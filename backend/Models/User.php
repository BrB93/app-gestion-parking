<?php
namespace Models;

class User {
    private $id;
    private $name;
    private $email;
    private $role;
    private $password;
    private $phone;

    public function __construct($id, $name, $email, $role, $password = null, $phone = null) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->role = $role;
        $this->password = $password;
        $this->phone = $phone;
    }

    public function getId(): int {return $this->id;}
    public function getName(): string {return $this->name;} 
    public function getEmail(): string {return $this->email;}
    public function getRole(): string {return $this->role;}
    public function getPhone(): ?string {return $this->phone;}
    
    public function verifyPassword(string $password): bool {
        return password_verify($password, $this->password);
    }
}