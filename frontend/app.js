import { renderNavbar } from './views/navbarView.js';
import { loadUsers, getUser } from "./controllers/userController.js";
import { loadParkingSpots } from "./controllers/parkingSpotController.js";
import { loadPersons } from "./controllers/personController.js";
import { loadReservations } from "./controllers/reservationController.js";
import { Router } from './core/router.js';
import { initLoginForm, checkAuthStatus, checkProtectedRoute, getCurrentUser } from './controllers/authController.js';
import { renderUserForm } from './views/userView.js';
import { renderPersonForm } from './views/personView.js';
import { validateFormData } from './core/validator.js';
import { initializeNotifications } from './controllers/notificationController.js';
import { addNotificationBadge } from './views/notificationView.js';


document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  checkAuthStatus();
  addNotificationBadge();

  const currentUser = getCurrentUser();
  if (currentUser) {
    initializeNotifications();
    addNotificationBadge();

  }

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

    const cancelButton = document.querySelector('#person-form-container #cancel-person-form');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  const routes = [
    {
path: '/app-gestion-parking/public/',
      controller: async () => {
        console.log("Page d'accueil chargée");
        
        const currentUser = getCurrentUser();
        if (!currentUser) {
          const content = document.getElementById('app-content');
          if (content) {
content.innerHTML = `
  <div class="welcome-section">
    <h1>SmartPark - Solution de gestion de parking pour copropriétés</h1>
    <p class="welcome-text">Découvrez les places de parkings à louer à l'heure, au jour ou au mois dans cette copropriété !</p>
    <div id="map-container"></div>
  </div>
  <div class="user-actions">
    <div class="action-card">
      <h3>Vous êtes un résident ou visiteur ?</h3>
      <p>Connectez-vous ou créez un compte pour réserver une place de parking.</p>
      <div class="action-buttons">
        <a href="/app-gestion-parking/public/login" class="btn btn-primary">Se connecter</a>
        <a href="/app-gestion-parking/public/register" class="btn btn-secondary">S'inscrire</a>
      </div>
    </div>
    <div class="action-card owner-card">
      <h3>Vous êtes propriétaire d'une place ?</h3>
      <p>Connectez-vous pour gérer vos places de parking et suivre vos revenus.</p>
      <a href="/app-gestion-parking/public/login" class="btn btn-secondary">Espace propriétaire</a>
    </div>
    <div class="action-card condo-card">
      <h3>Vous représentez une copropriété ?</h3>
      <p>Intéressé par notre solution pour votre immeuble ou résidence ?</p>
      <p>Contactez notre équipe à <a href="mailto:contact@smartpark.fr">contact@smartpark.fr</a> pour une démonstration personnalisée.</p>
    </div>
  </div>
  <div class="welcome-features">
    <h2>Nos fonctionnalités</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🅿️</div>
        <h3>Gestion des places</h3>
        <p>Gérez facilement toutes les places de parking de votre copropriété</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>Réservations en ligne</h3>
        <p>Système de réservation simple et efficace</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💶</div>
        <h3>Paiements sécurisés</h3>
        <p>Paiements en ligne pour les résidents et visiteurs</p>
      </div>
    </div>
  </div>
`;
            
            loadParisMap();
          }
          return;
        }
        
        try {
          const content = document.getElementById('app-content');
          if (content) {
            content.innerHTML = '<div class="loading">Chargement des données...</div>';
            
            const { renderDashboard } = await import('./views/dashboardView.js');
            
            const response = await fetch('/app-gestion-parking/public/api/dashboard/stats', {
              credentials: 'include'
            });
            
            if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const stats = await response.json();
            
            content.innerHTML = renderDashboard(stats, currentUser.role);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
          const content = document.getElementById('app-content');
          if (content) {
            content.innerHTML = `
              <div class="error-container">
                <h2>Erreur de chargement</h2>
                <p>Impossible de charger les statistiques: ${error.message}</p>
                <button class="btn-primary" onclick="location.reload()">Réessayer</button>
              </div>
            `;
          }
        }
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
            const use3DView = localStorage.getItem('preferParkingView3D') === 'true';
            
            content.innerHTML = `
              <h1>Gestion des Places de Parking</h1>
              <div id="parking-spot-list"></div>
            `;
            
            import('./controllers/parkingSpotController.js').then(module => {
              module.loadParkingSpots(use3DView);
            });
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
      path: '/app-gestion-parking/public/notifications',
      controller: async () => {
        if (checkProtectedRoute()) {
          const content = document.getElementById('app-content');
          if (content) {
            content.innerHTML = '<h1>Mes Notifications</h1><div id="notifications-container" class="notifications-container"><div class="loading">Chargement des notifications...</div></div>';
            
            import('./controllers/notificationController.js').then(module => {
              module.loadNotifications();
            });
            
            const markAllReadBtn = document.getElementById('mark-all-notifications-read');
            if (markAllReadBtn) {
              markAllReadBtn.addEventListener('click', async () => {
                import('./controllers/notificationController.js').then(module => {
                  module.markAllAsRead();
                });
              });
            }
            
            const deleteAllBtn = document.getElementById('delete-all-notifications');
            if (deleteAllBtn) {
              deleteAllBtn.addEventListener('click', async () => {
                const confirm = window.confirm('Êtes-vous sûr de vouloir supprimer toutes vos notifications ?');
                if (confirm) {
                  import('./controllers/notificationController.js').then(module => {
                    module.deleteAllNotifications();
                  });
                }
              });
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
            content.innerHTML = `
              <h1>Mes Paiements</h1>
              <div id="payment-list">
                <div class="loading">Chargement des paiements...</div>
              </div>
            `;
            
            import('./controllers/paymentController.js').then(module => {
              setTimeout(() => {
                if (window.paymentData && window.paymentData.reservationId) {
                  module.showPaymentForm(window.paymentData.reservationId, window.paymentData.amount);
                } else {
                  module.loadPayments().then(() => {
                    setTimeout(() => module.refreshPaymentStatuses(), 500);
                  });
                }
              }, 10);
            });
          }
        }
      }
    }

  ];
  
  function loadParisMap() {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(leafletCSS);

      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      document.head.appendChild(leafletScript);

  leafletScript.onload = function() {
      const parisBounds = [
          [48.815573, 2.224199],
          [48.902144, 2.469920]
      ];

      const map = L.map('map-container');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      map.fitBounds(parisBounds);

          const mainParking = {
              lat: 48.8738,
              lng: 2.3501,
              name: "Résidence Saint-Lazare",
              units: 24
          };

          const blinkIcon = L.divIcon({
              className: 'blink-marker',
              iconSize: [18, 18]
          });

          const mainMarker = L.marker([mainParking.lat, mainParking.lng], { icon: blinkIcon }).addTo(map);
          mainMarker.bindPopup(`
              <strong>${mainParking.name}</strong><br>
              ${mainParking.units} places de parking<br>
              <a href="/app-gestion-parking/public/login">Sélectionner ce parking</a>
          `);

          const futureParkings = [
              {
                  lat: 48.8580,
                  lng: 2.3377,
                  name: "Les Jardins du Louvre"
              },
              {
                  lat: 48.8613,
                  lng: 2.3155,
                  name: "Immeuble Champs-Élysées"
              }
          ];

          futureParkings.forEach(parking => {
              const marker = L.marker([parking.lat, parking.lng]).addTo(map);
              marker.bindPopup(`
                  <strong>${parking.name}</strong><br>
                  Disponible à la rentrée de septembre 2025
              `);
          });

          setTimeout(() => {
              map.invalidateSize();
          }, 100);
      };
  }
  
  const router = new Router(routes);
  router.init();
});