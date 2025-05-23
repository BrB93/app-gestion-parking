export function renderDashboard(stats, userRole) {
  let html = `
    <div class="dashboard-container">
      <h1>Tableau de bord SmartPark</h1>
      <div class="dashboard-welcome">
        <p>Bienvenue sur votre tableau de bord personnalisé.</p>
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
            <div class="stat-title">Réservations de mes places</div>
            <div class="stat-value">${stats.total_reservations_on_my_spots}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Revenus générés</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_revenue)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-title">Taux d'occupation</div>
            <div class="stat-value">${Math.round(stats.occupation_rate)}%</div>
          </div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Activité de mes places</h3>
          <div class="chart-container">
            <div class="donut-chart" style="--percentage: ${stats.occupation_rate}; --color: #3498db;">
              <div class="donut-content">${Math.round(stats.occupation_rate)}%</div>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="color-box occupied"></span> Occupées</div>
              <div class="legend-item"><span class="color-box available"></span> Disponibles</div>
            </div>
          </div>
        </div>
        <div class="stats-info">
          <h3>Mes réservations personnelles</h3>
          <div class="owner-personal-stats">
            <p>Vous avez effectué <strong>${stats.my_reservations}</strong> réservations</p>
            <p>Actuellement, <strong>${stats.active_reservations_on_my_spots}</strong> de vos places sont réservées</p>
          </div>
        </div>
      </div>
    `;
  } else {
    // Utilisateur standard
    html += `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-title">Mes réservations</div>
            <div class="stat-value">${stats.total_reservations}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏲️</div>
          <div class="stat-content">
            <div class="stat-title">Réservations actives</div>
            <div class="stat-value">${stats.active_reservations}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Dépenses totales</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_spent)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔜</div>
          <div class="stat-content">
            <div class="stat-title">Réservations à venir</div>
            <div class="stat-value">${stats.upcoming_reservations}</div>
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
  `;

  return html;
}