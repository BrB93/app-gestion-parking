import { renderNavbar } from './views/navbarView.js';
import { loadUsers } from "./controllers/userController.js";
import { Router } from './core/router.js';
import { checkAuthStatus, initLoginForm, checkProtectedRoute } from './controllers/authController.js';

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  checkAuthStatus();
  
  const routes = [
    { 
      path: '/app-gestion-parking/public/', 
      controller: () => {
        const content = document.getElementById('app-content');
        content.innerHTML = '<h1>Bienvenue sur l\'application de gestion de parking</h1>';
      }
    },
    { 
      path: '/app-gestion-parking/public/users', 
      controller: () => {
        if (checkProtectedRoute()) {
          const content = document.getElementById('app-content');
          content.innerHTML = '<h1>Liste des utilisateurs</h1><div id="user-list"></div>';
          loadUsers();
        }
      }
    },
    {
      path: '/app-gestion-parking/public/login',
      controller: () => {
        initLoginForm();
      }
    }
  ];
  
  const router = new Router(routes);
  router.init();
});