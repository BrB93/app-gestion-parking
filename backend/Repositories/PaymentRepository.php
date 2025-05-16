<?php
namespace Repositories;

use Core\Database;
use Models\Payment;
use PDO;

class PaymentRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAllPayments(): array {
        $stmt = $this->db->query("SELECT * FROM payments ORDER BY timestamp DESC");
        $payments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $payments[] = $this->mapToPayment($row);
        }
        return $payments;
    }

    public function getPaymentById(int $id): ?Payment {
        $stmt = $this->db->prepare("SELECT * FROM payments WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->mapToPayment($row) : null;
    }

    public function getPaymentsByReservationId(int $reservationId): array {
        $stmt = $this->db->prepare("SELECT * FROM payments WHERE reservation_id = :reservation_id ORDER BY timestamp DESC");
        $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmt->execute();

        $payments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $payments[] = $this->mapToPayment($row);
        }
        return $payments;
    }

    public function getPaymentsByUserId(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT p.* 
            FROM payments p 
            JOIN reservations r ON p.reservation_id = r.id 
            WHERE r.user_id = :user_id 
            ORDER BY p.timestamp DESC
        ");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $payments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $payments[] = $this->mapToPayment($row);
        }
        return $payments;
    }

    public function createPayment(int $reservationId, float $amount, string $method, string $status = 'effectue'): int {
        $stmt = $this->db->prepare("
            INSERT INTO payments (reservation_id, amount, method, status) 
            VALUES (:reservation_id, :amount, :method, :status)
        ");
        $stmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
        $stmt->bindParam(':amount', $amount, PDO::PARAM_STR);
        $stmt->bindParam(':method', $method, PDO::PARAM_STR);
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        
        if ($stmt->execute()) {
            return (int)$this->db->lastInsertId();
        }
        return 0;
    }

    public function updatePaymentStatus(int $id, string $status): bool {
        if (!in_array($status, ['en_attente', 'effectue', 'echoue'])) {
            return false;
        }

        $stmt = $this->db->prepare("UPDATE payments SET status = :status WHERE id = :id");
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    public function getPaymentsBySpotId(int $spotId): array {
        $stmt = $this->db->prepare("
            SELECT p.* 
            FROM payments p 
            JOIN reservations r ON p.reservation_id = r.id 
            WHERE r.spot_id = :spot_id 
            ORDER BY p.timestamp DESC
        ");
        $stmt->bindParam(':spot_id', $spotId, PDO::PARAM_INT);
        $stmt->execute();

        $payments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $payments[] = $this->mapToPayment($row);
        }
        return $payments;
    }
    
    public function getTotalCompletedPaymentAmount(int $userId = null): float {
        $query = "SELECT SUM(amount) as total FROM payments WHERE status = 'effectue'";
        $params = [];
        
        if ($userId !== null) {
            $query .= " AND reservation_id IN (SELECT id FROM reservations WHERE user_id = :user_id)";
            $params[':user_id'] = $userId;
        }
        
        $stmt = $this->db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'] ?? 0;
    }

    private function mapToPayment(array $row): Payment {
        return new Payment(
            $row['id'],
            $row['reservation_id'],
            $row['amount'],
            $row['method'],
            $row['status'],
            $row['timestamp']
        );
    }
    
}