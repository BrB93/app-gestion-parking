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
    
    public function getUnreadNotificationsByUserId(int $userId): array {
        $stmt = $this->db->prepare("SELECT * FROM notifications WHERE user_id = :user_id AND is_read = 0 ORDER BY timestamp DESC");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $notifications = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $notifications[] = $this->mapToNotification($row);
        }
        
        return $notifications;
    }

    public function createNotification(int $userId, string $type, string $title, string $content): int {
        $stmt = $this->db->prepare("
            INSERT INTO notifications (user_id, type, title, content, is_read) 
            VALUES (:user_id, :type, :title, :content, :is_read)
        ");
        $isRead = false;
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':type', $type, PDO::PARAM_STR);
        $stmt->bindParam(':title', $title, PDO::PARAM_STR);
        $stmt->bindParam(':content', $content, PDO::PARAM_STR);
        $stmt->bindParam(':is_read', $isRead, PDO::PARAM_BOOL);
        
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
        $stmt = $this->db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = :user_id AND is_read = 0");
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
    
    public function countUnreadNotifications(int $userId): int {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = 0");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }
}