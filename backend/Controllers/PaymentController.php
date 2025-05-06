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
            if ($currentUser->getRole() === 'admin') {
                $payments = $this->paymentRepo->getAllPayments();
            } else {
                $payments = $this->paymentRepo->getPaymentsByUserId($currentUser->getId());
            }
            
            header('Content-Type: application/json');
            echo json_encode(array_map(function($payment) {
                return [
                    'id' => $payment->getId(),
                    'reservation_id' => $payment->getReservationId(),
                    'amount' => $payment->getAmount(),
                    'method' => $payment->getMethod(),
                    'status' => $payment->getStatus(),
                    'timestamp' => $payment->getTimestamp()
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
            'method_label' => $payment->getMethodLabel(),
            'status' => $payment->getStatus(),
            'status_label' => $payment->getStatusLabel(),
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
            echo json_encode(['error' => 'Données incomplètes']);
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
            echo json_encode(['error' => 'Vous n\'êtes pas autorisé à payer cette réservation']);
            return;
        }
        
        $paymentId = 0;
        
        if ($method === 'cb') {
            $paymentId = $this->processCreditCardPayment($reservationId, $amount, $data);
        } else if ($method === 'paypal') {
            $paymentId = $this->processPayPalPayment($reservationId, $amount, $data);
        }
        
        if ($paymentId > 0) {
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Paiement initié avec succès',
                'payment_id' => $paymentId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de l\'initiation du paiement']);
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