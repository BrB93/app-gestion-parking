export function renderDashboard(stats, userRole) {
  let html = `
    <div class="dashboard-container">
      <div class="dashboard-welcome">
        <h1>Tableau de bord SmartPark</h1>
        <p>Votre solution de location de places de parking entre particuliers</p>
      </div>
      <div class="stats-container">
  `;

  // ADMIN
  if (userRole === 'admin') {
    html += `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-title">Utilisateurs</div>
            <div class="stat-value">${stats.total_users ?? 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🅿️</div>
          <div class="stat-content">
            <div class="stat-title">Places de parking</div>
            <div class="stat-value">${stats.total_spots ?? 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-title">Réservations</div>
            <div class="stat-value">${stats.total_reservations ?? 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Revenus totaux</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_amount ?? 0)}</div>
          </div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Répartition des utilisateurs</h3>
          ${stats.users_by_role && stats.total_users ? renderUserPie(stats.users_by_role, stats.total_users) : '<div class="empty-chart">Aucune donnée</div>'}
        </div>
        <div class="stats-chart">
          <h3>Réservations par mois</h3>
          ${stats.reservations_by_month ? renderBarChart(stats.reservations_by_month) : '<div class="empty-chart">Aucune donnée</div>'}
        </div>
      </div>
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Revenus mensuels</h3>
          ${stats.revenue_by_month ? renderLineChart(stats.revenue_by_month) : '<div class="empty-chart">Aucune donnée</div>'}
        </div>
        <div class="stats-info">
          <h3>Disponibilité des places</h3>
          <div class="availability-info">
            <div class="availability-gauge">
              <div class="gauge-fill" style="width: ${(stats.available_spots ?? 0) / (stats.total_spots || 1) * 100}%"></div>
            </div>
            <p>${stats.available_spots ?? 0} places disponibles sur ${stats.total_spots ?? 0} (${Math.round((stats.available_spots ?? 0) / (stats.total_spots || 1) * 100)}%)</p>
          </div>
        </div>
      </div>
    `;
  }
  // OWNER
  else if (userRole === 'owner') {
    html += `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">🅿️</div>
          <div class="stat-content">
            <div class="stat-title">Mes places</div>
            <div class="stat-value">${stats.owned_spots ?? 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-title">Réservations reçues</div>
            <div class="stat-value">${stats.total_reservations_on_my_spots ?? 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Revenus générés</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_revenue ?? 0)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-title">Taux d'occupation</div>
            <div class="stat-value">${Math.round(stats.occupation_rate ?? 0)}%</div>
          </div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Occupation de mes places</h3>
          ${typeof stats.occupation_rate === 'number' ? renderDonut(stats.occupation_rate) : '<div class="empty-chart">Aucune donnée</div>'}
        </div>
        <div class="stats-chart">
          <h3>Revenus par mois</h3>
          ${stats.revenue_by_month ? renderLineChart(stats.revenue_by_month) : '<div class="empty-chart">Aucune donnée</div>'}
        </div>
      </div>
    `;
  }
  // USER
  else {
    html += `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-title">Mes réservations</div>
            <div class="stat-value">${stats.total_reservations ?? 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏲️</div>
          <div class="stat-content">
            <div class="stat-title">Réservations actives</div>
            <div class="stat-value">${stats.active_reservations ?? 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💶</div>
          <div class="stat-content">
            <div class="stat-title">Dépenses totales</div>
            <div class="stat-value">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total_spent ?? 0)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔜</div>
          <div class="stat-content">
            <div class="stat-title">Réservations à venir</div>
            <div class="stat-value">${stats.upcoming_reservations ?? 0}</div>
          </div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stats-chart">
          <h3>Historique de mes réservations</h3>
          ${stats.reservations_by_month ? renderBarChart(stats.reservations_by_month) : '<div class="empty-chart">Aucune donnée</div>'}
        </div>
        <div class="stats-chart">
          <h3>Mes dépenses par mois</h3>
          ${stats.spending_by_month ? renderLineChart(stats.spending_by_month, '#e67e22') : '<div class="empty-chart">Aucune donnée</div>'}
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </div>
    <script>
      // Animation pour les barres et donuts
      document.querySelectorAll('.bar-inner').forEach(bar => {
        const width = bar.getAttribute('data-width');
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = width; }, 300);
      });
      document.querySelectorAll('.donut-ring').forEach(donut => {
        const percent = donut.getAttribute('data-percent');
        donut.style.strokeDasharray = percent + ' 100';
      });
    </script>
  `;

  return html;
}

function renderUserPie(users_by_role, total) {
  const admin = users_by_role.admin ?? 0;
  const owner = users_by_role.owner ?? 0;
  const user = users_by_role.user ?? 0;
  const percentAdmin = (admin / total * 100).toFixed(1);
  const percentOwner = (owner / total * 100).toFixed(1);
  const percentUser = (user / total * 100).toFixed(1);

  let offset = 0;
  const getArc = (percent) => {
    const r = 40, c = 2 * Math.PI * r;
    const val = (percent / 100) * c;
    const arc = `<circle r="${r}" cx="50" cy="50" fill="transparent" stroke-width="20" stroke-dasharray="${val} ${c - val}" stroke-dashoffset="-${offset}" />`;
    offset += val;
    return arc;
  };

  offset = 0;
  return `
    <svg width="120" height="120" viewBox="0 0 100 100" class="pie-chart">
      ${getArc(percentAdmin).replace('stroke-dashoffset', 'stroke="#e74c3c" stroke-dashoffset')}
      ${getArc(percentOwner).replace('stroke-dashoffset', 'stroke="#3498db" stroke-dashoffset')}
      ${getArc(percentUser).replace('stroke-dashoffset', 'stroke="#2ecc71" stroke-dashoffset')}
    </svg>
    <div class="pie-legend">
      <span><span class="color-box admin"></span>Admin (${percentAdmin}%)</span>
      <span><span class="color-box owner"></span>Owner (${percentOwner}%)</span>
      <span><span class="color-box user"></span>User (${percentUser}%)</span>
    </div>
  `;
}

function renderDonut(percent) {
  percent = Math.max(0, Math.min(100, percent));
  return `
    <svg width="120" height="120" viewBox="0 0 120 120" class="donut">
      <circle class="donut-bg" cx="60" cy="60" r="50" fill="none" stroke="#eee" stroke-width="18"/>
      <circle class="donut-ring" cx="60" cy="60" r="50" fill="none" stroke="#3498db" stroke-width="18"
        stroke-dasharray="0 100" data-percent="${percent}" style="transition: stroke-dasharray 1s;"/>
      <text x="60" y="65" text-anchor="middle" font-size="28" fill="#2c3e50" font-weight="bold">${percent}%</text>
    </svg>
    <div style="text-align:center; color:#7f8c8d;">Taux d'occupation</div>
  `;
}

function renderBarChart(data) {
  const max = Math.max(...data.map(d => d.value), 1);
  return `
    <div class="bar-chart">
      ${data.map(d => `
        <div class="bar-group">
          <div class="bar-label">${d.label}</div>
          <div class="bar-outer">
            <div class="bar-inner" data-width="${(d.value / max * 100).toFixed(1)}%" style="width: ${(d.value / max * 100).toFixed(1)}%; background: #3498db;">
              <span class="bar-value">${d.value}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLineChart(data, color = '#27ae60') {
  const max = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => {
    const x = 30 + i * (320 / (data.length - 1));
    const y = 120 - (d.value / max * 100);
    return `${x},${y}`;
  }).join(' ');
  return `
    <svg width="380" height="140" class="line-chart">
      <polyline fill="none" stroke="${color}" stroke-width="3" points="${points}" />
      ${data.map((d, i) => {
        const x = 30 + i * (320 / (data.length - 1));
        const y = 120 - (d.value / max * 100);
        return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" />`;
      }).join('')}
      ${data.map((d, i) => {
        const x = 30 + i * (320 / (data.length - 1));
        return `<text x="${x}" y="135" font-size="12" text-anchor="middle" fill="#7f8c8d">${d.label}</text>`;
      }).join('')}
    </svg>
  `;
}