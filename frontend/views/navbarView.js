import { getCurrentUser } from '../controllers/authController.js';

export function renderNavbar() {
    const nav = document.createElement('nav');
    nav.innerHTML = `
      <div class="nav-links">
        <a href="/app-gestion-parking/public/" data-route="/app-gestion-parking/public/">Accueil</a>
        ${isAdmin() ? `<a href="/app-gestion-parking/public/users" data-route="/app-gestion-parking/public/users">Utilisateurs</a>` : ''}
        <a href="/app-gestion-parking/public/parkings" data-route="/app-gestion-parking/public/parkings">Parkings</a>
        <a href="/app-gestion-parking/public/vehicles" data-route="/app-gestion-parking/public/vehicles">Véhicules</a>
      </div>
    `;
    
    document.body.prepend(nav);
    
    const user = getCurrentUser();
    if (user) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <span>Bienvenue, ${user.name} (${user.role})</span>
            <button class="logout-btn" id="logout-btn">Déconnexion</button>
        `;
        nav.appendChild(userInfo);
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            import('../controllers/authController.js').then(module => {
                module.logout();
            });
        });
    } else {
        const loginLink = document.createElement('a');
        loginLink.href = '/app-gestion-parking/public/login';
        loginLink.setAttribute('data-route', '/app-gestion-parking/public/login');
        loginLink.textContent = 'Connexion';
        loginLink.style.color = 'white';
        
        const linkContainer = document.createElement('div');
        linkContainer.appendChild(loginLink);
        nav.appendChild(linkContainer);
    }
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}