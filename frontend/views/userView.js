import { getCurrentUser } from '../controllers/authController.js';

export function renderUsers(users) {
    const container = document.getElementById("user-list") || document.querySelector("[id='user-list']");
    
    if (!container) {
        console.error("Élément 'user-list' introuvable. Création d'un conteneur de secours.");
        const backupContainer = document.createElement("div");
        backupContainer.id = "user-list";
        
        const appContent = document.getElementById("app-content");
        if (appContent) {
            appContent.appendChild(backupContainer);
            renderUsersInContainer(backupContainer, users);
        } else {
            document.body.appendChild(backupContainer);
            renderUsersInContainer(backupContainer, users);
            console.warn("Conteneur app-content non trouvé, ajout direct à body");
        }
        return;
    }
    
    renderUsersInContainer(container, users);
}

function renderUsersInContainer(container, users) {
    container.innerHTML = "";
    
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    if (isAdmin) {
        const createBtn = document.createElement("button");
        createBtn.className = "btn-primary";
        createBtn.id = "create-user-btn";
        createBtn.textContent = "Créer un nouvel utilisateur";
        container.appendChild(createBtn);
    }
    
    users.forEach(user => {
        const div = document.createElement("div");
        div.className = "user-card";
        if (user.is_active === false) {
            div.classList.add("user-inactive");
        }
        
        div.innerHTML = `
            <h3>${user.username}</h3>
            <p>Email: ${user.email}</p>
            <p>Role: ${user.role}</p>
            ${user.phone ? `<p>Téléphone: ${user.phone}</p>` : ''}
            <p>Statut: ${user.is_active ? '<span class="status-active">Actif</span>' : '<span class="status-inactive">Inactif</span>'}</p>
            <div class="user-actions">
                ${isAdmin || currentUser.id === user.id ? 
                    `<button class="btn-edit" data-id="${user.id}">Modifier</button>` : ''}
                ${isAdmin ? 
                    `<button class="btn-delete" data-id="${user.id}">Supprimer</button>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

export function renderUserForm(user = null) {
    const isEditing = user !== null;
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const canEditPhone = isEditing && (isAdmin || (currentUser && currentUser.id === user.id && 
                          (currentUser.role === 'user' || currentUser.role === 'owner')));
    
    return `
    <div class="form-container">
        <h2>${isEditing ? 'Modifier' : 'Créer'} un utilisateur</h2>
        <form id="${isEditing ? 'edit-user-form' : 'create-user-form'}" data-id="${isEditing ? user.id : ''}">
            <div class="form-group">
                <label for="name">Nom d'utilisateur:</label>
                <input type="text" id="username" name="username" value="${isEditing ? user.username : ''}" required>
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="${isEditing ? user.email : ''}" required>
            </div>
            <div class="form-group">
                <label for="password">Mot de passe ${isEditing ? '(laisser vide pour ne pas changer)' : ''}:</label>
                <input type="password" id="password" name="password" ${!isEditing ? 'required' : ''}>
            </div>
            ${canEditPhone || !isEditing ? `
            <div class="form-group">
                <label for="phone">Téléphone:</label>
                <input type="tel" id="phone" name="phone" value="${isEditing && user.phone ? user.phone : ''}" placeholder="Ex: 0612345678">
            </div>
            ` : ''}
            ${isAdmin ? `
            <div class="form-group">
                <label for="role">Rôle:</label>
                <select id="role" name="role" required>
                    <option value="user" ${isEditing && user.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                    <option value="admin" ${isEditing && user.role === 'admin' ? 'selected' : ''}>Administrateur</option>
                    <option value="owner" ${isEditing && user.role === 'owner' ? 'selected' : ''}>Propriétaire</option>
                </select>
            </div>
            <div class="form-group">
                <label for="is_active">Statut:</label>
                <select id="is_active" name="is_active" required>
                    <option value="1" ${isEditing && user.is_active ? 'selected' : ''}>Actif</option>
                    <option value="0" ${isEditing && !user.is_active ? 'selected' : ''}>Inactif</option>
                </select>
            </div>
            ` : ''}
            <div class="form-group">
                <button type="submit" class="btn-primary">${isEditing ? 'Mettre à jour' : 'Créer'}</button>
                <button type="button" id="cancel-form" class="btn-secondary">Annuler</button>
            </div>
            <div id="form-error" class="error-message"></div>
        </form>
    </div>
    `;
}

export function renderDeleteConfirmation(userId) {
    return `
    <div class="modal">
        <div class="modal-content">
            <h2>Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible.</p>
            <div class="modal-actions">
                <button id="confirm-delete" data-id="${userId}" class="btn-danger">Supprimer</button>
                <button id="cancel-delete" class="btn-secondary">Annuler</button>
            </div>
        </div>
    </div>
    `;
}