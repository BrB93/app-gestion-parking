
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
$paymentMethod = 'cb';
$cardDetails = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $reservationId = isset($_POST['reservation_id']) ? (int)$_POST['reservation_id'] : null;
    $amount = isset($_POST['amount']) ? (float)$_POST['amount'] : 0;
    $paymentMethod = isset($_POST['payment_method']) ? $_POST['payment_method'] : 'cb';
    
    if ($paymentMethod === 'cb') {
        $cardDetails = [
            'card_number' => isset($_POST['card_number']) ? $_POST['card_number'] : '',
            'expiry_date' => isset($_POST['expiry_date']) ? $_POST['expiry_date'] : '',
            'cvv' => isset($_POST['cvv']) ? $_POST['cvv'] : '',
            'cardholder_name' => isset($_POST['cardholder_name']) ? $_POST['cardholder_name'] : '',
        ];
    }
    
    $_SESSION['payment_data'] = [
        'reservation_id' => $reservationId,
        'amount' => $amount,
        'payment_method' => $paymentMethod,
        'card_details' => $cardDetails
    ];
}
else if (isset($_SESSION['payment_data'])) {
    $reservationId = $_SESSION['payment_data']['reservation_id'];
    $amount = $_SESSION['payment_data']['amount'];
    $paymentMethod = $_SESSION['payment_data']['payment_method'];
    $cardDetails = $_SESSION['payment_data']['card_details'] ?? [];
}

if (!$reservationId) {
    ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Erreur de paiement - Gestion de Parking</title>
  <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
    <h1>Erreur de paiement</h1>
    <div class="error-message">
      <h2>Erreur</h2>
      <p>Aucune réservation à payer n'a été spécifiée.</p>
      <a href="/app-gestion-parking/public/reservations" class="btn-primary">Retour aux réservations</a>
    </div>
  </div>
</body>
</html>
    <?php
    exit;
}

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
      reservationId: <?php echo $reservationId; ?>,
      amount: <?php echo $amount; ?>,
      paymentMethod: "<?php echo htmlspecialchars($paymentMethod); ?>"
    };
  </script>
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
  </div>
</body>
</html>