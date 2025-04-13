<?php
namespace Models;

class ParkingSpot {
    public function __construct(
        private int $id,
        private string $spot_number,
        private string $type,
        private string $status = 'libre',
        private ?int $owner_id = null,
        private ?int $pricing_id = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getSpotNumber(): string { return $this->spot_number; }
    public function getType(): string { return $this->type; }
    public function getStatus(): string { return $this->status; }
    public function getOwnerId(): ?int { return $this->owner_id; }
    public function getPricingId(): ?int { return $this->pricing_id; }

    public function isAvailable(): bool { return $this->status === 'libre'; }
    public function isReserved(): bool { return $this->status === 'reservee'; }
    public function isOccupied(): bool { return $this->status === 'occupee'; }

    public function setStatus(string $status): void {
        if (!in_array($status, ['libre', 'occupee', 'reservee']))
            throw new \InvalidArgumentException("Statut invalide: $status");
        $this->status = $status;
    }
}