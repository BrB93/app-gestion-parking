# SmartPark - Application de Gestion de Parking

## 📋 Présentation

SmartPark est une application web complète de gestion de parking permettant la location de places de stationnement entre particuliers. Elle offre une interface intuitive pour les utilisateurs qui souhaitent réserver des places de parking, pour les propriétaires qui souhaitent louer leurs places, et pour les administrateurs qui gèrent l'ensemble du système.

![SmartPark Logo](https://placeholder.com/logo.png)

## ✨ Fonctionnalités principales

- **Gestion des utilisateurs** avec trois rôles distincts (utilisateur, propriétaire, administrateur)
- **Gestion des places de parking** avec différents types (standard, PMR, électrique, réservée)
- **Système de réservation** en temps réel
- **Gestion des paiements** via différentes méthodes (CB, PayPal)
- **Système de tarification dynamique** selon le jour et l'heure
- **Notifications** pour les réservations, paiements, etc.
- **Profils utilisateurs** avec informations personnelles et véhicules
- **Vue interactive 2D** du parking avec état des places en temps réel
- **Interface d'administration** complète
- **Conformité RGPD** intégrée

## 🛠 Technologies utilisées

### Backend
- PHP 8.x
- Architecture MVC personnalisée
- PDO pour les interactions avec la base de données
- MySQL/MariaDB

### Frontend
- JavaScript ES6+
- HTML5/CSS3
- Architecture modulaire avec contrôleurs et vues
- Système de routage côté client
- Fetch API pour les requêtes AJAX

### Sécurité
- Validation et sanitisation des entrées utilisateur
- Protection contre les injections SQL
- Sessions sécurisées
- Hachage des mots de passe
- Protection CSRF
- Conformité RGPD

## 📁 Structure du projet

```
app-gestion-parking/
├── backend/
│   ├── Controllers/       # Contrôleurs PHP
│   ├── Core/              # Classes principales (Auth, Database, Validator)
│   ├── Models/            # Modèles de données
│   ├── Repositories/      # Couche d'accès aux données
│   └── Kernel.php         # Point d'entrée backend
├── frontend/
│   ├── controllers/       # Contrôleurs JavaScript
│   ├── models/            # Modèles de données JavaScript
│   ├── views/             # Vues et templates
│   ├── core/              # Utilitaires et classes de base
│   └── app.js             # Point d'entrée frontend
├── public/
│   ├── api/               # Endpoints API (générés par le routeur)
│   ├── assets/            # Ressources statiques (CSS, images)
│   ├── .htaccess          # Configuration Apache
│   └── index.php          # Contrôleur frontal
├── vendor/                # Dépendances externes
├── .env                   # Configuration d'environnement
├── .gitignore             # Configuration Git
└── README.md              # Documentation
```

## 📥 Installation

### Prérequis
- PHP 8.0 ou supérieur
- MySQL 5.7 ou supérieur
- Serveur web (Apache, Nginx)
- Composer (optionnel)

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/votre-username/app-gestion-parking.git
   cd app-gestion-parking
   ```

2. **Configuration de la base de données**
   - Créer une base de données MySQL nommée `app_gestion_parking`
   - Importer le schéma depuis `database/schema.sql`

3. **Configuration de l'environnement**
   - Copier le fichier `.env.example` vers .env
   - Modifier les valeurs dans .env avec vos informations de connexion à la base de données
   ```
   DB_HOST=localhost
   DB_NAME=app_gestion_parking
   DB_USER=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   ```

4. **Installation des dépendances** (si utilisation de Composer)
   ```bash
   composer install
   ```

5. **Configuration du serveur web**
   - Configurer le serveur web pour pointer vers le dossier public
   - Assurer que le module `mod_rewrite` est activé (Apache)

6. **Créer un compte administrateur**
   - Accéder à `http://votre-domaine/app-gestion-parking/public/admin-setup.php?key=setup_admin_2025`
   - Suivre les instructions pour créer votre premier compte administrateur

## 🚗 Utilisation

### Types d'utilisateurs

- **Administrateur** : Accès complet à toutes les fonctionnalités et gestion du système
- **Propriétaire** : Peut gérer ses places de parking, suivre les réservations et les paiements
- **Utilisateur** : Peut réserver des places de parking et gérer ses réservations

### Réservation d'une place

1. Se connecter en tant qu'utilisateur
2. Naviguer vers "Places de parking"
3. Filtrer les places disponibles selon vos critères
4. Sélectionner une place et cliquer sur "Réserver"
5. Choisir la date et l'heure de début et de fin
6. Confirmer et procéder au paiement

### Gestion des places (Propriétaires)

1. Se connecter en tant que propriétaire
2. Voir les réservations actuelles et à venir de vos places
3. Consulter l'historique des paiements
4. Modifier les paramètres de vos places

### Administration

1. Se connecter en tant qu'administrateur
2. Accéder au tableau de bord administrateur
3. Gérer les utilisateurs, places, réservations et paiements
4. Consulter les statistiques d'utilisation

## 🛡️ Sécurité et RGPD

### Mesures de sécurité
- Validation et assainissement de toutes les entrées utilisateur
- Protection contre les injections SQL via PDO
- Hachage des mots de passe avec algorithmes modernes
- Gestion sécurisée des sessions
- Contrôle d'accès strict basé sur les rôles

### Conformité RGPD
L'application est conçue en tenant compte des exigences du RGPD :
- Politique de confidentialité claire accessible via le pied de page
- Mécanismes pour permettre aux utilisateurs d'exercer leurs droits (accès, rectification, suppression)
- Sécurisation des données personnelles
- Collecte minimale d'informations (seules les données nécessaires sont demandées)

Pour plus d'informations sur le RGPD, vous pouvez consulter [le site officiel de la CNIL](https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on).

## 🔄 Maintenance

### Base de données
- Des sauvegardes régulières de la base de données sont recommandées
- Un script de maintenance est disponible dans `scripts/maintenance.php`

### Mise à jour
1. Sauvegarder la base de données et les fichiers
2. Récupérer les dernières modifications depuis le dépôt
3. Exécuter les migrations si nécessaire
4. Tester le bon fonctionnement de l'application

## 📊 Tableau de bord et statistiques

L'application inclut un tableau de bord complet qui affiche :
- Taux d'occupation des places
- Revenu généré par période
- Répartition des types d'utilisateurs
- Statistiques de réservation
- Taux de conversion des paiements

## 🚀 Développements futurs

- Application mobile pour iOS et Android
- Intégration de systèmes de reconnaissance automatique de plaques d'immatriculation
- Fonctionnalité de réservation récurrente
- Système de fidélité pour les utilisateurs réguliers
- Intégration de plus de méthodes de paiement
- Module d'analyse prédictive de la demande

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 👥 Contributeurs

- [Votre Nom](https://github.com/votre-username) - Développeur principal

## 📞 Contact

Pour toute question ou suggestion, veuillez nous contacter à support@smartpark.fr

---

© 2025 SmartPark - Tous droits réservés