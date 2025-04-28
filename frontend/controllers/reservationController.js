import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { Reservation } from "../models/Reservation.js";
import { renderReservations, renderReservationForm, renderDeleteConfirmation } from "../views/reservationView.js";
import { getCurrentUser } from "./authController.js";
import { validateReservationData } from "../core/validator.js";

export async function loadReservations() {
    try {
        const response = await fetchJSON("/app-gestion-parking/public/api/reservations");
        
        const data = Array.isArray(response) ? response : [];
        console.log("Données de réservations reçues:", response);
        
        const myReservations = [];
        const spotReservations = [];
        
        data.forEach(res => {
            const reservation = new Reservation(
                res.id,
                res.user_id,
                res.spot_id,
                res.start_time,
                res.end_time,
                res.status,
                res.created_at,
                res.is_owner_spot
            );
            
            if (res.is_owner_spot) {
                spotReservations.push(reservation);
            } else {
                myReservations.push(reservation);
            }
        });
        
        renderReservations(myReservations, spotReservations);
    } catch (error) {
        console.error("Erreur lors du chargement des réservations :", error);
    }
}

export async function getReservation(reservationId) {
    try {
        const data = await fetchJSON(`/app-gestion-parking/public/api/reservations/${reservationId}`);
        return new Reservation(
            data.id,
            data.user_id,
            data.spot_id,
            data.start_time,
            data.end_time,
            data.status,
            data.created_at
        );
    } catch (error) {
        console.error(`Erreur lors de la récupération de la réservation ${reservationId} :`, error);
        return null;
    }
}

export async function createReservation(reservationData) {
    try {
        const response = await postJSON("/app-gestion-parking/public/api/reservations/create", reservationData);
        return response;
    } catch (error) {
        console.error("Erreur lors de la création de la réservation :", error);
        return { error: error.message };
    }
}

export async function updateReservation(reservationId, reservationData) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/reservations/${reservationId}/update`, reservationData);
        return response;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de la réservation ${reservationId} :`, error);
        return { error: error.message };
    }
}

export async function deleteReservation(reservationId) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/reservations/${reservationId}/delete`, {});
        return response;
    } catch (error) {
        console.error(`Erreur lors de la suppression de la réservation ${reservationId} :`, error);
        return { error: error.message };
    }
}

export function setupReservationEvents() {
    const contentElement = document.getElementById('app-content');

    const createBtn = document.getElementById('create-reservation-btn');
    if (createBtn) {
        createBtn.onclick = async function () {
            contentElement.innerHTML = renderReservationForm();
            setupFormSubmission();
        };
    }

    document.querySelectorAll('.btn-edit-reservation').forEach(button => {
        button.onclick = async function () {
            const reservationId = this.getAttribute('data-id');
            const reservation = await getReservation(reservationId);
            if (reservation) {
                contentElement.innerHTML = renderReservationForm(reservation);
                setupFormSubmission(reservationId);
            }
        };
    });

    document.querySelectorAll('.btn-delete-reservation').forEach(button => {
        button.onclick = function () {
            const reservationId = this.getAttribute('data-id');
            const modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            modalContainer.innerHTML = renderDeleteConfirmation(reservationId);
            document.body.appendChild(modalContainer);

            document.getElementById('confirm-delete').onclick = async function () {
                const result = await deleteReservation(reservationId);
                if (result.success) {
                    document.body.removeChild(modalContainer);
                    loadReservations();
                }
            };

            document.getElementById('cancel-delete').onclick = function () {
                document.body.removeChild(modalContainer);
            };
        };
    });
}

function setupFormSubmission(id = null) {
    const isEditing = id !== null;
    const formId = isEditing ? 'edit-reservation-form' : 'create-reservation-form';
    const form = document.getElementById(formId);
    const errorElement = document.getElementById('form-error');

    document.getElementById('cancel-form').addEventListener('click', () => {
        loadReservations();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const reservationData = {};

        formData.forEach((value, key) => {
            reservationData[key] = value;
        });

        const validation = validateReservationData(reservationData);
        if (!validation.isValid) {
            let errorMessage = "Veuillez corriger les erreurs suivantes:\n";
            for (const field in validation.errors) {
                errorMessage += `- ${validation.errors[field]}\n`;
            }
            errorElement.textContent = errorMessage;
            return;
        }

        let result;
        if (isEditing) {
            result = await updateReservation(id, reservationData);
        } else {
            result = await createReservation(reservationData);
        }

        if (result.error) {
            errorElement.textContent = result.error;
        } else if (result.success) {
            window.location.href = '/app-gestion-parking/public/reservations';
        }
    });
}

export async function showEditReservationForm(reservationId) {
    try {
        const reservation = await getReservation(reservationId);
        if (!reservation) {
            alert("Réservation non trouvée");
            return;
        }
        
        const startTime = new Date(reservation.start_time)
            .toISOString().slice(0, 16); // Format YYYY-MM-DDThh:mm
        const endTime = new Date(reservation.end_time)
            .toISOString().slice(0, 16);
        
        const container = document.createElement('div');
        container.className = 'modal-container';
        container.id = 'reservation-modal';
        
        container.innerHTML = `
            <div class="form-container">
                <h2>Modifier la réservation</h2>
                <form id="edit-reservation-form" data-id="${reservationId}">
                    <input type="hidden" name="spot_id" value="${reservation.spot_id}">
                    <input type="hidden" name="user_id" value="${reservation.user_id}">
                    <div class="form-group">
                        <label for="start_time">Date de début:</label>
                        <input type="datetime-local" name="start_time" id="start_time" value="${startTime}" required>
                    </div>
                    <div class="form-group">
                        <label for="end_time">Date de fin:</label>
                        <input type="datetime-local" name="end_time" id="end_time" value="${endTime}" required>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn-primary">Mettre à jour</button>
                        <button type="button" id="cancel-edit-form" class="btn-secondary">Annuler</button>
                    </div>
                    <div id="form-error" class="error-message"></div>
                </form>
            </div>
        `;
        
        document.body.appendChild(container);
        
        const form = document.getElementById('edit-reservation-form');
        const cancelBtn = document.getElementById('cancel-edit-form');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const reservationData = {
                spot_id: formData.get('spot_id'),
                start_time: formData.get('start_time'),
                end_time: formData.get('end_time')
            };
            
            const validation = validateReservationData(reservationData);
            if (!validation.isValid) {
                let errorMessage = "Veuillez corriger les erreurs suivantes:\n";
                for (const field in validation.errors) {
                    errorMessage += `- ${validation.errors[field]}\n`;
                }
                document.getElementById('form-error').textContent = errorMessage;
                return;
            }
            
            const result = await updateReservation(reservationId, reservationData);
            if (result.success) {
                alert('Réservation mise à jour avec succès !');
                document.body.removeChild(container);
                window.location.reload();
            } else {
                document.getElementById('form-error').textContent = result.error || 'Une erreur est survenue';
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(container);
        });
    } catch (error) {
        console.error("Erreur lors du chargement du formulaire de modification:", error);
        alert("Une erreur est survenue lors du chargement du formulaire de modification.");
    }
}
