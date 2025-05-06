import { renderNavbar } from './views/navbarView.js';
import { loadUsers, getUser } from "./controllers/userController.js";
import { loadParkingSpots } from "./controllers/parkingSpotController.js";
import { loadPersons } from "./controllers/personController.js";
import { loadReservations } from "./controllers/reservationController.js";
import { Router } from './core/router.js';
import { checkAuthStatus, initLoginForm, checkProtectedRoute, getCurrentUser } from './controllers/authController.js';
import { renderUserForm } from './views/userView.js';
import { renderPersonForm } from './views/personView.js';
import { validateFormData } from './core/validator.js';

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  checkAuthStatus();

  function setupUserFormSubmission(userId) {
    const form = document.getElementById('edit-user-form');
    if (!form) return;
  
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
        const response = await fetch(`/app-gestion-parking/public/api/users/${userId}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
  
        const result = await response.json();
        if (result.success) {
          const updatedUser = await getUser(userId);
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          alert('Informations du compte mises à jour avec succès');
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
  
  function setupPersonFormSubmission(personId = null) {
    const form = document.getElementById(personId ? 'edit-person-form' : 'create-person-form');
    if (!form) return;

    const errorElement = document.getElementById('person-form-error');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const personData = {};
      
      formData.forEach((value, key) => {
        personData[key] = value;
      });

      const currentUser = getCurrentUser();
      personData.user_id = currentUser.id;

      const validation = validateFormData(personData);
      if (!validation.isValid) {
        const errors = validation.errors;
        let errorMessage = "Veuillez corriger les erreurs suivantes:\n";
        for (const field in errors) {
          errorMessage += `- ${errors[field]}\n`;
        }
        errorElement.textContent = errorMessage;
        return;
      }

      try {
        let url;
        if (personId) {
          url = `/app-gestion-parking/public/api/persons/${personId}/update`;
        } else {
          url = `/app-gestion-parking/public/api/persons/create`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personData),
        });

        const result = await response.json();
        if (result.success) {
          alert('Informations personnelles ' + (personId ? 'mises à jour' : 'créées') + ' avec succès');
          window.location.reload();
        } else {
          errorElement.textContent = result.error || 'Une erreur est survenue';
        }
      } catch (error) {
        console.error('Error:', error);
        errorElement.textContent = 'Une erreur est survenue lors de la communication avec le serveur';
      }
    });

    const cancelButton = document.querySelector('#person-form-container #cancel-form');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

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
      path: '/app-gestion-parking/public/persons',
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
            content.innerHTML = '<h1>Places de Parking</h1><div id="parking-spot-list"></div>';
            try {
              const module = await import('./controllers/parkingSpotController.js');
              module.loadParkingSpots();
            } catch (error) {
              console.error("Erreur lors du chargement du module des places de parking:", error);
              content.innerHTML += `<p class="error-message">Erreur de chargement du module: ${error.message}</p>`;
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

        try {
          content.innerHTML = `
            <h1>Mon Profil</h1>
            <div class="loading">Chargement des données...</div>
          `;

          const userFormData = new FormData();
          userFormData.append('id', currentUser.id);
          
          const userResponse = await fetch(`/app-gestion-parking/public/api/users/${currentUser.id}`, {
            method: 'POST',
            body: userFormData
          });
          const userData = await userResponse.json();
          
          const personFormData = new FormData();
          personFormData.append('user_id', currentUser.id);
          
          const personsResponse = await fetch(`/app-gestion-parking/public/api/persons/by-user/${currentUser.id}`, {
            method: 'POST',
            body: personFormData
          });
          const personsData = await personsResponse.json();
          const person = personsData.length > 0 ? personsData[0] : null;
          
          let userFormHTML = renderUserForm(userData);
          
          content.innerHTML = `
            <h1>Mon Profil</h1>
            <div class="profile-container">
              <div class="user-profile-section">
                <h2>Informations du compte</h2>
                ${userFormHTML}
              </div>
              <div class="personal-info-section">
                <h2>Informations personnelles</h2>
                <div id="person-form-container">
                  <div class="loading">Chargement des informations personnelles...</div>
                </div>
              </div>
            </div>
          `;

          setupUserFormSubmission(userData.id);
          
          const personFormContainer = document.getElementById('person-form-container');
          
          if (person) {
            const personFormHTML = await renderPersonForm(person);
            personFormContainer.innerHTML = personFormHTML;
            setupPersonFormSubmission(person.id);
          } else {
            personFormContainer.innerHTML = `
              <p>Vous n'avez pas encore d'informations personnelles enregistrées.</p>
              <button id="add-person-info" class="btn-primary">Ajouter mes informations</button>
            `;
            
            const addButton = document.getElementById('add-person-info');
            if (addButton) {
              addButton.addEventListener('click', async () => {
                const newPerson = { 
                  user_id: currentUser.id, 
                  first_name: '', 
                  last_name: '', 
                  address: '', 
                  zip_code: '', 
                  city: '' 
                };
                personFormContainer.innerHTML = '<div class="loading">Chargement du formulaire...</div>';
                const personFormHTML = await renderPersonForm(newPerson);
                personFormContainer.innerHTML = personFormHTML;
                setupPersonFormSubmission();
              });
            }
          }
        } catch (error) {
          console.error('Error:', error);
          content.innerHTML = `
            <h1>Mon Profil</h1>
            <p class="error-message">Une erreur est survenue lors du chargement du profil: ${error.message}</p>
          `;
        }
      }
    },
    {
      path: '/app-gestion-parking/public/login',
      controller: () => {
        initLoginForm();
      }
    },
    
    {
      path: '/app-gestion-parking/public/reservations',
      controller: async () => {
        if (checkProtectedRoute()) {
          const content = document.getElementById('app-content');
          if (content) {
            content.innerHTML = '<h1>Mes Réservations</h1><div id="reservation-list"></div>';
            try {
              await loadReservations();
            } catch (error) {
              console.error("Erreur lors du chargement des réservations:", error);
              content.innerHTML += `<p class="error-message">Une erreur est survenue lors du chargement des réservations.</p>`;
            }
          }
        }
      }
    },
    {
      path: '/app-gestion-parking/public/payments',
      controller: async () => {
        if (checkProtectedRoute()) {
          const content = document.getElementById('app-content');
          if (content) {
            const urlParams = new URLSearchParams(window.location.search);
            const reservationId = urlParams.get('reservation_id');
            const amount = urlParams.get('amount');
            
            if (reservationId && amount) {
              // Afficher le formulaire de paiement avec les données pré-remplies
              import('./controllers/paymentController.js').then(module => {
                module.showPaymentForm(reservationId, amount);
              });
            } else {
              // Afficher la liste des paiements
              import('./controllers/paymentController.js').then(module => {
                module.loadPayments();
              });
            }
          }
        }
      }
    }

  ];
  
  const router = new Router(routes);
  router.init();
});