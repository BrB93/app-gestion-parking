import { getCurrentUser } from '../controllers/authController.js';


export function renderParkingSpots(spots) {
  const container = document.getElementById("parking-spot-list");
  if (!container) return;
  
  if (!document.getElementById('enhanced-parking-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'enhanced-parking-style';
    styleElement.textContent = `
      .parking-map-enhanced {
        position: relative;
        width: 100%;
        background: #2c3e50;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        margin-bottom: 30px;
        overflow: hidden;
      }
      
      .asphalt-layer {
        background: #34495e;
        position: relative;
        border-radius: 6px;
        padding: 15px;
        box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.4);
      }
      
      .drive-lanes {
        position: relative;
      }
      
      .main-lane {
        background: #576574;
        height: 40px;
        width: 100%;
        position: relative;
        margin: 30px 0;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      
      .main-lane::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background: repeating-linear-gradient(to right, #f5f6fa 0px, #f5f6fa 20px, transparent 20px, transparent 40px);
        transform: translateY(-50%);
      }
      
      .vertical-lane {
        background: #576574;
        width: 30px;
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: 3px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      }
      
      .vertical-lane.left-lane {
        left: 120px;
      }
      
      .vertical-lane.right-lane {
        right: 120px;
      }
      
      .vertical-lane::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        background: repeating-linear-gradient(to bottom, #f5f6fa 0px, #f5f6fa 20px, transparent 20px, transparent 40px);
        transform: translateX(-50%);
      }
      
      .entrance-area, .exit-area {
        position: absolute;
        width: 120px;
        height: 40px;
        background: #273c75;
        color: #f5f6fa;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        border-radius: 5px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
        z-index: 10;
      }
      
      .entrance-area {
        top: 30px;
        left: 20px;
      }
      
      .entrance-area::before {
        content: '⬇';
        margin-right: 5px;
        font-size: 1.2em;
      }
      
      .exit-area {
        bottom: 30px;
        left: 20px;
      }
      
      .exit-area::before {
        content: '⬆';
        margin-right: 5px;
        font-size: 1.2em;
      }
      
      .parking-section {
        margin: 15px 0;
        position: relative;
      }
      
      .section-label {
        position: absolute;
        top: 0;
        left: -15px;
        background: #0097e6;
        color: white;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        transform: translateY(-50%);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
        z-index: 10;
      }
      
      .spot-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        margin: 8px 0;
      }
      
      .parking-spot-enhanced {
        width: 50px;
        height: 30px;
        margin: 2px;
        position: relative;
        border-radius: 4px;
        transition: all 0.2s ease;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transform: perspective(300px) rotateX(30deg);
      }
      
      .parking-spot-enhanced:hover {
        transform: perspective(300px) rotateX(30deg) translateY(-3px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 5;
      }
      
      .parking-spot-enhanced.status-available {
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      }
      
      .parking-spot-enhanced.status-reserved {
        background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      }
      
      .parking-spot-enhanced.status-occupied {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      }
      
      .parking-spot-enhanced.status-unavailable {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
      }
      
      .spot-markings {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 3;
      }
      
      .spot-markings::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(45deg, 
          rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 5px, 
          transparent 5px, transparent 10px);
        z-index: -1;
      }
      
      .spot-number {
        font-size: 11px;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        z-index: 4;
      }
      
      .handicap-symbol, .electric-symbol {
        font-size: 14px;
        position: absolute;
        bottom: 1px;
        right: 1px;
        line-height: 1;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
      }
      
      .car-icon {
        width: 40px;
        height: 20px;
        background-color: #34495e;
        position: absolute;
        border-radius: 6px;
        transform: translateY(-2px);
        box-shadow: 0 3px 3px rgba(0, 0, 0, 0.2);
        z-index: 3;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .car-icon::before {
        content: '';
        position: absolute;
        width: 32px;
        height: 14px;
        background-color: #2c3e50;
        border-radius: 5px;
        top: 3px;
      }
      
      .car-icon::after {
        content: '';
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.5);
        top: 4px;
        right: 8px;
      }
      
      .parking-legend {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 10px;
        margin-top: 20px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      }
      
      .legend-title {
        font-weight: bold;
        color: #ecf0f1;
        margin-bottom: 8px;
        text-align: center;
      }
      
      .legend-items {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 15px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        margin: 5px 0;
      }
      
      .legend-color {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        margin-right: 8px;
      }
      
      .legend-color.status-available {
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      }
      
      .legend-color.status-reserved {
        background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      }
      
      .legend-color.status-occupied {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      }
      
      .legend-color.status-unavailable {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
      }
      
      .legend-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        color: white;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      
      .legend-label {
        font-size: 12px;
        color: #ecf0f1;
      }
      
      .parking-stats {
        margin-top: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 10px;
        text-align: center;
        color: #ecf0f1;
        font-weight: bold;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      }
      
      .view-toggle {
        margin-bottom: 15px;
      }
      
      /* Animation pour les spots occupés */
      @keyframes carPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .car-icon {
        animation: carPulse 2s infinite;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  const viewToggle = document.createElement("div");
  viewToggle.className = "view-toggle";
  viewToggle.innerHTML = `
    <div class="toggle-buttons">
      <button class="btn-primary" id="view-2d">Vue standard</button>
      <button class="btn-secondary active" id="view-2d-dynamic">Vue dynamique</button>
    </div>
  `;
  
  const existingFilter = container.querySelector('.filter-section');
  
  container.innerHTML = "";
  container.appendChild(viewToggle);
  if (existingFilter) container.appendChild(existingFilter);
    
  const parkingMap = document.createElement("div");
  parkingMap.className = "parking-map-enhanced";
  
  const spotsMap = {};
  spots.sort((a, b) => {
    const numA = parseInt(a.spot_number);
    const numB = parseInt(b.spot_number);
    return numA - numB;
  }).forEach(spot => {
    spotsMap[spot.spot_number] = spot;
  });
  
  const totalSpots = 204;
  const spotsPerRow = 17;
  const totalRows = Math.ceil(totalSpots / spotsPerRow);
  const sectionsCount = 6;
  const rowsPerSection = Math.ceil(totalRows / sectionsCount);
  
  let existingPlaces = spots.length;
  let nonExistingPlaces = totalSpots - existingPlaces;
  
  const asphaltLayer = document.createElement("div");
  asphaltLayer.className = "asphalt-layer";
  
  const driveLanes = document.createElement("div");
  driveLanes.className = "drive-lanes";
  driveLanes.innerHTML = `
    <div class="main-lane horizontal-lane"></div>
    <div class="vertical-lane left-lane"></div>
    <div class="vertical-lane right-lane"></div>
    <div class="entrance-area">ENTRÉE</div>
    <div class="exit-area">SORTIE</div>
  `;
  
  asphaltLayer.appendChild(driveLanes);
  
  const parkingAreas = document.createElement("div");
  parkingAreas.className = "parking-areas";
  
  for (let section = 0; section < sectionsCount; section++) {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "parking-section";
    
    const sectionLabel = document.createElement("div");
    sectionLabel.className = "section-label";
    sectionLabel.textContent = `Zone ${section + 1}`;
    sectionDiv.appendChild(sectionLabel);
    
    for (let rowInSection = 0; rowInSection < rowsPerSection; rowInSection++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "spot-row";
      
      const currentRow = section * rowsPerSection + rowInSection;
      
      for (let col = 0; col < spotsPerRow; col++) {
        const spotIndex = currentRow * spotsPerRow + col;
        const spotNumber = (spotIndex + 1).toString();
        
        if (spotIndex >= totalSpots) continue;
        
        const dbSpot = spotsMap[spotNumber] || null;
        
        const spotElement = document.createElement("div");
        spotElement.className = `parking-spot-enhanced ${dbSpot ? dbSpot.getStatusClass() : "status-unavailable"} ${dbSpot ? dbSpot.type : "normale"}`;
        spotElement.dataset.spotNumber = spotNumber;
        spotElement.dataset.type = dbSpot ? dbSpot.type : "normale";
        
        if (dbSpot) {
          spotElement.dataset.id = dbSpot.id;
        }
        
        const spotMarkings = document.createElement("div");
        spotMarkings.className = "spot-markings";
        
        const spotNumberElement = document.createElement("div");
        spotNumberElement.className = "spot-number";
        spotNumberElement.textContent = spotNumber;
        spotMarkings.appendChild(spotNumberElement);
        
        if (dbSpot && dbSpot.type === "handicapee") {
          const handicapSymbol = document.createElement("div");
          handicapSymbol.className = "handicap-symbol";
          handicapSymbol.innerHTML = "♿";
          spotMarkings.appendChild(handicapSymbol);
        } else if (dbSpot && dbSpot.type === "electrique") {
          const electricSymbol = document.createElement("div");
          electricSymbol.className = "electric-symbol";
          electricSymbol.innerHTML = "⚡";
          spotMarkings.appendChild(electricSymbol);
        }
        
        spotElement.appendChild(spotMarkings);
        
        if (dbSpot && dbSpot.status === "occupee") {
          const carIcon = document.createElement("div");
          carIcon.className = "car-icon";
          spotElement.appendChild(carIcon);
        }
        
        spotElement.addEventListener('click', () => {
          if (dbSpot) {
            showSpotDetails(dbSpot);
          } else {
            showUnassignedSpotMessage(spotNumber);
          }
        });
        
        rowDiv.appendChild(spotElement);
      }
      
      sectionDiv.appendChild(rowDiv);
    }
    
    parkingAreas.appendChild(sectionDiv);
  }
  
  asphaltLayer.appendChild(parkingAreas);
  parkingMap.appendChild(asphaltLayer);
  
  addEnhancedParkingLegend(parkingMap);
  container.appendChild(parkingMap);
  
  const stats = document.createElement("div");
  stats.className = "parking-stats";
  stats.innerHTML = `
    <div class="spots-stats">Places configurées: ${existingPlaces}/${totalSpots}</div>
  `;
  parkingMap.appendChild(stats);
  
  const btnStandard = document.getElementById('view-2d');
  if (btnStandard) {
    btnStandard.addEventListener('click', () => {
      import('./parkingSpotView.js').then(module => {
        module.renderParkingSpots(spots);
      });
    });
  }
  
  const btnDynamic = document.getElementById('view-2d-dynamic');
  if (btnDynamic) {
    btnDynamic.addEventListener('click', () => {
      renderParkingSpots(spots);
    });
  }
  
  console.log(`Total: ${totalSpots} places, Existantes: ${existingPlaces}, Non attribuées: ${nonExistingPlaces}`);
}

function showSpotDetails(spot) {
  const currentUser = getCurrentUser?.();
  const canReserve = currentUser && currentUser.role === 'user' && spot.status !== 'occupee' && spot.status !== 'maintenance';

  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.id = 'spot-details-modal';
  
  modalContainer.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Détails de la place ${spot.spot_number}</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>Type:</strong> ${spot.getTypeLabel()}</p>
        <p><strong>Statut:</strong> ${spot.getStatusLabel()}</p>
        ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner') ? `
          <p><strong>ID:</strong> ${spot.id}</p>
          <p><strong>Tarif associé:</strong> ${spot.pricing_id ?? 'Non défini'}</p>
          <p><strong>Propriétaire:</strong> ${spot.owner_id ?? 'Aucun'}</p>
        ` : ''}
        <div class="modal-actions">
          ${canReserve ? 
            `<button class="btn-primary btn-reserve" data-id="${spot.id}">Réserver cette place</button>` : 
            ''}
          <button class="btn-secondary btn-close-modal">Fermer</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalContainer);
  
  modalContainer.querySelector('.close-modal').addEventListener('click', () => {
    modalContainer.remove();
  });
  
  modalContainer.querySelector('.btn-close-modal').addEventListener('click', () => {
    modalContainer.remove();
  });

if (canReserve) {
  const reserveBtn = modalContainer.querySelector('.btn-reserve');
  if (reserveBtn) {
    reserveBtn.addEventListener('click', async () => {
      modalContainer.remove();
      const module = await import('./parkingSpotView.js');
      if (module.showReservationForm) {
        module.showReservationForm(spot.id);
      }
    });
  }
}
}

function showUnassignedSpotMessage(spotNumber) {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.id = 'unassigned-spot-modal';
  
  modalContainer.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Place non configurée</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p>La place ${spotNumber} n'est pas encore configurée dans le système.</p>
        <div class="modal-actions">
          <button class="btn-secondary btn-close-modal">Fermer</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalContainer);
  
  modalContainer.querySelector('.close-modal').addEventListener('click', () => {
    modalContainer.remove();
  });
  
  modalContainer.querySelector('.btn-close-modal').addEventListener('click', () => {
    modalContainer.remove();
  });
}

function addEnhancedParkingLegend(container) {
  const legend = document.createElement('div');
  legend.className = 'parking-legend';
  
  legend.innerHTML = `
    <div class="legend-title">Légende</div>
    <div class="legend-items">
      <div class="legend-item">
        <div class="legend-color status-available"></div>
        <div class="legend-label">Disponible</div>
      </div>
      <div class="legend-item">
        <div class="legend-color status-reserved"></div>
        <div class="legend-label">Réservée</div>
      </div>
      <div class="legend-item">
        <div class="legend-color status-occupied"></div>
        <div class="legend-label">Occupée</div>
      </div>
      <div class="legend-item">
        <div class="legend-color status-unavailable"></div>
        <div class="legend-label">Non attribuée</div>
      </div>
      <div class="legend-item">
        <div class="legend-icon handicap">♿</div>
        <div class="legend-label">PMR</div>
      </div>
      <div class="legend-item">
        <div class="legend-icon electric">⚡</div>
        <div class="legend-label">Borne électrique</div>
      </div>
    </div>
  `;
  
  container.appendChild(legend);
}