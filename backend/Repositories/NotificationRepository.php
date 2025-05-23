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
        
        if ($this->isJson($content)) {
            $contentObj = json_decode($content, true);
            $formattedContent = $this->formatNotificationContent($contentObj);
            $content = $formattedContent;
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

    private function isJson($string) {
    json_decode($string);
    return (json_last_error() == JSON_ERROR_NONE);
}

    private function formatNotificationContent($contentObj) {
        if (!isset($contentObj['action'])) {
            return json_encode($contentObj);
        }
        
        $action = $contentObj['action'];
        $entityType = $contentObj['entity_type'] ?? 'élément';
        $entityId = $contentObj['entity_id'] ?? '';
        
        $entityLabels = [
            'user' => 'utilisateur',
            'person' => 'personne',
            'parking_spot' => 'place de parking',
            'reservation' => 'réservation',
            'payment' => 'paiement'
        ];
        
        $entityLabel = $entityLabels[$entityType] ?? $entityType;
        
        $entityName = '';
        if (isset($contentObj['details']['person_name'])) {
            $entityName = $contentObj['details']['person_name'];
        }
        
        switch ($action) {
            case 'update':
                $fieldsText = '';
                if (isset($contentObj['details']['fields']) && is_array($contentObj['details']['fields'])) {
                    $humanFields = $this->convertFieldsToHumanReadable($contentObj['details']['fields'], $entityType);
                    $fieldsText = " (champs modifiés : " . implode(', ', $humanFields) . ")";
                }
                
                return $entityName 
                    ? "Mise à jour des informations de $entityLabel : $entityName$fieldsText" 
                    : "Mise à jour d'un $entityLabel #$entityId$fieldsText";
            
            case 'create':
                return $entityName 
                    ? "Création d'un nouveau $entityLabel : $entityName" 
                    : "Nouveau $entityLabel créé";
                
            case 'delete':
                return $entityName 
                    ? "Suppression du $entityLabel : $entityName" 
                    : "Un $entityLabel a été supprimé";
                
            default:
                return "Activité sur $entityLabel" . ($entityName ? " : $entityName" : " #$entityId");
        }
    }

    private function convertFieldsToHumanReadable($fields, $entityType) {
        $fieldLabels = [
            'username' => 'nom d\'utilisateur',
            'email' => 'adresse email',
            'password' => 'mot de passe',
            'phone' => 'téléphone',
            'first_name' => 'prénom',
            'last_name' => 'nom',
            'address' => 'adresse',
            'zip_code' => 'code postal',
            'city' => 'ville',
            'apartment_number' => 'numéro d\'appartement',
            'phone_number' => 'numéro de téléphone',
            'vehicle_brand' => 'marque du véhicule',
            'vehicle_model' => 'modèle du véhicule',
            'license_plate' => 'plaque d\'immatriculation',
            'spot_number' => 'numéro de place',
            'type' => 'type',
            'status' => 'statut',
            'start_time' => 'heure de début',
            'end_time' => 'heure de fin',
            'amount' => 'montant',
            'method' => 'méthode de paiement'
        ];
        
        $result = [];
        foreach ($fields as $field) {
            $result[] = $fieldLabels[$field] ?? $field;
        }
        
        if (count($result) > 3) {
            return array_slice($result, 0, 3) + ["et " . (count($result) - 3) . " autres"];
        }
        
        return $result;
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