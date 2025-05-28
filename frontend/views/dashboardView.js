export function renderDashboard(stats, userRole) {
  const dashboardStyles = `
    <style>
      .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9fafc;
        border-radius: 12px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      }
      
      .dashboard-welcome {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 1px solid #eaeaea;
        padding-bottom: 15px;
      }
      
      .dashboard-welcome h1 {
        color: #2c3e50;
        font-size: 28px;
        margin-bottom: 10px;
      }
      
      .dashboard-welcome p {
        color: #7f8c8d;
        font-size: 16px;
      }
      
      .stats-container {
        display: flex;
        flex-direction: column;
        gap: 30px;
      }
      
      .stats-row {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }
      
      .stat-card {
        flex: 1;
        min-width: 220px;
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.1);
      }
      
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        background: linear-gradient(45deg, #3498db, #2ecc71);
        border-radius: 3px 0 0 3px;
      }
      
      .stat-icon {
        font-size: 36px;
        margin-right: 15px;
        background: #f2f9ff;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 30px;
      }
      
      .stat-content {
        flex: 1;
      }
      
      .stat-title {
        color: #7f8c8d;
        font-size: 14px;
        margin-bottom: 5px;
      }
      
      .stat-value {
        color: #2c3e50;
        font-size: 24px;
        font-weight: 600;
      }
      
      .stats-chart, .stats-info {
        flex: 1;
        min-width: 280px;
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.05);
      }
      
      .chart-container {
        display: flex;
        height: 200px;
        margin-top: 20px;
        position: relative;
      }
      
      .chart-bar {
        flex: 1;
        display: flex;
        flex-direction: column-reverse;
        margin-right: 20px;
        position: relative;
        background: #f5f5f5;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .bar-segment {
        width: 100%;
        transition: height 1s ease;
      }
      
      .bar-segment.admin {
        background: #e74c3c;
      }
      
      .bar-segment.owner {
        background: #3498db;
      }
      
      .bar-segment.user {
        background: #2ecc71;
      }
      
      .chart-legend {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 15px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        font-size: 14px;
      }
      
      .color-box {
        width: 15px;
        height: 15px;
        margin-right: 8px;
        border-radius: 3px;
      }
      
      .color-box.admin { background: #e74c3c; }
      .color-box.owner { background: #3498db; }
      .color-box.user { background: #2ecc71; }
      .color-box.occupied { background: #e74c3c; }
      .color-box.available { background: #2ecc71; }
      
      .availability-info {
        margin-top: 20px;
      }
      
      .availability-gauge {
        height: 20px;
        width: 100%;
        background: #f5f5f5;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 10px;
      }
      
      .gauge-fill {
        height: 100%;
        background: linear-gradient(to right, #2ecc71, #3498db);
        border-radius: 10px;
        transition: width 1s ease;
      }
      
      .quick-actions {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-top: 20px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.05);
      }
      
      .actions-container {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        margin-top: 15px;
      }
      
      .action-button {
        flex: 1;
        min-width: 120px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        color: #333;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .action-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        border-color: #3498db;
      }
      
      .action-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      .donut-chart {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        background: conic-gradient(var(--color) calc(var(--percentage) * 1%), #ecf0f1 0);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 30px;
        position: relative;
      }
      
      .donut-chart::before {
        content: "";
        width: 100px;
        height: 100px;
        background: white;
        border-radius: 50%;
        position: absolute;
      }
      
      .donut-content {
        z-index: 1;
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }
      
      /* Nouvelles visualisations de données */
      .stats-progress {
        margin-top: 20px;
      }
      
      .progress-item {
        margin-bottom: 15px;
      }
      
      .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: 14px;
      }
      
      .progress-bar {
        height: 8px;
        width: 100%;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 1s ease;
      }
      
      /* Style pour graphique à barres horizontales */
      .horizontal-bars {
        margin-top: 20px;
      }
      
      .h-bar-item {
        margin-bottom: 12px;
      }
      
      .h-bar-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: 14px;
      }
      
      .h-bar-container {
        height: 25px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }
      
      .h-bar-fill {
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        display: flex;
        align-items: center;
        padding-left: 10px;
        color: white;
        font-size: 12px;
        font-weight: bold;
        transition: width 1s ease;
      }
      
      /* Graphiques circulaires */
      .metrics-circular {
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 20px;
      }
      
      .metric-circle {
        position: relative;
        width: 100px;
        height: 100px;
      }
      
      .circle-bg {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #f0f0f0;
        position: absolute;
      }
      
      .circle-fill {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        position: absolute;
        clip: rect(0, 50px, 100px, 0);
        transform: rotate(0deg);
        background: #3498db;
      }
      
      .circle-content {
        position: absolute;
        width: 80%;
        height: 80%;
        left: 10%;
        top: 10%;
        border-radius: 50%;
        background: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      .circle-value {
        font-size: 18px;
        font-weight: bold;
      }
      
      .circle-label {
        font-size: 10px;
        color: #7f8c8d;
      }
      
      /* Carte de heatmap */
      .week-heatmap {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 5px;
      }
      
      .day-column {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .day-header {
        text-align: center;
        font-size: 12px;
        color: #7f8c8d;
        padding: 5px 0;
      }
      
      .hour-cell {
        height: 10px;
        border-radius: 2px;
        transition: all 0.3s ease;
      }
      
      .hour-cell:hover {
        transform: scale(1.2);
      }
    </style>
  `;

  let html = dashboardStyles + `
    <div class="dashboard-container">
      <div class="dashboard-welcome">
        <h1>Tableau de bord SmartPark</h1>
        <p>Votre solution de location de places de parking entre particuliers</p>
      </div>
      <div class="stats-container">
  `;

  if (userRole === 'admin') {
    html += `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-title">Utilisateurs</div>
            <div class="stat-value">${stats.total_users}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🅿️</div>
          <div class="stat-content">
            <div class="stat-title">Places de parking</div>
            <div class="stat-value">${stats.total_spots}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-title">Réservations</div>
            <div class="stat-value">${stats.total_reservations}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Revenus totaux</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_amount)}</div>
          </div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Répartition des utilisateurs</h3>
          <div class="chart-container">
            <div class="chart-bar">
              <div class="bar-segment admin" style="height: ${stats.users_by_role.admin / stats.total_users * 100}%"></div>
              <div class="bar-segment owner" style="height: ${stats.users_by_role.owner / stats.total_users * 100}%"></div>
              <div class="bar-segment user" style="height: ${stats.users_by_role.user / stats.total_users * 100}%"></div>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="color-box admin"></span> Administrateurs (${stats.users_by_role.admin})</div>
              <div class="legend-item"><span class="color-box owner"></span> Propriétaires (${stats.users_by_role.owner})</div>
              <div class="legend-item"><span class="color-box user"></span> Utilisateurs (${stats.users_by_role.user})</div>
            </div>
          </div>
        </div>
        
        <div class="stats-info">
          <h3>Disponibilité des places</h3>
          <div class="availability-info">
            <div class="availability-gauge">
              <div class="gauge-fill" style="width: ${(stats.available_spots / stats.total_spots) * 100}%"></div>
            </div>
            <p>${stats.available_spots} places disponibles sur ${stats.total_spots} (${Math.round((stats.available_spots / stats.total_spots) * 100)}%)</p>
          </div>
          
          <div class="horizontal-bars">
            <div class="h-bar-item">
              <div class="h-bar-label">
                <span>Places standard</span>
                <span>${Math.round(stats.spots_by_type?.normale || 0)}%</span>
              </div>
              <div class="h-bar-container">
                <div class="h-bar-fill" style="width: ${stats.spots_by_type?.normale || 0}%; background-color: #3498db;">
                  ${Math.round(stats.spots_by_type?.normale || 0)}%
                </div>
              </div>
            </div>
            
            <div class="h-bar-item">
              <div class="h-bar-label">
                <span>Places PMR</span>
                <span>${Math.round(stats.spots_by_type?.handicapee || 0)}%</span>
              </div>
              <div class="h-bar-container">
                <div class="h-bar-fill" style="width: ${stats.spots_by_type?.handicapee || 0}%; background-color: #9b59b6;">
                  ${Math.round(stats.spots_by_type?.handicapee || 0)}%
                </div>
              </div>
            </div>
            
            <div class="h-bar-item">
              <div class="h-bar-label">
                <span>Places électriques</span>
                <span>${Math.round(stats.spots_by_type?.electrique || 0)}%</span>
              </div>
              <div class="h-bar-container">
                <div class="h-bar-fill" style="width: ${stats.spots_by_type?.electrique || 0}%; background-color: #2ecc71;">
                  ${Math.round(stats.spots_by_type?.electrique || 0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Activité hebdomadaire</h3>
          <div class="week-heatmap">
            ${generateHeatmapAdmin(stats.weekly_activity || {})}
          </div>
          <div style="font-size: 12px; text-align: center; margin-top: 10px; color: #7f8c8d;">
            Intensité des réservations par jour et heure
          </div>
        </div>
        
        <div class="stats-info">
          <h3>Performances financières</h3>
          <div class="metrics-circular">
            <div class="metric-circle">
              <div class="circle-bg"></div>
              <div class="circle-fill" style="transform: rotate(${3.6 * Math.min(stats.revenue_growth || 0, 100)}deg);"></div>
              <div class="circle-fill" style="transform: rotate(180deg); background-color: ${(stats.revenue_growth || 0) >= 50 ? '#3498db' : '#e74c3c'};"></div>
              <div class="circle-content">
                <div class="circle-value">+${Math.round(stats.revenue_growth || 0)}%</div>
                <div class="circle-label">Croissance</div>
              </div>
            </div>
            
            <div class="metric-circle">
              <div class="circle-bg"></div>
              <div class="circle-fill" style="transform: rotate(${3.6 * Math.min(stats.user_retention || 0, 100)}deg);"></div>
              <div class="circle-fill" style="transform: rotate(180deg); background-color: ${(stats.user_retention || 0) >= 50 ? '#2ecc71' : '#f39c12'};"></div>
              <div class="circle-content">
                <div class="circle-value">${Math.round(stats.user_retention || 0)}%</div>
                <div class="circle-label">Rétention</div>
              </div>
            </div>
            
            <div class="metric-circle">
              <div class="circle-bg"></div>
              <div class="circle-fill" style="transform: rotate(${3.6 * Math.min(stats.booking_rate || 0, 100)}deg);"></div>
              <div class="circle-fill" style="transform: rotate(180deg); background-color: ${(stats.booking_rate || 0) >= 50 ? '#2ecc71' : '#f39c12'};"></div>
              <div class="circle-content">
                <div class="circle-value">${Math.round(stats.booking_rate || 0)}%</div>
                <div class="circle-label">Taux réserv.</div>
              </div>
            </div>
          </div>
          
          <div class="stats-progress">
            <div class="progress-item">
              <div class="progress-label">
                <span>Objectif chiffre d'affaires</span>
                <span>${Math.round((stats.current_revenue || 0) / (stats.revenue_target || 1) * 100)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(Math.round((stats.current_revenue || 0) / (stats.revenue_target || 1) * 100), 100)}%; background: linear-gradient(to right, #3498db, #2ecc71);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (userRole === 'owner') {
    html += `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">🅿️</div>
          <div class="stat-content">
            <div class="stat-title">Mes places</div>
            <div class="stat-value">${stats.owned_spots}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-title">Réservations reçues</div>
            <div class="stat-value">${stats.total_reservations_on_my_spots}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Revenus générés</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_revenue || 0)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-title">Taux d'occupation</div>
            <div class="stat-value">${Math.round(stats.occupation_rate || 0)}%</div>
          </div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Occupation de mes places</h3>
          <div class="chart-container">
            <div class="donut-chart" style="--percentage: ${stats.occupation_rate || 0}; --color: #3498db;">
              <div class="donut-content">${Math.round(stats.occupation_rate || 0)}%</div>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="color-box occupied"></span> Occupées</div>
              <div class="legend-item"><span class="color-box available"></span> Disponibles</div>
            </div>
          </div>
          
          <div class="horizontal-bars">
            <div class="h-bar-item">
              <div class="h-bar-label">
                <span>Taux de réservation</span>
                <span>${Math.round(stats.booking_rate || 0)}%</span>
              </div>
              <div class="h-bar-container">
                <div class="h-bar-fill" style="width: ${stats.booking_rate || 0}%; background: linear-gradient(to right, #3498db, #9b59b6);">
                  ${Math.round(stats.booking_rate || 0)}%
                </div>
              </div>
            </div>
            
            <div class="h-bar-item">
              <div class="h-bar-label">
                <span>Satisfaction clients</span>
                <span>${Math.round(stats.customer_satisfaction || 0)}%</span>
              </div>
              <div class="h-bar-container">
                <div class="h-bar-fill" style="width: ${stats.customer_satisfaction || 0}%; background: linear-gradient(to right, #2ecc71, #27ae60);">
                  ${Math.round(stats.customer_satisfaction || 0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="stats-info">
          <h3>Performance financière</h3>
          <div class="stats-progress">
            <div class="progress-item">
              <div class="progress-label">
                <span>Revenu ce mois</span>
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.monthly_revenue || 0)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(Math.round((stats.monthly_revenue || 0) / (stats.monthly_target || 1) * 100), 100)}%; background: linear-gradient(to right, #f1c40f, #f39c12);"></div>
              </div>
            </div>
            
            <div class="progress-item">
              <div class="progress-label">
                <span>Revenu total</span>
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_revenue || 0)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 100%; background: linear-gradient(to right, #3498db, #2980b9);"></div>
              </div>
            </div>
          </div>
          
          <h3>Mes emplacements les plus populaires</h3>
          <div class="horizontal-bars">
            ${generatePopularSpots(stats.popular_spots || [])}
          </div>
          
          <div class="stats-chart" style="margin-top: 20px;">
            <h3>Activité hebdomadaire</h3>
            <div class="week-heatmap">
              ${generateHeatmap(stats.weekly_activity || {})}
            </div>
            <div style="font-size: 12px; text-align: center; margin-top: 10px; color: #7f8c8d;">
              Intensité des réservations par jour et heure
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-title">Mes réservations</div>
            <div class="stat-value">${stats.total_reservations || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏲️</div>
          <div class="stat-content">
            <div class="stat-title">Réservations actives</div>
            <div class="stat-value">${stats.active_reservations || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Dépenses totales</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_spent || 0)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔜</div>
          <div class="stat-content">
            <div class="stat-title">Réservations à venir</div>
            <div class="stat-value">${stats.upcoming_reservations || 0}</div>
          </div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Historique de mes réservations</h3>
          <div class="chart-container" style="height: 250px;">
            ${generateReservationChart(stats.reservation_history || [])}
          </div>
        </div>
        
        <div class="stats-info">
          <h3>Mes dépenses</h3>
          <div class="metrics-circular">
            <div class="metric-circle">
              <div class="circle-bg"></div>
              <div class="circle-fill" style="transform: rotate(${3.6 * Math.min(stats.monthly_spending_percentage || 0, 100)}deg);"></div>
              <div class="circle-fill" style="transform: rotate(180deg); background-color: ${(stats.monthly_spending_percentage || 0) >= 70 ? '#e74c3c' : '#2ecc71'};"></div>
              <div class="circle-content">
                <div class="circle-value">${Math.round(stats.monthly_spending_percentage || 0)}%</div>
                <div class="circle-label">Ce mois</div>
              </div>
            </div>
            
            <div class="metric-circle">
              <div class="circle-bg"></div>
              <div class="circle-fill" style="transform: rotate(${3.6 * Math.min(stats.savings_percentage || 0, 100)}deg);"></div>
              <div class="circle-fill" style="transform: rotate(180deg); background-color: ${(stats.savings_percentage || 0) >= 50 ? '#2ecc71' : '#e74c3c'};"></div>
              <div class="circle-content">
                <div class="circle-value">${Math.round(stats.savings_percentage || 0)}%</div>
                <div class="circle-label">Économies</div>
              </div>
            </div>
          </div>
          
          <div class="horizontal-bars">
            <div class="h-bar-item">
              <div class="h-bar-label">
                <span>Dépenses ce mois</span>
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.monthly_spent || 0)}</span>
              </div>
              <div class="h-bar-container">
                <div class="h-bar-fill" style="width: ${Math.min((stats.monthly_spent || 0) / (stats.average_monthly || 1) * 100, 100)}%; background: linear-gradient(to right, #3498db, #2980b9);">
                  ${Math.round((stats.monthly_spent || 0) / (stats.average_monthly || 1) * 100)}%
                </div>
              </div>
            </div>
            
            <div class="h-bar-item">
              <div class="h-bar-label">
                <span>Économies estimées</span>
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.estimated_savings || 0)}</span>
              </div>
              <div class="h-bar-container">
                <div class="h-bar-fill" style="width: 100%; background: linear-gradient(to right, #2ecc71, #27ae60);">
                  100%
                </div>
              </div>
            </div>
          </div>
          
          <h3>Lieux favoris</h3>
          <div class="horizontal-bars">
            ${generateFavoriteLocations(stats.favorite_locations || [])}
          </div>
        </div>
      </div>
      
      <div class="quick-actions">
        <h3>Actions rapides</h3>
        <div class="actions-container">
          <a href="/app-gestion-parking/public/parking" class="action-button">
            <i class="action-icon">🅿️</i>
            <span>Trouver une place</span>
          </a>
          <a href="/app-gestion-parking/public/reservations" class="action-button">
            <i class="action-icon">📅</i>
            <span>Mes réservations</span>
          </a>
          <a href="/app-gestion-parking/public/profile" class="action-button">
            <i class="action-icon">👤</i>
            <span>Mon profil</span>
          </a>
          <a href="/app-gestion-parking/public/payments" class="action-button">
            <i class="action-icon">💳</i>
            <span>Paiements</span>
          </a>
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.bar-segment').forEach(bar => {
          const originalHeight = bar.style.height;
          bar.style.height = '0%';
          setTimeout(() => {
            bar.style.height = originalHeight;
          }, 300);
        });
        
        document.querySelectorAll('.gauge-fill').forEach(gauge => {
          const originalWidth = gauge.style.width;
          gauge.style.width = '0%';
          setTimeout(() => {
            gauge.style.width = originalWidth;
          }, 300);
        });
        
        document.querySelectorAll('.h-bar-fill').forEach((bar, index) => {
          const originalWidth = bar.style.width;
          bar.style.width = '0%';
          setTimeout(() => {
            bar.style.width = originalWidth;
          }, 300 + index * 100);
        });
      });
    </script>
  `;

  return html;
}

function generateHeatmap(weeklyActivity) {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = Array.from({length: 24}, (_, i) => i);
  let heatmapHtml = '';
  
  const defaultActivity = {};
  days.forEach(day => {
    defaultActivity[day] = {};
    hours.forEach(hour => {
      defaultActivity[day][hour] = Math.floor(Math.random() * 10);
    });
  });
  
  const activity = Object.keys(weeklyActivity).length ? weeklyActivity : defaultActivity;
  
  days.forEach(day => {
    heatmapHtml += `<div class="day-column">
      <div class="day-header">${day}</div>
      ${hours.filter(h => h >= 6 && h <= 22).map(hour => {
        const intensity = activity[day]?.[hour] || 0;
        const color = getHeatmapColor(intensity, 10);
        return `<div class="hour-cell" style="background-color: ${color};" title="${day} ${hour}:00 - Intensité: ${intensity}/10"></div>`;
      }).join('')}
    </div>`;
  });
  
  return heatmapHtml;
}

function generateHeatmapAdmin(weeklyActivity) {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = [8, 10, 12, 14, 16, 18, 20];
  let heatmapHtml = '';
  
  const defaultActivity = {};
  days.forEach(day => {
    defaultActivity[day] = {};
    hours.forEach(hour => {
      defaultActivity[day][hour] = Math.floor(Math.random() * 10);
    });
  });
  
  const activity = Object.keys(weeklyActivity).length ? weeklyActivity : defaultActivity;
  
  days.forEach(day => {
    heatmapHtml += `<div class="day-column">
      <div class="day-header">${day}</div>
      ${hours.map(hour => {
        const intensity = activity[day]?.[hour] || 0;
        const color = getHeatmapColor(intensity, 10);
        return `<div class="hour-cell" style="background-color: ${color}; height: 20px;" title="${day} ${hour}:00 - Intensité: ${intensity}/10"></div>`;
      }).join('')}
    </div>`;
  });
  
  return heatmapHtml;
}

function getHeatmapColor(intensity, max) {
  const ratio = intensity / max;
  if (ratio < 0.2) return '#ebedf0';
  if (ratio < 0.4) return '#c6e48b';
  if (ratio < 0.6) return '#7bc96f';
  if (ratio < 0.8) return '#239a3b';
  return '#196127';
}

function generatePopularSpots(spots) {
  if (!spots.length) {
    spots = [
      { number: 'A-101', usage: 85 },
      { number: 'B-205', usage: 72 },
      { number: 'C-304', usage: 64 }
    ];
  }
  
  return spots.slice(0, 3).map(spot => `
    <div class="h-bar-item">
      <div class="h-bar-label">
        <span>Place ${spot.number}</span>
        <span>${spot.usage}%</span>
      </div>
      <div class="h-bar-container">
        <div class="h-bar-fill" style="width: ${spot.usage}%; background: linear-gradient(to right, #3498db, #2980b9);">
          ${spot.usage}%
        </div>
      </div>
    </div>
  `).join('');
}

function generateFavoriteLocations(locations) {
  if (!locations.length) {
    locations = [
      { name: 'Centre-ville', count: 12 },
      { name: 'Quartier des affaires', count: 8 },
      { name: 'Gare centrale', count: 5 }
    ];
  }
  
  const maxCount = Math.max(...locations.map(loc => loc.count));
  
  return locations.slice(0, 3).map(location => `
    <div class="h-bar-item">
      <div class="h-bar-label">
        <span>${location.name}</span>
        <span>${location.count} réservations</span>
      </div>
      <div class="h-bar-container">
        <div class="h-bar-fill" style="width: ${location.count / maxCount * 100}%; background: linear-gradient(to right, #9b59b6, #8e44ad);">
          ${location.count}
        </div>
      </div>
    </div>
  `).join('');
}

function generateReservationChart(history) {
  if (!history.length) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
    history = months.map((month, i) => ({ 
      label: month, 
      count: Math.floor(Math.random() * 10) + 1
    }));
  }
  
  const maxCount = Math.max(...history.map(h => h.count));
  const barWidth = 100 / history.length - 5;
  
  return `
    <div style="display: flex; height: 100%; align-items: flex-end; justify-content: space-around;">
      ${history.map(item => `
        <div style="display: flex; flex-direction: column; align-items: center; width: ${barWidth}%;">
          <div style="background: linear-gradient(to top, #3498db, #2980b9); height: ${item.count / maxCount * 200}px; width: 80%; border-radius: 5px 5px 0 0; transition: height 1s ease;" title="${item.count} réservations"></div>
          <div style="font-size: 12px; margin-top: 5px; text-align: center;">${item.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}