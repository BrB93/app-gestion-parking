<?php
namespace Controllers;

use Repositories\NotificationRepository;
use Core\Auth;
use Core\Validator;

class NotificationController {
    private $notificationRepo;

    public function __construct() {
        $this->notificationRepo = new NotificationRepository();
    }

    public function index() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $notifications = $this->notificationRepo->getNotificationsByUserId($currentUser->getId());
        
        header('Content-Type: application/json');
        $notificationsArray = array_map(function($notification) {
            return [
                'id' => $notification->getId(),
                'user_id' => $notification->getUserId(),
                'type' => $notification->getType(),
                'content' => $notification->getContent(),
                'is_read' => $notification->isRead(),
                'timestamp' => $notification->getTimestamp()
            ];
        }, $notifications);
        
        echo json_encode($notificationsArray);
    }
    
    public function show($id) {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $notification = $this->notificationRepo->getNotificationById($id);
        
        if (!$notification) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification non trouvée']);
            return;
        }
        
        if ($notification->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé à cette notification']);
            return;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'id' => $notification->getId(),
            'type' => $notification->getType(),
            'content' => $notification->getContent(),
            'is_read' => $notification->isRead(),
            'timestamp' => $notification->getTimestamp()
        ]);
    }

    public function markAsRead($id) {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $notification = $this->notificationRepo->getNotificationById($id);
        
        if (!$notification) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification non trouvée']);
            return;
        }
        
        if ($notification->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé à cette notification']);
            return;
        }
        
        $success = $this->notificationRepo->markAsRead($id);
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Notification marquée comme lue']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour de la notification']);
        }
    }
    
    public function markAllAsRead() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $success = $this->notificationRepo->markAllAsRead($currentUser->getId());
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Toutes les notifications marquées comme lues']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour des notifications']);
        }
    }

    public function countUnread() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $count = $this->notificationRepo->countUnreadNotifications($currentUser->getId());
        
        echo json_encode(['count' => $count]);
    }
    
    public function create() {
        Auth::requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeData($data);
        
        if (!isset($data['user_id']) || !isset($data['type']) || !isset($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Données incomplètes']);
            return;
        }
        
        if (!in_array($data['type'], ['rappel', 'alerte'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Type de notification invalide']);
            return;
        }
        
        $notificationId = $this->notificationRepo->createNotification(
            $data['user_id'],
            $data['type'],
            $data['title'] ?? '',
            $data['content']
        );
        
        if ($notificationId > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Notification créée avec succès',
                'id' => $notificationId
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la création de la notification']);
        }
    }
    
    public function delete($id) {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $notification = $this->notificationRepo->getNotificationById($id);
        
        if (!$notification) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification non trouvée']);
            return;
        }
        
        if ($notification->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé à cette notification']);
            return;
        }
        
        $success = $this->notificationRepo->deleteNotification($id);
        
        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Notification supprimée avec succès']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la suppression de la notification']);
        }
    }
}