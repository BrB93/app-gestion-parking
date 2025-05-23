import { markAsRead, deleteNotification } from '../controllers/notificationController.js';

export function renderNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <p>Vous n'avez pas de notifications</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.getTypeClass()} ${notification.isRead() ? '' : 'unread'}`;
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
                <div class="notification-actions">
                    ${!notification.isRead() ? 
                        `<button class="mark-read-btn btn-sm">Marquer comme lu</button>` : ''}
                    <button class="delete-notification-btn btn-sm btn-danger">Supprimer</button>
                </div>
            </div>
        `;
        
        container.appendChild(notificationElement);
    });
    
}

export function showToast(message, type = 'info', duration = 3000) {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        if (toast.dataset.autoDismiss === 'true') {
            toast.remove();
        }
    });
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.dataset.autoDismiss = 'true';
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        </div>
    `;
    
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        const newToastContainer = document.createElement('div');
        newToastContainer.className = 'toast-container';
        document.body.appendChild(newToastContainer);
        newToastContainer.appendChild(toast);
    } else {
        toastContainer.appendChild(toast);
    }
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add('toast-hiding');
            setTimeout(() => toast.remove(), 500);
        }, duration);
    }
    
    return toast;
}

(function addToastStyles() {
    if (document.getElementById('toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            padding: 12px 16px;
            min-width: 280px;
            max-width: 350px;
            animation: toast-slide-in 0.3s ease-out;
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .toast-hiding {
            opacity: 0;
            transform: translateX(100%);
        }
        
        .toast-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .toast-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #999;
        }
        
        .toast-close:hover {
            color: #333;
        }
        
        .toast-info {
            border-left: 4px solid #3498db;
        }
        
        .toast-success {
            border-left: 4px solid #2ecc71;
        }
        
        .toast-warning {
            border-left: 4px solid #f39c12;
        }
        
        .toast-error {
            border-left: 4px solid #e74c3c;
        }
        
        @keyframes toast-slide-in {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    document.head.appendChild(style);
})();

export function addNotificationBadge() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const existingLink = document.querySelector('a[href="/app-gestion-parking/public/notifications"]');
    if (existingLink) {
        if (!existingLink.querySelector('.notification-badge')) {
            existingLink.innerHTML = `
                Notifications 
                <span class="notification-badge" style="display: none;">0</span>
            `;
        }
        return;
    }
    
    const notificationLink = document.createElement('a');
    notificationLink.href = '/app-gestion-parking/public/notifications';
    notificationLink.innerHTML = `
        Notifications 
        <span class="notification-badge" style="display: none;">0</span>
    `;
    
    notificationLink.style.position = 'relative';
    
    navLinks.appendChild(notificationLink);
}