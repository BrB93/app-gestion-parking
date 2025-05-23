<?php
namespace Repositories;

use Core\Database;
use Models\Notification;
use PDO;

class NotificationRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAllNotifications(): array {
        $stmt = $this->db->query("SELECT * FROM notifications ORDER BY timestamp DESC");
        $notifications = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $notifications[] = $this->mapToNotification($row);
        }
        
        return $notifications;
    }
    
    public function getNotificationById(int $id): ?Notification {
        $stmt = $this->db->prepare("SELECT * FROM notifications WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return $this->mapToNotification($row);
    }
    
    public function getNotificationsByUserId(int $userId): array {
        $stmt = $this->db->prepare("SELECT * FROM notifications WHERE user_id = :user_id ORDER BY timestamp DESC");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $notifications = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $notifications[] = $this->mapToNotification($row);
        }
        
        return $notifications;
    }
    
    public function getUnreadNotifications(int $userId): array {
        $stmt = $this->db->prepare("SELECT * FROM notifications WHERE user_id = :user_id AND is_read = 0 ORDER BY timestamp DESC");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $notifications = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $notifications[] = $this->mapToNotification($row);
        }
        
        return $notifications;
    }
    
    public function getUnreadCount(int $userId): int {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = 0");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        return (int)$stmt->fetchColumn();
    }
    
    public function createNotification(int $userId, string $type, string $content): int {
        if (!in_array($type, ['rappel', 'alerte'])) {
            throw new \InvalidArgumentException("Type de notification invalide: $type");
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO notifications (user_id, type, content, is_read)
            VALUES (:user_id, :type, :content, 0)
        ");
        
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':type', $type, PDO::PARAM_STR);
        $stmt->bindParam(':content', $content, PDO::PARAM_STR);
        
        if ($stmt->execute()) {
            return (int)$this->db->lastInsertId();
        }
        
        return 0;
    }
    
    public function markAsRead(int $id): bool {
        $stmt = $this->db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    public function markAllAsRead(int $userId): bool {
        $stmt = $this->db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    public function deleteNotification(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM notifications WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    public function deleteAllNotifications(int $userId): bool {
        $stmt = $this->db->prepare("DELETE FROM notifications WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    public function createReservationReminder(int $userId, int $reservationId, string $spotNumber, string $startTime, string $timeFrame = '4 heures'): int {
        $formattedTime = date('d/m/Y à H:i', strtotime($startTime));
        $content = "Rappel : Votre réservation de la place n°$spotNumber commence dans $timeFrame ($formattedTime).";
        
        return $this->createNotification($userId, 'rappel', $content);
    }
    
    public function createAvailabilityAlert(int $userId, string $spotType, int $count): int {
        $content = "Des places de type \"$spotType\" sont disponibles ($count places).";
        
        return $this->createNotification($userId, 'alerte', $content);
    }
    
    private function mapToNotification(array $row): Notification {
        return new Notification(
            $row['id'],
            $row['user_id'],
            $row['type'],
            $row['content'],
            (bool)$row['is_read'],
            $row['timestamp']
        );
    }
}