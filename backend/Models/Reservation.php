<?php
namespace Models;

class Reservation {
    public function __construct(
        private int $id,
        private int $user_id,
        private int $spot_id,
        private string $start_time,
        private string $end_time,
        private string $status = 'en_attente',
        private ?string $created_at = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getUserId(): int { return $this->user_id; }
    public function getSpotId(): int { return $this->spot_id; }
    public function getStartTime(): string { return $this->start_time; }
    public function getEndTime(): string { return $this->end_time; }
    public function getStatus(): string { return $this->status; }
    public function getCreatedAt(): ?string { return $this->created_at; }

    public function isPending(): bool {
        return $this->status === 'en_attente';
    }

    public function isConfirmed(): bool {
        return $this->status === 'confirmee';
    }

    public function isCancelled(): bool {
        return $this->status === 'annulee';
    }

    public function isFinished(): bool {
        return $this->status === 'terminee';
    }

    public function setStatus(string $status): void {
        $valid = ['en_attente', 'confirmee', 'annulee', 'terminee'];
        if (!in_array($status, $valid)) {
            throw new \InvalidArgumentException("Statut de réservation invalide: $status");
        }
        $this->status = $status;
    }
}
