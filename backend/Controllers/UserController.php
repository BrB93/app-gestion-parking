<?php
namespace Controllers;
use Repositories\UserRepository;

class UserController {
    private $userRepo;

    public function __construct() {
        $this->userRepo = new UserRepository();
    }

    public function index() {
        $users = $this->userRepo->getAllUsers();
        
        error_log('Users: ' . print_r($users, true));
        
        header('Content-Type: application/json');
        $usersArray = array_map(function($user) {
            return [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'role' => $user->getRole()
            ];
        }, $users);
        
        error_log('JSON: ' . json_encode($usersArray));
        
        echo json_encode($usersArray);
    }
}