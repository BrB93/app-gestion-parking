export class Notification {
    constructor(id, userId, type, content, isRead = false, timestamp = null) {
        this.id = id;
        this.user_id = userId;
        this.type = type;
        this.content = content;
        this.is_read = isRead;
        this.timestamp = timestamp ? new Date(timestamp) : new Date();
    }
    
    isUnread() {
        return !this.is_read;
    }
    
    getTypeLabel() {
        switch (this.type) {
            case 'rappel': return 'Rappel';
            case 'alerte': return 'Alerte';
            default: return this.type;
        }
    }
    
    getTypeClass() {
        switch (this.type) {
            case 'rappel': return 'notification-reminder';
            case 'alerte': return 'notification-alert';
            default: return '';
        }
    }
    
    getFormattedDate() {
        return this.timestamp.toLocaleString('fr-FR');
    }
    
    getTimeAgo() {
        const now = new Date();
        const diffMs = now - this.timestamp;
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);
        
        if (diffSec < 60) {
            return 'à l\'instant';
        } else if (diffMin < 60) {
            return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
        } else if (diffHour < 24) {
            return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
        } else if (diffDay < 30) {
            return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
        } else {
            return this.getFormattedDate();
        }
    }
}