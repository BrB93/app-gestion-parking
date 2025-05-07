export class ParkingSpot {
    constructor(id, spot_number, type, status = 'libre', owner_id = null, pricing_id = null) {
      this.id = id;
      this.spot_number = spot_number;
      this.type = type;
      this.status = status;
      this.owner_id = owner_id;
      this.pricing_id = pricing_id;
    }
  
    isAvailable() {
      return this.status === 'libre';
    }
  
    isReserved() {
      return this.status === 'reservee';
    }
  
    isOccupied() {
      return this.status === 'occupee';
    }
    
    getStatusClass() {
      switch (this.status) {
        case 'libre': return 'status-available';
        case 'reservee': return 'status-reserved';
        case 'occupee': return 'status-occupied';
        default: return '';
      }
    }
    
    getTypeLabel() {
      switch (this.type) {
        case 'normale': return 'Standard';
        case 'handicapee': return 'PMR';
        case 'reservee': return 'Réservée';
        case 'electrique': return 'Électrique';
        default: return this.type;
      }
    }

    getStatusLabel() {
      switch (this.status) {
        case 'libre': return 'Disponible';
        case 'reservee': return 'Réservée';
        case 'occupee': return 'Occupée';
        default: return this.status;
      }
    }
  }