<?php
namespace Models;

class ParkingSpot {
    private $id;
    private $spot_number;
    private $type;
    private $status;
    private $owner_id;
    private $pricing_id;

    public function __construct($id, $spot_number, $type, $status = 'libre', $owner_id = null, $pricing_id = null) {
        $this->id = $id;
        $this->spot_number = $spot_number;
        $this->type = $type;
        $this->status = $status;
        $this->owner_id = $owner_id;
        $this->pricing_id = $pricing_id;
    }

    public function getId(): int {return $this->id;}
    public function getSpotNumber(): string {return $this->spot_number;}
    public function getType(): string {return $this->type;}
    public function getStatus(): string {return $this->status;}
    public function getOwnerId(): ?int {return $this->owner_id;}
    public function getPricingId(): ?int {return $this->pricing_id;}
    
    public function isAvailable(): bool {
        return $this->status === 'libre';
    }
    
    public function isReserved(): bool {
        return $this->status === 'reservee';
    }
    
    public function isOccupied(): bool {
        return $this->status === 'occupee';
    }
    
    public function setStatus(string $status): void {
        if (!in_array($status, ['libre', 'occupee', 'reservee'])) {
            throw new \InvalidArgumentException("Statut invalide: $status");
        }
        $this->status = $status;
    }
}