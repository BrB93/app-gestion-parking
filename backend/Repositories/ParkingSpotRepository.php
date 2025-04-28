<?php
namespace Repositories;
use Core\Database;
use Models\ParkingSpot;
use PDO;

class ParkingSpotRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAllSpots(): array {
        $stmt = $this->db->query("SELECT * FROM parking_spots ORDER BY spot_number");
        $spots = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $spots[] = new ParkingSpot(
                $row['id'],
                $row['spot_number'], 
                $row['type'], 
                $row['status'],
                $row['owner_id'],
                $row['pricing_id']
            );
        }
        return $spots;
    }
    
    public function getSpotById(int $id): ?ParkingSpot {
        $stmt = $this->db->prepare("SELECT * FROM parking_spots WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new ParkingSpot(
            $row['id'],
            $row['spot_number'], 
            $row['type'], 
            $row['status'],
            $row['owner_id'],
            $row['pricing_id']
        );
    }
    
    public function getSpotsByType(string $type): array {
        $stmt = $this->db->prepare("SELECT * FROM parking_spots WHERE type = :type ORDER BY spot_number");
        $stmt->bindParam(':type', $type, PDO::PARAM_STR);
        $stmt->execute();
        
        $spots = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $spots[] = new ParkingSpot(
                $row['id'],
                $row['spot_number'], 
                $row['type'], 
                $row['status'],
                $row['owner_id'],
                $row['pricing_id']
            );
        }
        return $spots;
    }
    
    public function getSpotsByStatus(string $status): array {
        $stmt = $this->db->prepare("SELECT * FROM parking_spots WHERE status = :status ORDER BY spot_number");
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->execute();
        
        $spots = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $spots[] = new ParkingSpot(
                $row['id'],
                $row['spot_number'], 
                $row['type'], 
                $row['status'],
                $row['owner_id'],
                $row['pricing_id']
            );
        }
        return $spots;
    }
    
    public function createSpot(string $spot_number, string $type, string $status = 'libre', int $owner_id = null, int $pricing_id = null): bool {
        $stmt = $this->db->prepare("INSERT INTO parking_spots (spot_number, type, status, owner_id, pricing_id) VALUES (:spot_number, :type, :status, :owner_id, :pricing_id)");
        $stmt->bindParam(':spot_number', $spot_number, PDO::PARAM_STR);
        $stmt->bindParam(':type', $type, PDO::PARAM_STR);
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->bindParam(':owner_id', $owner_id, $owner_id ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindParam(':pricing_id', $pricing_id, $pricing_id ? PDO::PARAM_INT : PDO::PARAM_NULL);
        
        return $stmt->execute();
    }
    
    public function updateSpot(int $id, array $data): bool {
        $setClauses = [];
        $params = [':id' => $id];
        
        foreach ($data as $key => $value) {
            if (in_array($key, ['spot_number', 'type', 'status', 'owner_id', 'pricing_id'])) {
                if (($key === 'owner_id' || $key === 'pricing_id') && ($value === '' || $value === null)) {
                    $setClauses[] = "$key = NULL";
                } else {
                    $setClauses[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
            }
        }
        
        if (empty($setClauses)) {
            return false;
        }
        
        $query = "UPDATE parking_spots SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        
        return $stmt->execute($params);
    }
    public function deleteSpot(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM parking_spots WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    public function getAvailableSpots(): array {
        return $this->getSpotsByStatus('libre');
    }

    public function getSpotsByOwnerId(int $ownerId): array {
        $stmt = $this->db->prepare("SELECT * FROM parking_spots WHERE owner_id = :owner_id ORDER BY spot_number");
        $stmt->bindParam(':owner_id', $ownerId, PDO::PARAM_INT);
        $stmt->execute();
        
        $spots = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $spots[] = new ParkingSpot(
                $row['id'],
                $row['spot_number'], 
                $row['type'], 
                $row['status'],
                $row['owner_id'],
                $row['pricing_id']
            );
        }
        return $spots;
    }
    
    public function updateSpotStatus(int $spotId, string $status): bool {
        if (!in_array($status, ['libre', 'occupee', 'reservee'])) {
            return false;
        }
        
        $stmt = $this->db->prepare("UPDATE parking_spots SET status = :status WHERE id = :id");
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->bindParam(':id', $spotId, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

}