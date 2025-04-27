import { getCurrentUser } from "../controllers/authController.js";

/**
 * Affiche la liste des réservations
 * @param {Reservation[]} reservations 
 */
export function renderReservations(reservations) {
  const container = document.getElementById("reservation-list");
  if (!container) return;

  container.innerHTML = "";

  if (reservations.length === 0) {
    container.innerHTML = "<p>Aucune réservation trouvée.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  reservations.forEach(reservation => {
    const div = document.createElement("div");
    div.className = `reservation-item ${reservation.getStatusClass()}`;

    div.innerHTML = `
      <h3>Réservation #${reservation.id}</h3>
      <p>Utilisateur ID: ${reservation.user_id}</p>
      <p>Place ID: ${reservation.spot_id}</p>
      <p>Période: ${reservation.getFormattedDateRange()}</p>
      <p>Statut: <span class="${reservation.getStatusClass()}">${reservation.getStatusLabel()}</span></p>
      <div class="reservation-actions">
        ${renderActions(reservation)}
      </div>
    `;
    fragment.appendChild(div);
  });

  container.appendChild(fragment);
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
      <button class="btn-cancel-reservation" data-id="${reservation.id}">Annuler</button>
    `;
  }

  return "";
}

function attachReservationEvents() {
  document.querySelectorAll('.btn-cancel-reservation').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      const confirmed = confirm("Voulez-vous vraiment annuler cette réservation ?");
      if (confirmed) {
        // Cette fonction devra être définie dans le controller
        window.dispatchEvent(new CustomEvent("cancelReservation", { detail: { reservationId: id } }));
      }
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
        <div class="form-group">
          <button type="submit" class="btn-primary">Réserver</button>
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
