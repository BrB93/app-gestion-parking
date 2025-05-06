<?php
namespace Repositories;
use Core\Database;
use Models\Pricing;
use PDO;

class PricingRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAllPricings(): array {
        $stmt = $this->db->query("SELECT * FROM pricing ORDER BY type_place, day_of_week");
        $pricings = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $pricings[] = new Pricing(
                $row['id'],
                $row['type_place'],
                $row['day_of_week'],
                $row['start_hour'],
                $row['end_hour'],
                $row['price_per_hour']
            );
        }
        
        return $pricings;
    }
    
    public function getPricingById(int $id): ?Pricing {
        $stmt = $this->db->prepare("SELECT * FROM pricing WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new Pricing(
            $row['id'],
            $row['type_place'],
            $row['day_of_week'],
            $row['start_hour'],
            $row['end_hour'],
            $row['price_per_hour']
        );
    }
    
    public function getPricingsByType(string $type): array {
        $stmt = $this->db->prepare("SELECT * FROM pricing WHERE type_place = :type ORDER BY day_of_week");
        $stmt->bindParam(':type', $type, PDO::PARAM_STR);
        $stmt->execute();
        
        $pricings = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $pricings[] = new Pricing(
                $row['id'],
                $row['type_place'],
                $row['day_of_week'],
                $row['start_hour'],
                $row['end_hour'],
                $row['price_per_hour']
            );
        }
        
        return $pricings;
    }

    public function findApplicablePricing(string $spotType, string $dayOfWeek, string $hourOfDay): ?Pricing {
        $stmt = $this->db->prepare("
            SELECT * FROM pricing 
            WHERE type_place = :type_place 
            AND day_of_week = :day_of_week 
            AND start_hour <= :hour_of_day 
            AND end_hour > :hour_of_day 
            LIMIT 1
        ");
        
        $stmt->bindParam(':type_place', $spotType, PDO::PARAM_STR);
        $stmt->bindParam(':day_of_week', $dayOfWeek, PDO::PARAM_STR);
        $stmt->bindParam(':hour_of_day', $hourOfDay, PDO::PARAM_STR);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        
        return new Pricing(
            $row['id'],
            $row['type_place'],
            $row['day_of_week'],
            $row['start_hour'],
            $row['end_hour'],
            $row['price_per_hour']
        );
    }
}