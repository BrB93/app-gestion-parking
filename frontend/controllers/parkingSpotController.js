import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { ParkingSpot } from "../models/parkingSpot.js";
import { renderParkingSpots, renderParkingSpotForm, renderDeleteConfirmation } from "../views/parkingSpotView.js";
import { getCurrentUser } from "./authController.js";
import { validateFormData } from "../core/validator.js";

export async function loadParkingSpots() {
    console.log("loadParkingSpots appelé");
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/parking-spots");
        console.log("Données de places récupérées:", data.length, "places");
        const spots = data.map(spot => new ParkingSpot(
            spot.id, 
            spot.spot_number, 
            spot.type, 
            spot.status,
            spot.owner_id,
            spot.pricing_id
        ));
        renderParkingSpots(spots);
    } catch (error) {
        console.error("Error loading parking spots:", error);
    }
}

export async function loadAvailableSpots() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/parking-spots/available");
        const spots = data.map(spot => new ParkingSpot(
            spot.id, 
            spot.spot_number, 
            spot.type, 
            spot.status,
            spot.owner_id,
            spot.pricing_id
        ));
        return spots;
    } catch (error) {
        console.error("Error loading available spots:", error);
        return [];
    }
}

async function getFormData() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/parking-spots/form-data");
        console.log("Données récupérées pour le formulaire:", data);
        return data;
    } catch (error) {
        console.error("Error loading form data:", error);
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
        console.error(`Error fetching parking spot ${spotId}:`, error);
        return null;
    }
}

export async function createParkingSpot(spotData) {
    try {
        const response = await postJSON("/app-gestion-parking/public/api/parking-spots/create", spotData);
        return response;
    } catch (error) {
        console.error("Error creating parking spot:", error);
        return { error: error.message };
    }
}

export async function updateParkingSpot(spotId, spotData) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/parking-spots/${spotId}/update`, spotData);
        return response;
    } catch (error) {
        console.error(`Error updating parking spot ${spotId}:`, error);
        return { error: error.message };
    }
}

export async function deleteParkingSpot(spotId) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/parking-spots/${spotId}/delete`, {});
        return response;
    } catch (error) {
        console.error(`Error deleting parking spot ${spotId}:`, error);
        return { error: error.message };
    }
}

export function setupParkingSpotEvents() {
    console.log("DÉBUT setupParkingSpotEvents");
    const contentElement = document.getElementById('app-content');
    
    const createBtn = document.getElementById('create-spot-btn');
    console.log("Bouton de création trouvé:", createBtn);
    if (createBtn) {
        createBtn.onclick = async function() {
            console.log("CLIC sur le bouton de création");
            try {
                const formData = await getFormData();
                contentElement.innerHTML = renderParkingSpotForm(null, formData);
                setupFormSubmission();
            } catch (error) {
                console.error("Erreur lors du clic sur Créer:", error);
            }
        };
    }

    const editButtons = document.querySelectorAll('.btn-edit-spot');
    console.log(`Trouvé ${editButtons.length} boutons d'édition`);
    editButtons.forEach(button => {
        button.onclick = async function() {
            try {
                const spotId = this.getAttribute('data-id');
                console.log(`CLIC sur Modifier pour la place ${spotId}`);
                const spot = await getParkingSpot(spotId);
                const formData = await getFormData();
                
                if (spot) {
                    contentElement.innerHTML = renderParkingSpotForm(spot, formData);
                    setupFormSubmission(spotId);
                }
            } catch (error) {
                console.error("Erreur lors du clic sur Modifier:", error);
            }
        };
    });

    const deleteButtons = document.querySelectorAll('.btn-delete-spot');
    console.log(`Trouvé ${deleteButtons.length} boutons de suppression`);
    deleteButtons.forEach(button => {
        button.onclick = function() {
            try {
                const spotId = this.getAttribute('data-id');
                console.log(`CLIC sur Supprimer pour la place ${spotId}`);
                
                const modalContainer = document.createElement('div');
                modalContainer.id = 'modal-container';
                modalContainer.innerHTML = renderDeleteConfirmation(spotId);
                document.body.appendChild(modalContainer);

                document.getElementById('confirm-delete').onclick = async function() {
                    const result = await deleteParkingSpot(spotId);
                    if (result.success) {
                        document.body.removeChild(modalContainer);
                        loadParkingSpots();
                    }
                };

                document.getElementById('cancel-delete').onclick = function() {
                    document.body.removeChild(modalContainer);
                };
            } catch (error) {
                console.error("Erreur lors du clic sur Supprimer:", error);
            }
        };
    });
    console.log("FIN setupParkingSpotEvents");
}
function renderSpots(spots, container) {
    console.log("renderSpots appelé avec", spots.length, "places");
    container.innerHTML = "";
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isOwner = currentUser && currentUser.role === 'owner';
    const isRegularUser = currentUser && currentUser.role === 'user';
    
    if (spots.length === 0) {
        container.innerHTML = "<p>Aucune place de parking trouvée.</p>";
        return;
    }
    
    fetchJSON("/app-gestion-parking/public/api/parking-spots/form-data")
        .then(formData => {
            console.log("Données de formulaire récupérées:", formData);
            const personsMap = {};
            if (formData.persons) {
                formData.persons.forEach(person => {
                    personsMap[person.id] = person.name;
                });
            }

            spots.forEach(spot => {
                const spotElement = document.createElement("div");
                spotElement.className = `parking-spot ${spot.getStatusClass()}`;
                
                spotElement.innerHTML = `
                    <h3>Place ${spot.spot_number}</h3>
                    <p>Type: ${spot.getTypeLabel()}</p>
                    <p>Statut: <span class="${spot.getStatusClass()}">${spot.status}</span></p>
                    ${spot.owner_id && personsMap[spot.owner_id] ? 
                        `<p>Propriétaire: ${personsMap[spot.owner_id]}</p>` : ''}
                    <div class="spot-actions">
                        ${isAdmin ? `
                            <button class="btn-edit-spot" data-id="${spot.id}">Modifier</button>
                            <button class="btn-delete-spot" data-id="${spot.id}">Supprimer</button>
                        ` : ''}
                        ${isRegularUser && spot.isAvailable() ? `
                            <button class="btn-reserve-spot" data-id="${spot.id}">Réserver</button>
                        ` : ''}
                    </div>
                `;
                
                container.appendChild(spotElement);
            });
            
            console.log("Toutes les places ont été rendues, appel de setupParkingSpotEvents");
            setupParkingSpotEvents();
        })
        .catch(error => {
            console.error("Error fetching additional data:", error);
            container.innerHTML = `<p class="error-message">Erreur de chargement des données: ${error.message}</p>`;
        });
}
function setupFormSubmission(id = null) {
    const isEditing = id !== null;
    const formId = isEditing ? 'edit-spot-form' : 'create-spot-form';
    const form = document.getElementById(formId);
    const errorElement = document.getElementById('form-error');

    document.getElementById('cancel-form').addEventListener('click', () => {
        loadParkingSpots();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const spotData = {};
    
        formData.forEach((value, key) => {
            spotData[key] = value;
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
    });
}