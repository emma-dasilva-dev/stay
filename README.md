 # STAY — Plateforme Full-Stack de Réservation et de Gestion Hôtelière

> Une plateforme web premium permettant de découvrir des hôtels et resorts au Bénin, d'effectuer des demandes de réservation et de gérer l'ensemble du processus depuis des espaces sécurisés dédiés aux clients, aux employés et à l'administration.

---

## Développeuse

**Emma DA SILVA**  
Développeuse Full-Stack  
Créatrice et développeuse de **STAY**

Projet développé dans le cadre d'un stage informatique.

---

## À propos de STAY

**STAY** est une application web full-stack de découverte, de réservation et de gestion hôtelière conçue pour mettre en valeur une sélection d'hôtels, de resorts et de lodges au Bénin.

La plateforme permet aux visiteurs de découvrir différentes destinations, de consulter leurs informations principales et d'envoyer une demande de réservation.

STAY ne fonctionne pas comme une plateforme de réservation instantanée classique.

Le fonctionnement repose sur un système de **demande de réservation** :

1. Le voyageur choisit une destination.
2. Il renseigne les informations de son séjour.
3. La demande est enregistrée dans la base de données.
4. L'équipe STAY reçoit la demande.
5. La réservation est traitée et suivie depuis un espace sécurisé.
6. Le client peut être contacté par téléphone ou WhatsApp.
7. Le statut de la réservation évolue jusqu'à sa finalisation.

La plateforme dispose de plusieurs niveaux d'accès distincts :

- un site public ;
- un espace client ;
- un espace employé ;
- un espace Super Admin.

L'application est développée en **français par défaut** et adopte une identité visuelle premium, minimaliste et responsive.

---

# Objectifs du projet

STAY a été conçu pour répondre à plusieurs objectifs :

- faciliter la découverte d'hôtels et de resorts au Bénin ;
- centraliser les demandes de réservation ;
- permettre les réservations avec ou sans compte client ;
- offrir aux clients un historique personnel de leurs réservations ;
- fournir aux employés un espace opérationnel sécurisé ;
- permettre au Super Admin de superviser les réservations, les clients et l'équipe ;
- séparer clairement les différents niveaux d'accès ;
- proposer une expérience moderne sur ordinateur, tablette et mobile ;
- construire une architecture full-stack maintenable et évolutive ;
- préparer l'application à un futur déploiement en production.

---

# Fonctionnalités principales

## 1. Site public

Le site public permet aux visiteurs de :

- découvrir l'univers de STAY ;
- consulter une sélection de destinations au Bénin ;
- découvrir les hôtels, resorts et lodges disponibles ;
- consulter leur localisation ;
- consulter une description de chaque établissement ;
- voir les prix indicatifs à partir des données enregistrées ;
- filtrer et explorer les destinations ;
- sélectionner une destination ;
- accéder au formulaire de réservation ;
- consulter la FAQ ;
- accéder à leur compte personnel ;
- accéder discrètement au portail réservé aux employés.

### Routes publiques

```text
/
├── /destinations
├── /booking
├── /faq
└── /account
```

---

# 2. Gestion des destinations

Les destinations sont récupérées dynamiquement depuis la base de données à travers l'API.

Chaque destination peut contenir :

- un nom ;
- un slug unique ;
- une localisation ;
- une description courte ;
- une catégorie ;
- un prix de départ en FCFA ;
- une image ;
- un statut actif ou inactif ;
- un statut de destination mise en avant.

Les catégories permettent d'organiser les établissements selon leur expérience, par exemple :

- escapade urbaine ;
- bord de mer ;
- nature et calme.

Les images des destinations sont servies par le backend depuis :

```text
/backend/uploads/destinations/
```

Exemple :

```text
/uploads/destinations/sofitel/main.jpg
```

---

# 3. Système de réservation

STAY permet à deux types de visiteurs d'effectuer une demande de réservation :

- les visiteurs sans compte ;
- les utilisateurs connectés.

Lorsqu'un utilisateur authentifié effectue une réservation, celle-ci est automatiquement liée à son compte.

Une réservation contient notamment :

- une référence unique ;
- la destination sélectionnée ;
- le nom du client ;
- l'adresse e-mail ;
- le numéro de téléphone ;
- la date d'arrivée ;
- la date de départ ;
- le nombre d'adultes ;
- le nombre d'enfants ;
- une demande particulière facultative ;
- une estimation du montant du séjour ;
- une méthode de contact ;
- un statut.

Chaque réservation reçoit une référence unique générée automatiquement.

Exemple :

```text
STAY-20260721-XXXX
```

---

## Méthodes de contact

Le client peut poursuivre sa demande principalement via :

- WhatsApp ;
- téléphone.

La réservation enregistrée peut ensuite être traitée par l'équipe STAY depuis les espaces sécurisés.

---

# 4. Statuts des réservations

Le cycle de vie d'une réservation repose sur cinq statuts :

```text
En attente
Contactée
Confirmée
Annulée
Terminée
```

Correspondance technique :

```text
pending
contacted
confirmed
cancelled
completed
```

### En attente

La réservation vient d'être créée et doit encore être traitée.

### Contactée

Le client a été contacté ou le suivi est en cours.

### Confirmée

La demande a été validée.

### Annulée

La demande a été annulée.

### Terminée

Le traitement ou le séjour est considéré comme terminé.

Les réservations terminées disposent également d'une section dédiée dans l'espace Super Admin afin de garder les listes opérationnelles plus propres.

---

# 5. Espace client

L'espace client permet aux utilisateurs de gérer leur relation avec STAY.

Les utilisateurs peuvent :

- créer un compte ;
- se connecter ;
- se déconnecter ;
- consulter leurs informations ;
- effectuer une réservation en étant authentifiés ;
- retrouver leurs réservations ;
- suivre le statut de leurs demandes ;
- consulter leur historique.

### Authentification client

Les comptes utilisent :

- une adresse e-mail ;
- un mot de passe sécurisé ;
- un rôle utilisateur.

Les rôles principaux du système public sont :

```text
customer
admin
```

Un utilisateur avec le rôle `customer` accède à son espace personnel.

Un utilisateur avec le rôle `admin` est redirigé vers l'espace d'administration.

---

# 6. Espace Super Admin

L'espace Super Admin est accessible via :

```text
/admin
```

Il est protégé par authentification et contrôle du rôle administrateur.

Le Super Admin dispose des sections suivantes :

```text
Tableau de bord
Réservations
Clients
Équipe
Terminées
```

---

## Tableau de bord

Le tableau de bord permet d'obtenir rapidement une vision de l'activité opérationnelle.

Il présente notamment :

- les demandes à traiter ;
- les réservations confirmées ;
- le nombre de clients enregistrés ;
- les réservations prioritaires en attente ;
- des accès rapides aux principales sections d'administration.

L'interface suit le même système visuel que l'espace employé afin de maintenir une expérience cohérente dans toute la plateforme.

---

## Gestion des réservations

Le Super Admin peut :

- consulter toutes les réservations ;
- rechercher une réservation ;
- rechercher par référence, client ou destination ;
- filtrer les réservations par statut ;
- ouvrir les détails complets d'une réservation ;
- consulter les coordonnées du client ;
- consulter les informations du séjour ;
- consulter le montant estimé ;
- consulter la demande particulière ;
- contacter le client ;
- modifier le statut d'une réservation.

Les lignes du tableau sont interactives afin de conserver une interface simple et épurée.

---

## Gestion des clients

Le Super Admin peut :

- consulter la liste des clients ;
- rechercher un client ;
- consulter ses coordonnées ;
- consulter la date de création de son compte ;
- consulter le nombre de réservations ;
- ouvrir son profil ;
- consulter son historique de réservation ;
- contacter le client par e-mail ;
- appeler le client ;
- ouvrir une conversation WhatsApp.

---

## Gestion de l'équipe

Le Super Admin peut gérer les membres de l'équipe STAY.

Il peut :

- consulter les employés ;
- créer un nouvel employé ;
- modifier ses informations ;
- choisir son rôle ;
- consulter son statut ;
- activer son accès ;
- désactiver son accès ;
- consulter sa dernière connexion ;
- générer un nouveau code PIN temporaire ;
- réinitialiser son code PIN si nécessaire.

Les rôles actuellement utilisés sont :

```text
Manager
Agent de réservation
```

Correspondance technique :

```text
manager
reservation_agent
```

---

## Section Terminées

Une section dédiée permet de consulter uniquement les réservations dont le statut est :

```text
completed
```

Cette séparation permet de conserver les réservations actives et les réservations terminées dans des espaces distincts.

La section permet notamment de :

- consulter toutes les réservations terminées ;
- rechercher une réservation terminée ;
- ouvrir les détails ;
- consulter l'historique ;
- modifier à nouveau le statut si nécessaire.

---

# 7. Espace employé

L'espace employé est complètement séparé de l'espace Super Admin.

### Portail de connexion

```text
/staff
```

### Tableau de bord employé

```text
/staff/dashboard
```

L'employé se connecte avec :

- son adresse e-mail ;
- un code PIN personnel à 6 chiffres.

L'espace employé possède son propre système d'authentification et sa propre session.

Les employés ne peuvent pas utiliser leur session pour accéder aux routes réservées au Super Admin.

---

## Fonctionnalités de l'espace employé

Selon son rôle opérationnel, un employé peut :

- accéder à son tableau de bord ;
- consulter les réservations ;
- rechercher les réservations ;
- filtrer les réservations ;
- consulter les détails d'une réservation ;
- modifier le statut d'une réservation ;
- consulter les clients ;
- rechercher les clients ;
- consulter l'historique d'un client ;
- contacter un client ;
- consulter son profil ;
- se déconnecter de manière sécurisée.

Les rôles opérationnels actuels sont :

```text
manager
reservation_agent
```

Les fonctionnalités sensibles réservées au Super Admin restent séparées.

Un employé ne peut donc pas :

- créer d'autres employés ;
- gérer les comptes de l'équipe ;
- réinitialiser les PIN des autres employés ;
- accéder aux routes Super Admin.

---

# 8. Sécurité de l'espace employé

Le système employé possède plusieurs mécanismes de sécurité.

### Authentification séparée

Les employés utilisent un token JWT distinct des comptes clients et administrateurs.

Les sessions utilisent également des clés de stockage différentes côté frontend.

### Vérification de session

L'accès à l'espace employé vérifie notamment :

- la validité du token ;
- l'existence de l'employé ;
- la session active ;
- le statut actif du compte ;
- le rôle de l'employé.

### Protection contre les tentatives répétées

Après plusieurs tentatives de connexion incorrectes, le compte employé peut être temporairement verrouillé.

Configuration actuelle :

```text
5 tentatives incorrectes maximum
15 minutes de verrouillage
```

### Journalisation

Les actions importantes liées à l'espace employé peuvent être enregistrées afin de conserver une trace des opérations réalisées.

---

# 9. Architecture technique

STAY utilise une architecture full-stack séparant clairement le frontend, le backend et la base de données.

```text
UTILISATEUR
    │
    ▼
FRONTEND REACT
    │
    │ Requêtes HTTP / JSON
    ▼
API REST EXPRESS
    │
    ▼
MYSQL
```

Le frontend ne communique pas directement avec MySQL.

Toutes les opérations passent par l'API backend.

---

# 10. Technologies utilisées

## Frontend

- React 19
- Vite
- React Router
- JavaScript
- CSS
- Fetch API
- Fontsource

## Backend

- Node.js
- Express.js
- JavaScript CommonJS
- REST API

## Base de données

- MySQL 8
- `mysql2/promise`

## Authentification et sécurité

- JSON Web Token
- bcryptjs
- contrôle des rôles
- middleware d'authentification
- sessions séparées pour les employés
- verrouillage temporaire des comptes employés

## Outils backend supplémentaires

- CORS
- dotenv
- multer
- nodemailer
- nodemon

## Gestion de versions

- Git
- GitHub

---

# 11. Architecture des accès

STAY possède trois systèmes d'utilisation principaux.

```text
PUBLIC / CLIENT
        │
        ├── Découverte
        ├── Réservation
        ├── Compte
        └── Historique

EMPLOYÉ
        │
        ├── Réservations
        ├── Clients
        ├── Gestion opérationnelle
        └── Profil

SUPER ADMIN
        │
        ├── Tableau de bord
        ├── Réservations
        ├── Clients
        ├── Équipe
        └── Terminées
```

Cette séparation évite de mélanger les responsabilités entre les différents utilisateurs du système.

---

# 12. Routes Frontend

| Route | Description |
|---|---|
| `/` | Présentation de STAY |
| `/destinations` | Liste et découverte des destinations |
| `/booking` | Formulaire de réservation |
| `/faq` | Questions fréquentes |
| `/account` | Authentification et espace client |
| `/staff` | Portail de connexion des employés |
| `/staff/dashboard` | Espace de travail des employés |
| `/admin` | Tableau de bord Super Admin |

---

# 13. API Backend

L'API utilise le préfixe :

```text
/api
```

---

## Santé de l'API

```http
GET /api/health
```

Permet de vérifier que l'API STAY fonctionne correctement.

---

## Authentification client et administrateur

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

## Destinations

```http
GET /api/destinations
```

Retourne les destinations actives disponibles sur la plateforme.

---

## Réservations client

```http
POST /api/bookings
GET  /api/bookings/my-bookings
```

`POST /api/bookings` accepte les visiteurs ainsi que les utilisateurs authentifiés.

`GET /api/bookings/my-bookings` nécessite un compte connecté.

---

## Super Admin

```http
GET   /api/admin/stats

GET   /api/admin/bookings
PATCH /api/admin/bookings/:bookingId/status

GET   /api/admin/customers

GET   /api/admin/employees
POST  /api/admin/employees
PUT   /api/admin/employees/:employeeId
PATCH /api/admin/employees/:employeeId/status
POST  /api/admin/employees/:employeeId/reset-pin
```

Toutes les routes `/api/admin/*` nécessitent :

- un token valide ;
- un compte ayant le rôle administrateur.

---

## Authentification employé

```http
POST /api/employee-auth/login
GET  /api/employee-auth/me
POST /api/employee-auth/logout
```

---

## Espace employé

```http
GET   /api/employee/bookings
PATCH /api/employee/bookings/:bookingId/status
GET   /api/employee/customers
```

Ces routes nécessitent :

- une session employé valide ;
- un compte actif ;
- un rôle opérationnel autorisé.

---

# 14. Base de données

STAY utilise **MySQL 8** avec le moteur **InnoDB** et l'encodage :

```text
utf8mb4
```

La base de données stocke principalement :

- les utilisateurs ;
- les destinations ;
- les réservations ;
- les employés ;
- les sessions employées ;
- les informations de sécurité des comptes employés ;
- les journaux d'activité.

---

## Table utilisateurs

La table des utilisateurs contient notamment :

- l'identifiant ;
- le nom complet ;
- l'adresse e-mail ;
- le téléphone ;
- le mot de passe haché ;
- le rôle ;
- les dates de création et de modification.

---

## Table destinations

Elle contient notamment :

- le nom ;
- le slug ;
- la localisation ;
- la description ;
- la catégorie ;
- le prix de départ ;
- le chemin de l'image ;
- le statut de mise en avant ;
- le statut actif.

---

## Table réservations

Elle contient notamment :

- la référence ;
- le client associé lorsque disponible ;
- la destination ;
- les coordonnées du voyageur ;
- les dates du séjour ;
- le nombre de voyageurs ;
- les demandes particulières ;
- le montant estimé ;
- le statut ;
- la méthode de contact.

Des clés étrangères relient les réservations :

- aux utilisateurs ;
- aux destinations.

La base contient également plusieurs index pour optimiser les recherches fréquentes.

---

# 15. Structure générale du projet

```text
STAY/
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   │
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   └── Logo/
│   │   │
│   │   ├── pages/
│   │   │   ├── About/
│   │   │   ├── Account/
│   │   │   ├── Admin/
│   │   │   ├── Booking/
│   │   │   ├── Destinations/
│   │   │   ├── EmployeeDashboard/
│   │   │   ├── EmployeePortal/
│   │   │   └── FAQ/
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── backend/
│   │
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   │   └── destinations/
│   │
│   ├── server.js
│   └── package.json
│
├── database/
│   └── fichiers SQL de la base de données
│
└── README.md
```

---

# 16. Installation locale

## Prérequis

Avant de démarrer STAY, installer :

- Node.js ;
- npm ;
- MySQL 8 ;
- Git.

---

## 1. Cloner le projet

```bash
git clone <URL_DU_REPOSITORY>
cd stay
```

---

## 2. Configurer la base de données

Créer la base MySQL et appliquer les scripts SQL présents dans le dossier :

```text
database/
```

La base principale utilisée par le projet est :

```text
stay
```

---

## 3. Installer le backend

```bash
cd backend
npm install
```

Créer ensuite un fichier :

```text
backend/.env
```

Exemple de configuration locale :

```env
PORT=5000
NODE_ENV=development

FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=stay

JWT_SECRET=remplacer_par_une_cle_secrete_longue_et_securisee
JWT_EXPIRES_IN=7d
EMPLOYEE_JWT_EXPIRES_IN=12h
```

Ne jamais publier de véritables secrets dans GitHub.

---

## 4. Démarrer le backend

En développement :

```bash
npm run dev
```

Ou :

```bash
npm start
```

Le backend fonctionne par défaut sur :

```text
http://localhost:5000
```

Test rapide :

```text
http://localhost:5000/api/health
```

---

## 5. Installer le frontend

Dans un nouveau terminal :

```bash
cd frontend
npm install
```

---

## 6. Configuration du frontend

En développement local, STAY peut automatiquement utiliser le nom d'hôte actuel avec le backend sur le port `5000`.

Le fichier `.env` frontend peut donc rester sans `VITE_API_URL` pour le développement local classique.

Pour utiliser une API spécifique :

```env
VITE_API_URL=http://localhost:5000/api
```

En production, `VITE_API_URL` doit pointer vers l'URL réelle du backend.

Exemple :

```env
VITE_API_URL=https://api.example.com/api
```

---

## 7. Démarrer le frontend

```bash
npm run dev
```

Le frontend fonctionne généralement sur :

```text
http://localhost:5173
```

---

# 17. Test sur téléphone ou autre ordinateur du réseau

Pour rendre le frontend accessible sur le réseau local :

```bash
npm run dev -- --host
```

Le backend écoute également sur le réseau local en environnement de développement.

Il est donc possible d'ouvrir STAY depuis :

- un téléphone ;
- une tablette ;
- un autre ordinateur ;

à condition que les appareils soient connectés au même réseau Wi-Fi.

Le frontend utilise automatiquement le nom d'hôte courant pour contacter le backend local sur le port `5000` lorsqu'aucune URL API personnalisée n'est configurée.

---

# 18. Sécurité actuellement implémentée

STAY dispose actuellement de plusieurs mécanismes de sécurité.

## Authentification

- JWT pour les comptes clients et administrateurs ;
- JWT séparé pour les employés ;
- vérification des sessions ;
- contrôle des rôles ;
- protection des routes privées.

## Mots de passe et PIN

- mots de passe hachés avec bcrypt ;
- PIN employés hachés ;
- validation du format des identifiants ;
- limitation des tentatives de connexion des employés ;
- verrouillage temporaire après plusieurs échecs.

## Contrôle des accès

- séparation entre clients et administrateurs ;
- séparation entre employés et Super Admin ;
- vérification du statut actif des employés ;
- middleware dédié aux employés ;
- middleware dédié à l'administration.

## Backend

- désactivation de l'en-tête `X-Powered-By` ;
- configuration CORS ;
- configuration différente entre développement et production ;
- validation des données ;
- gestion centralisée des erreurs ;
- limite appliquée à la taille des requêtes JSON.

---

# 19. Responsive Design

STAY est conçu pour fonctionner sur :

- ordinateur ;
- tablette ;
- téléphone.

Les principales interfaces disposent d'adaptations responsive :

- navigation publique ;
- pages de destinations ;
- formulaire de réservation ;
- compte client ;
- portail employé ;
- tableau de bord employé ;
- tableau de bord Super Admin ;
- tableaux ;
- panneaux latéraux de détails.

Sur mobile, les espaces d'administration utilisent une navigation adaptée avec menu latéral.

---

# 20. Philosophie UI / UX

L'identité visuelle de STAY repose sur une approche :

- premium ;
- minimaliste ;
- éditoriale ;
- moderne ;
- lisible ;
- cohérente ;
- responsive.

La palette utilise principalement :

- des tons blanc cassé ;
- des tons beige et gris chaud ;
- du noir et du charbon ;
- des contrastes sobres.

Les interfaces administratives et employées utilisent le même langage visuel afin de conserver une expérience cohérente entre les différents espaces internes.

L'objectif est d'éviter les interfaces surchargées et de privilégier :

- la hiérarchie visuelle ;
- les espaces ;
- les informations essentielles ;
- les actions clairement identifiables ;
- une navigation simple.

---

# 21. Fonctionnalités terminées

Les fonctionnalités principales actuellement développées comprennent :

## Public

- page de présentation ;
- navigation responsive ;
- page destinations ;
- récupération des destinations depuis MySQL ;
- catégories et mise en avant des destinations ;
- page de réservation ;
- FAQ ;
- page compte.

## Authentification client

- inscription ;
- connexion ;
- déconnexion ;
- rôles ;
- protection des accès ;
- restauration de session ;
- redirection selon le rôle.

## Réservations

- réservation sans compte ;
- réservation avec compte ;
- références uniques ;
- estimation du montant ;
- différentes méthodes de contact ;
- historique client ;
- suivi du statut.

## Super Admin

- authentification protégée ;
- tableau de bord ;
- statistiques ;
- liste des réservations ;
- recherche ;
- filtres ;
- détails des réservations ;
- changement de statut ;
- gestion des clients ;
- historique des clients ;
- gestion des employés ;
- création d'employés ;
- modification des employés ;
- activation et désactivation ;
- réinitialisation des PIN ;
- suivi de la dernière connexion ;
- section dédiée aux réservations terminées.

## Employés

- portail de connexion séparé ;
- authentification par e-mail et PIN ;
- sessions employées séparées ;
- validation du compte actif ;
- verrouillage après tentatives incorrectes ;
- tableau de bord ;
- gestion opérationnelle des réservations ;
- recherche et filtres ;
- changement de statut ;
- consultation des clients ;
- historique client ;
- actions de contact ;
- espace profil ;
- journalisation des opérations importantes.

## Réseau local

- accès frontend depuis le réseau local ;
- accès backend depuis le réseau local ;
- test du projet depuis un téléphone ou un autre ordinateur.

---

# 22. État actuel du projet

**STAY est actuellement dans sa phase finale avant déploiement.**

Le développement fonctionnel principal est terminé.

Les dernières étapes sont principalement :

```text
1. Ajouter les dernières images des nouveaux hôtels
2. Vérifier toutes les destinations
3. Effectuer les tests fonctionnels finaux
4. Vérifier l'expérience mobile
5. Vérifier les accès Client / Employé / Super Admin
6. Vérifier les erreurs dans la console du navigateur
7. Vérifier les requêtes API
8. Préparer les variables d'environnement de production
9. Déployer le frontend
10. Déployer le backend
11. Déployer la base MySQL
12. Vérifier les images et fichiers statiques en production
```

---

# 23. Tests finaux avant déploiement

Avant la mise en production, les scénarios suivants doivent être validés.

## Site public

- toutes les pages s'ouvrent correctement ;
- toutes les destinations apparaissent ;
- toutes les images se chargent ;
- aucun débordement visuel ;
- navigation correcte sur mobile.

## Réservation

- réservation invité ;
- réservation client connecté ;
- génération de référence ;
- calcul ou estimation correcte ;
- sauvegarde MySQL ;
- affichage dans les espaces internes.

## Client

- création de compte ;
- connexion ;
- historique ;
- protection des routes.

## Super Admin

- accès administrateur ;
- statistiques ;
- recherche ;
- filtres ;
- changement de statut ;
- clients ;
- gestion de l'équipe ;
- création d'un employé ;
- activation et désactivation ;
- réinitialisation du PIN ;
- section Terminées.

## Employé

- connexion Manager ;
- connexion Agent de réservation ;
- accès aux réservations ;
- accès aux clients ;
- modification du statut ;
- protection des routes Super Admin ;
- rejet d'un token employé sur `/api/admin/*`.

## Technique

- aucune erreur critique dans la console ;
- aucune requête API normale en échec ;
- test ordinateur ;
- test téléphone ;
- test réseau local ;
- vérification finale de la base de données.

---

# 24. Limites actuelles

STAY est aujourd'hui une plateforme fonctionnelle de gestion des demandes de réservation, mais certaines fonctionnalités ne font pas encore partie de cette version.

La plateforme ne propose pas encore :

- paiement en ligne ;
- réservation instantanée avec disponibilité temps réel ;
- synchronisation avec les systèmes internes des hôtels ;
- calendrier avancé de disponibilité ;
- avis clients publics ;
- système de promotions ;
- application mobile native ;
- tableau de bord analytique avancé.

Les prix affichés sont des prix indicatifs de départ et peuvent varier selon :

- les dates ;
- le type de chambre ;
- les disponibilités ;
- les politiques propres à chaque établissement.

STAY doit donc être considéré comme une plateforme de découverte et de **demande de réservation**, et non comme une confirmation automatique de disponibilité auprès des établissements.

---

# 25. Améliorations futures

Les prochaines évolutions possibles comprennent :

- paiement en ligne ;
- notifications automatiques par e-mail ;
- notifications SMS ou WhatsApp ;
- calendrier de disponibilité ;
- système de promotions ;
- gestion avancée des images depuis l'administration ;
- avis et notes clients ;
- favoris ;
- interface multilingue ;
- tableaux de bord analytiques ;
- statistiques plus détaillées ;
- automatisation des tests ;
- journalisation et monitoring de production ;
- sauvegardes automatisées ;
- amélioration continue de la sécurité.

Pour une version de production à plus grande échelle, des améliorations de sécurité supplémentaires pourront également être étudiées, notamment :

- cookies HttpOnly pour les sessions web ;
- politique CORS strictement limitée aux domaines de production ;
- HTTPS obligatoire ;
- limitation globale des requêtes ;
- en-têtes HTTP de sécurité supplémentaires ;
- stratégie de sauvegarde de la base de données ;
- monitoring des erreurs ;
- rotation des secrets.

---

# 26. Vision du projet

La vision de STAY est de construire une plateforme numérique moderne dédiée à l'hospitalité au Bénin.

À terme, la plateforme pourrait devenir un écosystème permettant de connecter :

- les voyageurs ;
- les hôtels ;
- les resorts ;
- les lodges ;
- les équipes de réservation ;
- les administrateurs.

L'objectif est de proposer une expérience locale haut de gamme avec une architecture capable d'évoluer progressivement vers une solution plus complète de découverte, de réservation et de gestion de séjours.

---

# 27. Ce que ce projet démontre

STAY représente un projet full-stack complet mettant en pratique plusieurs compétences de développement logiciel :

- conception d'une interface utilisateur moderne ;
- développement responsive ;
- développement React ;
- création d'une API REST ;
- développement Node.js et Express ;
- modélisation d'une base de données MySQL ;
- relations entre tables ;
- authentification JWT ;
- contrôle d'accès par rôles ;
- hachage des mots de passe ;
- systèmes d'authentification séparés ;
- gestion de sessions ;
- validation des données ;
- gestion des erreurs ;
- intégration frontend/backend ;
- gestion de fichiers et d'images ;
- développement d'interfaces administratives ;
- développement d'un espace opérationnel employé ;
- architecture évolutive ;
- tests sur réseau local ;
- utilisation de Git et GitHub.

---

# Développeuse

## Emma DA SILVA

**Créatrice et développeuse Full-Stack de STAY**

STAY a été conçu et développé par **Emma DA SILVA** comme projet de stage informatique, depuis la conception de l'expérience utilisateur jusqu'à l'implémentation du frontend, du backend, de la base de données et des différents systèmes de gestion.

**GitHub :** `emma-dasilva-dev`

---

## STAY

**Discover. Request. Manage.**

Une expérience moderne pour découvrir et gérer des séjours premium au Bénin.
