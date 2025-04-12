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
        $stmt = $this->db->query("SELECT id, name, email, phone, role FROM users");
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = new User(
                $row['id'],
                $row['name'], 
                $row['email'], 
                $row['role'], 
                null, 
                $row['phone'] ?? null
            );
        }
        return $users;
    }
    
    public function findUserByEmail(string $email): ?User {
        $stmt = $this->db->prepare("SELECT id, name, email, role, password, phone FROM users WHERE email = :email");
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new User(
            $row['id'], 
            $row['name'], 
            $row['email'], 
            $row['role'], 
            $row['password'],
            $row['phone'] ?? null
        );
    }
    
    public function findUserById(int $id): ?User {
        $stmt = $this->db->prepare("SELECT id, name, email, role, phone FROM users WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new User(
            $row['id'], 
            $row['name'], 
            $row['email'], 
            $row['role'],
            null,
            $row['phone'] ?? null
        );
    }
    
    public function createUser(string $name, string $email, string $password, string $role = 'user'): bool {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $this->db->prepare("INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)");
        $stmt->bindParam(':name', $name, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
        $stmt->bindParam(':role', $role, PDO::PARAM_STR);
        
        return $stmt->execute();
    }
    
    public function findUserByName(string $name): ?User {
        $stmt = $this->db->prepare("SELECT id, name, email, role, password, phone FROM users WHERE name = :name");
        $stmt->bindParam(':name', $name, PDO::PARAM_STR);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new User(
            $row['id'], 
            $row['name'], 
            $row['email'], 
            $row['role'], 
            $row['password'],
            $row['phone'] ?? null
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
}