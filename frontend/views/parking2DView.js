import { getCurrentUser } from '../controllers/authController.js';

export function renderParkingSpots(spots) {
  const container = document.getElementById("parking-spot-list");
  if (!container) return;
  
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
  parkingMap.className = "parking-map-realistic";
  
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
        spotElement.className = `parking-spot-realistic ${dbSpot ? dbSpot.getStatusClass() : "status-unavailable"} ${dbSpot ? dbSpot.type : "normale"}`;
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
  
  addParkingLegend(parkingMap);
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

function addParkingLegend(container) {
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

function showUnassignedSpotMessage(spotNumber) {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser && currentUser.role === 'admin';
  
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.id = 'spot-details-modal';
  
  modalContainer.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Place ${spotNumber}</h2>
        <span class="status-badge badge-secondary">Non attribuée</span>
      </div>
      <div class="modal-body">
        <p>Cette place n'est pas encore configurée dans le système.</p>
        ${isAdmin ? `
        <div class="admin-actions">
          <button id="create-spot-btn" class="btn-primary" data-spot-number="${spotNumber}">
            Configurer cette place
          </button>
        </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button id="close-spot-details" class="btn-secondary">Fermer</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalContainer);
  
  document.getElementById('close-spot-details').addEventListener('click', () => {
    document.body.removeChild(modalContainer);
  });
  
  const createBtn = document.getElementById('create-spot-btn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      import('../controllers/parkingSpotController.js').then(module => {
        module.createSpotWithNumber(spotNumber);
      });
    });
  }
}

function showSpotDetails(spot) {
  if (window.showSpotDetailsModal) {
    window.showSpotDetailsModal(spot);
  } else {
    import('./parkingSpotView.js').then(module => {
      if (module.showSpotDetailsModal) {
        module.showSpotDetailsModal(spot);
      }
    });
  }
}