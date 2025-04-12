<?php
namespace Models;

class User {
    private $id;
    private $name;
    private $email;
    private $role;
    private $password;
    private $phone;
    private $is_active;

    public function __construct($id, $name, $email, $role, $password = null, $phone = null, $is_active = 1) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->role = $role;
        $this->password = $password;
        $this->phone = $phone;
        $this->is_active = $is_active;
    }

    public function getId(): int {return $this->id;}
    public function getName(): string {return $this->name;} 
    public function getEmail(): string {return $this->email;}
    public function getRole(): string {return $this->role;}
    public function getPhone(): ?string {return $this->phone;}
    public function isActive(): bool {return $this->is_active == 1;}
    
    public function verifyPassword(string $password): bool {
        return password_verify($password, $this->password);
    }
}