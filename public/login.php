<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../backend/Kernel.php';
?>
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
    <div class="auth-container">
      <div class="auth-tabs">
        <button class="auth-tab active" id="login-tab">Connexion</button>
        <button class="auth-tab" id="register-tab">Inscription</button>
      </div>
      
      <div id="login-form-container" class="form-container">
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
      
      <div id="register-form-container" class="form-container" style="display: none;">
        <h1>Inscription</h1>
        <form id="register-form">
          <div class="form-group">
            <label for="reg-role">Type de compte:</label>
            <select id="reg-role" name="role" required>
              <option value="user">Utilisateur</option>
              <option value="owner">Propriétaire</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reg-username">Nom d'utilisateur:</label>
            <input type="text" id="reg-username" name="username" required>
          </div>
          <div class="form-group">
            <label for="reg-email">Email:</label>
            <input type="email" id="reg-email" name="email" required>
          </div>
          <div class="form-group">
            <label for="reg-password">Mot de passe:</label>
            <input type="password" id="reg-password" name="password" required>
          </div>
          <div class="form-group">
            <label for="reg-confirm-password">Confirmer le mot de passe:</label>
            <input type="password" id="reg-confirm-password" name="confirm_password" required>
          </div>
          <div class="form-group">
            <label for="reg-phone">Téléphone (optionnel):</label>
            <input type="tel" id="reg-phone" name="phone">
          </div>
          <div class="form-group admin-key-container" style="display: none;">
            <label for="reg-admin-key">Clé d'administration:</label>
            <input type="password" id="reg-admin-key" name="admin_key">
          </div>
          <div class="form-group">
            <button type="submit" class="btn-primary">S'inscrire</button>
          </div>
          <div id="register-error" class="error-message"></div>
          <div id="register-success" class="success-message" style="display: none;"></div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>