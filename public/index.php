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
if (preg_match('#^/app-gestion-parking/public/api/notifications$#', $uri)) {
    $controller = new NotificationController();
    $controller->index();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/notifications/(\d+)$#', $uri, $matches)) {
    $controller = new NotificationController();
    $controller->show($matches[1]);
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/notifications/(\d+)/read$#', $uri, $matches)) {
    $controller = new NotificationController();
    $controller->markAsRead($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/notifications/mark-all-read') {
    $controller = new NotificationController();
    $controller->markAllAsRead();
    exit;
}

if ($uri === '/app-gestion-parking/public/api/notifications/unread-count') {
    $controller = new NotificationController();
    $controller->countUnread();
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/notifications/(\d+)/delete$#', $uri, $matches)) {
    $controller = new NotificationController();
    $controller->delete($matches[1]);
    exit;
}

if ($uri === '/app-gestion-parking/public/api/notifications/create') {
    $controller = new NotificationController();
    $controller->create();
    exit;
}

if ($uri === '/app-gestion-parking/public/notifications') {
    require __DIR__ . '/notifications.php';
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
  <style>
    .hero-section {
      background-color: #3498db;
      color: white;
      padding: 60px 20px;
      text-align: center;
      border-radius: 10px;
      margin-bottom: 40px;
    }
    
    .hero-section h1 {
      font-size: 3em;
      margin-bottom: 15px;
    }
    
    .hero-section p {
      font-size: 1.2em;
      margin-bottom: 30px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .features-section {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 30px;
      margin-bottom: 50px;
    }
    
    .feature-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      padding: 25px;
      width: 300px;
      text-align: center;
      transition: transform 0.3s;
    }
    
    .feature-card:hover {
      transform: translateY(-10px);
    }
    
    .feature-icon {
      font-size: 48px;
      margin-bottom: 20px;
      color: #3498db;
    }
    
    .cta-button {
      background-color: #2ecc71;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 1.2em;
      border-radius: 30px;
      cursor: pointer;
      transition: background-color 0.3s;
      display: inline-block;
      margin-top: 20px;
      text-decoration: none;
    }
    
    .cta-button:hover {
      background-color: #27ae60;
    }
    
    .footer-section {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #7f8c8d;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div id="app-content">
    <div class="hero-section">
      <h1>SmartPark</h1>
      <p>La solution moderne pour la gestion de votre parking. Réservez, payez et gérez vos places de stationnement en toute simplicité.</p>
      <a href="/app-gestion-parking/public/login" class="cta-button">Connexion / Inscription</a>
    </div>
    
    <div class="features-section">
      <div class="feature-card">
        <div class="feature-icon">🚗</div>
        <h3>Réservation Facile</h3>
        <p>Trouvez et réservez une place de parking en quelques clics, de n'importe où et à tout moment.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">💳</div>
        <h3>Paiement Sécurisé</h3>
        <p>Effectuez vos paiements en ligne en toute sécurité avec nos méthodes de paiement variées.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>Gestion Personnalisée</h3>
        <p>Gérez vos réservations, consultez votre historique et recevez des notifications en temps réel.</p>
      </div>
    </div>
    
    <div class="features-section">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Places Spéciales</h3>
        <p>Accédez à des places pour véhicules électriques, PMR et autres types d'emplacements spécifiques.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>Profils Multiples</h3>
        <p>Fonctionnalités adaptées pour les utilisateurs, propriétaires de places et administrateurs.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Tarification Transparente</h3>
        <p>Consultez les tarifs en temps réel selon les horaires et types d'emplacements.</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <h2>Prêt à simplifier votre stationnement ?</h2>
      <a href="/app-gestion-parking/public/login" class="cta-button">Commencer maintenant</a>
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



http_response_code(404);
echo json_encode(['error' => 'Not Found']);
exit;
?>

