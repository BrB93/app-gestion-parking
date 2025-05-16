<?php
namespace Models;

class Notification {
    public function __construct(
        private int $id,
        private int $user_id,
        private string $type,
        private string $content,
        private bool $is_read = false,
        private ?string $timestamp = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getUserId(): int { return $this->user_id; }
    public function getType(): string { return $this->type; }
    public function getContent(): string { return $this->content; }
    public function isRead(): bool { return $this->is_read; }
    public function getTimestamp(): ?string { return $this->timestamp; }
    
    public function markAsRead(): void { $this->is_read = true; }
    
    public function getTypeLabel(): string {
        switch ($this->type) {
            case 'rappel': return 'Rappel';
            case 'alerte': return 'Alerte';
            default: return $this->type;
        }
    }
    
    public function toArray(): array {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'content' => $this->content,
            'is_read' => $this->is_read,
            'timestamp' => $this->timestamp
        ];
    }
}