export class Payment {
    constructor(id, reservation_id, amount, method, status = 'en_attente', timestamp = null, user_id = null, spot_id = null, is_owner_spot = false) {
      this.id = id;
      this.reservation_id = reservation_id;
      this.amount = amount;
      this.method = method;
      this.status = status;
      this.timestamp = timestamp ? new Date(timestamp) : new Date();
      this.user_id = user_id;
      this.spot_id = spot_id;
      this.is_owner_spot = is_owner_spot;
    }
  
    isPending() {
      return this.status === 'en_attente';
    }
  
    isCompleted() {
      return this.status === 'effectue';
    }
  
    isFailed() {
      return this.status === 'echoue';
    }
    
  getStatusLabel() {
    switch (this.status) {
      case 'en_attente': return 'En attente';
      case 'effectue': return 'Effectué';
      case 'echoue': 
        return this.isFailed() ? 'Remboursé' : 'Échoué';
      default: return this.status;
    }
  }
  
    getMethodLabel() {
      switch (this.method) {
        case 'cb': return 'Carte bancaire';
        case 'paypal': return 'PayPal';
        default: return this.method;
      }
    }
  
    getStatusClass() {
      switch (this.status) {
        case 'en_attente': return 'status-pending';
        case 'effectue': return 'status-completed';
        case 'echoue': return 'status-failed';
        default: return '';
      }
    }
  
    getFormattedAmount() {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(this.amount);
    }
  
    getFormattedDate() {
      return this.timestamp.toLocaleString('fr-FR');
    }
  }