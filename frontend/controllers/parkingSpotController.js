import { fetchJSON, postJSON } from '../core/fetchWrapper.js';
import { ParkingSpot } from '../models/ParkingSpot.js';
import { renderParkingSpots } from '../views/parkingSpotView.js';
import { render3DParkingSpots } from '../views/parking3DView.js';
import { validateFormData } from '../core/validator.js';
import { getCurrentUser } from './authController.js';

export async function loadParkingSpots(use3DView = false) {
    try {
        console.log(`Chargement des places de parking (vue ${use3DView ? '3D' : '2D'})...`);
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
        
        if (use3DView) {
            import('../views/parkingSpotView.js').then(module => {
                window.showSpotDetailsModal = module.showSpotDetailsModal;
                
                render3DParkingSpots(spots);
            });
        } else {
            renderParkingSpots(spots);
        }
        
        setupParkingSpotEvents();
    } catch (error) {
        console.error("Erreur lors du chargement des places de parking:", error);
        
        const container = document.getElementById("parking-spot-list");
        if (container) {
            container.innerHTML = `<p class="error-message">Erreur de chargement: ${error.message}</p>`;
        }
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
                
                // Importer correctement le module de vue
                const viewModule = await import('../views/parkingSpotView.js');
                if (!viewModule.renderParkingSpotForm) {
                    console.error("La fonction renderParkingSpotForm n'est pas disponible");
                    return;
                }
                
                const modalContainer = document.createElement('div');
                modalContainer.className = 'modal-container';
                modalContainer.innerHTML = viewModule.renderParkingSpotForm(null, formData);
                document.body.appendChild(modalContainer);
                
                setupFormSubmission();
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
            <button id="try-reserve" class="btn-primary">Essayer de réserver</button>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    document.getElementById('close-availability').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    document.getElementById('try-reserve').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        showReservationForm(spotId);
    });
    
    getSpotAvailability(spotId).then(data => {
        const content = document.getElementById('availability-content');
        if (data.reservations && data.reservations.length > 0) {
            content.innerHTML = `
                <p>Cette place est déjà réservée pour les créneaux suivants:</p>
                <div class="reservation-list">
                    ${data.reservations.map(res => {
                        const start = new Date(res.start_time).toLocaleString();
                        const end = new Date(res.end_time).toLocaleString();
                        return `<div class="reservation-slot">
                            <p><strong>Du:</strong> ${start}</p>
                            <p><strong>Au:</strong> ${end}</p>
                        </div>`;
                    }).join('')}
                </div>
                <p class="help-text">Veuillez choisir un créneau qui ne chevauche pas ces périodes.</p>
            `;
        } else {
            content.innerHTML = `<p>Cette place est entièrement disponible.</p>`;
        }
    });
}

export async function createSpotWithNumber(spotNumber) {
    try {
      const formData = await getFormData();
      
      const section = spotNumber.charAt(0);
      let type = 'normale';
      
      if (section === 'A' || section === 'F') {
        type = 'normale';
      } else if (section === 'B') {
        type = 'handicapee';
      } else if (section === 'E') {
        type = 'electrique';
      } else if (section === 'C' || section === 'D') {
        type = 'reservee';
      }
      
      const container = document.getElementById('app-content');
      container.innerHTML = `
        <h2>Configuration de la place ${spotNumber}</h2>
        <form id="create-spot-form">
          <div class="form-group">
            <label for="spot_number">Numéro de place</label>
            <input type="text" id="spot_number" name="spot_number" value="${spotNumber}" readonly>
          </div>
          <div class="form-group">
            <label for="type">Type de place</label>
            <select id="type" name="type" required>
              <option value="normale" ${type === 'normale' ? 'selected' : ''}>Standard</option>
              <option value="handicapee" ${type === 'handicapee' ? 'selected' : ''}>PMR</option>
              <option value="reservee" ${type === 'reservee' ? 'selected' : ''}>Réservée</option>
              <option value="electrique" ${type === 'electrique' ? 'selected' : ''}>Électrique</option>
            </select>
          </div>
          <div class="form-group">
            <label for="status">Statut initial</label>
            <select id="status" name="status" required>
              <option value="libre" selected>Libre</option>
              <option value="reservee">Réservée</option>
              <option value="occupee">Occupée</option>
            </select>
          </div>
          <div class="form-group">
            <label for="owner_id">Propriétaire (facultatif)</label>
            <select id="owner_id" name="owner_id">
              <option value="">-- Aucun --</option>
              ${formData.users.filter(u => u.role === 'owner').map(user => 
                `<option value="${user.id}">${user.username}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="pricing_id">Tarification</label>
            <select id="pricing_id" name="pricing_id">
              <option value="">-- Par défaut --</option>
              ${formData.pricings.map(pricing => 
                `<option value="${pricing.id}">${pricing.name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Créer la place</button>
            <button type="button" id="cancel-form" class="btn-secondary">Annuler</button>
          </div>
          <div id="form-error" class="error-message"></div>
        </form>
      `;
      
      setupFormSubmission();
    } catch (error) {
      console.error("Erreur lors de la création du formulaire de spot:", error);
    }
  }