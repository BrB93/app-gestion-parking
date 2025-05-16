export function renderNotifications(notifications) {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    
    let html = `
        <div class="notification-panel-header">
            <h3>Notifications</h3>
            <div class="notification-actions">
                <button id="mark-all-read" class="btn-secondary btn-sm">Tout marquer comme lu</button>
                <button id="close-notifications" class="btn-close">&times;</button>
            </div>
        </div>
        <div class="notification-list">
    `;
    
    if (notifications.length === 0) {
        html += `<div class="notification-empty">Aucune notification</div>`;
    } else {
        notifications.forEach(notification => {
            html += `
                <div class="notification-item ${notification.isUnread() ? 'unread' : ''} ${notification.getTypeClass()}" 
                     data-id="${notification.id}" 
                     data-type="${notification.type}">
                    <div class="notification-content">
                        <div class="notification-header">
                            <span class="notification-type">${notification.getTypeLabel()}</span>
                            <span class="notification-time">${notification.getTimeAgo()}</span>
                        </div>
                        <div class="notification-body">${notification.content}</div>
                    </div>
                    <div class="notification-actions">
                        ${notification.isUnread() ? 
                            `<button class="mark-read-btn" data-id="${notification.id}" title="Marquer comme lu">
                                <i class="fas fa-check"></i>
                            </button>` : 
                            ''
                        }
                        <button class="delete-notification-btn" data-id="${notification.id}" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div>`;
    
    panel.innerHTML = html;
    
    document.getElementById('close-notifications').addEventListener('click', () => {
        panel.classList.remove('open');
    });
}

export function renderNotificationBadge(count) {
    let notificationBtn = document.getElementById('notification-btn');
    
    if (!notificationBtn) {
        const nav = document.querySelector('nav');
        if (!nav) return;
        
        notificationBtn = document.createElement('button');
        notificationBtn.id = 'notification-btn';
        notificationBtn.className = 'notification-btn';
        notificationBtn.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="notification-badge"></span>
        `;
        
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.prepend(notificationBtn);
        } else {
            nav.appendChild(notificationBtn);
        }
        
        notificationBtn.addEventListener('click', () => {
            import('../controllers/notificationController.js').then(module => {
                module.toggleNotificationPanel();
            });
        });
    }
    
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}