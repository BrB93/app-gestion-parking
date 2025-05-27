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
      return {
        success: true,
        redirect_to: data.redirect_to
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

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('session_expired')) {
    const errorElement = document.getElementById('login-error');
    if (errorElement) {
      errorElement.textContent = "Votre session a expiré. Veuillez vous reconnecter.";
      errorElement.style.display = "block";
    }
  }

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
  const ownerVerificationSection = document.getElementById("owner-verification-section");
  const verifyCodeBtn = document.getElementById("verify-code-btn");
  const verificationResult = document.getElementById("verification-result");
  const verificationCode = document.getElementById("verification-code");
  const registerSubmitBtn = document.getElementById("register-submit-btn");

  let codeVerified = false;
  let spotNumber = null;

  if (roleSelect) {
    roleSelect.addEventListener("change", () => {
      if (roleSelect.value === "owner") {
        ownerVerificationSection.style.display = "block";
        if (!codeVerified) {
          registerSubmitBtn.disabled = true;
        }
      } else {
        ownerVerificationSection.style.display = "none";
        registerSubmitBtn.disabled = false;
      }
    });
  }

  if (verifyCodeBtn) {
    verifyCodeBtn.addEventListener("click", async () => {
      const code = verificationCode.value.trim();
      
      if (code.length !== 8) {
        verificationResult.innerHTML = `<p class="error-message">Le code doit contenir 8 caractères.</p>`;
        return;
      }

      verifyCodeBtn.disabled = true;
      verifyCodeBtn.textContent = "Vérification en cours...";
      
      verificationResult.innerHTML = `
        <div class="verification-animation">
          <div class="verification-steps">
            <div class="verification-step active" id="step-1">
              <div class="step-icon">1</div>
              <div class="step-text">Validation du format du code</div>
            </div>
            <div class="verification-step" id="step-2">
              <div class="step-icon">2</div>
              <div class="step-text">Vérification dans la base du syndic</div>
            </div>
            <div class="verification-step" id="step-3">
              <div class="step-icon">3</div>
              <div class="step-text">Association avec votre place</div>
            </div>
          </div>
        </div>
      `;

      await simulateVerificationStep("step-1", true);
      
      const result = await simulateCodeVerification(code);
      
      await simulateVerificationStep("step-2", result.valid);
      
      if (result.valid) {
        spotNumber = result.spotNumber;
        await simulateVerificationStep("step-3", true);
        
        const spotInfoDiv = document.createElement("div");
        spotInfoDiv.className = "spot-info";
        spotInfoDiv.innerHTML = `
          <h4>Place de parking validée</h4>
          <p>Votre code correspond à la place numéro <strong>${spotNumber}</strong>.</p>
          <p>Vous pouvez maintenant terminer votre inscription.</p>
        `;
        verificationResult.appendChild(spotInfoDiv);
        spotInfoDiv.style.display = "block";
        
        registerSubmitBtn.disabled = false;
        codeVerified = true;
      } else {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = "Le code saisi n'est pas valide ou a déjà été utilisé.";
        verificationResult.appendChild(errorDiv);
      }
      
      verifyCodeBtn.disabled = false;
      verifyCodeBtn.textContent = "Vérifier le code";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const errorElement = document.getElementById("login-error");
      
      errorElement.style.display = "none";
      
      const result = await login(username, password);
      
      if (!result.success) {
        errorElement.textContent = result.message;
        errorElement.style.display = "block";
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
      const role = document.getElementById("reg-role").value;
      const phone = document.getElementById("reg-phone").value;
      const errorElement = document.getElementById("register-error");
      const successElement = document.getElementById("register-success");
      
      errorElement.style.display = "none";
      successElement.style.display = "none";
      
      if (password !== confirmPassword) {
        errorElement.textContent = "Les mots de passe ne correspondent pas.";
        errorElement.style.display = "block";
        return;
      }
      
      if (role === "owner" && !codeVerified) {
        errorElement.textContent = "Veuillez vérifier votre code propriétaire avant de vous inscrire.";
        errorElement.style.display = "block";
        return;
      }
      
      const userData = {
        username,
        email,
        password,
        role,
        phone: phone || null,
        verification_code: role === "owner" ? verificationCode.value : null,
        spot_number: spotNumber
      };
      
      const result = await register(userData);
      
      if (result.success) {
        successElement.textContent = "Votre compte a été créé avec succès!";
        successElement.style.display = "block";
        registerForm.reset();
        
        setTimeout(() => {
          window.location.href = result.redirect_to || "/app-gestion-parking/public/";
        }, 1500);
      } else {
        errorElement.textContent = result.message;
        errorElement.style.display = "block";
      }
    });
  }
}

async function simulateCodeVerification(code) {
  await new Promise(r => setTimeout(r, 1500));
  
  const valid = code.startsWith("A") || code === "TEST1234";
  
  const spotNumber = Math.floor(Math.random() * 204) + 1;
  
  return {
    valid,
    spotNumber: valid ? spotNumber : null
  };
}

async function simulateVerificationStep(stepId, success) {
  const step = document.getElementById(stepId);
  
  step.classList.add("active");
  
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
  
  step.classList.remove("active");
  step.classList.add(success ? "completed" : "error");
  
  if (success) {
    const nextStep = document.getElementById(`step-${parseInt(stepId.split('-')[1]) + 1}`);
    if (nextStep) {
      nextStep.classList.add("active");
    }
  }
  
  return success;
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
    if (!window.location.pathname.includes('/login')) {
      localStorage.setItem("redirect_after_login", window.location.pathname);
      window.location.href = "/app-gestion-parking/public/login";
    }
    return false;
  }

  return true;
}
