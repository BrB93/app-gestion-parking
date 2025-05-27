import { fetchJSON } from '../core/fetchWrapper.js';
import { Pricing } from '../models/pricing.js';
import { renderPricing } from '../views/pricingView.js';


export async function loadPricings() {
  try {
    const data = await fetchJSON('/app-gestion-parking/public/api/pricings');
    const pricings = data.map(p => new Pricing(
      p.id,
      p.type_place,
      p.day_of_week,
      p.start_hour,
      p.end_hour,
      p.price_per_hour
    ));
    
    renderPricing(pricings);
  } catch (error) {
    console.error('Erreur lors du chargement des tarifs:', error);
    
    const container = document.getElementById('pricing-list');
    if (container) {
      container.innerHTML = `<p class="error-message">Erreur de chargement: ${error.message}</p>`;
    }
  }
}

export async function calculatePrice(spotId, startTime, endTime) {
  try {
    const response = await fetch('/app-gestion-parking/public/api/pricings/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spot_id: spotId,
        start_time: startTime,
        end_time: endTime
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du calcul du prix:', error);
    return { error: error.message };
  }
}

export async function getPricingsByType(type) {
  try {
    const data = await fetchJSON(`/app-gestion-parking/public/api/pricings/by-type/${type}`);
    return data.map(p => new Pricing(
      p.id,
      p.type_place,
      p.day_of_week,
      p.start_hour,
      p.end_hour,
      p.price_per_hour
    ));
  } catch (error) {
    console.error(`Erreur lors du chargement des tarifs pour le type ${type}:`, error);
    return [];
  }
}