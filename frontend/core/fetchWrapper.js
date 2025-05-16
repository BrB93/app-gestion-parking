export async function fetchJSON(url) {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin'
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      console.log("Session expirée ou utilisateur non connecté");
      localStorage.setItem("redirect_after_login", window.location.pathname);
      window.location.href = "/app-gestion-parking/public/login";
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      console.log("Session expirée ou utilisateur non connecté");
      localStorage.setItem("redirect_after_login", window.location.pathname);
      window.location.href = "/app-gestion-parking/public/login";
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}