<?php
namespace Controllers;

use Repositories\ReservationRepository;
use Repositories\ParkingSpotRepository;
use Core\Auth;
use Core\Validator;
use Models\Reservation;

class ReservationController {
    private $reservationRepo;
    private $spotRepo;

    public function __construct() {
        $this->reservationRepo = new ReservationRepository();
        $this->spotRepo = new ParkingSpotRepository();
    }

    public function index() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
    
        $reservations = [];
        
        if ($currentUser->getRole() === 'admin') {
            $reservations = $this->reservationRepo->getAllReservations();
        } else if ($currentUser->getRole() === 'owner') {
            $userReservations = $this->reservationRepo->getReservationsByUserId($currentUser->getId());
            $ownedSpotReservations = $this->reservationRepo->getReservationsByOwnerId($currentUser->getId());
            
            $reservations = array_merge($userReservations, $ownedSpotReservations);
            
            foreach ($reservations as $key => $res) {
                $isOwnerReservation = ($res->getUserId() === $currentUser->getId());
                $reservations[$key] = $res;
            }
        } else {
            $reservations = $this->reservationRepo->getReservationsByUserId($currentUser->getId());
        }
    
        header('Content-Type: application/json');
        echo json_encode(array_map(function($res) use ($currentUser) {
            $data = [
                'id' => $res->getId(),
                'user_id' => $res->getUserId(),
                'spot_id' => $res->getSpotId(),
                'start_time' => $res->getStartTime(),
                'end_time' => $res->getEndTime(),
                'status' => $res->getStatus(),
                'created_at' => $res->getCreatedAt(),
                'is_owner_spot' => ($currentUser->getRole() === 'owner' && $res->getUserId() !== $currentUser->getId())
            ];
            return $data;
        }, $reservations));
    }

    public function show($id) {
        Auth::requireAuthentication();

        $reservation = $this->reservationRepo->getReservationById($id);

        if (!$reservation) {
            http_response_code(404);
            echo json_encode(['error' => 'Réservation non trouvée']);
            return;
        }

        header('Content-Type: application/json');
        echo json_encode([
            'id' => $reservation->getId(),
            'user_id' => $reservation->getUserId(),
            'spot_id' => $reservation->getSpotId(),
            'start_time' => $reservation->getStartTime(),
            'end_time' => $reservation->getEndTime(),
            'status' => $reservation->getStatus(),
            'created_at' => $reservation->getCreatedAt()
        ]);
    }

    public function create() {
        Auth::requireAuthentication();
    
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
    
        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeData($data);
    
        if (!isset($data['spot_id']) || !isset($data['start_time']) || !isset($data['end_time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données manquantes']);
            return;
        }
    
        $currentUser = Auth::getCurrentUser();
    
        $spot = $this->spotRepo->getSpotById($data['spot_id']);
        if (!$spot || $spot->getStatus() === 'occupee') {
            http_response_code(400);
            echo json_encode(['error' => 'Place non disponible']);
            return;
        }
    
        if ($this->reservationRepo->hasConflictingReservations($data['spot_id'], $data['start_time'], $data['end_time'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Cette place est déjà réservée sur ce créneau horaire']);
            return;
        }
    
        $reservationId = $this->reservationRepo->createReservation(
            $currentUser->getId(),
            $data['spot_id'],
            $data['start_time'],
            $data['end_time']
        );
    
        if ($reservationId) {
            $this->spotRepo->updateSpotStatus($data['spot_id'], 'reservee');
            echo json_encode([
                'success' => true, 
                'message' => 'Réservation créée',
                'reservation_id' => $reservationId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création de la réservation']);
        }
    }
    public function cancel($id) {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();

        $reservation = $this->reservationRepo->getReservationById($id);

        if (!$reservation) {
            http_response_code(404);
            echo json_encode(['error' => 'Réservation non trouvée']);
            return;
        }

        if ($reservation->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès interdit ou réservation non trouvée']);
            return;
        }

        $result = $this->reservationRepo->updateStatus($id, 'annulee');

        if ($result) {
            $this->spotRepo->updateSpotStatus($reservation->getSpotId(), 'libre');

            echo json_encode(['success' => true, 'message' => 'Réservation annulée']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de l\'annulation']);
        }
    }

    public function getFormData() {
        Auth::requireAuthentication();

        $spotRepo = new ParkingSpotRepository();
        $spots = $spotRepo->getAvailableSpots();

        header('Content-Type: application/json');
        echo json_encode([
            'spots' => array_map(function($spot) {
                return [
                    'id' => $spot->getId(),
                    'spot_number' => $spot->getSpotNumber(),
                    'type' => $spot->getType(),
                    'status' => $spot->getStatus()
                ];
            }, $spots)
        ]);
    }

    public function update($id) {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }

        $reservation = $this->reservationRepo->getReservationById($id);
        
        if (!$reservation) {
            http_response_code(404);
            echo json_encode(['error' => 'Réservation non trouvée']);
            return;
        }
        
        if ($reservation->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Vous n\'êtes pas autorisé à modifier cette réservation']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeData($data);
        
        if (!isset($data['start_time']) || !isset($data['end_time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données manquantes']);
            return;
        }
        
        $startTime = strtotime($data['start_time']);
        $endTime = strtotime($data['end_time']);
        
        if ($endTime <= $startTime) {
            http_response_code(400);
            echo json_encode(['error' => 'La date de fin doit être postérieure à la date de début']);
            return;
        }
        
        $now = time();
        if ($startTime < $now) {
            http_response_code(400);
            echo json_encode(['error' => 'La date de début ne peut pas être dans le passé']);
            return;
        }
        
        $updateData = [
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time']
        ];

        if ($this->reservationRepo->hasConflictingReservations(
            $reservation->getSpotId(),
            $data['start_time'],
            $data['end_time'],
            $id
        )) {
            http_response_code(409);
            echo json_encode(['error' => 'Cette place est déjà réservée sur ce créneau horaire']);
            return;
        }
        
        $result = $this->reservationRepo->updateReservation($id, $updateData);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Réservation mise à jour avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour de la réservation']);
        }
    }

    public function getAvailability($id) {
        Auth::requireAuthentication();
        
        $spot = $this->spotRepo->getSpotById($id);
        
        if (!$spot) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Place de parking non trouvée']);
            return;
        }
        
        $reservationRepo = new \Repositories\ReservationRepository();
        $reservations = $reservationRepo->getReservationsBySpotId($id);
        
        $activeReservations = array_filter($reservations, function($res) {
            return $res->getStatus() !== 'annulee' && 
                   strtotime($res->getEndTime()) > time();
        });
        
        header('Content-Type: application/json');
        echo json_encode([
            'spot_id' => $id,
            'available' => true,
            'reservations' => array_map(function($res) {
                return [
                    'id' => $res->getId(),
                    'start_time' => $res->getStartTime(),
                    'end_time' => $res->getEndTime(),
                    'status' => $res->getStatus()
                ];
            }, $activeReservations)
        ]);
    }
}