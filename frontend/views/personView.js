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
            <p>Adresse: ${person.address}</p>
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

export async function renderPersonForm(person = null) {
    const isEditing = person !== null;
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    const users = await getAvailableUsers();

    return `
    <div class="form-container">
        <h2>${isEditing ? 'Modifier' : 'Ajouter'} une personne</h2>
        <form id="${isEditing ? 'edit-person-form' : 'create-person-form'}" data-id="${isEditing ? person.id : ''}">
            <div class="form-group">
                <label for="user_id">Utilisateur associé:</label>
                <select id="user_id" name="user_id" required>
                    <option value="">Sélectionnez un utilisateur</option>
                    ${users.map(user => `
                        <option value="${user.id}" ${isEditing && person.user_id === user.id ? 'selected' : ''}>
                            ${user.name} (${user.email}) - ${user.role}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="first_name">Prénom:</label>
                <input type="text" id="first_name" name="first_name" value="${isEditing && person.first_name ? person.first_name : ''}" required>
            </div>
            <div class="form-group">
                <label for="last_name">Nom:</label>
                <input type="text" id="last_name" name="last_name" value="${isEditing && person.last_name ? person.last_name : ''}" required>
            </div>
            <div class="form-group">
                <label for="address">Adresse:</label>
                <input type="text" id="address" name="address" value="${isEditing ? person.address : ''}" required>
            </div>
            <div class="form-group">
                <label for="apartment_number">Appartement:</label>
                <input type="text" id="apartment_number" name="apartment_number" value="${isEditing && person.apartment_number ? person.apartment_number : ''}">
            </div>
            <div class="form-group">
                <label for="phone_number">Téléphone:</label>
                <input type="tel" id="phone_number" name="phone_number" value="${isEditing && person.phone_number ? person.phone_number : ''}">
            </div>
            <div class="form-group">
                <label for="vehicle_brand">Marque du véhicule:</label>
                <input type="text" id="vehicle_brand" name="vehicle_brand" value="${isEditing && person.vehicle_brand ? person.vehicle_brand : ''}">
            </div>
            <div class="form-group">
                <label for="vehicle_model">Modèle:</label>
                <input type="text" id="vehicle_model" name="vehicle_model" value="${isEditing && person.vehicle_model ? person.vehicle_model : ''}">
            </div>
            <div class="form-group">
                <label for="license_plate">Immatriculation:</label>
                <input type="text" id="license_plate" name="license_plate" value="${isEditing && person.license_plate ? person.license_plate : ''}">
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