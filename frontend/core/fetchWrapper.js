export async function fetchJSON(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log("Session expirée ou utilisateur non connecté");
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          localStorage.setItem("redirect_after_login", currentPath);
          window.location.href = "/app-gestion-parking/public/login?session_expired=true";
        }
        throw new Error('Session expirée');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Erreur fetchJSON:", error);
    throw error;
  }
}

export async function postJSON(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', 
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log("Session expirée ou utilisateur non connecté");
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          localStorage.setItem("redirect_after_login", currentPath);
          window.location.href = "/app-gestion-parking/public/login?session_expired=true";
        }
        throw new Error('Session expirée');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Erreur postJSON:", error);
    throw error;
  }
}