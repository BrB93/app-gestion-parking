import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { User } from "../models/user.js";
import { renderLoginForm, renderLogoutButton } from "../views/authView.js";
import { validateFormData, isSafeString } from "../core/validator.js";

export async function login(username, password) {
  try {
    if (!isSafeString(username)) {
      return {
        success: false,
        message: "Le nom d'utilisateur contient des caractères non autorisés"
      };
    }

    const response = await fetch("/app-gestion-parking/public/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log("Connexion réussie, stockage des informations utilisateur");
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      const redirectUrl = localStorage.getItem("redirect_after_login") || "/app-gestion-parking/public/";
      localStorage.removeItem("redirect_after_login");
      window.location.href = redirectUrl;
      return { success: true };
    }

    if (response.status === 403 && data.inactive) {
      return {
        success: false,
        inactive: true,
        message: data.message
      };
    }

    return {
      success: false,
      message: data.error || "Erreur de connexion"
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la connexion"
    };
  }
}

export async function register(userData) {
  try {
    if (!isSafeString(userData.username)) {
      return {
        success: false,
        message: "Le nom d'utilisateur contient des caractères non autorisés"
      };
    }

    const response = await fetch("/app-gestion-parking/public/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("newUserId", data.user_id);
      return {
        success: true,
        message: data.message,
        user_id: data.user_id
      };
    }

    return {
      success: false,
      message: data.error || "Erreur lors de l'inscription"
    };
  } catch (error) {
    console.error("Register error:", error);
    return {
      success: false,
      message: "Une erreur est survenue lors de l'inscription"
    };
  }
}

export async function logout() {
  try {
    await fetchJSON("/app-gestion-parking/public/api/logout");
    localStorage.removeItem("currentUser");
    window.location.href = "/app-gestion-parking/public/login";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export function getCurrentUser() {
  const userData = localStorage.getItem("currentUser");
  if (!userData) return null;

  const user = JSON.parse(userData);
  return new User(user.id, user.username, user.email, user.role);
}

export function checkAuthStatus() {
  const user = getCurrentUser();
  if (user) {
    renderLogoutButton(user);
  }
}

export function initLoginForm() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  const loginFormContainer = document.getElementById("login-form-container");
  const registerFormContainer = document.getElementById("register-form-container");

  if (loginTab && registerTab) {
    loginTab.addEventListener("click", () => {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      loginFormContainer.style.display = "block";
      registerFormContainer.style.display = "none";
    });

    registerTab.addEventListener("click", () => {
      registerTab.classList.add("active");
      loginTab.classList.remove("active");
      registerFormContainer.style.display = "block";
      loginFormContainer.style.display = "none";
    });
  }

  const roleSelect = document.getElementById("reg-role");
  const adminKeyContainer = document.querySelector(".admin-key-container");

  if (roleSelect && adminKeyContainer) {
    roleSelect.addEventListener("change", () => {
      adminKeyContainer.style.display = roleSelect.value === "admin" ? "block" : "none";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const errorElement = document.getElementById("login-error");

      const loginData = { username, password };
      const validation = validateFormData(loginData);

      if (!validation.isValid) {
        const errors = validation.errors;
        let errorMessage = "Veuillez corriger les erreurs suivantes:\n";
        for (const field in errors) {
          errorMessage += `- ${errors[field]}\n`;
        }
        errorElement.textContent = errorMessage;
        return;
      }

      const result = await login(username, password);

      if (!result.success) {
        errorElement.textContent = result.message;

        if (result.inactive) {
          const supportEmail = result.message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
          if (supportEmail && supportEmail[0]) {
            const emailLink = document.createElement('a');
            emailLink.href = `mailto:${supportEmail[0]}`;
            emailLink.textContent = supportEmail[0];
            emailLink.style.color = '#3498db';
            errorElement.innerHTML = result.message.replace(supportEmail[0], emailLink.outerHTML);
          }
        }
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("reg-username").value;
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;
      const confirmPassword = document.getElementById("reg-confirm-password").value;
      const phone = document.getElementById("reg-phone").value;
      const role = document.getElementById("reg-role").value;
      const adminKey = document.getElementById("reg-admin-key")?.value || "";

      const errorElement = document.getElementById("register-error");
      const successElement = document.getElementById("register-success");

      if (password !== confirmPassword) {
        errorElement.textContent = "Les mots de passe ne correspondent pas";
        errorElement.style.display = "block";
        successElement.style.display = "none";
        return;
      }

      const result = await register({
        username,
        email,
        password,
        role,
        phone,
        admin_key: adminKey
      });

      if (result.success) {
        errorElement.style.display = "none";
        successElement.textContent = result.message || "Inscription réussie!";
        successElement.style.display = "block";

        if (registerFormContainer) {
          registerFormContainer.innerHTML = await renderPersonCreationForm(result.user_id);
          setupPersonFormSubmission(null, result.user_id);
        }
      } else {
        errorElement.textContent = result.message;
        errorElement.style.display = "block";
        successElement.style.display = "none";
      }
    });
  }
}

async function renderPersonCreationForm(userId) {
  const { renderPersonForm } = await import('../views/personView.js');

  return `
    <h2>Informations personnelles</h2>
    <p class="success-message">Votre compte a été créé avec succès! Veuillez maintenant compléter vos informations personnelles.</p>
    <div id="person-form-container">
      ${await renderPersonForm(null)}
      <input type="hidden" name="user_id" value="${userId}">
    </div>
  `;
}

function setupPersonFormSubmission(personId = null, userId = null) {
  import('../controllers/personController.js').then(module => {
    const form = document.getElementById(personId ? 'edit-person-form' : 'create-person-form');
    if (!form) return;

    const errorElement = document.getElementById('person-form-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const personData = {};

      formData.forEach((value, key) => {
        personData[key] = value;
      });

      if (userId) {
        personData.user_id = userId;
      }

      try {
        if (!personData.user_id) {
          if (errorElement) {
            errorElement.textContent = "ID utilisateur manquant";
            errorElement.style.display = 'block';
          }
          return;
        }

        const { validateFormData } = await import('../core/validator.js');
        const validation = validateFormData(personData);

        if (!validation.isValid) {
          const errorMessages = Object.values(validation.errors).join('<br>');
          if (errorElement) {
            errorElement.innerHTML = errorMessages;
            errorElement.style.display = 'block';
          }
          return;
        }

        const result = await module.createPerson(personData);

        if (result.error) {
          if (errorElement) {
            errorElement.textContent = result.error;
            errorElement.style.display = 'block';
          }
        } else {
          if (errorElement) {
            errorElement.style.display = 'none';
          }

          document.getElementById('person-form-container').innerHTML = `
            <div class="success-message">
              <p>Vos informations personnelles ont été enregistrées avec succès!</p>
              <p>Vous pouvez maintenant vous <a href="/app-gestion-parking/public/login">connecter</a> à votre compte.</p>
            </div>
          `;
        }
      } catch (error) {
        console.error("Erreur lors de la création de la personne:", error);
        if (errorElement) {
          errorElement.textContent = "Une erreur est survenue lors de la création du profil";
          errorElement.style.display = 'block';
        }
      }
    });

    const cancelButton = document.querySelector('#cancel-form');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        window.location.href = "/app-gestion-parking/public/login";
      });
    }
  });
}

export function checkProtectedRoute() {
  const user = getCurrentUser();

  if (!user) {
    console.log("Utilisateur non connecté, redirection vers la page de login...");
    localStorage.setItem("redirect_after_login", window.location.pathname);
    window.location.href = "/app-gestion-parking/public/login";
    return false;
  }

  return true;
}
