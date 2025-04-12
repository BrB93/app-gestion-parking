import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { User } from "../models/user.js";
import { renderLoginForm, renderLogoutButton } from "../views/authView.js";

export async function login(username, password) {
  try {
    const data = await postJSON("/app-gestion-parking/public/api/login", { username, password });
    
    if (data.success) {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      window.location.href = "/app-gestion-parking/public/";
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Login error:", error);
    return false;
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
  return new User(user.id, user.name, user.email, user.role);
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
    
    const success = await login(username, password);
    
    if (!success) {
      errorElement.textContent = "Nom d'utilisateur ou mot de passe incorrect";
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
