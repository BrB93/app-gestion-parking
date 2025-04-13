<?php
namespace Models;

class Person {
    public function __construct(
        private int $id,
        private int $user_id,
        private string $first_name,
        private string $last_name,
        private string $address,
        private ?string $apartment_number = null,
        private ?string $phone_number = null,
        private ?string $created_at = null,
        private ?string $vehicle_brand = null,
        private ?string $vehicle_model = null,
        private ?string $license_plate = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getUserId(): int { return $this->user_id; }
    public function getFirstName(): string { return $this->first_name; }
    public function getLastName(): string { return $this->last_name; }
    public function getAddress(): string { return $this->address; }
    public function getApartmentNumber(): ?string { return $this->apartment_number; }
    public function getPhoneNumber(): ?string { return $this->phone_number; }
    public function getCreatedAt(): ?string { return $this->created_at; }
    public function getVehicleBrand(): ?string { return $this->vehicle_brand; }
    public function getVehicleModel(): ?string { return $this->vehicle_model; }
    public function getLicensePlate(): ?string { return $this->license_plate; }
}