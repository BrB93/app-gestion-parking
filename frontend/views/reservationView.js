import { getCurrentUser } from "../controllers/authController.js";

/**
 * Affiche la liste des réservations
 * @param {Reservation[]} reservations 
 */
export function renderReservations(myReservations, spotReservations = []) {
  const container = document.getElementById("reservation-list");
  if (!container) return;

  container.innerHTML = "";
  const currentUser = getCurrentUser();
  const isOwner = currentUser && currentUser.role === 'owner';

  if (myReservations.length === 0 && spotReservations.length === 0) {
    container.innerHTML = "<p>Aucune réservation trouvée.</p>";
    return;
  }

  if (myReservations.length > 0) {
    const myReservationsSection = document.createElement("div");
    myReservationsSection.className = "reservation-section";
    myReservationsSection.innerHTML = "<h2>Mes réservations</h2>";
    
    const fragment = document.createDocumentFragment();
    myReservations.forEach(reservation => {
      const div = document.createElement("div");
      div.className = `reservation-item ${reservation.getStatusClass()}`;

      div.innerHTML = `
        <h3>Réservation #${reservation.id}</h3>
        <p>Place ID: ${reservation.spot_id}</p>
        <p>Période: ${reservation.getFormattedDateRange()}</p>
        <p>Statut: <span class="${reservation.getStatusClass()}">${reservation.getStatusLabel()}</span></p>
        <div class="reservation-actions">
          ${renderActions(reservation)}
        </div>
      `;
      fragment.appendChild(div);
    });
    
    myReservationsSection.appendChild(fragment);
    container.appendChild(myReservationsSection);
  }

  if (isOwner && spotReservations.length > 0) {
    const spotReservationsSection = document.createElement("div");
    spotReservationsSection.className = "reservation-section";
    spotReservationsSection.innerHTML = "<h2>Réservations de mes places de parking</h2>";
    
    const fragment = document.createDocumentFragment();
    spotReservations.forEach(reservation => {
      const div = document.createElement("div");
      div.className = `reservation-item owner-spot ${reservation.getStatusClass()}`;

      div.innerHTML = `
        <h3>Réservation #${reservation.id}</h3>
        <p>Utilisateur ID: ${reservation.user_id}</p>
        <p>Place ID: ${reservation.spot_id}</p>
        <p>Période: ${reservation.getFormattedDateRange()}</p>
        <p>Statut: <span class="${reservation.getStatusClass()}">${reservation.getStatusLabel()}</span></p>
      `;
      fragment.appendChild(div);
    });
    
    spotReservationsSection.appendChild(fragment);
    container.appendChild(spotReservationsSection);
  }

  attachReservationEvents();
}

function renderActions(reservation) {
  const currentUser = getCurrentUser();
  if (!currentUser) return "";

  const isAdmin = currentUser.role === 'admin';
  const isOwner = currentUser.role === 'owner';
  const isUser = currentUser.role === 'user' && currentUser.id == reservation.user_id;

  if ((isUser || isAdmin) && reservation.isPending()) {
    return `
      <button class="btn-edit-reservation" data-id="${reservation.id}">Modifier</button>
      <button class="btn-cancel-reservation" data-id="${reservation.id}">Annuler</button>
    `;
  }

  return "";
}
function attachReservationEvents() {
  document.querySelectorAll('.btn-cancel-reservation').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');
      const confirmed = confirm("Voulez-vous vraiment annuler cette réservation ?");
      if (confirmed) {
        try {
          const response = await fetch(`/app-gestion-parking/public/api/reservations/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          
          const result = await response.json();
          
          if (result.success) {
            alert("Réservation annulée avec succès !");
            window.location.reload();
          } else {
            alert(`Erreur: ${result.error || "Une erreur est survenue"}`);
          }
        } catch (error) {
          console.error("Erreur lors de l'annulation:", error);
          alert("Une erreur est survenue lors de l'annulation de la réservation.");
        }
      }
    });
  });

  document.querySelectorAll('.btn-edit-reservation').forEach(button => {
    button.addEventListener('click', async () => {
      const reservationId = button.getAttribute('data-id');
      import('../controllers/reservationController.js').then(module => {
        module.showEditReservationForm(reservationId);
      }).catch(err => {
        console.error("Erreur lors de l'import du contrôleur:", err);
      });
    });
  });
}

/**
 * Formulaire de réservation
 * @param {Object} options 
 */
export function renderReservationForm({ spotId = null, userId = null, defaultStart = "", defaultEnd = "" } = {}) {
  return `
    <div class="form-container">
      <h2>Réserver une place</h2>
      <form id="reservation-form">
        <input type="hidden" name="spot_id" value="${spotId || ''}">
        <input type="hidden" name="user_id" value="${userId || ''}">
        <div class="form-group">
          <label for="start_time">Date de début:</label>
          <input type="datetime-local" name="start_time" id="start_time" value="${defaultStart}" required>
        </div>
        <div class="form-group">
          <label for="end_time">Date de fin:</label>
          <input type="datetime-local" name="end_time" id="end_time" value="${defaultEnd}" required>
        </div>
        <div class="form-group pricing-info">
          <h3>Tarification</h3>
          <p>Prix estimé: <span id="reservation-price">Calcul en cours...</span></p>
        </div>
        <div class="form-group">
          <button type="submit" class="btn-primary">Réserver et payer</button>
          <button type="button" id="cancel-reservation-form" class="btn-secondary">Annuler</button>
        </div>
        <div id="form-error" class="error-message"></div>
      </form>
    </div>
  `;
}
export function renderDeleteConfirmation(reservationId) {
    return `
      <div class="modal">
        <div class="modal-content">
          <h2>Confirmer la suppression</h2>
          <p>Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.</p>
          <div class="modal-actions">
            <button id="confirm-delete" data-id="${reservationId}" class="btn-danger">Supprimer</button>
            <button id="cancel-delete" class="btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    `;
  }


