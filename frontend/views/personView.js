import { getCurrentUser } from '../controllers/authController.js';
import { getAvailableUsers } from '../controllers/personController.js';

export function renderPersons(persons) {
    const container = document.getElementById("person-list") || document.querySelector("[id='person-list']");
    
    if (!container) {
        const backupContainer = document.createElement("div");
        backupContainer.id = "person-list";
        const appContent = document.getElementById("app-content");

        (appContent || document.body).appendChild(backupContainer);
        renderPersonsInContainer(backupContainer, persons);
        return;
    }
    
    renderPersonsInContainer(container, persons);
}

function renderPersonsInContainer(container, persons) {
    container.innerHTML = "";
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (isAdmin) {
        const createBtn = document.createElement("button");
        createBtn.className = "btn-primary";
        createBtn.id = "create-person-btn";
        createBtn.textContent = "Ajouter une personne";
        container.appendChild(createBtn);
    }

    persons.forEach(person => {
        const div = document.createElement("div");
        div.className = "person-card";

        div.innerHTML = `
            <h3>${person.first_name || ''} ${person.last_name || ''}</h3>
            <p>Adresse: ${person.address} ${person.zip_code || ''} ${person.city || ''}</p>
            ${person.apartment_number ? `<p>Appartement: ${person.apartment_number}</p>` : ''}
            ${person.phone_number ? `<p>Téléphone: ${person.phone_number}</p>` : ''}
            ${person.vehicle_brand || person.vehicle_model ? `<p>Véhicule: ${person.vehicle_brand ?? ''} ${person.vehicle_model ?? ''}</p>` : ''}
            ${person.license_plate ? `<p>Immatriculation: ${person.license_plate}</p>` : ''}
            <p>Créé le: ${new Date(person.created_at).toLocaleString()}</p>
            <div class="person-actions">
                ${isAdmin || currentUser.id === person.user_id ? `<button class="btn-edit" data-id="${person.id}">Modifier</button>` : ''}
                ${isAdmin ? `<button class="btn-delete" data-id="${person.id}">Supprimer</button>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

export async function renderPersonForm(person = null, userId = null) {
    const currentUser = getCurrentUser();
    
    const id = person?.id || '';
    const defaultUserId = userId || (currentUser ? currentUser.id : '');
    const firstName = person?.first_name || '';
    const lastName = person?.last_name || '';
    const address = person?.address || '';
    const zipCode = person?.zip_code || '';
    const city = person?.city || '';
    const apartmentNumber = person?.apartment_number || '';
    const phoneNumber = person?.phone_number || '';
    const vehicleBrand = person?.vehicle_brand || '';
    const vehicleModel = person?.vehicle_model || '';
    const licensePlate = person?.license_plate || '';

    const isProfilePage = window.location.pathname.includes('/profile');
    
    return `
      <form id="${id ? 'edit-person-form' : 'create-person-form'}" class="form">
        ${id ? `<input type="hidden" name="id" value="${id}">` : ''}
        
        <!-- Champ caché pour user_id -->
        <input type="hidden" name="user_id" value="${defaultUserId}">
        
        <div class="form-group">
          <label for="first_name">Prénom :</label>
          <input type="text" name="first_name" id="first_name" value="${firstName}" required>
        </div>
        
        <div class="form-group">
          <label for="last_name">Nom :</label>
          <input type="text" name="last_name" id="last_name" value="${lastName}" required>
        </div>
        
        <div class="form-group">
          <label for="address">Adresse :</label>
          <input type="text" name="address" id="address" value="${address}" required>
        </div>
        
        <div class="form-group">
          <label for="zip_code">Code postal :</label>
          <input type="text" name="zip_code" id="zip_code" value="${zipCode}" required>
        </div>
        
        <div class="form-group">
          <label for="city">Ville :</label>
          <input type="text" name="city" id="city" value="${city}" required>
        </div>
        
        <div class="form-group">
          <label for="apartment_number">Numéro d'appartement :</label>
          <input type="text" name="apartment_number" id="apartment_number" value="${apartmentNumber}">
        </div>
        
        <div class="form-group">
          <label for="phone_number">Téléphone :</label>
          <input type="text" name="phone_number" id="phone_number" value="${phoneNumber}">
        </div>
        
        <div class="form-group">
          <label for="vehicle_brand">Marque du véhicule :</label>
          <input type="text" name="vehicle_brand" id="vehicle_brand" value="${vehicleBrand}">
        </div>
        
        <div class="form-group">
          <label for="vehicle_model">Modèle du véhicule :</label>
          <input type="text" name="vehicle_model" id="vehicle_model" value="${vehicleModel}">
        </div>
        
        <div class="form-group">
          <label for="license_plate">Plaque d'immatriculation :</label>
          <input type="text" name="license_plate" id="license_plate" value="${licensePlate}">
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-primary">${id ? 'Mettre à jour' : 'Créer'}</button>
          <button type="button" id="cancel-person-form" class="btn-secondary">Annuler</button>
        </div>
        <div id="person-form-error" class="error-message"></div>
      </form>
    `;
}

export function renderDeleteConfirmation(personId) {
    return `
    <div class="modal">
        <div class="modal-content">
            <h2>Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer cette personne ? Cette action est irréversible.</p>
            <div class="modal-actions">
                <button id="confirm-delete" data-id="${personId}" class="btn-danger">Supprimer</button>
                <button id="cancel-delete" class="btn-secondary">Annuler</button>
            </div>
        </div>
    </div>
    `;
}