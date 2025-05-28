import { markAsRead } from '../controllers/notificationController.js';

export function renderNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    const unreadNotifications = notifications.filter(notification => !notification.isRead());

    if (unreadNotifications.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <p>Vous n'avez pas de notifications non lues</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    unreadNotifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.getTypeClass()} unread`;
        notificationElement.dataset.id = notification.id;
        
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-type">${notification.getTypeLabel()}</span>
                    <span class="notification-time">${notification.getTimeAgo()}</span>
                </div>
                <div class="notification-body">
                    ${notification.content}
                </div>
            </div>
            <div class="notification-actions">
                <button class="mark-read-btn" data-id="${notification.id}"><i class="fas fa-check"></i> Marquer comme lu</button>
            </div>
        `;
        
        container.appendChild(notificationElement);
    });
    
    setupNotificationEventDelegation(container);
}

function setupNotificationEventDelegation(container) {
    container.removeEventListener('click', handleNotificationContainerClick);
    container.addEventListener('click', handleNotificationContainerClick);
}

function handleNotificationContainerClick(e) {
    const markReadBtn = e.target.closest('.mark-read-btn');
    if (markReadBtn) {
        e.preventDefault();
        
        if (markReadBtn.dataset.processing === 'true') {
            return;
        }
        
        const notificationId = markReadBtn.closest('.notification-item').dataset.id;
        markReadBtn.dataset.processing = 'true';
        markReadBtn.disabled = true;
        
        markAsRead(notificationId).then(() => {
            const notificationElement = markReadBtn.closest('.notification-item');
            const notificationsContainer = notificationElement.parentNode;
            notificationElement.classList.remove('unread');
            markReadBtn.style.display = 'none';
            
            notificationElement.style.opacity = '0';
            notificationElement.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                if (notificationElement.parentNode) {
                    notificationElement.parentNode.removeChild(notificationElement);
                    
                    if (notificationsContainer.querySelectorAll('.notification-item').length === 0) {
                        notificationsContainer.innerHTML = `
                            <div class="notification-empty">
                                <p>Vous n'avez pas de notifications non lues</p>
                            </div>
                        `;
                    }
                }
            }, 500);
        }).finally(() => {
            markReadBtn.dataset.processing = 'false';
            markReadBtn.disabled = false;
        });
    }
}

export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<p>${message}</p>`;
    
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

export function addNotificationBadge(container) {
    if (!container) return;
    
    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.style.display = 'none';
    
    container.classList.add('has-badge');
    container.appendChild(badge);
    
    return badge;
}