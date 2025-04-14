<?php require_once __DIR__ . '/../vendor/autoload.php'; ?>
<?php require_once __DIR__ . '/../backend/Kernel.php'; ?>
<?php 
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
  <title>Places de Parking - Gestion de Parking</title>
  <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
    <h1>Gestion des Places de Parking</h1>
    <div id="parking-spot-list"></div>
  </div>
</body>
</html>