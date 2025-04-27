import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { Reservation } from "../models/Reservation.js";
import { renderReservations, renderReservationForm, renderDeleteConfirmation } from "../views/reservationView.js";
import { getCurrentUser } from "./authController.js";
import { validateReservationData } from "../core/validator.js";

export async function loadReservations() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/reservations");
        const reservations = data.map(res => new Reservation(
            res.id,
            res.user_id,
            res.spot_id,
            res.start_time,
            res.end_time,
            res.status,
            res.created_at
        ));
        renderReservations(reservations);
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
