<?php
namespace Controllers;
use Repositories\UserRepository;
use Core\Auth;
use Core\Validator;

class AuthController {
    private $userRepo;
    private $supportEmail = "support@parking.fr";
    private $adminKey = "admin_secure_key_2025";

    public function __construct() {
        $this->userRepo = new UserRepository();
    }
    
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $data = Validator::sanitizeData($data);
        
        if (!isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nom d\'utilisateur et mot de passe requis']);
            return;
        }
        
        $username = $data['username'];
        $password = $data['password'];
                if (!Validator::isSafeString($username)) {
            http_response_code(400);
            echo json_encode(['error' => 'Données invalides détectées']);
            return;
        }
        
        $user = $this->userRepo->findUserByName($username);
        
        if (!$user || !$user->verifyPassword($password)) {
            http_response_code(401);
            echo json_encode(['error' => 'Nom d\'utilisateur ou mot de passe incorrect']);
            return;
        }
        
        if (!$user->isActive()) {
            http_response_code(403);
            echo json_encode([
                'error' => 'Compte inactif', 
                'message' => "Votre compte a été désactivé. Veuillez contacter {$this->supportEmail} pour plus d'informations.",
                'inactive' => true
            ]);
            return;
        }
        
        session_start();
        $_SESSION['user_id'] = $user->getId();
        $_SESSION['user_name'] = $user->getName();
        $_SESSION['user_email'] = $user->getEmail();
        $_SESSION['user_role'] = $user->getRole();
        $_SESSION['user_phone'] = $user->getPhone();
        
        $_SESSION['just_logged_in'] = true;
    
        echo json_encode([
            'success' => true,
            'redirect_to' => $_SESSION['redirect_after_login'] ?? '/app-gestion-parking/public/',
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'role' => $user->getRole(),
                'phone' => $user->getPhone()
            ]
        ]);
    }
    
    public function register() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeData($data);
        
        if (!isset($data['username']) || !isset($data['email']) || !isset($data['password']) || !isset($data['role'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données incomplètes']);
            return;
        }
        
        if ($this->userRepo->findUserByName($data['username'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Ce nom d\'utilisateur est déjà utilisé']);
            return;
        }
        
        if ($this->userRepo->findUserByEmail($data['email'])) {
            http_response_code(409);
            echo json_encode(['error' => 'Cet email est déjà utilisé']);
            return;
        }
        
        $role = $data['role'];
        if (!in_array($role, ['user', 'owner', 'admin'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Rôle invalide']);
            return;
        }
        
        if ($role === 'admin') {
            $admins = $this->userRepo->getUsersByRole('admin');
            
            if (count($admins) > 0) {
                if (!isset($data['admin_key']) || $data['admin_key'] !== $this->adminKey) {
                    http_response_code(403);
                    echo json_encode(['error' => 'Clé d\'administration invalide']);
                    return;
                }
            }
        }
        
        $result = $this->userRepo->createUser(
            $data['username'], 
            $data['email'], 
            $data['password'], 
            $role
        );
        
        if ($result) {
            $user = $this->userRepo->findUserByName($data['username']);
            
            if ($data['phone']) {
                $this->userRepo->updateUser($user->getId(), ['phone' => $data['phone']]);
            }
            
            echo json_encode([
                'success' => true, 
                'message' => 'Compte créé avec succès', 
                'user' => [
                    'username' => $data['username'],
                    'email' => $data['email'],
                    'role' => $role
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création du compte']);
        }
    }
    
    public function logout() {
        session_start();
        
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
        
        echo json_encode(['success' => true]);
    }
    
    public function getCurrentUser() {
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['authenticated' => false]);
            return;
        }
        
        echo json_encode([
            'authenticated' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'],
                'email' => $_SESSION['user_email'],
                'role' => $_SESSION['user_role'],
                'phone' => $_SESSION['user_phone'] ?? null
            ]
        ]);
    }
}