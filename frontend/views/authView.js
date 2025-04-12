export function renderLoginForm() {
  return `
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
  `;
}

export function renderLogoutButton(user) {
  const navElement = document.querySelector('nav');
  
  if (!navElement) return;
  
  const existingUserInfo = navElement.querySelector('.user-info');
  if (existingUserInfo) {
    existingUserInfo.remove();
  }
  
  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';
  userInfo.innerHTML = `
    <span>Bienvenue, ${user.name} (${user.role})</span>
    <button class="logout-btn" id="logout-btn">Déconnexion</button>
  `;
  
  navElement.appendChild(userInfo);
  
  document.getElementById('logout-btn').addEventListener('click', () => {
    import('../controllers/authController.js').then(module => {
      module.logout();
    });
  });
}
