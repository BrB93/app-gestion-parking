import { getCurrentUser } from '../controllers/authController.js';

export function renderNavbar() {
  const nav = document.createElement('nav');
  const user = getCurrentUser();
  
  nav.innerHTML = `
    <div class="nav-links">
      <a href="/app-gestion-parking/public/">Accueil</a>
      ${user && user.role === 'admin' ? `
        <a href="/app-gestion-parking/public/users" data-route="/app-gestion-parking/public/users">Utilisateurs</a>
        <a href="/app-gestion-parking/public/persons" data-route="/app-gestion-parking/public/persons">Personnes</a>
      ` : ''}
      <a href="/app-gestion-parking/public/parking" data-route="/app-gestion-parking/public/parking">Places de parking</a>
      ${user ? `<a href="/app-gestion-parking/public/reservations" data-route="/app-gestion-parking/public/reservations">Réservations</a>` : ''}
      ${user ? `<a href="/app-gestion-parking/public/payments" data-route="/app-gestion-parking/public/payments">Paiements</a>` : ''}
      ${user ? `<a href="/app-gestion-parking/public/notifications" data-route="/app-gestion-parking/public/notifications">Notifications</a>` : ''}
      ${user ? `<a href="/app-gestion-parking/public/profile" data-route="/app-gestion-parking/public/profile">Mon Profil</a>` : ''}
    </div>
  `;
  
  document.body.prepend(nav);
    
  if (user) {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    
    
    userInfo.innerHTML += `
      <span>Bienvenue, ${user.username || user.name || 'Utilisateur'} (${user.role})</span>
      <button class="logout-btn" id="logout-btn">Déconnexion</button>
    `;
    
    nav.appendChild(userInfo);
    
    document.getElementById('logout-btn').addEventListener('click', () => {
      import('../controllers/authController.js').then(module => {
        module.logout();
      });
    });
  }
  
  const footer = document.createElement('footer');
  footer.className = 'app-footer';
  footer.innerHTML = `
    <div class="footer-content">
      <p>&copy; ${new Date().getFullYear()} SmartPark - Tous droits réservés</p>
      <p>
        <a href="https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on" target="_blank" rel="noopener noreferrer">Politique de confidentialité (RGPD)</a>
        | <a href="https://www.service-public.fr/particuliers/vosdroits/F32463" target="_blank" rel="noopener noreferrer">Mentions légales</a>
      </p>
    </div>
  `;
  
  document.body.appendChild(footer);
}