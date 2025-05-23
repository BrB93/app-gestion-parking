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

    public function setIsRead(bool $is_read): void {
        $this->is_read = $is_read;
    }

    public function isAlert(): bool {
        return $this->type === 'alerte';
    }

    public function isReminder(): bool {
        return $this->type === 'rappel';
    }
    
    public function getTypeLabel(): string {
        return $this->isAlert() ? 'Alerte' : 'Rappel';
    }
    
    public function getFormattedTimestamp(): string {
        if (!$this->timestamp) return '';
        
        $date = new \DateTime($this->timestamp);
        return $date->format('d/m/Y H:i');
    }
    
    public function getTimeAgo(): string {
        if (!$this->timestamp) return '';
        
        $date = new \DateTime($this->timestamp);
        $now = new \DateTime();
        $diff = $now->diff($date);
        
        if ($diff->y > 0) {
            return $diff->y . ' an' . ($diff->y > 1 ? 's' : '');
        } elseif ($diff->m > 0) {
            return $diff->m . ' mois';
        } elseif ($diff->d > 0) {
            return $diff->d . ' jour' . ($diff->d > 1 ? 's' : '');
        } elseif ($diff->h > 0) {
            return $diff->h . ' heure' . ($diff->h > 1 ? 's' : '');
        } elseif ($diff->i > 0) {
            return $diff->i . ' minute' . ($diff->i > 1 ? 's' : '');
        } else {
            return 'à l\'instant';
        }
    }
}