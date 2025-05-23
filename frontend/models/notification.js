export class Notification {
    constructor(id, userId, type, content, isRead = false, timestamp = null) {
        this.id = id;
        this.user_id = userId;
        this.type = type;
        this.content = content;
        this.is_read = isRead;
        this.timestamp = timestamp ? new Date(timestamp) : new Date();
        this.time_ago = '';
        this.type_label = '';
    }

    isAlert() {
        return this.type === 'alerte';
    }

    isReminder() {
        return this.type === 'rappel';
    }

    isRead() {
        return this.is_read;
    }

    getTypeLabel() {
        return this.isAlert() ? 'Alerte' : 'Rappel';
    }

    getTypeClass() {
        return this.isAlert() ? 'notification-alert' : 'notification-reminder';
    }

    getFormattedTimestamp() {
        return this.timestamp.toLocaleString('fr-FR');
    }

    getTimeAgo() {
        if (this.time_ago) return this.time_ago;
        
        const now = new Date();
        const diff = Math.floor((now - this.timestamp) / 1000);
        
        if (diff < 60) {
            return 'à l\'instant';
        } else if (diff < 3600) {
            const minutes = Math.floor(diff / 60);
            return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        } else if (diff < 2592000) {
            const days = Math.floor(diff / 86400);
            return `il y a ${days} jour${days > 1 ? 's' : ''}`;
        } else if (diff < 31536000) {
            const months = Math.floor(diff / 2592000);
            return `il y a ${months} mois`;
        } else {
            const years = Math.floor(diff / 31536000);
            return `il y a ${years} an${years > 1 ? 's' : ''}`;
        }
    }
}