<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../backend/Kernel.php';

use Controllers\UserController;
use Controllers\AuthController;

$uri = $_SERVER['REQUEST_URI'];

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
    require_once __DIR__ . '/users.html';
    exit;
}

if ($uri === '/app-gestion-parking/public/login') {
    require_once __DIR__ . '/login.html';
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not Found']);
exit;
?>