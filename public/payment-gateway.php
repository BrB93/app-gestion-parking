<?php 
session_start();
require_once __DIR__ . '/../vendor/autoload.php'; 
require_once __DIR__ . '/../backend/Kernel.php'; 

use Core\Auth;

if (!Auth::isAuthenticated()) {
    $_SESSION['redirect_after_login'] = '/app-gestion-parking/public/payments';
    header('Location: /app-gestion-parking/public/login?from=payments');
    exit;
}

$reservationId = null;
$amount = 0;

if (isset($_SESSION['payment_data'])) {
    $reservationId = $_SESSION['payment_data']['reservation_id'];
    $amount = $_SESSION['payment_data']['amount'];
    
    if ($amount == 0) {
        $reservationRepo = new \Repositories\ReservationRepository();
        $pricingController = new \Controllers\PricingController();
        
        $reservation = $reservationRepo->getReservationById($reservationId);
        if ($reservation) {
            $spotRepo = new \Repositories\ParkingSpotRepository();
            $spot = $spotRepo->getSpotById($reservation->getSpotId());
            
            if ($spot) {
                $amount = $pricingController->calculateTotalPrice(
                    $spot, 
                    $reservation->getStartTime(), 
                    $reservation->getEndTime()
                );
            }
        }
    }
}

unset($_SESSION['payment_data']);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Finaliser votre paiement - Gestion de Parking</title>
  <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
  <script>
    window.paymentData = {
      reservationId: <?php echo json_encode($reservationId); ?>,
      amount: <?php echo json_encode($amount); ?>
    };
    console.log("Payment data initialized:", window.paymentData);
  </script>
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
    <h1>Finaliser votre paiement</h1>
    <div id="payment-gateway-container">
      <?php if ($reservationId): ?>
      <div class="payment-info">
        <p>Réservation #<?php echo htmlspecialchars($reservationId); ?></p>
        <p>Montant à payer: <?php echo number_format($amount, 2, ',', ' '); ?> €</p>
      </div>
      <div class="loading">Chargement du système de paiement...</div>
      <?php else: ?>
      <div class="error-message">
        <h2>Erreur</h2>
        <p>Aucune réservation à payer n'a été spécifiée.</p>
        <a href="/app-gestion-parking/public/reservations" class="btn-primary">Retour aux réservations</a>
      </div>
      <?php endif; ?>
    </div>
  </div>
  
  <?php if ($reservationId): ?>
  <script type="module">
    document.addEventListener('DOMContentLoaded', function() {
      import('/app-gestion-parking/frontend/controllers/paymentController.js')
        .then(module => {
          setTimeout(() => {
            module.showPaymentForm(<?php echo json_encode($reservationId); ?>, <?php echo json_encode($amount); ?>);
          }, 100);
        });
    });
  </script>
  <?php endif; ?>
</body>
</html>