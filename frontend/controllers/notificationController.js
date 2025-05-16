import { fetchJSON, postJSON } from '../core/fetchWrapper.js';
import { Notification } from '../models/notification.js';
import { renderNotifications, renderNotificationBadge } from '../views/notificationView.js';

export async function loadNotifications() {
    try {
        const response = await fetchJSON('/app-gestion-parking/public/api/notifications');
        const data = Array.isArray(response) ? response : [];
        console.log("Données de notifications reçues:", data);
        
        const notifications = data.map(n => new Notification(
            n.id,
            n.user_id,
            n.type,
            n.content,
            n.is_read,
            n.timestamp
        ));
        
        renderNotifications(notifications);
        setupNotificationEvents();
        return notifications;
    } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
        return [];
    }
}

export async function getUnreadCount() {
    try {
        const data = await fetchJSON('/app-gestion-parking/public/api/notifications/unread-count');
        const count = data.count || 0;
        
        renderNotificationBadge(count);
        return count;
    } catch (error) {
        console.error('Erreur lors du chargement du nombre de notifications non lues:', error);
        return 0;
    }
}

export async function markAsRead(notificationId) {
    try {
        const result = await postJSON(`/app-gestion-parking/public/api/notifications/${notificationId}/read`, {});
        if (result.success) {
            await refreshNotifications();
        }
        return result;
    } catch (error) {
        console.error(`Erreur lors du marquage de la notification ${notificationId} comme lue:`, error);
        return { error: error.message };
    }
}

export async function markAllAsRead() {
    try {
        const result = await postJSON('/app-gestion-parking/public/api/notifications/mark-all-read', {});
        if (result.success) {
            await refreshNotifications();
        }
        return result;
    } catch (error) {
        console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
        return { error: error.message };
    }
}

export async function deleteNotification(notificationId) {
    try {
        const result = await postJSON(`/app-gestion-parking/public/api/notifications/${notificationId}/delete`, {});
        if (result.success) {
            await refreshNotifications();
        }
        return result;
    } catch (error) {
        console.error(`Erreur lors de la suppression de la notification ${notificationId}:`, error);
        return { error: error.message };
    }
}

function setupNotificationEvents() {
    document.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const notificationId = button.getAttribute('data-id');
            await markAsRead(notificationId);
        });
    });
    
    document.querySelectorAll('.delete-notification-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const notificationId = button.getAttribute('data-id');
            await deleteNotification(notificationId);
        });
    });
    
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await markAllAsRead();
        });
    }
    
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async () => {
            const notificationId = item.getAttribute('data-id');
            if (notificationId) {
                await markAsRead(notificationId);
                
                // Vous pouvez rediriger vers une page spécifique selon le type de notification
                // const type = item.getAttribute('data-type');
                // const targetUrl = item.getAttribute('data-target');
                // if (targetUrl) {
                //     window.location.href = targetUrl;
                // }
            }
        });
    });
}

export async function refreshNotifications() {
    await loadNotifications();
    await getUnreadCount();
}

export function initializeNotifications() {
    getUnreadCount();
    
    setInterval(() => {
        getUnreadCount();
    }, 60000);
}

export function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
        if (panel.classList.contains('open')) {
            panel.classList.remove('open');
        } else {
            panel.classList.add('open');
            loadNotifications();
        }
    } else {
        const newPanel = document.createElement('div');
        newPanel.id = 'notification-panel';
        newPanel.className = 'notification-panel open';
        newPanel.innerHTML = '<div class="loading">Chargement des notifications...</div>';
        document.body.appendChild(newPanel);
        loadNotifications();
    }
}