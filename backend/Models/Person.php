<?php
namespace Models;

class Person {
    public function __construct(
        private int $id,
        private int $user_id,
        private string $first_name,
        private string $last_name,
        private string $address,
        private string $zip_code,
        private string $city,
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
    public function getZipCode(): string { return $this->zip_code; }
    public function getCity(): string { return $this->city; }
    public function getApartmentNumber(): ?string { return $this->apartment_number; }
    public function getPhoneNumber(): ?string { return $this->phone_number; }
    public function getCreatedAt(): ?string { return $this->created_at; }
    public function getVehicleBrand(): ?string { return $this->vehicle_brand; }
    public function getVehicleModel(): ?string { return $this->vehicle_model; }
    public function getLicensePlate(): ?string { return $this->license_plate; }
    public function setFirstName(string $firstName): void { $this->first_name = $firstName; }
    public function setLastName(string $lastName): void { $this->last_name = $lastName; }
    public function setAddress(string $address): void { $this->address = $address; }
    public function setZipCode(string $zipCode): void { $this->zip_code = $zipCode; }
    public function setCity(string $city): void { $this->city = $city; }
    public function setApartmentNumber(?string $apartmentNumber): void { $this->apartment_number = $apartmentNumber; }
    public function setPhoneNumber(?string $phoneNumber): void { $this->phone_number = $phoneNumber; }
    public function setVehicleBrand(?string $vehicleBrand): void { $this->vehicle_brand = $vehicleBrand; }
    public function setVehicleModel(?string $vehicleModel): void { $this->vehicle_model = $vehicleModel; }
    public function setLicensePlate(?string $licensePlate): void { $this->license_plate = $licensePlate; }
}