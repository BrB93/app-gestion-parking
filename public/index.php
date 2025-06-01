<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../backend/Kernel.php';

use Controllers\UserController;
use Controllers\AuthController;
use Controllers\ParkingSpotController;
use Controllers\PersonController;
use Controllers\ReservationController;
use Controllers\PaymentController;
use Controllers\PricingController;


$uri = $_SERVER['REQUEST_URI'];
if (isset($_GET['reset_session'])) {
    session_start();
    session_destroy();
    setcookie(session_name(), '', time() - 3600);
    header('Location: /app-gestion-parking/public/login');
    exit;
}


// tableau de bord
if ($uri === '/app-gestion-parking/public/api/dashboard/stats') {
    $auth = new Core\Auth();
    if (!$auth::isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentification requise']);
        exit;
    }
    
    $currentUser = $auth::getCurrentUser();
    $userRepo = new Repositories\UserRepository();
    $reservationRepo = new Repositories\ReservationRepository();
    $spotRepo = new Repositories\ParkingSpotRepository();
    $paymentRepo = new Repositories\PaymentRepository();
    
    $stats = [];
    
    if ($currentUser->getRole() === 'admin') {
        $users = $userRepo->getAllUsers();
        $spots = $spotRepo->getAllSpots();
        $reservations = $reservationRepo->getAllReservations();
        $totalAmount = $paymentRepo->getTotalCompletedPaymentAmount();
        
        $stats = [
            'total_users' => count($users),
            'total_spots' => count($spots),
            'total_reservations' => count($reservations),
            'available_spots' => count($spotRepo->getAvailableSpots()),
            'total_amount' => $totalAmount,
            'users_by_role' => [
                'admin' => count(array_filter($users, function($u) { return $u->getRole() === 'admin'; })),
                'owner' => count(array_filter($users, function($u) { return $u->getRole() === 'owner'; })),
                'user' => count(array_filter($users, function($u) { return $u->getRole() === 'user'; })),
            ]
        ];
    } elseif ($currentUser->getRole() === 'owner') {
        $ownedSpots = $spotRepo->getSpotsByOwnerId($currentUser->getId());
        $reservations = $reservationRepo->getReservationsByOwnerId($currentUser->getId());
        $userReservations = $reservationRepo->getReservationsByUserId($currentUser->getId());
        
        $revenue = 0;
        foreach ($reservations as $reservation) {
            $payments = $paymentRepo->getPaymentsByReservationId($reservation->getId());
            foreach ($payments as $payment) {
                if ($payment->isCompleted()) {
                    $revenue += $payment->getAmount();
                }
            }
        }
        
        $stats = [
            'owned_spots' => count($ownedSpots),
            'total_reservations_on_my_spots' => count($reservations),
            'active_reservations_on_my_spots' => count(array_filter($reservations, function($r) { 
                return !$r->isCancelled() && !$r->isFinished(); 
            })),
            'my_reservations' => count($userReservations),
            'total_revenue' => $revenue,
            'occupation_rate' => count($ownedSpots) > 0 ? 
                count(array_filter($ownedSpots, function($s) { return !$s->isAvailable(); })) / count($ownedSpots) * 100 : 0
        ];
    } else {
        $userReservations = $reservationRepo->getReservationsByUserId($currentUser->getId());
        $totalSpent = 0;
        foreach ($userReservations as $reservation) {
            $payments = $paymentRepo->getPaymentsByReservationId($reservation->getId());
            foreach ($payments as $payment) {
                if ($payment->isCompleted()) {
                    $totalSpent += $payment->getAmount();
                }
            }
        }
        
        $stats = [
            'total_reservations' => count($userReservations),
            'active_reservations' => count(array_filter($userReservations, function($r) { 
                return !$r->isCancelled() && !$r->isFinished(); 
            })),
            'total_spent' => $totalSpent,
            'favorite_spot_type' => 'normale', // Valeur par défaut
            'upcoming_reservations' => count(array_filter($userReservations, function($r) { 
                return !$r->isCancelled() && new DateTime($r->getStartTime()) > new DateTime(); 
            }))
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode($stats);
    exit;
}

// utilisateurs
if (preg_match('#^/app-gestion-parking/public/api/users$#', $uri)) {
    $controller = new UserController();
    $controller->index();
    exit;
}
if (preg_match('#^/app-gestion-parking/public/api/users/(\d+)$#', $uri, $matches)) {
    $controller = new UserController();
    $controller->show($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/users/create') {
    $controller = new UserController();
    $controller->create();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/users/(\d+)/update$#', $uri, $matches)) {
    $controller = new UserController();
    $controller->update($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/users/(\d+)/delete$#', $uri, $matches)) {
    $controller = new UserController();
    $controller->delete($matches[1]);
    exit;
}

// authentification
if ($uri === '/app-gestion-parking/public/api/register') {
    $controller = new AuthController();
    $controller->register();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/login') {
    $controller = new AuthController();
    $controller->login();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/logout') {
    $controller = new AuthController();
    $controller->logout();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/current-user') {
    $controller = new AuthController();
    $controller->getCurrentUser();
    exit;
}

// places de parking
if (preg_match('#^/app-gestion-parking/public/api/parking-spots$#', $uri)) {
    $controller = new ParkingSpotController();
    $controller->index();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/persons/(\d+)$#', $uri, $matches)) {
    $controller = new PersonController();
    $controller->show($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/parking-spots/create') {
    $controller = new ParkingSpotController();
    $controller->create();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/parking-spots/(\d+)/update$#', $uri, $matches)) {
    $controller = new ParkingSpotController();
    $controller->update($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/parking-spots/(\d+)/delete$#', $uri, $matches)) {
    $controller = new ParkingSpotController();
    $controller->delete($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/parking-spots/available') {
    $controller = new ParkingSpotController();
    $controller->available();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/parking-spots/form-data') {
    $controller = new ParkingSpotController();
    $controller->getFormData();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/parking-spots/(\d+)$#', $uri, $matches)) {
    $controller = new ParkingSpotController();
    $controller->show($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/parking-spots/(\d+)/availability$#', $uri, $matches)) {
    $controller = new ParkingSpotController();
    $controller->getAvailability($matches[1]);
    exit;
}

// personnes
if (preg_match('#^/app-gestion-parking/public/api/persons/(\d+)$#', $uri, $matches)) {
    $controller = new PersonController();
    $controller->show($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/persons$#', $uri)) {
    $controller = new PersonController();
    $controller->index();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/persons/by-user/(\d+)$#', $uri, $matches)) {
    $controller = new PersonController();
    $controller->getByUserId($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/persons/create') {
    $controller = new PersonController();
    $controller->create();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/persons/(\d+)/update$#', $uri, $matches)) {
    $controller = new PersonController();
    $controller->update($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/persons/(\d+)/delete$#', $uri, $matches)) {
    $controller = new PersonController();
    $controller->delete($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/persons/by-user/(\d+)$#', $uri, $matches)) {
    $controller = new PersonController();
    $controller->getByUserId($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/persons') {
    require_once __DIR__ . '/persons.php';
    exit;
}

//Tarifs

if ($uri === '/app-gestion-parking/public/api/pricings') {
    $controller = new PricingController();
    $controller->index();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/pricings/calculate') {
    $controller = new PricingController();
    $controller->calculatePrice();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/pricings/by-type/(.+)$#', $uri, $matches)) {
    $controller = new PricingController();
    $controller->getBySpotType($matches[1]);
    exit;
}

// réservations
if (preg_match('#^/app-gestion-parking/public/api/reservations$#', $uri)) {
    $controller = new ReservationController();
    $controller->index();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/reservations/create') {
    $controller = new ReservationController();
    $controller->create();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/reservations/(\d+)$#', $uri, $matches)) {
    $controller = new ReservationController();
    $controller->show($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/reservations/(\d+)/cancel$#', $uri, $matches)) {
    $controller = new ReservationController();
    $controller->cancel($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/reservations') {
    require_once __DIR__ . '/reservations.php';
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/reservations/(\d+)/update$#', $uri, $matches)) {
    $controller = new ReservationController();
    $controller->update($matches[1]);
    exit;
}

// notifications
if ($uri === '/app-gestion-parking/public/api/cron/check-reservations' && isset($_SERVER['HTTP_X_CRON_KEY']) && $_SERVER['HTTP_X_CRON_KEY'] === 'votre_clé_secrète') {
    $reservationRepo = new ReservationRepository();
    $spotRepo = new ParkingSpotRepository();
    $notificationRepo = new NotificationRepository();
    
    $upcomingReservations = $reservationRepo->getUpcomingReservations();
    $now = new \DateTime();
    $reminderThreshold4h = (new \DateTime())->add(new \DateInterval('PT4H'));
    $reminderThreshold1h = (new \DateTime())->add(new \DateInterval('PT1H'));
    
    foreach ($upcomingReservations as $reservation) {
        if ($reservation->getStatus() !== 'confirmee') continue;
        
        $startTime = new \DateTime($reservation->getStartTime());
        $userId = $reservation->getUserId();
        $spotId = $reservation->getSpotId();
        $spot = $spotRepo->getSpotById($spotId);
        
        if ($startTime > $now && $startTime <= $reminderThreshold4h && $startTime > $reminderThreshold1h) {
            if ($spot) {
                $notificationRepo->createReservationReminder(
                    $userId,
                    $reservation->getId(),
                    $spot->getSpotNumber(),
                    $reservation->getStartTime(),
                    '4 heures'
                );
            }
        }
        
        if ($startTime > $now && $startTime <= $reminderThreshold1h) {
            if ($spot) {
                $notificationRepo->createReservationReminder(
                    $userId,
                    $reservation->getId(),
                    $spot->getSpotNumber(),
                    $reservation->getStartTime(),
                    '1 heure'
                );
            }
        }
    }
    
    echo json_encode(['success' => true, 'message' => 'Vérification des notifications terminée']);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/notifications$#', $uri)) {
    $controller = new Controllers\NotificationController();
    $controller->index();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/notifications/(\d+)$#', $uri, $matches)) {
    $controller = new Controllers\NotificationController();
    $controller->show($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/notifications/(\d+)/read$#', $uri, $matches)) {
    $controller = new Controllers\NotificationController();
    $controller->markAsRead($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/notifications/mark-all-read') {
    $controller = new Controllers\NotificationController();
    $controller->markAllAsRead();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/notifications/unread-count') {
    $controller = new Controllers\NotificationController();
    $controller->getUnreadCount();
    exit;
}


if ($uri === '/app-gestion-parking/public/api/notifications/delete-all') {
    $controller = new Controllers\NotificationController();
    $controller->deleteAll();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/notifications/create') {
    $controller = new Controllers\NotificationController();
    $controller->create();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/notifications/(\d+)/delete$#', $uri, $matches)) {
    $controller = new Controllers\NotificationController();
    $controller->delete($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/notifications/delete-all') {
    $controller = new Controllers\NotificationController();
    $controller->deleteAll();
    exit;
}


// paiements
if ($uri === '/app-gestion-parking/public/api/payments') {
    try {
        $controller = new PaymentController();
        $controller->index();
    } catch (Exception $e) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
    }
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/payments/(\d+)$#', $uri, $matches)) {
    $controller = new PaymentController();
    $controller->show($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/payments/process') {
    $controller = new PaymentController();
    $controller->processPayment();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/payments/(\d+)/confirm$#', $uri, $matches)) {
    $controller = new PaymentController();
    $controller->confirmPayment($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/payments/(\d+)/cancel$#', $uri, $matches)) {
    $controller = new PaymentController();
    $controller->cancelPayment($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/payments$#', $uri)) {
    if (!Core\Auth::isAuthenticated()) {
        $_SESSION['redirect_after_login'] = $uri;
        header('Location: /app-gestion-parking/public/login');
        exit;
    }
    require_once __DIR__ . '/payments.php';
    exit;
}

if (preg_match('#^/app-gestion-parking/public/payments/process$#', $uri)) {
    if (!Core\Auth::isAuthenticated()) {
        $_SESSION['redirect_after_login'] = $uri;
        header('Location: /app-gestion-parking/public/login');
        exit;
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $_SESSION['payment_data'] = [
            'reservation_id' => $_POST['reservation_id'],
            'amount' => $_POST['amount']
        ];
        
        header('Location: /app-gestion-parking/public/payment-gateway.php');
        exit;
    } else {
        header('Location: /app-gestion-parking/public/reservations');
        exit;
    }
}


// HTML
if ($uri === '/app-gestion-parking/public/' || $uri === '/app-gestion-parking/public/index.php') {
    ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>SmartPark - Gestion intelligente de parking</title>
    <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
    <div class="home-hero">
      <h1>SmartPark</h1>
      <p>La solution moderne pour la gestion de votre parking. Réservez, payez et gérez vos places de stationnement en toute simplicité.</p>
      <div class="home-cta-buttons">
        <a href="/app-gestion-parking/public/login" class="btn-primary">Connexion / Inscription</a>
      </div>
    </div>
    <div id="map-container" style="height: 400px;"></div>

    <div class="home-section" style="text-align: center;">
      <h2>Prêt à simplifier votre stationnement ?</h2>
      <a href="/app-gestion-parking/public/login" class="btn-primary" style="margin-top:18px;">Commencer maintenant</a>
    </div>

    <div class="home-contact">
      <p>
        Vous représentez une copropriété ?<br>
        Contactez notre équipe à <a href="mailto:contact@smartpark.fr">contact@smartpark.fr</a> pour une démonstration personnalisée.
      </p>
    </div>

    <div class="footer-section">
      <p>© 2025 SmartPark - Application de gestion de parking</p>
    </div>
  </div>
</body>
</html>
<?php
    exit;
}

if ($uri === '/app-gestion-parking/public/users') {
    require_once __DIR__ . '/users.php';
    exit;
}

if ($uri === '/app-gestion-parking/public/parking') {
    require_once __DIR__ . '/parking.php';
    exit;
}

if ($uri === '/app-gestion-parking/public/login') {
    include __DIR__ . '/login.php';
    exit;
}

if ($uri === '/app-gestion-parking/public/profile') {
    require_once __DIR__ . '/profile.php';
    exit;
}
if ($uri === '/app-gestion-parking/public/notifications') {
    require __DIR__ . '/notifications.php';
    exit;
}



http_response_code(404);
echo json_encode(['error' => 'Not Found']);
exit;
?>

