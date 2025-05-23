import { fetchJSON, postJSON } from '../core/fetchWrapper.js';
import { Notification } from '../models/notification.js';
import { renderNotifications, showToast } from '../views/notificationView.js';

let notificationsCache = [];
let unreadCount = 0;

export async function loadNotifications() {
    try {
        const response = await fetch('/app-gestion-parking/public/api/notifications');
        
        if (!response.ok) {
            console.error('Erreur lors du chargement des notifications:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Détails:', errorText);
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.error('Les données de notifications reçues ne sont pas un tableau:', data);
            return [];
        }
        
        const notifications = data.map(n => {
            const notification = new Notification(
                n.id,
                n.user_id,
                n.type,
                n.content,
                n.is_read,
                n.timestamp
            );
            notification.time_ago = n.time_ago || '';
            notification.type_label = n.type_label || '';
            return notification;
        });
        
        notificationsCache = notifications;
        unreadCount = notifications.filter(n => !n.is_read).length;
        
        updateNotificationBadge();
        renderNotifications(notifications);
        setupNotificationEvents();
        
        return notifications;
    } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
        const container = document.getElementById('notifications-container');
        if (container) {
            container.innerHTML = `<p class="error-message">Erreur lors du chargement des notifications: ${error.message}</p>`;
        }
        return [];
    }
}

export async function markAsRead(notificationId) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/notifications/${notificationId}/read`, {});
        
        if (response.success) {
            const notification = notificationsCache.find(n => n.id == notificationId);
            if (notification) {
                notification.is_read = true;
                unreadCount = Math.max(0, unreadCount - 1);
                updateNotificationBadge();
            }
        }
        
        return response;
    } catch (error) {
        console.error(`Erreur lors du marquage de la notification ${notificationId} comme lue:`, error);
        return { error: error.message };
    }
}

export async function markAllAsRead() {
    try {
        const response = await postJSON('/app-gestion-parking/public/api/notifications/mark-all-read', {});
        
        if (response.success) {
            notificationsCache.forEach(n => n.is_read = true);
            unreadCount = 0;
            updateNotificationBadge();
            renderNotifications(notificationsCache);
            showToast('Toutes les notifications ont été marquées comme lues', 'success');
        }
        
        return response;
    } catch (error) {
        console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
        showToast('Erreur: impossible de marquer les notifications comme lues', 'error');
        return { error: error.message };
    }
}

export async function deleteNotification(notificationId) {
    try {
        const response = await postJSON(`/app-gestion-parking/public/api/notifications/${notificationId}/delete`, {});
        
        if (response.success) {
            const index = notificationsCache.findIndex(n => n.id == notificationId);
            if (index !== -1) {
                if (!notificationsCache[index].is_read) {
                    unreadCount = Math.max(0, unreadCount - 1);
                }
                notificationsCache.splice(index, 1);
                updateNotificationBadge();
                renderNotifications(notificationsCache);
            }
            showToast('Notification supprimée', 'success');
        }
        
        return response;
    } catch (error) {
        console.error(`Erreur lors de la suppression de la notification ${notificationId}:`, error);
        showToast('Erreur: impossible de supprimer la notification', 'error');
        return { error: error.message };
    }
}

export async function deleteAllNotifications() {
    try {
        const response = await postJSON('/app-gestion-parking/public/api/notifications/delete-all', {});
        
        if (response.success) {
            notificationsCache = [];
            unreadCount = 0;
            updateNotificationBadge();
            renderNotifications([]);
            showToast('Toutes les notifications ont été supprimées', 'success');
        }
        
        return response;
    } catch (error) {
        console.error('Erreur lors de la suppression de toutes les notifications:', error);
        showToast('Erreur: impossible de supprimer les notifications', 'error');
        return { error: error.message };
    }
}

export async function getUnreadCount() {
    try {
        const data = await fetchJSON('/app-gestion-parking/public/api/notifications/unread-count');
        unreadCount = data.count;
        updateNotificationBadge();
        return unreadCount;
    } catch (error) {
        console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
        return 0;
    }
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

export function setupNotificationEvents() {
    const markAllReadBtn = document.getElementById('mark-all-notifications-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }
    
    const deleteAllBtn = document.getElementById('delete-all-notifications');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer toutes vos notifications ?')) {
                deleteAllNotifications();
            }
        });
    }
    
    document.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const notificationId = button.closest('.notification-item').dataset.id;
            markAsRead(notificationId).then(() => {
                const notificationElement = button.closest('.notification-item');
                notificationElement.classList.remove('unread');
                button.style.display = 'none';
            });
        });
    });
    
    document.querySelectorAll('.delete-notification-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const notificationId = button.closest('.notification-item').dataset.id;
            deleteNotification(notificationId);
        });
    });
}

export function initializeNotifications() {
    getUnreadCount();
    
    setInterval(getUnreadCount, 60000);
    
    setTimeout(showUnreadNotificationsToast, 3000);
}

async function showUnreadNotificationsToast() {
    if (unreadCount > 0) {
        const data = await fetchJSON('/app-gestion-parking/public/api/notifications');
        
        const unreadNotifications = data
            .filter(n => !n.is_read)
            .slice(0, 3)
            .map(n => n.content);
            
        if (unreadNotifications.length > 0) {
            showToast(`Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`, 'info', 5000);
        }
    }
}