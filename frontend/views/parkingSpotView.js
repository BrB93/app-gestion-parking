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
    
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        const createBtn = document.createElement("button");
        createBtn.className = "btn-primary";
        createBtn.id = "create-spot-btn";
        createBtn.textContent = "Créer une nouvelle place";
        container.appendChild(createBtn);
        
        container.appendChild(document.createElement("br"));
        container.appendChild(document.createElement("br"));
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
    
    const filterSectionRef = filterSection;
    
    setupFilterEvents(spots, container, filterSectionRef);
    
    renderSpotsGrid(spots, container);
}

export function showReservationForm(spotId) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.id = 'reservation-modal';
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = '/app-gestion-parking/public/login';
        return;
    }
    
    Promise.all([
        import('../controllers/reservationController.js'),
        import('../views/reservationView.js'),
        import('../controllers/pricingController.js')
    ]).then(([controllerModule, viewModule, pricingModule]) => {
        import('../controllers/parkingSpotController.js').then(spotController => {
            spotController.getParkingSpot(spotId).then(spot => {
                if (!spot) {
                    console.error(`La place ${spotId} n'existe pas`);
                    return;
                }
                
                const now = new Date();
                const tomorrow = new Date();
                tomorrow.setDate(now.getDate() + 1);
                
                const defaultStart = now.toISOString().slice(0, 16);
                const defaultEnd = tomorrow.toISOString().slice(0, 16);
                
                modalContainer.innerHTML = viewModule.renderReservationForm({
                    spotId: spotId,
                    userId: currentUser.id,
                    defaultStart: defaultStart,
                    defaultEnd: defaultEnd
                });
                
                document.body.appendChild(modalContainer);
                
                const form = document.getElementById('reservation-form');
                const startTimeInput = document.getElementById('start_time');
                const endTimeInput = document.getElementById('end_time');
                const errorElement = document.getElementById('form-error');
                
                const updatePrice = async () => {
                    const startTime = startTimeInput.value;
                    const endTime = endTimeInput.value;
                    
                    if (!startTime || !endTime) return;
                    
                    try {
                        const result = await pricingModule.calculatePrice(spotId, startTime, endTime);
                        
                        if (result.error) {
                            console.error("Erreur de calcul de prix:", result.error);
                            return;
                        }
                        
                        const priceElement = document.getElementById('reservation-price');
                        if (priceElement) {
                            priceElement.textContent = result.formatted_price;
                            priceElement.dataset.price = result.price;
                        }
                    } catch (error) {
                        console.error("Erreur lors du calcul du prix:", error);
                    }
                };
                
                updatePrice();
                
                startTimeInput.addEventListener('change', updatePrice);
                endTimeInput.addEventListener('change', updatePrice);
                
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData(form);
                    const reservationData = {};
                    
                    formData.forEach((value, key) => {
                        reservationData[key] = value;
                    });
                    
                    const validation = controllerModule.validateReservationData 
                        ? controllerModule.validateReservationData(reservationData) 
                        : { isValid: true };
                    
                    if (!validation.isValid) {
                        errorElement.textContent = Object.values(validation.errors).join('\n');
                        return;
                    }
                    
                    const submitButton = form.querySelector('button[type="submit"]');
                    submitButton.disabled = true;
                    submitButton.textContent = 'Traitement en cours...';
                    
                    const result = await controllerModule.createReservation(reservationData);
                    
                    submitButton.disabled = false;
                    submitButton.textContent = 'Réserver et payer';
                    
                    if (result.error) {
                        errorElement.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
                        if (result.status === 409) {
                            errorElement.innerHTML += `<p>Consultez les <a href="#" id="view-availability">disponibilités de cette place</a> pour choisir un autre créneau.</p>`;
                            document.getElementById('view-availability').addEventListener('click', (e) => {
                                e.preventDefault();
                                document.body.removeChild(modalContainer);
                                import('../controllers/parkingSpotController.js').then(controller => {
                                    controller.showAvailabilityInfo(reservationData.spot_id);
                                });
                            });
                        }
                    } else if (result.success) {
                        document.body.removeChild(modalContainer);
                        const priceElement = document.getElementById('reservation-price');
                        let price = priceElement ? priceElement.dataset.price : 0;
                        
                        if (!price || price == "0" || price == 0) {
                          console.warn("Prix non défini ou à zéro, utilisation d'une valeur par défaut");
                          price = 5.00;
                        }
                        
                        console.log("Création du formulaire POST pour redirection vers paiement");
                        console.log("ID de réservation:", result.reservation_id);
                        console.log("Montant:", price);
                        
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.action = '/app-gestion-parking/public/payments/process';
                        form.style.display = 'none';
                        
                        const reservationField = document.createElement('input');
                        reservationField.type = 'hidden';
                        reservationField.name = 'reservation_id';
                        reservationField.value = result.reservation_id;
                        form.appendChild(reservationField);
                        
                        const amountField = document.createElement('input');
                        amountField.type = 'hidden';
                        amountField.name = 'amount';
                        amountField.value = price;
                        form.appendChild(amountField);
                        
                        document.body.appendChild(form);
                        form.submit();
                      }
                });
                
                document.getElementById('cancel-reservation-form').addEventListener('click', () => {
                    document.body.removeChild(modalContainer);
                });
            }).catch(error => {
                console.error("Erreur lors de la récupération des détails de la place:", error);
                modalContainer.innerHTML = '<div class="modal-content"><p>Erreur lors du chargement des détails de la place.</p></div>';
                document.body.appendChild(modalContainer);
            });
        }).catch(error => {
            console.error("Erreur lors du chargement du contrôleur de places:", error);
            modalContainer.innerHTML = '<div class="modal-content"><p>Une erreur est survenue.</p></div>';
            document.body.appendChild(modalContainer);
        });
    }).catch(err => {
        console.error("Erreur lors du chargement des modules:", err);
        modalContainer.innerHTML = '<div class="modal-content"><p>Une erreur est survenue.</p></div>';
        document.body.appendChild(modalContainer);
    });
}

function renderSpotsGrid(spots, container) {
    if (spots.length === 0) {
        container.innerHTML = "<p>Aucune place de parking trouvée.</p>";
        return;
    }
    
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    const spotsGrid = document.createElement("div");
    spotsGrid.className = "parking-grid";
    
    spots.forEach(spot => {
        const div = document.createElement("div");
        div.className = `parking-spot ${spot.getStatusClass()}`;
        
        let canBeReserved = spot.isAvailable();
        

        if (spot.status === 'reservee') {
            canBeReserved = true;
        }
        
        div.innerHTML = `
            <h3>Place ${spot.spot_number}</h3>
            <p>Type: ${spot.getTypeLabel()}</p>
            <p>Statut: <span class="${spot.getStatusClass()}">${spot.status}</span></p>
            ${spot.owner_id ? `<p>Propriétaire ID: ${spot.owner_id}</p>` : ''}
            <div class="spot-actions">
                ${canBeReserved && !isAdmin ? `<button class="btn-reserve-spot" data-id="${spot.id}">Réserver</button>` : ''}
                ${isAdmin ? `<button class="btn-edit-spot" data-id="${spot.id}">Modifier</button>` : ''}
                ${isAdmin ? `<button class="btn-delete-spot" data-id="${spot.id}">Supprimer</button>` : ''}
            </div>
        `;
        
        spotsGrid.appendChild(div);
    });
    
    container.appendChild(spotsGrid);
    attachSpotEvents();
}

function attachSpotEvents() {
    document.querySelectorAll('.btn-reserve-spot').forEach(button => {
        button.addEventListener('click', () => {
            const spotId = button.getAttribute('data-id');
            showReservationForm(spotId);
        });
    });
    
    document.querySelectorAll('.btn-edit-spot').forEach(button => {
        button.addEventListener('click', async () => {
            const spotId = button.getAttribute('data-id');
            await editSpot(spotId);
        });
    });
    
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