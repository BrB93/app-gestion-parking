<?php
namespace Models;

class User {
    public function __construct(
        private int $id,
        private string $username,
        private string $email,
        private string $role,
        private ?string $password = null,
        private ?string $phone = null,
        private int $is_active = 1,
        private int $is_verified = 0,
        private ?int $spot_id = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getusername(): string { return $this->username; }
    public function getName(): string { return $this->username; }
    public function getEmail(): string { return $this->email; }
    public function getRole(): string { return $this->role; }
    public function getPhone(): ?string { return $this->phone; }
    public function isActive(): bool { return $this->is_active == 1; }
    public function isVerified(): bool { return $this->is_verified == 1; }
    public function getSpotId(): ?int { return $this->spot_id; }
    
    public function verifyPassword(string $password): bool {
        return password_verify($password, $this->password);
    }
}