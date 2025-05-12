import { getCurrentUser } from '../controllers/authController.js';

export function render3DParkingSpots(spots) {
    const container = document.getElementById("parking-spot-list");
    if (!container) return;
    
    const viewToggle = document.createElement("div");
    viewToggle.className = "view-toggle";
    viewToggle.innerHTML = `
      <div class="toggle-buttons">
        <button class="btn-secondary" id="view-2d">Vue standard</button>
        <button class="btn-primary active" id="view-3d">Vue 3D</button>
      </div>
    `;
    
    const existingFilter = container.querySelector('.filter-section');
    
    container.innerHTML = "";
    container.appendChild(viewToggle);
    if (existingFilter) container.appendChild(existingFilter);
    
    const scene3D = document.createElement("div");
    scene3D.className = "parking-3d-scene";
    
    const viewport = document.createElement("div");
    viewport.className = "parking-3d-viewport";
    viewport.style.transformStyle = "preserve-3d";
    viewport.style.perspective = "1200px";
    
    const floor = document.createElement("div");
    floor.className = "parking-3d-floor";
    
    const spotsMap = {};
    const spotsBySection = {};
    
    spots.forEach(spot => {
      spotsMap[spot.spot_number] = spot;
      
      if (/^[A-F]\d{1,2}$/.test(spot.spot_number)) {
        console.log(`Place au format structuré: ${spot.spot_number}, id=${spot.id}, statut=${spot.status}`);
        
        const section = spot.spot_number.charAt(0);
        const number = parseInt(spot.spot_number.substring(1));
        
        if (!spotsBySection[section]) {
          spotsBySection[section] = {};
        }
        
        spotsBySection[section][number] = spot;
      } else {
        console.log(`Place au format numérique: ${spot.spot_number}, id=${spot.id}, statut=${spot.status}`);
      }
    });
    
    const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
    const placesPerRow = 17;
    const rowsPerSection = 2;
    
    const spotWidth = 40;
    const spotLength = 80;
    const gapBetween = 5;
    const aisleWidth = 100;
    const sectionGap = 150;
    
    let totalPlaces = 0;
    let existingPlaces = 0;
    let nonExistingPlaces = 0;
    
    sections.forEach((section, sectionIndex) => {
      const sectionElement = document.createElement("div");
      sectionElement.className = "parking-section";
      sectionElement.dataset.section = section;
      
      const sectionX = (sectionIndex % 3) * ((spotWidth + gapBetween) * placesPerRow + sectionGap);
      const sectionZ = Math.floor(sectionIndex / 3) * ((spotLength + gapBetween) * rowsPerSection + sectionGap + aisleWidth);
      
      const sectionLabel = document.createElement("div");
      sectionLabel.className = "section-label";
      sectionLabel.textContent = `Section ${section}`;
      sectionLabel.style.left = `${sectionX + (placesPerRow * spotWidth) / 2}px`;
      sectionLabel.style.top = `${sectionZ - 30}px`;
      floor.appendChild(sectionLabel);
      
      for (let row = 0; row < rowsPerSection; row++) {
        for (let col = 0; col < placesPerRow; col++) {
          const num = row * placesPerRow + col + 1;
          const spotNumber = `${section}${num.toString().padStart(2, '0')}`;
          totalPlaces++;
          
          const xPos = sectionX + col * (spotWidth + gapBetween);
          const zPos = sectionZ + row * (spotLength + gapBetween + aisleWidth);
          
          let dbSpot = null;
          
          if (spotsBySection[section] && spotsBySection[section][num]) {
            dbSpot = spotsBySection[section][num];
          } 
          else if (spotsMap[spotNumber]) {
            dbSpot = spotsMap[spotNumber];
          } 
          else {
            const globalNum = (sectionIndex * rowsPerSection * placesPerRow) + 
                             (row * placesPerRow) + col + 1;
            
            if (spotsMap[globalNum.toString()]) {
              dbSpot = spotsMap[globalNum.toString()];
              console.log(`Correspondance trouvée: Place #${globalNum} → ${spotNumber}`);
            }
          }
          
          if (dbSpot) {
            existingPlaces++;
            console.log(`Place ${spotNumber} trouvée en base de données: id=${dbSpot.id}, statut=${dbSpot.status}`);
          } else {
            nonExistingPlaces++;
          }
          
          const spotStatus = dbSpot ? dbSpot.status : "non_disponible";
          const spotType = dbSpot ? dbSpot.type : "normale";
          const spotId = dbSpot ? dbSpot.id : null;
          
          const spotElement = document.createElement("div");
          spotElement.className = `parking-spot-area ${dbSpot ? dbSpot.getStatusClass() : "status-unavailable"}`;
          spotElement.dataset.spotNumber = spotNumber;
          spotElement.dataset.type = spotType;
          spotElement.dataset.status = spotStatus;
          
          if (spotId) {
            spotElement.dataset.id = spotId;
          }
          
          spotElement.style.left = `${xPos}px`;
          spotElement.style.top = `${zPos}px`;
          spotElement.style.width = `${spotWidth}px`;
          spotElement.style.height = `${spotLength}px`;
          
          const spotNumberElement = document.createElement("div");
          spotNumberElement.className = "spot-number";
          spotNumberElement.textContent = spotNumber;
          spotElement.appendChild(spotNumberElement);
          
          if (spotType === 'handicapee') {
            const handicapSymbol = document.createElement("div");
            handicapSymbol.className = "handicap-symbol";
            handicapSymbol.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,13V7H13V5H19A2,2 0 0,1 21,7V13H19M10,5C8.89,5 8,5.89 8,7S8.89,9 10,9 12,8.11 12,7 11.11,5 10,5M12,14.59L15,11.59L16.59,13.17C17.21,13.78 18.18,13.78 18.8,13.17L22,10V17H12V14.59M12,19A2,2 0 0,1 10,17A2,2 0 0,1 12,15A2,2 0 0,1 14,17A2,2 0 0,1 12,19M2,7H4V13H2V7M2,15H4V17H2V15Z"/></svg>`;
            spotElement.appendChild(handicapSymbol);
          } else if (spotType === 'electrique') {
            const electricSymbol = document.createElement("div");
            electricSymbol.className = "electric-symbol";
            electricSymbol.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12,1.33L18,7.33V11H16V8.83L12,4.83L8,8.83V11H6V7.33M12,4.83L14.67,7.5H9.33M19,12V16H21V19A1,1 0 0,1 20,20H4A1,1 0 0,1 3,19V16H5V12M19,18H5V17H19M17,12H7V16H17Z"/></svg>`;
            spotElement.appendChild(electricSymbol);
          }
          
          if (spotStatus === 'occupee') {
            const car = document.createElement("div");
            car.className = "car-model";
            spotElement.appendChild(car);
          }
          
          if (dbSpot) {
            spotElement.addEventListener('click', () => {
              import('../controllers/parkingSpotController.js').then(module => {
                module.getParkingSpot(spotId).then(spotData => {
                  import('../views/parkingSpotView.js').then(viewModule => {
                    if (viewModule.showSpotDetailsModal) {
                      viewModule.showSpotDetailsModal(spotData);
                    } else {
                      showSpotDetails(spotData);
                    }
                  });
                });
              });
            });

            if (!dbSpot) {
              for (let i = 0; i < spots.length; i++) {
                if (!spots[i].mapped && !isNaN(parseInt(spots[i].spot_number))) {
                  dbSpot = spots[i];
                  dbSpot.mapped = true;
                  console.log(`Correspondance forcée: Place #${spots[i].spot_number} → ${spotNumber}`);
                  break;
                }
              }
            }
          } else {
            spotElement.addEventListener('click', () => {
              showUnassignedSpotMessage(spotNumber);
            });
          }
          
          floor.appendChild(spotElement);
        }
      }
    });
    
    console.log(`Total: ${totalPlaces} places, Existantes: ${existingPlaces}, Non attribuées: ${nonExistingPlaces}`);
    
    addParkingLegend(floor);
    
    viewport.appendChild(floor);
    scene3D.appendChild(viewport);
    container.appendChild(scene3D);
    
    const navigationHelper = document.createElement("div");
    navigationHelper.className = "navigation-helper";
    navigationHelper.innerHTML = `
      <div class="compass">
        <div class="compass-north">N</div>
        <div class="compass-south">S</div>
        <div class="compass-east">E</div>
        <div class="compass-west">O</div>
      </div>
      <div class="zoom-level">Zoom: <span id="zoom-value">100%</span></div>
      <div class="spots-stats">Places configurées: ${existingPlaces}/${totalPlaces}</div>
    `;
    scene3D.appendChild(navigationHelper);
    
    addRotationControls(viewport);
    
    document.getElementById('view-2d').addEventListener('click', () => {
      import('../controllers/parkingSpotController.js').then(module => {
        module.loadParkingSpots(false);
      });
    });
  }
  
  function addParkingLegend(floor) {
    const legend = document.createElement("div");
    legend.className = "parking-legend";
    legend.innerHTML = `
      <div class="legend-item"><div class="legend-color status-available"></div> Disponible</div>
      <div class="legend-item"><div class="legend-color status-reserved"></div> Réservée</div>
      <div class="legend-item"><div class="legend-color status-occupied"></div> Occupée</div>
      <div class="legend-item"><div class="legend-color status-unavailable"></div> Non attribuée</div>
    `;
    floor.appendChild(legend);
    
    const entrance = document.createElement("div");
    entrance.className = "parking-entrance";
    entrance.innerHTML = `<span>ENTRÉE</span>`;
    entrance.style.left = "50px";
    entrance.style.top = "10px";
    floor.appendChild(entrance);
    
    const exit = document.createElement("div");
    exit.className = "parking-exit";
    exit.innerHTML = `<span>SORTIE</span>`;
    exit.style.right = "50px";
    exit.style.top = "10px";
    floor.appendChild(exit);
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
        document.body.removeChild(modalContainer);
        import('../controllers/parkingSpotController.js').then(module => {
          if (module.createSpotWithNumber) {
            module.createSpotWithNumber(spotNumber);
          }
        });
      });
    }
  }
  
  function addRotationControls(viewport) {
    let scale = 1;
    
    // Vue fixe à 90 degrés (parfaitement du dessus)
    viewport.style.transform = `rotateX(90deg) rotateY(0deg)`;
    
    // Conserver uniquement la fonction de zoom avec la molette
    viewport.parentElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const container = viewport.parentElement;
      const newScale = e.deltaY > 0 ? scale * 0.9 : scale * 1.1;
      
      if (newScale >= 0.3 && newScale <= 2) {
        scale = newScale;
        container.style.transform = `scale(${scale})`;
        
        const zoomValue = document.getElementById('zoom-value');
        if (zoomValue) {
          zoomValue.textContent = `${Math.round(scale * 100)}%`;
        }
      }
    });
    
    // Simplifier les contrôles - uniquement zoom et reset
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'parking-3d-controls';
    controlsDiv.innerHTML = `
      <button class="btn-zoom" data-zoom="in">+</button>
      <button class="btn-zoom" data-zoom="out">-</button>
      <button class="btn-reset" data-action="reset">R</button>
    `;
    
    viewport.parentElement.appendChild(controlsDiv);
    
    // Conserver les contrôles de zoom
    controlsDiv.querySelectorAll('.btn-zoom').forEach(button => {
      button.addEventListener('click', () => {
        const container = viewport.parentElement;
        const newScale = button.dataset.zoom === 'in' ? scale * 1.1 : scale * 0.9;
        
        if (newScale >= 0.3 && newScale <= 2) {
          scale = newScale;
          container.style.transform = `scale(${scale})`;
          
          const zoomValue = document.getElementById('zoom-value');
          if (zoomValue) {
            zoomValue.textContent = `${Math.round(scale * 100)}%`;
          }
        }
      });
    });
    
    controlsDiv.querySelector('.btn-reset').addEventListener('click', () => {
      scale = 1;
      viewport.parentElement.style.transform = `scale(${scale})`;
      
      const zoomValue = document.getElementById('zoom-value');
      if (zoomValue) {
        zoomValue.textContent = `${Math.round(scale * 100)}%`;
      }
    });
  }
  
  function showSpotDetails(spot) {
    if (window.showSpotDetailsModal) {
      window.showSpotDetailsModal(spot);
    } else {
      import('../views/parkingSpotView.js').then(module => {
        if (module.showSpotDetailsModal) {
          module.showSpotDetailsModal(spot);
        } else {
          console.error("La fonction showSpotDetailsModal n'est pas disponible dans parkingSpotView.js");
          
          const modalContainer = document.createElement('div');
          modalContainer.className = 'modal-container';
          modalContainer.id = 'spot-details-modal';
          
          modalContainer.innerHTML = `
            <div class="modal-content">
              <h2>Place #${spot.spot_number}</h2>
              <p>Type: ${spot.getTypeLabel()}</p>
              <p>Statut: <span class="${spot.getStatusClass()}">${spot.getStatusLabel()}</span></p>
              
              <div class="spot-actions">
                ${spot.isAvailable() ? 
                  `<button class="btn-reserve-spot" data-id="${spot.id}">Réserver cette place</button>` : ''}
                <button id="close-spot-details" class="btn-secondary">Fermer</button>
              </div>
            </div>
          `;
          
          document.body.appendChild(modalContainer);
          
          document.getElementById('close-spot-details').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
          });
          
          const reserveBtn = modalContainer.querySelector('.btn-reserve-spot');
          if (reserveBtn) {
            reserveBtn.addEventListener('click', () => {
              document.body.removeChild(modalContainer);
              import('../views/reservationView.js').then(module => {
                if (module.showReservationForm) {
                  module.showReservationForm(spot.id);
                }
              });
            });
          }
        }
      });
    }
  }