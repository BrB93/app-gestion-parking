<?php
namespace Models;

class Pricing {
    public function __construct(
        private int $id,
        private string $type_place,
        private string $day_of_week,
        private string $start_hour,
        private string $end_hour,
        private float $price_per_hour
    ) {}

    public function getId(): int { return $this->id; }
    public function getTypePlace(): string { return $this->type_place; }
    public function getDayOfWeek(): string { return $this->day_of_week; }
    public function getStartHour(): string { return $this->start_hour; }
    public function getEndHour(): string { return $this->end_hour; }
    public function getPricePerHour(): float { return $this->price_per_hour; }
    
    public function getName(): string {
        return ucfirst($this->type_place) . ' - ' . ucfirst($this->day_of_week);
    }
    
    public function getPrice(): float {
        return $this->price_per_hour;
    }
}