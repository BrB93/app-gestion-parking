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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      window.location.href = "/app-gestion-parking/public/";
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return { 
        success: true, 
        message: data.message 
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
      if (roleSelect.value === "admin") {
        adminKeyContainer.style.display = "block";
      } else {
        adminKeyContainer.style.display = "none";
      }
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
      const adminKey = document.getElementById("reg-admin-key").value;
      
      const errorElement = document.getElementById("register-error");
      const successElement = document.getElementById("register-success");
      
      errorElement.textContent = "";
      successElement.style.display = "none";
      
      if (password !== confirmPassword) {
        errorElement.textContent = "Les mots de passe ne correspondent pas";
        return;
      }
      
      const userData = { 
        username, 
        email, 
        password, 
        phone, 
        role 
      };
      
      if (role === "admin") {
        userData.admin_key = adminKey;
      }
      
      const result = await register(userData);
      
      if (result.success) {
        successElement.textContent = result.message;
        successElement.style.display = "block";
        registerForm.reset();
        
        setTimeout(() => {
          loginTab.click();
        }, 2000);
      } else {
        errorElement.textContent = result.message;
      }
    });
  }
}

export function checkProtectedRoute() {
  const user = getCurrentUser();
  const currentPath = window.location.pathname;
  
  const protectedRoutes = [
    { path: "/app-gestion-parking/public/users", role: "admin" }
  ];
  
  const requiredRoute = protectedRoutes.find(route => currentPath === route.path);
  
  if (requiredRoute) {
    if (!user) {
      window.location.href = "/app-gestion-parking/public/login";
      return false;
    }
    
    if (user.role !== "admin" && user.role !== requiredRoute.role) {
      window.location.href = "/app-gestion-parking/public/";
      return false;
    }
  }
  
  return true;
}
