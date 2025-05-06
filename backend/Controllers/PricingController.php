<?php
namespace Controllers;
use Repositories\PricingRepository;
use Core\Auth;

class PricingController {
    private $pricingRepo;

    public function __construct() {
        $this->pricingRepo = new PricingRepository();
    }

    public function index() {
        Auth::requireAuthentication();
        
        $pricings = $this->pricingRepo->getAllPricings();
        
        header('Content-Type: application/json');
        echo json_encode(array_map(function($pricing) {
            return [
                'id' => $pricing->getId(),
                'type_place' => $pricing->getTypePlace(),
                'day_of_week' => $pricing->getDayOfWeek(),
                'start_hour' => $pricing->getStartHour(),
                'end_hour' => $pricing->getEndHour(),
                'price_per_hour' => $pricing->getPricePerHour(),
                'name' => $pricing->getName()
            ];
        }, $pricings));
    }

    public function getBySpotType($type) {
        Auth::requireAuthentication();
        
        $pricings = $this->pricingRepo->getPricingsByType($type);
        
        header('Content-Type: application/json');
        echo json_encode(array_map(function($pricing) {
            return [
                'id' => $pricing->getId(),
                'type_place' => $pricing->getTypePlace(),
                'day_of_week' => $pricing->getDayOfWeek(),
                'start_hour' => $pricing->getStartHour(),
                'end_hour' => $pricing->getEndHour(),
                'price_per_hour' => $pricing->getPricePerHour(),
                'name' => $pricing->getName()
            ];
        }, $pricings));
    }

    public function calculatePrice() {
        Auth::requireAuthentication();
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['spot_id']) || !isset($data['start_time']) || !isset($data['end_time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Paramètres manquants']);
            return;
        }
        
        $spotId = $data['spot_id'];
        $startTime = $data['start_time'];
        $endTime = $data['end_time'];
        
        $spotRepo = new \Repositories\ParkingSpotRepository();
        $spot = $spotRepo->getSpotById($spotId);
        
        if (!$spot) {
            http_response_code(404);
            echo json_encode(['error' => 'Place de parking non trouvée']);
            return;
        }
        
        $totalPrice = $this->calculateTotalPrice($spot, $startTime, $endTime);
        
        echo json_encode([
            'success' => true,
            'price' => $totalPrice,
            'formatted_price' => number_format($totalPrice, 2, ',', ' ') . ' €',
            'spot_type' => $spot->getType()
        ]);
    }
    
    public function calculateTotalPrice($spot, $startTime, $endTime) {
        $startDt = new \DateTime($startTime);
        $endDt = new \DateTime($endTime);
        
        $spotType = $spot->getType();
        $hours = ($endDt->getTimestamp() - $startDt->getTimestamp()) / 3600;
        
        if ($spot->getPricingId()) {
            $pricing = $this->pricingRepo->getPricingById($spot->getPricingId());
            if ($pricing) {
                return $pricing->getPricePerHour() * $hours;
            }
        }
        
        $totalPrice = 0;
        $currentDt = clone $startDt;
        
        while ($currentDt < $endDt) {
            $dayOfWeek = strtolower($currentDt->format('l'));
            $daysMap = [
                'monday' => 'lundi',
                'tuesday' => 'mardi',
                'wednesday' => 'mercredi',
                'thursday' => 'jeudi',
                'friday' => 'vendredi',
                'saturday' => 'samedi',
                'sunday' => 'dimanche'
            ];
            $dayOfWeek = $daysMap[$dayOfWeek];
            
            $hourOfDay = $currentDt->format('H:i:s');
            
            $applicablePricing = $this->pricingRepo->findApplicablePricing(
                $spotType,
                $dayOfWeek,
                $hourOfDay
            );
            
            if ($applicablePricing) {
                $totalPrice += $applicablePricing->getPricePerHour();
            } else {
                $totalPrice += 2.00;
            }
            
            $currentDt->modify('+1 hour');
        }
        
        return $totalPrice;
    }

}