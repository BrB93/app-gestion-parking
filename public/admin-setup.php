<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../backend/Kernel.php';

use Repositories\UserRepository;

$userRepo = new UserRepository();
$admins = $userRepo->getUsersByRole('admin');

$setupKey = $_GET['key'] ?? '';
$validSetupKey = 'setup_admin_2025';

if ($setupKey !== $validSetupKey) {
    die('Accès non autorisé');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($email) || empty($password)) {
        $error = "Tous les champs sont requis";
    } else {
        $result = $userRepo->createUser($username, $email, $password, 'admin');
        if ($result) {
            $success = "Compte admin créé avec succès. Ce script va s'auto-détruire.";
            header("refresh:5;url=/app-gestion-parking/public/login");
            
            @unlink(__FILE__);
        } else {
            $error = "Erreur lors de la création du compte admin";
        }
    }
}

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Configuration Admin - Gestion de Parking</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .setup-container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            text-align: center;
            color: #333;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #2980b9;
        }
        .error {
            color: #721c24;
            background-color: #f8d7da;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        .success {
            color: #155724;
            background-color: #d4edda;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <h1>Configuration Admin</h1>
        
        <?php if (!empty($error)): ?>
            <div class="error"><?= $error ?></div>
        <?php endif; ?>
        
        <?php if (!empty($success)): ?>
            <div class="success"><?= $success ?></div>
        <?php else: ?>
            <?php if (count($admins) > 0): ?>
                <div class="error">
                    Un compte administrateur existe déjà. Ce script ne peut pas être utilisé.
                    <p>Le script sera supprimé automatiquement.</p>
                </div>
                <?php 
                header("refresh:5;url=/app-gestion-parking/public/login");
                @unlink(__FILE__);
                ?>
            <?php else: ?>
                <form method="post">
                    <div class="form-group">
                        <label for="username">Nom d'utilisateur:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Mot de passe:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit">Créer compte administrateur</button>
                    </div>
                    
                    <p>Attention : Ce script s'auto-détruira après la création du compte admin.</p>
                </form>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</body>
</html>