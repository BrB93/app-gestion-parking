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
        import('../controllers/pricingController.js').then(pricingModule => {
          pricingModule.getPricing(spot.pricing_id).then(pricing => {
            const currentUser = getCurrentUser();
            
            formContainer.innerHTML = `
              <div class="card reservation-card">
                <div class="card-header">
                  <h2>Réserver la place #${spot.spot_number}</h2>
                  <button class="btn-close" id="close-reservation-form">&times;</button>
                </div>
                
                <div class="card-body">
                  <div class="spot-preview ${spot.getStatusClass()}">
                    <span class="spot-number">${spot.spot_number}</span>
                    <span class="spot-type">${spot.getTypeLabel()}</span>
                  </div>
                  
                  <form id="create-reservation-form">
                    <input type="hidden" name="spot_id" value="${spot.id}">
                    <input type="hidden" name="pricing_id" value="${spot.pricing_id}">
                    
                    <div class="form-group">
                      <label for="start_time">Date et heure de début</label>
                      <input type="datetime-local" id="start_time" name="start_time" required
                             min="${new Date(Date.now() + 15*60000).toISOString().slice(0, 16)}">
                    </div>
                    
                    <div class="form-group">
                      <label for="end_time">Date et heure de fin</label>
                      <input type="datetime-local" id="end_time" name="end_time" required
                             min="${new Date(Date.now() + 30*60000).toISOString().slice(0, 16)}">
                    </div>
                    
                    <div class="form-group">
                      <label for="vehicle_info">Informations du véhicule</label>
                      <input type="text" id="vehicle_info" name="vehicle_info" placeholder="Modèle et plaque d'immatriculation">
                    </div>
                    
                    <div class="pricing-summary">
                      <h3>Tarification</h3>
                      <p>Base: ${pricing.base_price}€/heure</p>
                      <p>Jour (${pricing.daytime_start}-${pricing.daytime_end}): ${pricing.daytime_price}€/heure</p>
                      <p>Nuit: ${pricing.nighttime_price}€/heure</p>
                      ${pricing.weekend_price ? `<p>Week-end: ${pricing.weekend_price}€/heure</p>` : ''}
                      
                      <div class="total-price">
                        <p>Estimation: <span id="estimated-price">--</span></p>
                      </div>
                    </div>
                  </form>
                </div>
                
                <div class="card-footer">
                  <button id="cancel-reservation" class="btn-secondary">Annuler</button>
                  <button id="submit-reservation" class="btn-primary">Confirmer la réservation</button>
                </div>
              </div>
            `;
            
            container.appendChild(formContainer);
            
            setupPriceCalculation(pricing);
            
            document.getElementById('close-reservation-form').addEventListener('click', () => {
              container.removeChild(formContainer);
            });
            
            document.getElementById('cancel-reservation').addEventListener('click', () => {
              container.removeChild(formContainer);
            });
            
            document.getElementById('submit-reservation').addEventListener('click', () => {
              submitReservation(spot.id);
            });
          }).catch(error => {
            console.error("Erreur lors de la récupération du tarif:", error);
            formContainer.innerHTML = `
              <div class="error-message">
                <p>Impossible de charger les informations de tarif. Veuillez réessayer.</p>
                <button id="close-error" class="btn-primary">Fermer</button>
              </div>
            `;
            
            document.getElementById('close-error').addEventListener('click', () => {
              container.removeChild(formContainer);
            });
          });
        });
      }).catch(error => {
        console.error("Erreur lors de la récupération des informations de la place:", error);
        formContainer.innerHTML = `
          <div class="error-message">
            <p>Impossible de charger les informations de la place. Veuillez réessayer.</p>
            <button id="close-error" class="btn-primary">Fermer</button>
          </div>
        `;
        
        document.getElementById('close-error').addEventListener('click', () => {
          container.removeChild(formContainer);
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
  
  const formHTML = `
      <div class="modal-content">
          <h2>${isEditing ? 'Modifier' : 'Créer'} une place de parking</h2>
          <form id="${isEditing ? 'edit-spot-form' : 'create-spot-form'}">
              <!-- Champs du formulaire -->
              <div class="form-group">
                  <label for="spot_number">Numéro de place:</label>
                  <input type="text" id="spot_number" name="spot_number" value="${spot ? spot.spot_number : ''}" ${isEditing ? 'readonly' : 'required'}>
              </div>
              
              <div class="form-group">
                  <label for="type">Type de place:</label>
                  <select id="type" name="type" required>
                      <option value="normale" ${spot && spot.type === 'normale' ? 'selected' : ''}>Standard</option>
                      <option value="handicapee" ${spot && spot.type === 'handicapee' ? 'selected' : ''}>PMR</option>
                      <option value="electrique" ${spot && spot.type === 'electrique' ? 'selected' : ''}>Borne électrique</option>
                      <option value="reservee" ${spot && spot.type === 'reservee' ? 'selected' : ''}>Réservée</option>
                  </select>
              </div>
              
              <div class="form-group">
                  <label for="status">Statut:</label>
                  <select id="status" name="status" required>
                      <option value="libre" ${!spot || spot.status === 'libre' ? 'selected' : ''}>Disponible</option>
                      <option value="reservee" ${spot && spot.status === 'reservee' ? 'selected' : ''}>Réservée</option>
                      <option value="occupee" ${spot && spot.status === 'occupee' ? 'selected' : ''}>Occupée</option>
                  </select>
              </div>
              
              <div class="form-group">
                  <label for="owner_id">Propriétaire:</label>
                  <select id="owner_id" name="owner_id">
                      <option value="">Aucun propriétaire</option>
                      ${owners.map(owner => `
                          <option value="${owner.id}" ${spot && spot.owner_id === owner.id ? 'selected' : ''}>
                              ${owner.name} (${owner.role})
                          </option>
                      `).join('')}
                  </select>
              </div>
              
              <div class="form-group">
                  <label for="pricing_id">Tarification:</label>
                  <select id="pricing_id" name="pricing_id">
                      <option value="">Tarification par défaut</option>
                      ${pricings.map(pricing => `
                          <option value="${pricing.id}" ${spot && spot.pricing_id === pricing.id ? 'selected' : ''}>
                              ${pricing.name} (${pricing.price_per_hour}€/h)
                          </option>
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
  
  return formHTML;
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

function setupPriceCalculation(pricing) {
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
  
  function submitReservation(spotId) {
    const form = document.getElementById('create-reservation-form');
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    if (!data.start_time || !data.end_time) {
      alert('Veuillez renseigner les dates de début et de fin.');
      return;
    }
    
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    
    if (startTime >= endTime) {
      alert('La date de fin doit être postérieure à la date de début.');
      return;
    }
    
    const submitBtn = document.getElementById('submit-reservation');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Traitement...';
    
    import('../controllers/reservationController.js').then(module => {
      module.createReservation(data).then(reservationId => {
        window.location.href = `/app-gestion-parking/public/reservations?success=true&id=${reservationId}`;
      }).catch(error => {
        console.error('Erreur lors de la création de la réservation:', error);
        alert('Une erreur est survenue lors de la création de la réservation. Veuillez réessayer.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmer la réservation';
      });
    });
  }
  
  export function showSpotDetailsModal(spot) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.id = 'spot-details-modal';
    
    let pricingInfo = '';
    try {
      import('../controllers/pricingController.js').then(pricingModule => {
        if (spot.pricing_id) {
          pricingModule.getPricing(spot.pricing_id).then(pricing => {
            const pricingElement = document.getElementById('spot-pricing-info');
            if (pricingElement) {
              pricingElement.innerHTML = `
                <p><strong>Tarif:</strong> ${pricing.base_price}€/heure</p>
                <p><strong>Tarif jour:</strong> ${pricing.daytime_price}€/heure (${pricing.daytime_start}-${pricing.daytime_end})</p>
                <p><strong>Tarif nuit:</strong> ${pricing.nighttime_price}€/heure</p>
                ${pricing.weekend_price ? `<p><strong>Tarif week-end:</strong> ${pricing.weekend_price}€/heure</p>` : ''}
              `;
            }
          });
        }
      });
    } catch (error) {
      console.log('Impossible de récupérer les tarifs', error);
    }
    
    const statusLabel = spot.status === 'libre' ? 'Disponible' : 
                       (spot.status === 'reservee' ? 'Réservée' : 'Occupée');
    
    const statusClass = spot.status === 'libre' ? 'badge-success' : 
                       (spot.status === 'reservee' ? 'badge-warning' : 'badge-danger');
    
    modalContainer.innerHTML = `
      <div class="modal-content spot-detail-modal">
        <div class="modal-header">
          <h2>Place de parking #${spot.spot_number}</h2>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        
        <div class="modal-body">
          <div class="spot-info-grid">
            <div class="spot-main-info">
              <p><strong>Type:</strong> ${spot.getTypeLabel()}</p>
              <p><i class="icon ${spot.type === 'handicapee' ? 'icon-handicap' : 
                                (spot.type === 'electrique' ? 'icon-electric' : 'icon-standard')}"></i></p>
              <div id="spot-pricing-info" class="pricing-info">
                <p><em>Chargement des tarifs...</em></p>
              </div>
            </div>
            
            <div class="spot-visual">
              <div class="spot-3d-preview ${spot.getStatusClass()}">
                <span>${spot.spot_number}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          ${spot.status === 'libre' ? `
            <button id="reserve-spot-btn" class="btn-primary btn-reserve" data-id="${spot.id}">
              <i class="icon icon-calendar"></i> Réserver maintenant
            </button>
          ` : (spot.status === 'reservee' ? `
            <button class="btn-secondary" disabled>Place déjà réservée</button>
          ` : `
            <button class="btn-secondary" disabled>Place occupée</button>
          `)}
          <button id="close-spot-details" class="btn-secondary">Fermer</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    setTimeout(() => {
      modalContainer.classList.add('active');
    }, 10);
    
    document.getElementById('close-spot-details').addEventListener('click', () => {
      modalContainer.classList.remove('active');
      setTimeout(() => {
        document.body.removeChild(modalContainer);
      }, 300);
    });
    
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        modalContainer.classList.remove('active');
        setTimeout(() => {
          document.body.removeChild(modalContainer);
        }, 300);
      }
    });
    
    const reserveBtn = document.getElementById('reserve-spot-btn');
    if (reserveBtn) {
      reserveBtn.addEventListener('click', () => {
        reserveBtn.classList.add('btn-clicked');
        
        reserveBtn.innerHTML = '<i class="icon icon-loading"></i> Chargement...';
        
        setTimeout(() => {
          modalContainer.classList.remove('active');
          setTimeout(() => {
            document.body.removeChild(modalContainer);
            showReservationForm(spot.id);
          }, 300);
        }, 500);
      });
    }
  }