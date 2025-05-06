<?php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../backend/Kernel.php';

use Core\Auth;

if (!Auth::isAuthenticated()) {
    header('Location: /app-gestion-parking/public/login');
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mes Paiements - Gestion de Parking</title>
    <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
    <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
    <div id="app-content">
        <h1>Mes Paiements</h1>
        <div id="payment-list">
            <div class="loading">Chargement des paiements...</div>
        </div>
    </div>
</body>
</html>