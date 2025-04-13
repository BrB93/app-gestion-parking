<?php
namespace Repositories;

use Core\Database;
use Models\Person;
use PDO;

class PersonRepository {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAllPersons(): array {
        $stmt = $this->db->query("SELECT * FROM persons");
        $persons = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $persons[] = $this->mapToPerson($row);
        }
        return $persons;
    }

    public function getPersonsByUserId(int $userId): array {
        $stmt = $this->db->prepare("SELECT * FROM persons WHERE user_id = :user_id");
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $persons = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $persons[] = $this->mapToPerson($row);
        }
        return $persons;
    }

    public function findPersonById(int $id): ?Person {
        $stmt = $this->db->prepare("SELECT * FROM persons WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->mapToPerson($row) : null;
    }

    public function createPerson(array $data): bool {
        $stmt = $this->db->prepare("
            INSERT INTO persons (user_id, address, apartment_number, phone_number, vehicle_brand, vehicle_model, license_plate)
            VALUES (:user_id, :address, :apartment_number, :phone_number, :vehicle_brand, :vehicle_model, :license_plate)
        ");

        $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
        $stmt->bindParam(':address', $data['address'], PDO::PARAM_STR);
        $stmt->bindParam(':apartment_number', $data['apartment_number']);
        $stmt->bindParam(':phone_number', $data['phone_number']);
        $stmt->bindParam(':vehicle_brand', $data['vehicle_brand']);
        $stmt->bindParam(':vehicle_model', $data['vehicle_model']);
        $stmt->bindParam(':license_plate', $data['license_plate']);

        return $stmt->execute();
    }

    public function updatePerson(int $id, array $data): bool {
        $setClauses = [];
        $params = [':id' => $id];

        foreach ($data as $key => $value) {
            $setClauses[] = "$key = :$key";
            $params[":$key"] = $value;
        }

        if (empty($setClauses)) return false;

        $query = "UPDATE persons SET " . implode(', ', $setClauses) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute($params);
    }

    public function deletePerson(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM persons WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    private function mapToPerson(array $row): Person {
        return new Person(
            $row['id'],
            $row['user_id'],
            $row['address'],
            $row['apartment_number'] ?? null,
            $row['phone_number'] ?? null,
            $row['created_at'] ?? null,
            $row['vehicle_brand'] ?? null,
            $row['vehicle_model'] ?? null,
            $row['license_plate'] ?? null
        );
    }
}