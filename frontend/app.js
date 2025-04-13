import { renderNavbar } from './views/navbarView.js';
import { loadUsers, getUser } from "./controllers/userController.js";
import { loadParkingSpots } from "./controllers/parkingSpotController.js";
import { loadPersons } from "./controllers/personController.js"; // ← NEW
import { Router } from './core/router.js';
import { checkAuthStatus, initLoginForm, checkProtectedRoute, getCurrentUser } from './controllers/authController.js';
import { renderUserForm } from './views/userView.js';

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
      controller: async () => {
        if (checkProtectedRoute()) {
          const content = document.getElementById('app-content');
          if (content) {
            content.innerHTML = '<h1>Liste des utilisateurs</h1><div id="user-list"></div>';
            try {
              await new Promise(resolve => requestAnimationFrame(resolve));
              await loadUsers();
            } catch (error) {
              console.error("Erreur lors du chargement des utilisateurs:", error);
              content.innerHTML += `<p class="error-message">Une erreur est survenue lors du chargement des utilisateurs.</p>`;
            }
          }
        }
      }
    },
    {
      path: '/app-gestion-parking/public/persons', // ← NEW
      controller: async () => {
        if (checkProtectedRoute()) {
          const content = document.getElementById('app-content');
          if (content) {
            content.innerHTML = '<h1>Liste des personnes</h1><div id="person-list"></div>';
            try {
              await loadPersons();
            } catch (error) {
              console.error("Erreur lors du chargement des personnes:", error);
              content.innerHTML += `<p class="error-message">Une erreur est survenue lors du chargement des personnes.</p>`;
            }
          }
        }
      }
    },
    {
      path: '/app-gestion-parking/public/parking',
      controller: async () => {
        if (checkProtectedRoute()) {
          const content = document.getElementById('app-content');
          if (content) {
            content.innerHTML = '<h1>Gestion des Places de Parking</h1><div id="parking-spot-list"></div>';
            try {
              await loadParkingSpots();
            } catch (error) {
              console.error("Erreur lors du chargement des places de parking:", error);
              content.innerHTML += `<p class="error-message">Une erreur est survenue lors du chargement des places de parking.</p>`;
            }
          }
        }
      }
    },
    {
      path: '/app-gestion-parking/public/profile',
      controller: async () => {
        const content = document.getElementById('app-content');
        const currentUser = getCurrentUser();

        if (!currentUser) {
          window.location.href = "/app-gestion-parking/public/login";
          return;
        }

        const user = await getUser(currentUser.id);
        if (user) {
          content.innerHTML = `
            <h1>Mon Profil</h1>
            ${renderUserForm(user)}
          `;

          const form = document.getElementById('edit-user-form');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const userData = {};

            formData.forEach((value, key) => {
              if (key !== 'password' || value !== '') {
                userData[key] = value;
              }
            });

            try {
              const response = await fetch(`/app-gestion-parking/public/api/users/${user.id}/update`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
              });

              const result = await response.json();
              if (result.success) {
                const updatedUser = await getUser(user.id);
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));
                alert('Profil mis à jour avec succès');
              } else {
                document.getElementById('form-error').textContent = result.error || 'Une erreur est survenue';
              }
            } catch (error) {
              console.error('Error:', error);
              document.getElementById('form-error').textContent = 'Une erreur est survenue';
            }
          });

          document.getElementById('cancel-form').addEventListener('click', () => {
            window.location.href = "/app-gestion-parking/public/";
          });
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