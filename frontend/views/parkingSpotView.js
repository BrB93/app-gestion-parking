import { fetchJSON } from "../core/fetchWrapper.js";
import { getCurrentUser } from '../controllers/authController.js';
import { setupParkingSpotEvents, getParkingSpot, getFormData, deleteParkingSpot } from "../controllers/parkingSpotController.js";

export function renderParkingSpots(spots) {
    const container = document.getElementById("parking-spot-list");
    if (!container) return;
    
    container.innerHTML = "";
    
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        const createButton = document.createElement('button');
        createButton.className = 'btn-primary';
        createButton.id = 'create-spot-btn';
        createButton.textContent = 'Créer une place';
        container.appendChild(createButton);
    }
    
    const viewToggle = document.createElement("div");
    viewToggle.className = "view-toggle";
    viewToggle.innerHTML = `
        <div class="toggle-buttons">
            <button class="btn-primary active" id="view-2d">Vue standard</button>
            <button class="btn-secondary" id="view-3d">Vue 3D</button>
        </div>
    `;
    container.appendChild(viewToggle);
    
    document.getElementById('view-3d').addEventListener('click', () => {
        import('../controllers/parkingSpotController.js').then(module => {
            module.loadParkingSpots(true);
        });
    });
    
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
  const container = document.getElementById('app-content') || document.body;
  
  const formContainer = document.createElement('div');
  formContainer.className = 'reservation-form-container';
  formContainer.id = 'reservation-form';
  
  import('../controllers/parkingSpotController.js').then(module => {
    module.getParkingSpot(spotId).then(spot => {
      if (!spot) {
        formContainer.innerHTML = '<div class="error-message">Place de parking non trouvée</div>';
        return;
      }
      
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        window.location.href = '/app-gestion-parking/public/login';
        return;
      }
      
      const now = new Date();
      const startDate = new Date(now);
      startDate.setHours(startDate.getHours() + 1);
      startDate.setMinutes(0);
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
      
      const defaultStart = startDate.toISOString().slice(0, 16);
      const defaultEnd = endDate.toISOString().slice(0, 16);
      
      import('../views/reservationView.js').then(reservationView => {
        formContainer.innerHTML = reservationView.renderReservationForm({
          spotId: spot.id,
          spotNumber: spot.spot_number,
          userId: currentUser.id,
          defaultStart,
          defaultEnd
        });
        
        container.appendChild(formContainer);
        
        setupPriceCalculation(spot);
        
        document.getElementById('cancel-reservation-form').addEventListener('click', () => {
          container.removeChild(formContainer);
        });
        
        document.getElementById('reservation-form').addEventListener('submit', (e) => {
          e.preventDefault();
          submitReservation(spotId);
        });
      });
    });
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
  
  const owners = Array.isArray(formData?.users) ? formData.users : [];
  const pricings = Array.isArray(formData?.pricings) ? formData.pricings : [];
  
  return `
    <div class="form-container">
      <h2>${isEditing ? 'Modifier' : 'Créer'} une place de parking</h2>
      <form id="${isEditing ? 'edit-spot-form' : 'create-spot-form'}" data-id="${isEditing ? spot.id : ''}">
        <div class="form-group">
          <label for="spot_number">Numéro de place:</label>
          <input type="text" id="spot_number" name="spot_number" value="${isEditing ? spot.spot_number : ''}" required>
        </div>
        <div class="form-group">
          <label for="type">Type de place:</label>
          <select id="type" name="type" required>
            <option value="normale" ${isEditing && spot.type === 'normale' ? 'selected' : ''}>Standard</option>
            <option value="handicapee" ${isEditing && spot.type === 'handicapee' ? 'selected' : ''}>PMR</option>
            <option value="electrique" ${isEditing && spot.type === 'electrique' ? 'selected' : ''}>Électrique</option>
            <option value="reservee" ${isEditing && spot.type === 'reservee' ? 'selected' : ''}>Réservée</option>
          </select>
        </div>
        <div class="form-group">
          <label for="status">Statut:</label>
          <select id="status" name="status" required>
            <option value="libre" ${isEditing && spot.status === 'libre' ? 'selected' : ''}>Disponible</option>
            <option value="reservee" ${isEditing && spot.status === 'reservee' ? 'selected' : ''}>Réservée</option>
            <option value="occupee" ${isEditing && spot.status === 'occupee' ? 'selected' : ''}>Occupée</option>
          </select>
        </div>
        <div class="form-group">
          <label for="owner_id">Propriétaire:</label>
          <select id="owner_id" name="owner_id">
            <option value="">Aucun</option>
            ${owners.map(owner => `
              <option value="${owner.id}" ${isEditing && spot.owner_id == owner.id ? 'selected' : ''}>${owner.username} (${owner.role})</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="pricing_id">Tarification:</label>
          <select id="pricing_id" name="pricing_id">
            <option value="">Tarification par défaut</option>
            ${pricings.map(pricing => `
              <option value="${pricing.id}" ${isEditing && spot.pricing_id == pricing.id ? 'selected' : ''}>${pricing.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-actions">
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

function setupBasicPriceCalculation(pricing) {
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const estimatedPriceElement = document.getElementById('estimated-price');
    
    const calculatePrice = () => {
      const start = new Date(startTimeInput.value);
      const end = new Date(endTimeInput.value);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        estimatedPriceElement.textContent = '--';
        return;
      }
      
      const durationHours = (end - start) / (1000 * 60 * 60);
      
      let estimatedPrice = pricing.base_price * durationHours;
      
      estimatedPrice = Math.round(estimatedPrice * 100) / 100;
      
      estimatedPriceElement.textContent = `${estimatedPrice}€`;
    };
    
    startTimeInput.addEventListener('change', calculatePrice);
    endTimeInput.addEventListener('change', calculatePrice);
}

  function setupPriceCalculation(spot) {
  const startInput = document.getElementById('start_time');
  const endInput = document.getElementById('end_time');
  const priceElement = document.getElementById('reservation-price');
  
  const updatePrice = async () => {
    const startTime = startInput.value;
    const endTime = endInput.value;
    
    if (startTime && endTime) {
      import('../controllers/pricingController.js').then(async pricingModule => {
        try {
          const result = await pricingModule.calculatePrice(spot.id, startTime, endTime);
          if (result.success) {
            priceElement.textContent = result.formatted_price;
          } else {
            priceElement.textContent = 'Erreur de calcul';
          }
        } catch (error) {
          console.error('Erreur lors du calcul du prix:', error);
          priceElement.textContent = 'Erreur de calcul';
        }
      });
    }
  };
  
  if (startInput && endInput) {
    startInput.addEventListener('change', updatePrice);
    endInput.addEventListener('change', updatePrice);
    
    updatePrice();
  }
}
  
function submitReservation(spotId) {
  const formContainer = document.getElementById('reservation-form');
  const actualForm = formContainer ? formContainer.querySelector('form') : null;
  const errorElement = document.getElementById('form-error');
  
  if (!actualForm) {
    console.error("Formulaire de réservation introuvable");
    return;
  }
  
  actualForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorElement) errorElement.textContent = '';
    
    const formData = new FormData(actualForm);
    const reservationData = {
      spot_id: spotId,
    };
    
    formData.forEach((value, key) => {
      reservationData[key] = value;
    });
    
    try {
      const { createReservation } = await import("../controllers/reservationController.js");
      const response = await createReservation(reservationData);
      
      if (response.error) {
        if (errorElement) errorElement.textContent = response.error;
        return;
      }
      
      if (response.success) {
        if (response.reservation_id) {
          console.log("Affichage de la modale de paiement avec ID:", response.reservation_id, "et prix:", response.price);
          
          if (formContainer && formContainer.parentNode) {
            formContainer.parentNode.removeChild(formContainer);
          }
          
          import('../controllers/paymentController.js').then(module => {
            module.showPaymentForm(response.reservation_id, response.price);
          });
        } else {
          console.error("ID de réservation manquant dans la réponse");
          window.location.href = '/app-gestion-parking/public/reservations';
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
      if (errorElement) errorElement.textContent = "Une erreur est survenue lors de la création de la réservation";
    }
  });
}

function processReservationForm(form, spotId) {
  const formData = new FormData(form);
  const reservationData = {};
  
  formData.forEach((value, key) => {
    reservationData[key] = value;
  });
  
  import('../controllers/reservationController.js').then(async module => {
    try {
      const result = await module.createReservation(reservationData);
      
      if (result.error) {
        const errorElement = document.getElementById('form-error');
        if (errorElement) {
          errorElement.textContent = result.error;
        }
      } else if (result.success) {
        if (result.redirect_to_payment) {
          window.location.href = result.redirect_to_payment;
        } else {
          window.location.href = '/app-gestion-parking/public/reservations';
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      const errorElement = document.getElementById('form-error');
      if (errorElement) {
        errorElement.textContent = 'Une erreur est survenue lors de la création de la réservation.';
      }
    }
  });
}
  
export function showSpotDetailsModal(spot) {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.id = 'spot-details-modal';
  
  modalContainer.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Place ${spot.spot_number}</h2>
        <span class="status-badge ${spot.getStatusClass()}">${spot.getStatusLabel()}</span>
      </div>
      <div class="modal-body">
        <p><strong>Type:</strong> ${spot.getTypeLabel()}</p>
        <p><strong>Statut:</strong> ${spot.getStatusLabel()}</p>
        <div id="pricing-info">
          <p><strong>Tarification:</strong> <span id="pricing-label">Chargement...</span></p>
        </div>
      </div>
      <div class="modal-footer">
        ${spot.isAvailable() ? `<button id="reserve-spot-btn" class="btn-primary" data-id="${spot.id}">Réserver</button>` : ''}
        <button id="view-availability-btn" class="btn-secondary" data-id="${spot.id}">Voir disponibilités</button>
        <button id="close-spot-details" class="btn-secondary">Fermer</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalContainer);
  
  document.getElementById('close-spot-details').addEventListener('click', () => {
    document.body.removeChild(modalContainer);
  });

  if (spot.isAvailable()) {
    document.getElementById('reserve-spot-btn').addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      showReservationForm(spot.id);
    });
  }
  
  document.getElementById('view-availability-btn').addEventListener('click', () => {
    document.body.removeChild(modalContainer);
    import('../controllers/parkingSpotController.js').then(module => {
      module.showAvailabilityInfo(spot.id);
    });
  });
  
  if (spot.pricing_id) {
    import('../controllers/pricingController.js').then(pricingModule => {
      pricingModule.getPricingsByType(spot.type).then(pricings => {
        const pricingEl = document.getElementById('pricing-label');
        if (pricingEl) {
          const matchingPricing = pricings.find(p => p.id == spot.pricing_id);
          pricingEl.textContent = matchingPricing ? matchingPricing.getName() : 'Tarification standard';
        }
      });
    });
  } else {
    const pricingEl = document.getElementById('pricing-label');
    if (pricingEl) {
      pricingEl.textContent = 'Tarification par défaut';
    }
  }
}

