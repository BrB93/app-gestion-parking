<?php
namespace Controllers;

use Repositories\PaymentRepository;
use Repositories\ReservationRepository;
use Core\Auth;
use Core\Validator;

class PaymentController {
    private $paymentRepo;
    private $reservationRepo;

    public function __construct() {
        $this->paymentRepo = new PaymentRepository();
        $this->reservationRepo = new ReservationRepository();
    }

    public function index() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        try {
            $payments = [];
            
            if ($currentUser->getRole() === 'admin') {
                $payments = $this->paymentRepo->getAllPayments();
            } else if ($currentUser->getRole() === 'owner') {
                $userPayments = $this->paymentRepo->getPaymentsByUserId($currentUser->getId());
                
                $spotRepo = new \Repositories\ParkingSpotRepository();
                $ownedSpots = $spotRepo->getSpotsByOwnerId($currentUser->getId());
                $ownerPayments = [];
                
                foreach ($ownedSpots as $spot) {
                    $reservationRepo = new \Repositories\ReservationRepository();
                    $reservations = $reservationRepo->getReservationsBySpotId($spot->getId());
                    
                    foreach ($reservations as $reservation) {
                        $resPayments = $this->paymentRepo->getPaymentsByReservationId($reservation->getId());
                        foreach ($resPayments as $payment) {
                            $payment->setIsOwnerSpot(true);
                            $ownerPayments[] = $payment;
                        }
                    }
                }
                
                $payments = array_merge($userPayments, $ownerPayments);
            } else {
                $payments = $this->paymentRepo->getPaymentsByUserId($currentUser->getId());
            }
            
            header('Content-Type: application/json');
            echo json_encode(array_map(function($payment) use ($currentUser) {
                $reservation = $this->reservationRepo->getReservationById($payment->getReservationId());
                $isOwnerSpot = isset($payment->is_owner_spot) && $payment->is_owner_spot;
                
                return [
                    'id' => $payment->getId(),
                    'reservation_id' => $payment->getReservationId(),
                    'amount' => $payment->getAmount(),
                    'method' => $payment->getMethod(),
                    'status' => $payment->getStatus(),
                    'timestamp' => $payment->getTimestamp(),
                    'is_owner_spot' => $isOwnerSpot ?? false,
                    'user_id' => $reservation ? $reservation->getUserId() : null,
                    'spot_id' => $reservation ? $reservation->getSpotId() : null
                ];
            }, $payments));
        } catch (\Exception $e) {
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors du chargement des paiements: ' . $e->getMessage()]);
        }
    }
    public function show($id) {
        Auth::requireAuthentication();
        
        if (!is_numeric($id)) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de paiement invalide']);
            return;
        }
        
        $payment = $this->paymentRepo->getPaymentById($id);
        
        if (!$payment) {
            http_response_code(404);
            echo json_encode(['error' => 'Paiement non trouvé']);
            return;
        }
        
        $reservation = $this->reservationRepo->getReservationById($payment->getReservationId());
        
        if (!$reservation) {
            http_response_code(404);
            echo json_encode(['error' => 'Réservation associée non trouvée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if ($currentUser->getRole() !== 'admin' && $reservation->getUserId() !== $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé à ce paiement']);
            return;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'id' => $payment->getId(),
            'reservation_id' => $payment->getReservationId(),
            'amount' => $payment->getAmount(),
            'method' => $payment->getMethod(),
            'status' => $payment->getStatus(),
            'timestamp' => $payment->getTimestamp()
        ]);
    }

    public function processPayment() {
        Auth::requireAuthentication();
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeData($data);
        
        if (!isset($data['reservation_id']) || !isset($data['method']) || !isset($data['amount'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Paramètres manquants']);
            return;
        }
        
        if (!in_array($data['method'], ['cb', 'paypal'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Méthode de paiement non supportée']);
            return;
        }
        
        $reservationId = (int)$data['reservation_id'];
        $amount = (float)$data['amount'];
        $method = $data['method'];
        
        $reservation = $this->reservationRepo->getReservationById($reservationId);
        
        if (!$reservation) {
            http_response_code(404);
            echo json_encode(['error' => 'Réservation non trouvée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if ($currentUser->getRole() !== 'admin' && $reservation->getUserId() !== $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé à cette réservation']);
            return;
        }
        
        $paymentId = 0;
        
        if ($method === 'cb') {
            $paymentId = $this->processCreditCardPayment($reservationId, $amount, $data);
        } else if ($method === 'paypal') {
            $paymentId = $this->processPayPalPayment($reservationId, $amount, $data);
        }
        
        if ($paymentId > 0) {
            $this->paymentRepo->updatePaymentStatus($paymentId, 'effectue');
            
            $this->reservationRepo->updateStatus($reservationId, 'confirmee');
            
            echo json_encode([
                'success' => true, 
                'payment_id' => $paymentId, 
                'message' => 'Paiement effectué avec succès'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors du traitement du paiement']);
        }
    }
    
    public function confirmPayment($id) {
        Auth::requireAuthentication();
        
        $payment = $this->paymentRepo->getPaymentById($id);
        
        if (!$payment) {
            http_response_code(404);
            echo json_encode(['error' => 'Paiement non trouvé']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        $reservation = $this->reservationRepo->getReservationById($payment->getReservationId());
        
        if (!$reservation || $reservation->getUserId() !== $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Vous n\'êtes pas autorisé à confirmer ce paiement']);
            return;
        }
        
        $success = $this->paymentRepo->updatePaymentStatus($id, 'effectue');
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Paiement confirmé avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la confirmation du paiement']);
        }
    }
    
    public function cancelPayment($id) {
        Auth::requireAuthentication();
        
        $payment = $this->paymentRepo->getPaymentById($id);
        
        if (!$payment) {
            http_response_code(404);
            echo json_encode(['error' => 'Paiement non trouvé']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        $reservation = $this->reservationRepo->getReservationById($payment->getReservationId());
        
        if ($currentUser->getRole() !== 'admin' && 
            (!$reservation || $reservation->getUserId() !== $currentUser->getId())) {
            http_response_code(403);
            echo json_encode(['error' => 'Vous n\'êtes pas autorisé à annuler ce paiement']);
            return;
        }
        
        $actionMessage = $payment->isCompleted() ? 'remboursé' : 'annulé';
        
        $success = $this->paymentRepo->updatePaymentStatus($id, 'echoue');
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => "Paiement $actionMessage avec succès"]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => "Erreur lors de l'annulation du paiement"]);
        }
    }
    
    private function processCreditCardPayment($reservationId, $amount, $data) {
        
        $paymentId = $this->paymentRepo->createPayment($reservationId, $amount, 'cb');
        return $paymentId;
    }
    
    private function processPayPalPayment($reservationId, $amount, $data) {
        
        $paymentId = $this->paymentRepo->createPayment($reservationId, $amount, 'paypal');
        return $paymentId;
    }
}