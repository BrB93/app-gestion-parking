<?php
namespace Controllers;
use Repositories\UserRepository;
use Core\Auth;

class AuthController {
    private $userRepo;

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
        
        if (!isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Nom d\'utilisateur et mot de passe requis']);
            return;
        }
        
        $username = $data['username'];
        $password = $data['password'];
        
        $user = $this->userRepo->findUserByName($username);
        
        if (!$user || !$user->verifyPassword($password)) {
            http_response_code(401);
            echo json_encode(['error' => 'Nom d\'utilisateur ou mot de passe incorrect']);
            return;
        }
        
        session_start();
        $_SESSION['user_id'] = $user->getId();
        $_SESSION['user_name'] = $user->getName();
        $_SESSION['user_email'] = $user->getEmail();
        $_SESSION['user_role'] = $user->getRole();
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'role' => $user->getRole()
            ]
        ]);
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
                'role' => $_SESSION['user_role']
            ]
        ]);
    }
}
