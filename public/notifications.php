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
  <title>Notifications - Gestion de Parking</title>
  <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
    <h1>Mes Notifications</h1>
    <div class="notification-page-actions">
      <button id="mark-all-notifications-read" class="btn-secondary">Marquer tout comme lu</button>
      <button id="delete-all-notifications" class="btn-danger">Supprimer toutes les notifications</button>
    </div>
    <div id="notifications-container" class="notifications-container">
      <div class="loading">Chargement des notifications...</div>
    </div>
  </div>
</body>
</html>