import { fetchJSON } from "../core/fetchWrapper.js";
import { getCurrentUser } from '../controllers/authController.js';
import { setupParkingSpotEvents, getParkingSpot, getFormData, deleteParkingSpot } from "../controllers/parkingSpotController.js";

export function renderParkingSpots(spots) {
    const container = document.getElementById("parking-spot-list");
    if (!container) {
        console.error("Élément 'parking-spot-list' introuvable");
        return;
    }
    
    container.innerHTML = "";
    
    // Vérifier si l'utilisateur est un administrateur avant d'afficher le bouton
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        const createBtn = document.createElement("button");
        createBtn.className = "btn-primary";
        createBtn.id = "create-spot-btn";
        createBtn.textContent = "Créer une nouvelle place";
        container.appendChild(createBtn);
        
        // Ajout d'un espace après le bouton
        container.appendChild(document.createElement("br"));
        container.appendChild(document.createElement("br"));
    }
    
    // Section de filtrage
    const filterSection = document.createElement("div");
    filterSection.className = "filter-section";
    filterSection.innerHTML = `
        <h3>Filtrer les places</h3>
        <div class="filter-controls">
            <select id="filter-type">
                <option value="">Tous les types</option>
                <option value="normale">Standard</option>
                <option value="handicapee">PMR</option>
                <option value="reservee">Réservée</option>
                <option value="electrique">Électrique</option>
            </select>
            <select id="filter-status">
                <option value="">Tous les statuts</option>
                <option value="libre">Libre</option>
                <option value="reservee">Réservée</option>
                <option value="occupee">Occupée</option>
            </select>
            <button id="apply-filter" class="btn-secondary">Appliquer</button>
            <button id="reset-filter" class="btn-secondary">Réinitialiser</button>
        </div>
    `;
    
    container.appendChild(filterSection);
    
    // Gestion de la référence filterSection pour setupFilterEvents
    const filterSectionRef = filterSection;
    
    // Configuration des événements de filtrage
    setupFilterEvents(spots, container, filterSectionRef);
    
    // Rendu des places
    renderSpotsGrid(spots, container);
}

export function showReservationForm(spotId) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.id = 'reservation-modal';
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Vous devez être connecté pour effectuer une réservation");
        return;
    }
    
    import('../controllers/reservationController.js').then(module => {
        modalContainer.innerHTML = module.renderReservationForm({
            spotId: spotId,
            userId: currentUser.id
        });
        
        document.body.appendChild(modalContainer);
        
        document.getElementById('cancel-reservation-form').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        document.getElementById('reservation-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const reservationData = {
                spot_id: formData.get('spot_id'),
                start_time: formData.get('start_time'),
                end_time: formData.get('end_time')
            };
            
            try {
                const result = await module.createReservation(reservationData);
                if (result.success) {
                    alert("Réservation effectuée avec succès!");
                    document.body.removeChild(modalContainer);
                    window.location.reload();
                } else {
                    document.getElementById('form-error').textContent = result.error || "Erreur lors de la création de la réservation";
                }
            } catch (error) {
                console.error("Erreur:", error);
                document.getElementById('form-error').textContent = "Une erreur est survenue lors de la communication avec le serveur";
            }
        });
    }).catch(err => {
        console.error("Erreur lors du chargement du module de réservation:", err);
    });
}

function renderSpotsGrid(spots, container) {
    if (spots.length === 0) {
        container.innerHTML += "<p>Aucune place de parking trouvée.</p>";
        return;
    }
    
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    const spotsGrid = document.createElement("div");
    spotsGrid.className = "parking-grid";
    
    spots.forEach(spot => {
        const spotElement = document.createElement("div");
        spotElement.className = `parking-spot ${spot.getStatusClass()}`;
        
        const ownerInfo = spot.owner_id ? 
            `<p><strong>Propriétaire ID:</strong> ${spot.owner_id}</p>` : 
            '';
        
        spotElement.innerHTML = `
            <h3>Place ${spot.spot_number}</h3>
            <p><strong>Type:</strong> ${spot.getTypeLabel()}</p>
            <p><strong>Statut:</strong> <span class="${spot.getStatusClass()}">${spot.status}</span></p>
            ${ownerInfo}
            <div class="spot-actions">
                ${spot.status === 'libre' ? 
                    `<button class="btn-reserve-spot" data-id="${spot.id}">Réserver</button>` : ''}
                ${isAdmin ? 
                    `<button class="btn-edit-spot" data-id="${spot.id}">Modifier</button>
                    <button class="btn-delete-spot" data-id="${spot.id}">Supprimer</button>` : ''}
            </div>
        `;
        
        spotsGrid.appendChild(spotElement);
    });
    
    container.appendChild(spotsGrid);
    attachSpotEvents();
}

function attachSpotEvents() {
    // Événements pour les boutons de réservation
    document.querySelectorAll('.btn-reserve-spot').forEach(button => {
        button.addEventListener('click', () => {
            const spotId = button.getAttribute('data-id');
            showReservationForm(spotId);
        });
    });
    
    // Événements pour les boutons d'édition (pour les admins)
    document.querySelectorAll('.btn-edit-spot').forEach(button => {
        button.addEventListener('click', async () => {
            const spotId = button.getAttribute('data-id');
            await editSpot(spotId);
        });
    });
    
    // Événements pour les boutons de suppression (pour les admins)
    document.querySelectorAll('.btn-delete-spot').forEach(button => {
        button.addEventListener('click', () => {
            const spotId = button.getAttribute('data-id');
            deleteSpot(spotId);
        });
    });
}

async function editSpot(spotId) {
    try {
        const formData = await getFormData();
        const spot = await getParkingSpot(spotId);
        
        if (spot) {
            const appContent = document.getElementById('app-content');
            if (appContent) {
                appContent.innerHTML = renderParkingSpotForm(spot, formData);
                setupFormSubmission(spotId);
            }
        }
    } catch (error) {
        console.error(`Erreur lors de l'édition de la place ${spotId}:`, error);
    }
}

function deleteSpot(spotId) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.innerHTML = renderDeleteConfirmation(spotId);
    document.body.appendChild(modalContainer);
    
    document.getElementById('confirm-delete').addEventListener('click', async () => {
        const result = await deleteParkingSpot(spotId);
        if (result.success) {
            document.body.removeChild(modalContainer);
            window.location.reload();
        }
    });
    
    document.getElementById('cancel-delete').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
}

function setupFilterEvents(allSpots, container, filterSection) {
    const filterTypeSelect = document.getElementById('filter-type');
    const filterStatusSelect = document.getElementById('filter-status');
    const applyFilterBtn = document.getElementById('apply-filter');
    const resetFilterBtn = document.getElementById('reset-filter');
    
    if (!filterTypeSelect || !filterStatusSelect || !applyFilterBtn || !resetFilterBtn) {
        console.error("Éléments de filtrage introuvables");
        return;
    }
    
    applyFilterBtn.addEventListener('click', () => {
        const typeFilter = filterTypeSelect.value;
        const statusFilter = filterStatusSelect.value;
        
        const filteredSpots = allSpots.filter(spot => {
            const typeMatch = !typeFilter || spot.type === typeFilter;
            const statusMatch = !statusFilter || spot.status === statusFilter;
            return typeMatch && statusMatch;
        });
        
        // Nettoyer le container et conserver le bouton de création et les filtres
        const createBtn = document.getElementById('create-spot-btn');
        container.innerHTML = "";
        if (createBtn) container.appendChild(createBtn);
        container.appendChild(document.createElement("br"));
        container.appendChild(document.createElement("br"));
        container.appendChild(filterSection);
        
        renderSpotsGrid(filteredSpots, container);
    });
    
    resetFilterBtn.addEventListener('click', () => {
        filterTypeSelect.value = "";
        filterStatusSelect.value = "";
        
        // Nettoyer le container et conserver le bouton de création et les filtres
        const createBtn = document.getElementById('create-spot-btn');
        container.innerHTML = "";
        if (createBtn) container.appendChild(createBtn);
        container.appendChild(document.createElement("br"));
        container.appendChild(document.createElement("br"));
        container.appendChild(filterSection);
        
        renderSpotsGrid(allSpots, container);
    });
}

function setupFormSubmission(id = null) {
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
            // Pour les champs de sélection vides (comme owner_id et pricing_id)
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

        try {
            const { validateFormData } = await import("../core/validator.js");
            const { createParkingSpot, updateParkingSpot } = await import("../controllers/parkingSpotController.js");
            
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
        } catch (error) {
            console.error("Erreur lors de la soumission:", error);
            errorElement.textContent = "Une erreur est survenue lors de la communication avec le serveur";
        }
    });
}

export function renderParkingSpotForm(spot = null, formData = null) {
    const isEditing = spot !== null;
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isAdmin) return '';
    
    console.log("Données du formulaire:", formData);
    
    return `
    <div class="form-container">
        <h2>${isEditing ? 'Modifier' : 'Créer'} une place de parking</h2>
        <form id="${isEditing ? 'edit-spot-form' : 'create-spot-form'}" data-id="${isEditing ? spot.id : ''}">
            <div class="form-group">
                <label for="spot_number">Numéro de place:</label>
                <input type="text" id="spot_number" name="spot_number" value="${isEditing ? spot.spot_number : ''}" required>
            </div>
            <div class="form-group">
                <label for="type">Type:</label>
                <select id="type" name="type" required>
                    <option value="normale" ${isEditing && spot.type === 'normale' ? 'selected' : ''}>Standard</option>
                    <option value="handicapee" ${isEditing && spot.type === 'handicapee' ? 'selected' : ''}>PMR</option>
                    <option value="reservee" ${isEditing && spot.type === 'reservee' ? 'selected' : ''}>Réservée</option>
                    <option value="electrique" ${isEditing && spot.type === 'electrique' ? 'selected' : ''}>Électrique</option>
                </select>
            </div>
            <div class="form-group">
                <label for="status">Statut:</label>
                <select id="status" name="status" required>
                    <option value="libre" ${isEditing && spot.status === 'libre' ? 'selected' : ''}>Libre</option>
                    <option value="reservee" ${isEditing && spot.status === 'reservee' ? 'selected' : ''}>Réservée</option>
                    <option value="occupee" ${isEditing && spot.status === 'occupee' ? 'selected' : ''}>Occupée</option>
                </select>
            </div>
            <div class="form-group">
                <label for="owner_id">Propriétaire:</label>
                <select id="owner_id" name="owner_id">
                    <option value="">-- Aucun propriétaire --</option>
                    ${formData && formData.persons && formData.persons.length > 0 ? 
                        formData.persons.map(person => 
                            `<option value="${person.id}" ${isEditing && spot.owner_id == person.id ? 'selected' : ''}>
                                ${person.name || `Personne #${person.id}`}
                            </option>`
                        ).join('') : 
                        '<option value="" disabled>Aucune personne disponible</option>'
                    }
                </select>
            </div>
            <div class="form-group">
                <label for="pricing_id">Tarification:</label>
                <select id="pricing_id" name="pricing_id">
                    <option value="">-- Aucune tarification --</option>
                    ${formData && formData.pricings && formData.pricings.length > 0 ? 
                        formData.pricings.map(pricing => 
                            `<option value="${pricing.id}" ${isEditing && spot.pricing_id == pricing.id ? 'selected' : ''}>
                                ${pricing.name} - ${pricing.price}€
                            </option>`
                        ).join('') : 
                        '<option value="" disabled>Aucune tarification disponible</option>'
                    }
                </select>
            </div>
            <div class="form-group">
                <button type="submit" class="btn-primary">${isEditing ? 'Mettre à jour' : 'Créer'}</button>
                <button type="button" id="cancel-form" class="btn-secondary">Annuler</button>
            </div>
            <div id="form-error" class="error-message"></div>
        </form>
    </div>
    `;
}

export function renderDeleteConfirmation(spotId) {
    return `
    <div class="modal">
        <div class="modal-content">
            <h2>Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer cette place de parking ? Cette action est irréversible.</p>
            <div class="modal-actions">
                <button id="confirm-delete" data-id="${spotId}" class="btn-danger">Supprimer</button>
                <button id="cancel-delete" class="btn-secondary">Annuler</button>
            </div>
        </div>
    </div>
    `;
}