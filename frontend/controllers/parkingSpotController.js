import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { ParkingSpot } from "../models/parkingSpot.js";
import { renderParkingSpots, renderParkingSpotForm, renderDeleteConfirmation } from "../views/parkingSpotView.js";
import { getCurrentUser } from "./authController.js";

export async function loadParkingSpots() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/parking-spots");
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

function setupParkingSpotEvents() {
    const contentElement = document.getElementById('app-content');
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (isAdmin) {
        const createBtn = document.getElementById('create-spot-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                contentElement.innerHTML = renderParkingSpotForm();
                setupFormSubmission();
            });
        }
    }

    const editButtons = document.querySelectorAll('.btn-edit-spot');
    editButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const spotId = button.getAttribute('data-id');
            const spot = await getParkingSpot(spotId);
            
            if (spot) {
                contentElement.innerHTML = renderParkingSpotForm(spot);
                setupFormSubmission(spotId);
            }
        });
    });
    
    const deleteButtons = document.querySelectorAll('.btn-delete-spot');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const spotId = button.getAttribute('data-id');
            const modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            modalContainer.innerHTML = renderDeleteConfirmation(spotId);
            document.body.appendChild(modalContainer);
            
            document.getElementById('confirm-delete').addEventListener('click', async () => {
                const result = await deleteParkingSpot(spotId);
                if (result.success) {
                    document.body.removeChild(modalContainer);
                    loadParkingSpots();
                }
            });
            
            document.getElementById('cancel-delete').addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
    });
}

function setupFormSubmission(spotId = null) {
    const isEditing = spotId !== null;
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
        
        let result;
        if (isEditing) {
            result = await updateParkingSpot(spotId, spotData);
        } else {
            result = await createParkingSpot(spotData);
        }
        
        if (result.error) {
            errorElement.textContent = result.error;
        } else if (result.success) {
            loadParkingSpots();
        }
    });
}