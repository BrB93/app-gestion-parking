import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { ParkingSpot } from "../models/ParkingSpot.js";
import { renderParkingSpots, renderParkingSpotForm, renderDeleteConfirmation } from "../views/parkingSpotView.js";
import { validateFormData } from "../core/validator.js";
import { getCurrentUser } from "../controllers/authController.js";

export async function loadParkingSpots() {
    try {
        console.log("Chargement des places de parking...");
        const data = await fetchJSON("/app-gestion-parking/public/api/parking-spots");
        console.log(`${data.length} places récupérées`);
        
        const spots = data.map(spot => new ParkingSpot(
            spot.id, 
            spot.spot_number, 
            spot.type, 
            spot.status,
            spot.owner_id,
            spot.pricing_id
        ));
        
        renderParkingSpots(spots);
        setupParkingSpotEvents();
    } catch (error) {
        console.error("Erreur lors du chargement des places de parking:", error);
        
        const container = document.getElementById("parking-spot-list");
        if (container) {
            container.innerHTML = `<p class="error-message">Erreur de chargement: ${error.message}</p>`;
        }
    }
}

export async function loadAvailableSpots() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/parking-spots/available");
        return data.map(spot => new ParkingSpot(
            spot.id, 
            spot.spot_number, 
            spot.type, 
            spot.status,
            spot.owner_id,
            spot.pricing_id
        ));
    } catch (error) {
        console.error("Erreur lors du chargement des places disponibles:", error);
        return [];
    }
}

export async function getFormData() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/parking-spots/form-data");
        return data;
    } catch (error) {
        console.error("Erreur lors du chargement des données du formulaire:", error);
        return { persons: [], pricings: [] };
    }
}

export async function getParkingSpot(spotId) {
    try {
        const data = await fetchJSON(`/app-gestion-parking/public/api/parking-spots/${spotId}`);
        return new ParkingSpot(
            data.id, 
            data.spot_number, 
            data.type, 
            data.status,
            data.owner_id,
            data.pricing_id
        );
    } catch (error) {
        console.error(`Erreur lors de la récupération de la place ${spotId}:`, error);
        return null;
    }
}

export async function createParkingSpot(spotData) {
    try {
        const response = await postJSON("/app-gestion-parking/public/api/parking-spots/create", spotData);
        return response;
    } catch (error) {
        console.error("Erreur lors de la création de la place:", error);
        return { error: error.message };
    }
}

export async function updateParkingSpot(spotId, spotData) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/parking-spots/${spotId}/update`, spotData);
        return response;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de la place ${spotId}:`, error);
        return { error: error.message };
    }
}

export async function deleteParkingSpot(spotId) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/parking-spots/${spotId}/delete`, {});
        return response;
    } catch (error) {
        console.error(`Erreur lors de la suppression de la place ${spotId}:`, error);
        return { error: error.message };
    }
}

export function setupParkingSpotEvents() {
    const createButton = document.getElementById('create-spot-btn');
    if (createButton) {
        createButton.addEventListener('click', async () => {
            try {
                const formData = await getFormData();
                const appContent = document.getElementById('app-content');
                
                if (appContent) {
                    appContent.innerHTML = renderParkingSpotForm(null, formData);
                    setupFormSubmission();
                }
            } catch (error) {
                console.error("Erreur lors de la création:", error);
            }
        });
    }
}

export function setupFormSubmission(id = null) {
    const isEditing = id !== null;
    const formId = isEditing ? 'edit-spot-form' : 'create-spot-form';
    const form = document.getElementById(formId);
    const errorElement = document.getElementById('form-error');
    
    if (!form) {
        console.error(`Formulaire avec ID '${formId}' introuvable`);
        return;
    }

    document.getElementById('cancel-form').addEventListener('click', () => {
        window.location.href = '/app-gestion-parking/public/parking';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const spotData = {};
    
        formData.forEach((value, key) => {
            if (value === '') {
                if (key === 'owner_id' || key === 'pricing_id') {
                    spotData[key] = null;
                } else {
                    spotData[key] = value;
                }
            } else {
                spotData[key] = value;
            }
        });

        const validation = validateFormData(spotData);
    
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
            let result;
            if (isEditing) {
                result = await updateParkingSpot(id, spotData);
            } else {
                result = await createParkingSpot(spotData);
            }
        
            if (result.error) {
                errorElement.textContent = result.error;
            } else if (result.success) {
                window.location.href = '/app-gestion-parking/public/parking';
            }
        } catch (error) {
            console.error("Erreur lors de la soumission:", error);
            errorElement.textContent = "Une erreur est survenue lors de la communication avec le serveur";
        }
    });
}

export async function getSpotAvailability(spotId) {
    try {
        const data = await fetchJSON(`/app-gestion-parking/public/api/parking-spots/${spotId}/availability`);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des disponibilités pour la place ${spotId}:`, error);
        return { available: false, reservations: [] };
    }
}

export function showAvailabilityInfo(spotId) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.id = 'availability-modal';
    
    modalContainer.innerHTML = `
        <div class="modal-content">
            <h2>Disponibilités de la place</h2>
            <div id="availability-content">
                <p>Chargement des disponibilités...</p>
            </div>
            <button id="close-availability" class="btn-secondary">Fermer</button>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    document.getElementById('close-availability').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    getSpotAvailability(spotId).then(data => {
        const content = document.getElementById('availability-content');
        if (data.reservations && data.reservations.length > 0) {
            content.innerHTML = `
                <p>Cette place est réservée pour les créneaux suivants:</p>
                <ul>
                    ${data.reservations.map(res => `<li>${new Date(res.start_time).toLocaleString()} - ${new Date(res.end_time).toLocaleString()}</li>`).join('')}
                </ul>
                <p>Vous pouvez réserver cette place en dehors de ces créneaux.</p>
            `;
        } else {
            content.innerHTML = `<p>Cette place est entièrement disponible.</p>`;
        }
    });
}