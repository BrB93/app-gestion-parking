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
        echo json_encode(array_map(function($notification) {
            return [
                'id' => $notification->getId(),
                'user_id' => $notification->getUserId(),
                'type' => $notification->getType(),
                'content' => $notification->getContent(),
                'is_read' => $notification->isRead(),
                'timestamp' => $notification->getTimestamp(),
                'time_ago' => $notification->getTimeAgo(),
                'type_label' => $notification->getTypeLabel()
            ];
        }, $notifications));
    }
    
    public function show($id) {
        Auth::requireAuthentication();
        
        $notification = $this->notificationRepo->getNotificationById($id);
        
        if (!$notification) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification non trouvée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if ($notification->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
            return;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'id' => $notification->getId(),
            'user_id' => $notification->getUserId(),
            'type' => $notification->getType(),
            'content' => $notification->getContent(),
            'is_read' => $notification->isRead(),
            'timestamp' => $notification->getTimestamp(),
            'time_ago' => $notification->getTimeAgo(),
            'type_label' => $notification->getTypeLabel()
        ]);
    }
    
    public function markAsRead($id) {
        Auth::requireAuthentication();
        
        $notification = $this->notificationRepo->getNotificationById($id);
        
        if (!$notification) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification non trouvée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if ($notification->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
            return;
        }
        
        $result = $this->notificationRepo->markAsRead($id);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Notification marquée comme lue']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour']);
        }
    }
    
    public function markAllAsRead() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $result = $this->notificationRepo->markAllAsRead($currentUser->getId());
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Toutes les notifications ont été marquées comme lues']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la mise à jour']);
        }
    }
    
    public function delete($id) {
        Auth::requireAuthentication();
        
        $notification = $this->notificationRepo->getNotificationById($id);
        
        if (!$notification) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification non trouvée']);
            return;
        }
        
        $currentUser = Auth::getCurrentUser();
        if ($notification->getUserId() !== $currentUser->getId() && $currentUser->getRole() !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès non autorisé']);
            return;
        }
        
        $result = $this->notificationRepo->deleteNotification($id);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Notification supprimée']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la suppression']);
        }
    }
    
    public function deleteAll() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $result = $this->notificationRepo->deleteAllNotifications($currentUser->getId());
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Toutes les notifications ont été supprimées']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de la suppression']);
        }
    }
    
    public function getUnreadCount() {
        Auth::requireAuthentication();
        $currentUser = Auth::getCurrentUser();
        
        $count = $this->notificationRepo->getUnreadCount($currentUser->getId());
        
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
        
        try {
            $notificationId = $this->notificationRepo->createNotification(
                $data['user_id'],
                $data['type'],
                $data['content']
            );
            
            if ($notificationId) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'notification_id' => $notificationId,
                    'message' => 'Notification créée avec succès'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Erreur lors de la création de la notification']);
            }
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}