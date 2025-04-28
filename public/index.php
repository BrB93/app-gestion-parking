<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../backend/Kernel.php';

use Controllers\UserController;
use Controllers\AuthController;
use Controllers\ParkingSpotController;
use Controllers\PersonController;
use Controllers\ReservationController;


$uri = $_SERVER['REQUEST_URI'];

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

// réservations
if (preg_match('#^/app-gestion-parking/public/api/reservations$#', $uri)) {
    $controller = new ReservationController();
    $controller->index(); // Liste toutes les réservations
    exit;
}

if ($uri === '/app-gestion-parking/public/api/reservations/create') {
    $controller = new ReservationController();
    $controller->create(); // Crée une réservation
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/reservations/(\d+)$#', $uri, $matches)) {
    $controller = new ReservationController();
    $controller->show($matches[1]); // Détail d'une réservation
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/reservations/(\d+)/cancel$#', $uri, $matches)) {
    $controller = new ReservationController();
    $controller->cancel($matches[1]); // Annule une réservation
    exit;
}

if ($uri === '/app-gestion-parking/public/reservations') {
    require_once __DIR__ . '/reservations.php';
    exit;
}

if (preg_match('#^/app-gestion-parking/public/api/reservations/(\d+)/update$#', $uri, $matches)) {
    $controller = new ReservationController();
    $controller->update($matches[1]); // Met à jour une réservation
    exit;
}

// HTML
if ($uri === '/app-gestion-parking/public/' || $uri === '/app-gestion-parking/public/index.php') {
    ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Accueil</title>
  <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
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
    require_once __DIR__ . '/login.php';
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

