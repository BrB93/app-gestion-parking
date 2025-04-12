export class Router {
    constructor(routes) {
      this.routes = routes;
      this.contentElement = document.getElementById('app-content');
      
      window.addEventListener('popstate', () => this.handleRouteChange());
      
      document.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.getAttribute('data-route') !== null) {
          e.preventDefault();
          const route = e.target.getAttribute('data-route');
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