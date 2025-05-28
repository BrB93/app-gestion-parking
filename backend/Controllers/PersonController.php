<?php
namespace Controllers;
use Repositories\PersonRepository;
use Core\Auth;
use Core\Validator;
use Models\Person;
use Exception;

class PersonController {
    private $personRepo;

    public function __construct() {
        $this->personRepo = new PersonRepository();
    }

    public function index() {
        Auth::requireAuthentication();
        
        $persons = $this->personRepo->getAllPersons();
        
        header('Content-Type: application/json');
        $personsArray = array_map(function($person) {
            return [
                'id' => $person->getId(),
                'user_id' => $person->getUserId(),
                'first_name' => $person->getFirstName(),
                'last_name' => $person->getLastName(),
                'address' => $person->getAddress(),
                'zip_code' => $person->getZipCode(),
                'city' => $person->getCity(),
                'apartment_number' => $person->getApartmentNumber(),
                'phone_number' => $person->getPhoneNumber(),
                'created_at' => $person->getCreatedAt(),
                'vehicle_brand' => $person->getVehicleBrand(),
                'vehicle_model' => $person->getVehicleModel(),
                'license_plate' => $person->getLicensePlate(),
            ];
        }, $persons);
        
        echo json_encode($personsArray);
    }
    public function show($id) {
        Auth::requireAuthentication();
        
        $person = $this->personRepo->findPersonById($id);
        
        if (!$person) {
            http_response_code(404);
            echo json_encode(['error' => 'Personne non trouvée']);
            return;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'id' => $person->getId(),
            'user_id' => $person->getUserId(),
            'first_name' => $person->getFirstName(),
            'last_name' => $person->getLastName(),
            'address' => $person->getAddress(),
            'zip_code' => $person->getZipCode(),
            'city' => $person->getCity(),
            'apartment_number' => $person->getApartmentNumber(),
            'phone_number' => $person->getPhoneNumber(),
            'created_at' => $person->getCreatedAt(),
            'vehicle_brand' => $person->getVehicleBrand(),
            'vehicle_model' => $person->getVehicleModel(),
            'license_plate' => $person->getLicensePlate(),
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
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Données invalides']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $data['user_id'] != $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Vous ne pouvez pas créer des informations pour un autre utilisateur']);
            return;
        }
        
        $data = Validator::sanitizeData($data);
        
        try {
            $result = $this->personRepo->createPerson($data);
            
            if ($result) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Personne créée avec succès',
                    'person_id' => $result
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur lors de la création de la personne']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    public function update($id) {
        Auth::requireAuthentication();
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Données invalides']);
            return;
        }
        
        $existingPerson = $this->personRepo->findPersonById($id);
        if (!$existingPerson) {
            http_response_code(404);
            echo json_encode(['error' => 'Personne non trouvée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $existingPerson->getUserId() != $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Vous ne pouvez pas modifier les informations d\'un autre utilisateur']);
            return;
        }
        
        $data = Validator::sanitizeData($data);
        
        if (!Auth::hasRole('admin') && isset($data['user_id']) && $data['user_id'] != $existingPerson->getUserId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Vous ne pouvez pas changer l\'utilisateur associé']);
            return;
        }
        
        try {
            if (isset($data['first_name'])) {
                $existingPerson->setFirstName($data['first_name']);
            }
                
            if (isset($data['last_name'])) {
                $existingPerson->setLastName($data['last_name']);
            }
                
            if (isset($data['address'])) {
                $existingPerson->setAddress($data['address']);
            }
                
            if (isset($data['zip_code'])) {
                $existingPerson->setZipCode($data['zip_code']);
            }
                
            if (isset($data['city'])) {
                $existingPerson->setCity($data['city']);
            }
                
            if (isset($data['apartment_number'])) {
                $existingPerson->setApartmentNumber($data['apartment_number']);
            }
                
            if (isset($data['phone_number'])) {
                $existingPerson->setPhoneNumber($data['phone_number']);
            }
                
            if (isset($data['vehicle_brand'])) {
                $existingPerson->setVehicleBrand($data['vehicle_brand']);
            }
                
            if (isset($data['vehicle_model'])) {
                $existingPerson->setVehicleModel($data['vehicle_model']);
            }
                
            if (isset($data['license_plate'])) {
                $existingPerson->setLicensePlate($data['license_plate']);
            }

            $personData = [
                'first_name' => $existingPerson->getFirstName(),
                'last_name' => $existingPerson->getLastName(),
                'address' => $existingPerson->getAddress(),
                'zip_code' => $existingPerson->getZipCode(),
                'city' => $existingPerson->getCity(),
                'apartment_number' => $existingPerson->getApartmentNumber(),
                'phone_number' => $existingPerson->getPhoneNumber(),
                'vehicle_brand' => $existingPerson->getVehicleBrand(),
                'vehicle_model' => $existingPerson->getVehicleModel(),
                'license_plate' => $existingPerson->getLicensePlate()
            ];
            
            $result = $this->personRepo->updatePerson($id, $personData);
            
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'person' => [
                'last_name' => $existingPerson->getLastName()
            ]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
        }
    }

    public function delete($id) {
        Auth::requireAuthentication();
        
        $existingPerson = $this->personRepo->findPersonById($id);
        if (!$existingPerson) {
            http_response_code(404);
            echo json_encode(['error' => 'Personne non trouvée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $existingPerson->getUserId() != $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Vous ne pouvez pas supprimer les informations d\'un autre utilisateur']);
            return;
        }
        
        try {
            $this->personRepo->deletePerson($id);
            
            header('Content-Type: application/json');
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
    }

    public function getByUserId($userId) {
        Auth::requireAuthentication();
        
        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $currentUser->getId() != $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
            return;
        }
    
        $persons = $this->personRepo->getPersonsByUserId($userId);
    
        header('Content-Type: application/json');
        $personsArray = array_map(function($person) {
            return [
                'id' => $person->getId(),
                'user_id' => $person->getUserId(),
                'first_name' => $person->getFirstName(),
                'last_name' => $person->getLastName(),
                'address' => $person->getAddress(),
                'zip_code' => $person->getZipCode(),
                'city' => $person->getCity(),
                'apartment_number' => $person->getApartmentNumber(),
                'phone_number' => $person->getPhoneNumber(),
                'created_at' => $person->getCreatedAt(),
                'vehicle_brand' => $person->getVehicleBrand(),
                'vehicle_model' => $person->getVehicleModel(),
                'license_plate' => $person->getLicensePlate(),
            ];
        }, $persons);
    
        echo json_encode($personsArray);
    }
}