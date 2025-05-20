import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { Person } from "../models/person.js";
import { renderPersons, renderPersonForm, renderDeleteConfirmation } from "../views/personView.js";
import { getCurrentUser } from "./authController.js";
import { validateFormData } from "../core/validator.js";


export async function getAvailableUsers() {
    try {
        const data = await fetchJSON("/app-gestion-parking/public/api/users");
        return data;
    } catch (error) {
        console.error("Error loading available users:", error);
        return [];
    }
}

export async function loadPersons() {
    try {
        await waitForElement("person-list", 10);
        
        const response = await fetch("/app-gestion-parking/public/api/persons");
        const responseText = await response.text();
        
        try {
            const data = JSON.parse(responseText);
            console.log("API Response:", data);
            
            const personsArray = Array.isArray(data) ? data : [];
            console.log("Persons array:", personsArray);
            
            const persons = personsArray.map(p => new Person(
                p.id,
                p.user_id,
                p.first_name,
                p.last_name,
                p.address,
                p.zip_code,
                p.city,
                p.apartment_number,
                p.phone_number,
                p.created_at,
                p.vehicle_brand,
                p.vehicle_model,
                p.license_plate
            ));
            
            renderPersons(persons);
            setupPersonEvents();
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.log("Raw response:", responseText);
            
            const container = document.getElementById("person-list");
            if (container) {
                container.innerHTML = `<p class="error-message">Erreur de format de données: ${parseError.message}</p>
                                      <p>Réponse du serveur: ${responseText.substring(0, 100)}...</p>`;
            }
        }
    } catch (error) {
        console.error("Error loading persons:", error);
        
        const container = document.getElementById("person-list");
        if (container) {
            container.innerHTML = `<p class="error-message">Erreur de chargement: ${error.message}</p>`;
        }
    }
}

async function waitForElement(elementId, maxAttempts = 5) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkElement = () => {
            attempts++;
            const element = document.getElementById(elementId);
            if (element) return resolve(element);
            if (attempts >= maxAttempts) return reject(new Error(`Element '${elementId}' not found`));
            setTimeout(checkElement, 100 * Math.pow(2, attempts - 1));
        };
        checkElement();
    });
}

export async function getPerson(id) {
    try {
        const data = await fetchJSON(`/app-gestion-parking/public/api/persons/${id}`);
        return new Person(
            data.id,
            data.user_id,
            data.first_name,
            data.last_name,
            data.address,
            data.zip_code, 
            data.city,
            data.apartment_number,
            data.phone_number,
            data.created_at,
            data.vehicle_brand,
            data.vehicle_model,
            data.license_plate
        );
    } catch (error) {
        console.error(`Error fetching person ${id}:`, error);
        return null;
    }
}
export async function createPerson(personData) {
    try {
        if (!personData.user_id) {
            return { error: "ID utilisateur manquant" };
        }
        
        console.log("Tentative de création de personne avec les données:", personData);
        
        const response = await fetch("/app-gestion-parking/public/api/persons/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify(personData),
        });
        
        if (response.status === 401) {
            console.error("Erreur d'authentification lors de la création de personne");
            return { error: "Vous devez être connecté pour créer un profil" };
        }
        
        const result = await response.json();
        console.log("Réponse de création de personne:", result);
        return result;
    } catch (error) {
        console.error("Erreur lors de la création de personne:", error);
        return { error: error.message };
    }
}
export async function updatePerson(id, personData) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/persons/${id}/update`, personData);
        return response;
    } catch (error) {
        console.error(`Error updating person ${id}:`, error);
        return { error: error.message };
    }
}

export async function deletePerson(id) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/persons/${id}/delete`, {});
        return response;
    } catch (error) {
        console.error(`Error deleting person ${id}:`, error);
        return { error: error.message };
    }
}

function setupPersonEvents() {
    const contentElement = document.getElementById('app-content');

    const createBtn = document.getElementById('create-person-btn');
    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            contentElement.innerHTML = await renderPersonForm();
            setupFormSubmission();
        });
    }

    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', async () => {
            const id = button.getAttribute('data-id');
            const person = await getPerson(id);
            if (person) {
                contentElement.innerHTML = await renderPersonForm(person);
                setupFormSubmission(id);
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            const modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            modalContainer.innerHTML = renderDeleteConfirmation(id);
            document.body.appendChild(modalContainer);

            document.getElementById('confirm-delete').addEventListener('click', async () => {
                const result = await deletePerson(id);
                if (result.success) {
                    document.body.removeChild(modalContainer);
                    loadPersons();
                }
            });

            document.getElementById('cancel-delete').addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
    });
}

function setupFormSubmission(id = null) {
    const isEditing = id !== null;
    const formId = isEditing ? 'edit-person-form' : 'create-person-form';
    const form = document.getElementById(formId);
    const errorElement = document.getElementById('person-form-error');

    document.getElementById('cancel-form').addEventListener('click', () => {
        loadPersons();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const personData = {};
    
        formData.forEach((value, key) => {
            personData[key] = value;
        });
        const validation = validateFormData(personData);
    
        if (!validation.isValid) {
            const errors = validation.errors;
            let errorMessage = "Veuillez corriger les erreurs suivantes:\n";
            for (const field in errors) {
                errorMessage += `- ${errors[field]}\n`;
            }
            errorElement.textContent = errorMessage;
            return;
        }
    

        const result = isEditing
            ? await updatePerson(id, personData)
            : await createPerson(personData);

        if (result.error) {
            errorElement.textContent = result.error;
        } else if (result.success) {
            window.location.href = '/app-gestion-parking/public/persons';
        }
    });
}