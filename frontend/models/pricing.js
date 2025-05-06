export class Pricing {
    constructor(id, typePlace, dayOfWeek, startHour, endHour, pricePerHour) {
      this.id = id;
      this.type_place = typePlace;
      this.day_of_week = dayOfWeek;
      this.start_hour = startHour;
      this.end_hour = endHour;
      this.price_per_hour = pricePerHour;
    }
    
    getName() {
      return this.getTypeLabel() + ' - ' + this.getDayLabel();
    }
    
    getTypeLabel() {
      switch (this.type_place) {
        case 'normale': return 'Standard';
        case 'handicapee': return 'Place PMR';
        case 'reservee': return 'Réservée';
        case 'electrique': return 'Borne électrique';
        default: return this.type_place;
      }
    }
    
    getDayLabel() {
      switch (this.day_of_week) {
        case 'lundi': return 'Lundi';
        case 'mardi': return 'Mardi';
        case 'mercredi': return 'Mercredi';
        case 'jeudi': return 'Jeudi';
        case 'vendredi': return 'Vendredi';
        case 'samedi': return 'Samedi';
        case 'dimanche': return 'Dimanche';
        default: return this.day_of_week;
      }
    }
    
    getFormattedPrice() {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(this.price_per_hour);
    }
    
    getFormattedTimeRange() {
      return this.formatTime(this.start_hour) + ' - ' + this.formatTime(this.end_hour);
    }
    
    formatTime(timeString) {
      const date = new Date(`2000-01-01T${timeString}`);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  }