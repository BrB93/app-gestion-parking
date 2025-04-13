import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { User } from "../models/user.js";
import { renderLoginForm, renderLogoutButton } from "../views/authView.js";

export async function login(username, password) {
  try {
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
  if (!loginForm) return;
  
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorElement = document.getElementById("login-error");
    
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
