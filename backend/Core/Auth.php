<?php
namespace Core;
use Repositories\UserRepository;

class Auth {
    public static function isAuthenticated(): bool {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return isset($_SESSION['user_id']);
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
