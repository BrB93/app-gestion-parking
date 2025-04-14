import { getCurrentUser } from '../controllers/authController.js';

export function renderParkingSpots(spots) {
    const container = document.getElementById("parking-spot-list");
    if (!container) return;
    
    container.innerHTML = "";
    
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isOwner = currentUser && currentUser.role === 'owner';
    
    if (isAdmin) {
        const createBtn = document.createElement("button");
        createBtn.className = "btn-primary";
        createBtn.id = "create-spot-btn";
        createBtn.textContent = "Créer une nouvelle place";
        container.appendChild(createBtn);
    }
    
    if (isOwner) {
        const ownerMessage = document.createElement("div");
        ownerMessage.className = "owner-message info-banner";
        ownerMessage.innerHTML = "<p>Vous consultez uniquement les places de parking dont vous êtes propriétaire.</p>";
        container.appendChild(ownerMessage);
    }
    
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
    
    const spotsGrid = document.createElement("div");
    spotsGrid.className = "parking-grid";
    container.appendChild(spotsGrid);
    
    renderSpots(spots, spotsGrid);
    
    setupFilterEvents(spots, spotsGrid);
}

function renderSpots(spots, container) {
    container.innerHTML = "";
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (spots.length === 0) {
        container.innerHTML = "<p>Aucune place de parking trouvée.</p>";
        return;
    }
    
    spots.forEach(spot => {
        const div = document.createElement("div");
        div.className = `parking-spot ${spot.getStatusClass()}`;
        div.dataset.type = spot.type;
        div.dataset.status = spot.status;
        
        div.innerHTML = `
            <h3>Place ${spot.spot_number}</h3>
            <p>Type: ${spot.getTypeLabel()}</p>
            <p>Statut: <span class="${spot.getStatusClass()}">${spot.status}</span></p>
            ${spot.owner_id ? `<p>Propriétaire: ID ${spot.owner_id}</p>` : ''}
            ${spot.pricing_id ? `<p>Tarification: ID ${spot.pricing_id}</p>` : ''}
            <div class="spot-actions">
                ${isAdmin ? 
                    `<button class="btn-edit btn-edit-spot" data-id="${spot.id}">Modifier</button>
                     <button class="btn-delete btn-delete-spot" data-id="${spot.id}">Supprimer</button>` : 
                    spot.isAvailable() ? 
                    `<button class="btn-primary btn-reserve-spot" data-id="${spot.id}">Réserver</button>` : 
                    ''
                }
            </div>
        `;
        container.appendChild(div);
    });
    
    attachSpotEvents();
}

function attachSpotEvents() {
    const reserveButtons = document.querySelectorAll('.btn-reserve-spot');
    reserveButtons.forEach(button => {
        button.addEventListener('click', () => {
            const spotId = button.getAttribute('data-id');
            window.location.href = `/app-gestion-parking/public/reservation?spot=${spotId}`;
        });
    });
}

function setupFilterEvents(allSpots, container) {
    const filterTypeSelect = document.getElementById('filter-type');
    const filterStatusSelect = document.getElementById('filter-status');
    const applyFilterBtn = document.getElementById('apply-filter');
    const resetFilterBtn = document.getElementById('reset-filter');
    
    if (!filterTypeSelect || !filterStatusSelect || !applyFilterBtn || !resetFilterBtn) return;
    
    applyFilterBtn.addEventListener('click', () => {
        const typeFilter = filterTypeSelect.value;
        const statusFilter = filterStatusSelect.value;
        
        const filteredSpots = allSpots.filter(spot => {
            const typeMatch = !typeFilter || spot.type === typeFilter;
            const statusMatch = !statusFilter || spot.status === statusFilter;
            return typeMatch && statusMatch;
        });
        
        renderSpots(filteredSpots, container);
    });
    
    resetFilterBtn.addEventListener('click', () => {
        filterTypeSelect.value = '';
        filterStatusSelect.value = '';
        renderSpots(allSpots, container);
    });
}

export function renderParkingSpotForm(spot = null, formData = null) {
    const isEditing = spot !== null;
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isAdmin) return "<p>Vous n'avez pas les droits pour effectuer cette action.</p>";
    
    // Ajout d'un log pour déboguer
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
            <p>Êtes-vous sûr de vouloir supprimer cette place de parking? Cette action est irréversible.</p>
            <div class="modal-actions">
                <button id="confirm-delete" data-id="${spotId}" class="btn-danger">Supprimer</button>
                <button id="cancel-delete" class="btn-secondary">Annuler</button>
            </div>
        </div>
    </div>
    `;
}