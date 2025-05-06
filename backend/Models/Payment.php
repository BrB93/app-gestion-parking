<?php
namespace Models;

class Payment {
    public bool $is_owner_spot = false;
    
    public function __construct(
        private int $id,
        private int $reservation_id,
        private float $amount,
        private string $method,
        private string $status = 'en_attente',
        private ?string $timestamp = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getReservationId(): int { return $this->reservation_id; }
    public function getAmount(): float { return $this->amount; }
    public function getMethod(): string { return $this->method; }
    public function getStatus(): string { return $this->status; }
    public function getTimestamp(): ?string { return $this->timestamp; }
    public function isOwnerSpot(): bool { return $this->is_owner_spot; }
    public function setIsOwnerSpot(bool $value): void { $this->is_owner_spot = $value; }

    public function isPending(): bool { return $this->status === 'en_attente'; }
    public function isCompleted(): bool { return $this->status === 'effectue'; }
    public function isFailed(): bool { return $this->status === 'echoue'; }

    public function setStatus(string $status): void {
        if (!in_array($status, ['en_attente', 'effectue', 'echoue'])) {
            throw new \InvalidArgumentException("Statut de paiement invalide: $status");
        }
        $this->status = $status;
    }
    
    public function getStatusLabel(): string {
        switch ($this->status) {
            case 'en_attente': return 'En attente';
            case 'effectue': return 'Effectué';
            case 'echoue': return 'Échoué';
            default: return $this->status;
        }
    }
    
    public function getMethodLabel(): string {
        switch ($this->method) {
            case 'cb': return 'Carte bancaire';
            case 'paypal': return 'PayPal';
            default: return $this->method;
        }
    }
}