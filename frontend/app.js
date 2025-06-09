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
  <section class="welcome-section" style="background: linear-gradient(120deg, #2563eb 0%, #0ea5e9 100%); position:relative;">
    <div style="position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;opacity:0.12;z-index:0;background:url('https://www.transparenttextures.com/patterns/asfalt-light.png');"></div>
    <div style="position:relative;z-index:1;">
      <h1>
        <span style="display:inline-block;vertical-align:middle;">
          <svg width="48" height="48" fill="none" viewBox="0 0 48 48" style="vertical-align:middle;margin-right:10px;">
            <rect x="6" y="18" width="36" height="18" rx="4" fill="#fff" stroke="#1741a6" stroke-width="2"/>
            <rect x="12" y="24" width="24" height="8" rx="2" fill="#e6efff"/>
            <circle cx="14" cy="38" r="3" fill="#2563eb"/>
            <circle cx="34" cy="38" r="3" fill="#2563eb"/>
            <rect x="20" y="28" width="8" height="4" rx="1" fill="#93c5fd"/>
          </svg>
        </span>
        SmartPark Résidence
      </h1>
      <p class="welcome-text">
        <strong>Le parking partagé, pensé pour votre copropriété.</strong><br>
        Réservez, louez ou gérez votre place en toute simplicité, dans un espace sécurisé et communautaire.
      </p>
      <div id="map-container"></div>
    </div>
  </section>
  <section class="user-actions" style="margin-top:-40px;">
    <div class="action-card" style="background:linear-gradient(120deg,#f3f4f6 60%,#e6efff 100%);">
      <h3><span style="font-size:1.5em;">🚗</span> Résidents & Visiteurs</h3>
      <p>Besoin d’une place pour quelques heures, une nuit ou un mois ?<br>
      <span style="color:var(--primary-dark);font-weight:600;">Réservez en 3 clics, accédez à votre parking d’immeuble comme chez vous.</span></p>
      <div class="action-buttons">
        <a href="/app-gestion-parking/public/login" class="btn btn-primary">Se connecter</a>
        <a href="/app-gestion-parking/public/register" class="btn btn-secondary">Créer un compte</a>
      </div>
    </div>
    <div class="action-card owner-card" style="background:linear-gradient(120deg,#e6efff 60%,#f3f4f6 100%);">
      <h3><span style="font-size:1.5em;">🅿️</span> Propriétaires</h3>
      <p>Valorisez votre place inutilisée.<br>
      <span style="color:var(--accent);font-weight:600;">Gérez vos disponibilités, suivez vos revenus, tout est centralisé.</span></p>
      <div class="action-buttons">
        <a href="/app-gestion-parking/public/login" class="btn btn-secondary">Espace propriétaire</a>
      </div>
    </div>
    <div class="action-card condo-card" style="background:linear-gradient(120deg,#f0f7ff 60%,#e6efff 100%);">
      <h3><span style="font-size:1.5em;">🏢</span> Syndic / Conseil Syndical</h3>
      <p>
        <span style="color:var(--primary-dark);font-weight:600;">Optimisez l’utilisation du parking de votre immeuble.</span><br>
        Suivi des flux, sécurité, transparence, gestion des droits propriétaires.
      </p>
      <p>
        <a href="mailto:contact@smartpark.fr" class="btn btn-primary" style="margin-top:10px;">Demander une démo</a>
      </p>
    </div>
  </section>
  <section class="welcome-features" style="margin-top:40px;">
    <h2>Pourquoi choisir SmartPark ?</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon" style="background:#e6efff;">🔒</div>
        <h3>Sécurité & Sérénité</h3>
        <p>Accès contrôlé, historique des entrées/sorties, notifications en temps réel.<br>
        <span style="color:var(--primary-dark);font-size:0.95em;">Votre parking, votre tranquillité.</span></p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="background:#e6ffe6;">🤝</div>
        <h3>Communauté & Confiance</h3>
        <p>La copropriété valide les propriétaires, chaque location est encadrée.<br>
        <span style="color:var(--accent);font-size:0.95em;">Un esprit d’immeuble, même au parking.</span></p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="background:#fffbe6;">📱</div>
        <h3>100% Digital & Mobile</h3>
        <p>Réservation, paiement, gestion : tout se fait en ligne, sur mobile ou ordinateur.<br>
        <span style="color:var(--primary-dark);font-size:0.95em;">Plus besoin de papier ni d’aller au bureau du syndic !</span></p>
      </div>
    </div>
    <div style="margin-top:80px;">
      <span style="color:var(--gray);font-size:1.1em;">
        <svg width="22" height="22" fill="none" viewBox="0 0 22 22" style="vertical-align:middle;margin-right:6px;">
          <circle cx="11" cy="11" r="10" stroke="#2563eb" stroke-width="2"/>
          <path d="M7 11l3 3 5-5" stroke="#10b981" stroke-width="2" fill="none"/>
        </svg>
        Solution conçue pour les copropriétés modernes, par des experts de l’immobilier et du digital.
      </span>
    </div>

  </section>
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