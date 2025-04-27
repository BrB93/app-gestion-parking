export class Reservation {
    constructor(id, user_id, spot_id, start_time, end_time, status = 'en_attente', created_at = null) {
      this.id = id;
      this.user_id = user_id;
      this.spot_id = spot_id;
      this.start_time = new Date(start_time);
      this.end_time = new Date(end_time);
      this.status = status;
      this.created_at = created_at ? new Date(created_at) : new Date();
    }
  
    isPending() {
      return this.status === 'en_attente';
    }
  
    isConfirmed() {
      return this.status === 'confirmee';
    }
  
    isCancelled() {
      return this.status === 'annulee';
    }
  
    isFinished() {
      return this.status === 'terminee';
    }
  
    getStatusLabel() {
      switch (this.status) {
        case 'en_attente': return 'En attente';
        case 'confirmee': return 'Confirmée';
        case 'annulee': return 'Annulée';
        case 'terminee': return 'Terminée';
        default: return this.status;
      }
    }
  
    getStatusClass() {
      switch (this.status) {
        case 'en_attente': return 'status-pending';
        case 'confirmee': return 'status-confirmed';
        case 'annulee': return 'status-cancelled';
        case 'terminee': return 'status-finished';
        default: return '';
      }
    }
  
    getFormattedDateRange() {
      return `${this.start_time.toLocaleString()} - ${this.end_time.toLocaleString()}`;
    }
  }
  