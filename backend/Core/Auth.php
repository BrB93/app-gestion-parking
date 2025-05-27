<?php
namespace Core;
use Repositories\UserRepository;

class Auth {
    const SESSION_TIMEOUT = 1800;
    
    public static function isAuthenticated(): bool {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $isLoggedIn = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']) && 
                      isset($_SESSION['user_role']) && !empty($_SESSION['user_role']);
        
        if ($isLoggedIn) {
            if (isset($_SESSION['last_activity']) && 
                (time() - $_SESSION['last_activity'] > self::SESSION_TIMEOUT)) {
                self::logout();
                return false;
            }
            
            $_SESSION['last_activity'] = time();
            return true;
        }
        
        return false;
    }
    
    public static function logout(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
    }
    
    public static function getCurrentUser() {
        if (!self::isAuthenticated()) {
            return null;
        }
        
        $userRepo = new UserRepository();
        return $userRepo->findUserById($_SESSION['user_id']);
    }
    
    public static function hasRole(string $role): bool {
        if (!self::isAuthenticated()) {
            return false;
        }
        
        if ($_SESSION['user_role'] === 'admin') {
            return true;
        }
        
        return $_SESSION['user_role'] === $role;
    }
    
    public static function requireAuthentication() {
        if (!self::isAuthenticated()) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['error' => 'Authentification requise']);
            exit;
        }
    }
    
    public static function requireRole(string $role) {
        self::requireAuthentication();
        
        if (!self::hasRole($role)) {
            header('Content-Type: application/json');
            http_response_code(403);
            echo json_encode(['error' => 'Permission refusée']);
            exit;
        }
    }
}