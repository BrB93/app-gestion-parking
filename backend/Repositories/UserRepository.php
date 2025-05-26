<?php
namespace Repositories;
use Core\Database;
use Models\User;
use PDO;

class UserRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAllUsers(): array {
        $stmt = $this->db->query("SELECT id, username, email, phone, role, is_active FROM users");
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = new User(
                $row['id'],
                $row['username'], 
                $row['email'], 
                $row['role'], 
                null, 
                $row['phone'] ?? null,
                $row['is_active'] ?? 1
            );
        }
        return $users;
    }
    
    public function findUserByEmail(string $email): ?User {
        $stmt = $this->db->prepare("SELECT id, username, email, role, password, phone, is_active FROM users WHERE email = :email");
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new User(
            $row['id'], 
            $row['username'], 
            $row['email'], 
            $row['role'], 
            $row['password'],
            $row['phone'] ?? null,
            $row['is_active'] ?? 1
        );
    }
    
    public function findUserById(int $id): ?User {
        $stmt = $this->db->prepare("SELECT id, username, email, role, phone, is_active FROM users WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new User(
            $row['id'], 
            $row['username'], 
            $row['email'], 
            $row['role'],
            null,
            $row['phone'] ?? null,
            $row['is_active'] ?? 1
        );
    }
    
    public function createUser(string $username, string $email, string $password, string $role = 'user'): bool {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $is_active = 1;
        
        $stmt = $this->db->prepare("INSERT INTO users (username, email, password, role, is_active) VALUES (:username, :email, :password, :role, :is_active)");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
        $stmt->bindParam(':role', $role, PDO::PARAM_STR);
        $stmt->bindParam(':is_active', $is_active, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    public function findUserByName(string $username): ?User {
        $stmt = $this->db->prepare("SELECT id, username, email, role, password, phone, is_active FROM users WHERE username = :username");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new User(
            $row['id'], 
            $row['username'], 
            $row['email'], 
            $row['role'], 
            $row['password'],
            $row['phone'] ?? null,
            $row['is_active'] ?? 1
        );
    }
    
    public function updateUser(int $id, array $data): bool {
        $setClauses = [];
        $params = [':id' => $id];
        
        foreach ($data as $key => $value) {
            if ($key === 'password' && !empty($value)) {
                $setClauses[] = "$key = :$key";
                $params[":$key"] = password_hash($value, PASSWORD_DEFAULT);
            } elseif ($key !== 'password') {
                $setClauses[] = "$key = :$key";
                $params[":$key"] = $value;
            }
        }
        
        if (empty($setClauses)) {
            return false;
        }
        
        $query = "UPDATE users SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        
        return $stmt->execute($params);
    }
    
    public function deleteUser(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    public function getUsersByRole(string $role): array {
    $stmt = $this->db->prepare("SELECT id, username, email, phone, role, is_active FROM users WHERE role = :role");
    $stmt->bindParam(':role', $role, PDO::PARAM_STR);
    $stmt->execute();
    
    $users = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $users[] = new User(
            $row['id'],
            $row['username'], 
            $row['email'], 
            $row['role'], 
            null, 
            $row['phone'] ?? null,
            $row['is_active'] ?? 1
        );
    }
    return $users;
    }
    
    public function createUserWithSpot(string $username, string $email, string $password, string $role = 'user', ?int $spotId = null): bool {
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $is_active = 1;
    $is_verified = $role === 'owner' ? 1 : 0; // Les propriétaires sont automatiquement vérifiés
    
    $stmt = $this->db->prepare("INSERT INTO users (username, email, password, role, is_active, is_verified, spot_id) VALUES (:username, :email, :password, :role, :is_active, :is_verified, :spot_id)");
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
    $stmt->bindParam(':role', $role, PDO::PARAM_STR);
    $stmt->bindParam(':is_active', $is_active, PDO::PARAM_INT);
    $stmt->bindParam(':is_verified', $is_verified, PDO::PARAM_INT);
    $stmt->bindParam(':spot_id', $spotId, $spotId ? PDO::PARAM_INT : PDO::PARAM_NULL);
    
    return $stmt->execute();
    }

}
