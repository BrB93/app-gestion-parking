<?php
namespace Controllers;
use Repositories\PersonRepository;
use Core\Auth;
use Core\Validator;

class PersonController {
    private $personRepo;

    public function __construct() {
        $this->personRepo = new PersonRepository();
    }

    public function index() {
        Auth::requireAuthentication();

        if (Auth::hasRole('admin')) {
            $persons = $this->personRepo->getAllPersons();
        } else {
            $currentUser = Auth::getCurrentUser();
            $persons = $this->personRepo->getPersonsByUserId($currentUser->getId());
        }

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

        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $person->getUserId() != $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
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
        $data = Validator::sanitizeData($data);


        if (!isset($data['user_id'], $data['first_name'], $data['last_name'], $data['address'], $data['zip_code'], $data['city'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données incomplètes. Prénom, nom, ID utilisateur et adresse sont obligatoires.']);
            return;
        }

        $result = $this->personRepo->createPerson($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Personne créée avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création de la personne']);
        }
    }

    public function update($id) {
        Auth::requireAuthentication();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }

        $person = $this->personRepo->findPersonById($id);
        if (!$person) {
            http_response_code(404);
            echo json_encode(['error' => 'Personne non trouvée']);
            return;
        }

        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $person->getUserId() != $currentUser->getId()) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $result = $this->personRepo->updatePerson($id, $data);

        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Personne mise à jour avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour']);
        }
    }

    public function delete($id) {
        Auth::requireRole('admin');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }

        $result = $this->personRepo->deletePerson($id);

        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Personne supprimée avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la suppression']);
        }
    }
}