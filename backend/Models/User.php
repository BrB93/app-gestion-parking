<?php
namespace Models;

class User {
    private $id;
    private $name;
    private $email;
    private $role;
    private $password;

    public function __construct($id, $name, $email, $role, $password = null) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->role = $role;
        $this->password = $password;
    }

    public function getId(): int {return $this->id;}
    public function getName(): string {return $this->name;} 
    public function getEmail(): string {return $this->email;}
    public function getRole(): string {return $this->role;}
    
    public function verifyPassword(string $password): bool {
        return password_verify($password, $this->password);
    }
}