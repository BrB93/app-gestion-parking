export function renderPricing(pricings) {
    const container = document.getElementById('pricing-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const pricingsByType = {};
    pricings.forEach(pricing => {
      if (!pricingsByType[pricing.type_place]) {
        pricingsByType[pricing.type_place] = [];
      }
      pricingsByType[pricing.type_place].push(pricing);
    });
    
    for (const type in pricingsByType) {
      const typeHeader = document.createElement('h2');
      typeHeader.textContent = getTypeLabel(type);
      typeHeader.className = 'pricing-type-header';
      container.appendChild(typeHeader);
      
      const table = document.createElement('table');
      table.className = 'pricing-table';
      
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Jour</th>
          <th>Horaires</th>
          <th>Prix par heure</th>
        </tr>
      `;
      table.appendChild(thead);
      
      const tbody = document.createElement('tbody');
      pricingsByType[type].forEach(pricing => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${pricing.getDayLabel()}</td>
          <td>${pricing.getFormattedTimeRange()}</td>
          <td>${pricing.getFormattedPrice()}</td>
        `;
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      container.appendChild(table);
    }
  }
  
  function getTypeLabel(type) {
    switch (type) {
      case 'normale': return 'Places standards';
      case 'handicapee': return 'Places PMR';
      case 'reservee': return 'Places réservées';
      case 'electrique': return 'Places avec borne électrique';
      default: return type;
    }
  }