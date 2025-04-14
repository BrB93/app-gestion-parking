<?php
namespace Controllers;
use Repositories\UserRepository;
use Core\Auth;
use Core\Validator;

class UserController {
    private $userRepo;

    public function __construct() {
        $this->userRepo = new UserRepository();
    }

    public function index() {
        Auth::requireAuthentication();
        if (Auth::hasRole('admin')) {
            $users = $this->userRepo->getAllUsers();
        } else {
            $currentUser = Auth::getCurrentUser();
            $users = [$currentUser];
        }
        
        header('Content-Type: application/json');
        $usersArray = array_map(function($user) {
            return [
                'id' => $user->getId(),
                'username' => $user->getusername(),
                'email' => $user->getEmail(),
                'role' => $user->getRole(),
                'phone' => $user->getPhone(),
                'is_active' => $user->isActive()
            ];
        }, $users);
        
        echo json_encode($usersArray);
    }
    
    public function show($id) {
        Auth::requireAuthentication();
        
        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $currentUser->getId() != $id) {
            header('Content-Type: application/json');
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
            return;
        }
        
        $user = $this->userRepo->findUserById($id);
        
        if (!$user) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Utilisateur non trouvé']);
            return;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'id' => $user->getId(),
            'username' => $user->getusername(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'phone' => $user->getPhone(),
            'is_active' => $user->isActive()
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

        
        if (!isset($data['username']) || !isset($data['email']) || !isset($data['password']) || !isset($data['role'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données incomplètes']);
            return;
        }
        
        if ($this->userRepo->findUserByEmail($data['email'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Email déjà utilisé']);
            return;
        }
        
        $result = $this->userRepo->createUser($data['username'], $data['email'], $data['password'], $data['role']);
        
        if ($result) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Utilisateur créé avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création de l\'utilisateur']);
        }
    }
    
    public function update($id) {
        Auth::requireAuthentication();
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if (!Auth::hasRole('admin') && $currentUser->getId() != $id) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (!Auth::hasRole('admin') && isset($data['role'])) {
            unset($data['role']);
        }
        
        $result = $this->userRepo->updateUser($id, $data);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Utilisateur mis à jour avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour de l\'utilisateur']);
        }
    }
    
    public function delete($id) {
        Auth::requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $result = $this->userRepo->deleteUser($id);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la suppression de l\'utilisateur']);
        }
    }
}