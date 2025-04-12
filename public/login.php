<?php require_once __DIR__ . '/../vendor/autoload.php'; ?>
<?php require_once __DIR__ . '/../backend/Kernel.php'; ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Connexion - Gestion de Parking</title>
  <link rel="stylesheet" href="/app-gestion-parking/public/assets/css/styles.css">
  <script type="module" src="/app-gestion-parking/frontend/app.js" defer></script>
</head>
<body>
  <div id="app-content">
    <div class="login-container">
      <h1>Connexion</h1>
      <form id="login-form">
        <div class="form-group">
          <label for="username">Nom d'utilisateur:</label>
          <input type="text" id="username" name="username" required>
        </div>
        <div class="form-group">
          <label for="password">Mot de passe:</label>
          <input type="password" id="password" name="password" required>
        </div>
        <div class="form-group">
          <button type="submit" class="btn-primary">Se connecter</button>
        </div>
        <div id="login-error" class="error-message"></div>
      </form>
    </div>
  </div>
</body>
</html>
