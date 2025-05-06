<?php
namespace Controllers;
use Repositories\ParkingSpotRepository;
use Core\Auth;
use Core\Validator;

class ParkingSpotController {
    private $spotRepo;

    public function __construct() {
        $this->spotRepo = new ParkingSpotRepository();
    }

    public function index() {
        Auth::requireAuthentication();
        
        $currentUser = Auth::getCurrentUser();
        
        if ($currentUser->getRole() === 'admin') {
            $spots = $this->spotRepo->getAllSpots();
        } 
        elseif ($currentUser->getRole() === 'owner') {
            $spots = $this->spotRepo->getSpotsByOwnerId($currentUser->getId());
        } 
        else {
            $spots = $this->spotRepo->getAllSpots();
        }
        
        header('Content-Type: application/json');
        $spotsArray = array_map(function($spot) {
            return [
                'id' => $spot->getId(),
                'spot_number' => $spot->getSpotNumber(),
                'type' => $spot->getType(),
                'status' => $spot->getStatus(),
                'owner_id' => $spot->getOwnerId(),
                'pricing_id' => $spot->getPricingId()
            ];
        }, $spots);
        
        echo json_encode($spotsArray);
    }
    
    public function show($id) {
        Auth::requireAuthentication();
        
        $spot = $this->spotRepo->getSpotById($id);
        
        if (!$spot) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Place de parking non trouvée']);
            return;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'id' => $spot->getId(),
            'spot_number' => $spot->getSpotNumber(),
            'type' => $spot->getType(),
            'status' => $spot->getStatus(),
            'owner_id' => $spot->getOwnerId(),
            'pricing_id' => $spot->getPricingId()
        ]);
    }
    
    public function create() {
        Auth::requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeData($data);
        
        if (!isset($data['spot_number']) || !isset($data['type'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données incomplètes']);
            return;
        }
        
        $status = $data['status'] ?? 'libre';
        $owner_id = (!empty($data['owner_id'])) ? (int)$data['owner_id'] : null;
        if ($owner_id !== null) {
            $userRepo = new \Repositories\UserRepository();
            $owner = $userRepo->findUserById($owner_id);
            
            if (!$owner) {
                http_response_code(400);
                echo json_encode(['error' => 'Le propriétaire sélectionné n\'existe pas']);
                return;
            }
        }
        
        $pricing_id = (!empty($data['pricing_id'])) ? (int)$data['pricing_id'] : null;
        
        $result = $this->spotRepo->createSpot(
            $data['spot_number'], 
            $data['type'], 
            $status, 
            $owner_id, 
            $pricing_id
        );
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Place de parking créée avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création de la place de parking']);
        }
    }
    
    public function update($id) {
        Auth::requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $this->spotRepo->updateSpot($id, $data);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Place de parking mise à jour avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour de la place de parking']);
        }
    }
    
    public function delete($id) {
        Auth::requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $result = $this->spotRepo->deleteSpot($id);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Place de parking supprimée avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la suppression de la place de parking']);
        }
    }
    
    public function available() {
        Auth::requireAuthentication();
        
        $spots = $this->spotRepo->getAvailableSpots();
        
        header('Content-Type: application/json');
        $spotsArray = array_map(function($spot) {
            return [
                'id' => $spot->getId(),
                'spot_number' => $spot->getSpotNumber(),
                'type' => $spot->getType(),
                'status' => $spot->getStatus(),
                'owner_id' => $spot->getOwnerId(),
                'pricing_id' => $spot->getPricingId()
            ];
        }, $spots);
        
        echo json_encode($spotsArray);
    }

    public function getFormData() {
        Auth::requireAuthentication();
        
        $userRepo = new \Repositories\UserRepository();
        $users = $userRepo->getAllUsers();
        
        $personRepo = new \Repositories\PersonRepository();
        $persons = $personRepo->getAllPersons();
        
        $pricingRepo = new \Repositories\PricingRepository();
        $pricings = $pricingRepo->getAllPricings();
        
        $personsByUserId = [];
        foreach ($persons as $person) {
            $personsByUserId[$person->getUserId()] = $person;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'persons' => array_map(function($person) {
                return [
                    'id' => $person->getUserId(),
                    'name' => $person->getFirstName() . ' ' . $person->getLastName(),
                    'user_id' => $person->getUserId()
                ];
            }, $persons),
            'pricings' => array_map(function($pricing) {
                return [
                    'id' => $pricing->getId(),
                    'name' => $pricing->getName(),
                    'price' => $pricing->getPrice()
                ];
            }, $pricings)
        ]);
    }
    
}