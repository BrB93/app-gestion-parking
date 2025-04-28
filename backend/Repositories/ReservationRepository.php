<?php
namespace Repositories;

use Core\Database;
use Models\Reservation;
use PDO;

class ReservationRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAllReservations(): array {
        $stmt = $this->db->query("SELECT * FROM reservations ORDER BY start_time DESC");
        $reservations = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $reservations[] = new Reservation(
                $row['id'],
                $row['user_id'],
                $row['spot_id'],
                $row['start_time'],
                $row['end_time'],
                $row['status'],
                $row['created_at']
            );
        }
        return $reservations;
    }

    public function getReservationById(int $id): ?Reservation {
        $stmt = $this->db->prepare("SELECT * FROM reservations WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;

        return new Reservation(
            $row['id'],
            $row['user_id'],
            $row['spot_id'],
            $row['start_time'],
            $row['end_time'],
            $row['status'],
            $row['created_at']
        );
    }

    public function getReservationsByUserId(int $userId): array {
        $stmt = $this->db->prepare("SELECT * FROM reservations WHERE user_id = :user_id ORDER BY start_time DESC");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $reservations = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $reservations[] = new Reservation(
                $row['id'],
                $row['user_id'],
                $row['spot_id'],
                $row['start_time'],
                $row['end_time'],
                $row['status'],
                $row['created_at']
            );
        }
        return $reservations;
    }

    public function createReservation(int $userId, int $spotId, string $startTime, string $endTime, string $status = 'en_attente'): bool {
        $stmt = $this->db->prepare("INSERT INTO reservations (user_id, spot_id, start_time, end_time, status) VALUES (:user_id, :spot_id, :start_time, :end_time, :status)");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':spot_id', $spotId, PDO::PARAM_INT);
        $stmt->bindParam(':start_time', $startTime, PDO::PARAM_STR);
        $stmt->bindParam(':end_time', $endTime, PDO::PARAM_STR);
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);

        return $stmt->execute();
    }

    public function updateReservation(int $id, array $data): bool {
        $setClauses = [];
        $params = [':id' => $id];

        foreach ($data as $key => $value) {
            if (in_array($key, ['user_id', 'spot_id', 'start_time', 'end_time', 'status'])) {
                $setClauses[] = "$key = :$key";
                $params[":$key"] = $value;
            }
        }

        if (empty($setClauses)) {
            return false;
        }

        $query = "UPDATE reservations SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute($params);
    }

    public function deleteReservation(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM reservations WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getReservationsBySpotId(int $spotId): array {
        $stmt = $this->db->prepare("SELECT * FROM reservations WHERE spot_id = :spot_id ORDER BY start_time DESC");
        $stmt->bindParam(':spot_id', $spotId, PDO::PARAM_INT);
        $stmt->execute();

        $reservations = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $reservations[] = new Reservation(
                $row['id'],
                $row['user_id'],
                $row['spot_id'],
                $row['start_time'],
                $row['end_time'],
                $row['status'],
                $row['created_at']
            );
        }
        return $reservations;
    }

    public function getUpcomingReservations(): array {
        $stmt = $this->db->query("SELECT * FROM reservations WHERE start_time > NOW() ORDER BY start_time ASC");
        $reservations = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $reservations[] = new Reservation(
                $row['id'],
                $row['user_id'],
                $row['spot_id'],
                $row['start_time'],
                $row['end_time'],
                $row['status'],
                $row['created_at']
            );
        }
        return $reservations;
    }

    public function updateStatus(int $id, string $status): bool {
        if (!in_array($status, ['en_attente', 'confirmee', 'annulee', 'terminee'])) {
            return false;
        }
        
        $stmt = $this->db->prepare("UPDATE reservations SET status = :status WHERE id = :id");
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function getReservationsByOwnerId(int $ownerId): array {
        $sql = "SELECT r.* FROM reservations r
                JOIN parking_spots ps ON r.spot_id = ps.id
                WHERE ps.owner_id = :owner_id
                ORDER BY r.start_time DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':owner_id', $ownerId, PDO::PARAM_INT);
        $stmt->execute();
        
        $reservations = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $reservations[] = new Reservation(
                $row['id'],
                $row['user_id'],
                $row['spot_id'],
                $row['start_time'],
                $row['end_time'],
                $row['status'],
                $row['created_at']
            );
        }
        return $reservations;
    }
}
