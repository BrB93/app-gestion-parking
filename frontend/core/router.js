export class Router {
    constructor(routes) {
      this.routes = routes;
      this.fullPageRoutes = ['/app-gestion-parking/public/login'];
      this.contentElement = document.getElementById('app-content');
      
      window.addEventListener('popstate', () => this.handleRouteChange());
      
      document.addEventListener('click', (e) => {
        let target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        
        if (target && target.getAttribute('data-route') !== null) {
          const route = target.getAttribute('data-route');
          
          if (this.fullPageRoutes.includes(route)) {
            return;
          }
          
          e.preventDefault();
          this.navigateTo(route);
        }
      });
    }
    
    init() {
      this.handleRouteChange();
    }
    
    handleRouteChange() {
      const path = window.location.pathname;
      let matchedRoute = this.routes.find(route => route.path === path);

        if (path === '/app-gestion-parking/public/' || path === '/app-gestion-parking/public/index.php') {
      return;
      } 
      
      if (!matchedRoute) {
        matchedRoute = this.routes.find(route => route.path === '/app-gestion-parking/public/');
      }
      
      if (matchedRoute && matchedRoute.controller) {
        matchedRoute.controller();
      }
    }
    
    navigateTo(route) {
      window.history.pushState({}, '', route);
      this.handleRouteChange();
    }
  }

  function handleRouteChange() {
    const currentPath = window.location.pathname + window.location.search;
    const route = routes.find(r => currentPath.match(new RegExp(r.path)));
    
    if (route) {
      const contentElement = document.getElementById('app-content');
      if (contentElement) {
        contentElement.innerHTML = '<div class="loading">Chargement de la page...</div>';
      }
      
      setTimeout(() => {
        route.controller();
      }, 10);
    } else {
      console.warn(`Aucune route trouvée pour ${currentPath}`);
    }
  }