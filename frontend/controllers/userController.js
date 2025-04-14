import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { User } from "../models/user.js";
import { renderUsers, renderUserForm, renderDeleteConfirmation } from "../views/userView.js";
import { getCurrentUser } from "./authController.js";
import { validateFormData } from "../core/validator.js";

export async function loadUsers() {
    try {
        await waitForElement("user-list", 10);
        
        const data = await fetchJSON("/app-gestion-parking/public/api/users");
        const users = data.map(user => new User(
            user.id, 
            user.username, 
            user.email, 
            user.role, 
            user.phone,
            user.is_active
        ));
        renderUsers(users);
        
        setupUserEvents();
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

async function waitForElement(elementId, maxAttempts = 5) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkElement = () => {
            attempts++;
            const element = document.getElementById(elementId);
            
            if (element) {
                resolve(element);
            } else if (attempts >= maxAttempts) {
                reject(new Error(`Élément '${elementId}' non trouvé après ${maxAttempts} tentatives`));
            } else {
                const delay = 100 * Math.pow(2, attempts - 1);
                console.log(`Element '${elementId}' non disponible, nouvelle tentative dans ${delay}ms (${attempts}/${maxAttempts})`);
                setTimeout(checkElement, delay);
            }
        };
        
        checkElement();
    });
}

export async function getUser(userId) {
    try {
        const data = await fetchJSON(`/app-gestion-parking/public/api/users/${userId}`);
        return new User(
            data.id, 
            data.username, 
            data.email, 
            data.role, 
            data.phone,
            data.is_active
        );
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
}

export async function createUser(userData) {
    try {
        const response = await postJSON("/app-gestion-parking/public/api/users/create", userData);
        return response;
    } catch (error) {
        console.error("Error creating user:", error);
        return { error: error.message };
    }
}

export async function updateUser(userId, userData) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/users/${userId}/update`, userData);
        return response;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return { error: error.message };
    }
}

export async function deleteUser(userId) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/users/${userId}/delete`, {});
        return response;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        return { error: error.message };
    }
}

function setupUserEvents() {
    const contentElement = document.getElementById('app-content');
    
    const createBtn = document.getElementById('create-user-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            contentElement.innerHTML = renderUserForm();
            setupFormSubmission();
        });
    }

    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.getAttribute('data-id');
            const user = await getUser(userId);
            
            if (user) {
                contentElement.innerHTML = renderUserForm(user);
                setupFormSubmission(userId);
            }
        });
    });
    
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            const modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            modalContainer.innerHTML = renderDeleteConfirmation(userId);
            document.body.appendChild(modalContainer);
            
            document.getElementById('confirm-delete').addEventListener('click', async () => {
                const result = await deleteUser(userId);
                if (result.success) {
                    document.body.removeChild(modalContainer);
                    loadUsers();
                }
            });
            
            document.getElementById('cancel-delete').addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
    });
}

function setupFormSubmission(userId = null) {
    const isEditing = userId !== null;
    const formId = isEditing ? 'edit-user-form' : 'create-user-form';
    const form = document.getElementById(formId);
    const errorElement = document.getElementById('form-error');
    
    document.getElementById('cancel-form').addEventListener('click', () => {
        loadUsers();
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = {};
        
        formData.forEach((value, key) => {
            if (key !== 'password' || value !== '') {
                userData[key] = value;
            }
        });

        const validation = validateFormData(userData);
        
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
            result = await updateUser(userId, userData);
        } else {
            result = await createUser(userData);
        }
        
        if (result.error) {
            errorElement.textContent = result.error;
        } else if (result.success) {
            window.location.href = '/app-gestion-parking/public/users';
        }
    });
}