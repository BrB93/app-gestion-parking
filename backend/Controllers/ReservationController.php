<?php
namespace Controllers;

use Repositories\ReservationRepository;
use Repositories\ParkingSpotRepository;
use Core\Auth;
use Core\Validator;

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

        if ($currentUser->getRole() === 'admin') {
            $reservations = $this->reservationRepo->getAllReservations();
        } else {
            $reservations = $this->reservationRepo->getReservationsByUserId($currentUser->getId());
        }

        header('Content-Type: application/json');
        echo json_encode(array_map(function($res) {
            return [
                'id' => $res->getId(),
                'user_id' => $res->getUserId(),
                'spot_id' => $res->getSpotId(),
                'start_time' => $res->getStartTime(),
                'end_time' => $res->getEndTime(),
                'status' => $res->getStatus(),
                'created_at' => $res->getCreatedAt()
            ];
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

        $result = $this->reservationRepo->createReservation(
            $currentUser->getId(),
            $data['spot_id'],
            $data['start_time'],
            $data['end_time']
        );

        if ($result) {
            $this->spotRepo->updateSpotStatus($data['spot_id'], 'reservee');

            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Réservation créée']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création de la réservation']);
        }
    }

    public function cancel($id) {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();

        $reservation = $this->reservationRepo->getReservationById($id);

        if (!$reservation || $reservation->getUserId() !== $currentUser->getId()) {
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
            echo json_encode(['error' => 'Erreur lors de l’annulation']);
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
}
