# STAY – Plateforme Premium de Gestion Hôtelière

> Une plateforme web moderne permettant aux voyageurs de découvrir des hôtels et resorts premium au Bénin, d'effectuer des demandes de réservation et aux administrateurs de gérer l'ensemble des réservations depuis un tableau de bord sécurisé.

---

# À propos du projet

STAY est une application web full-stack conçue pour simplifier la recherche et la gestion des séjours dans des hôtels et resorts premium au Bénin.

Contrairement aux plateformes de réservation classiques, STAY fonctionne sur un système de **demande de réservation**. Les clients envoient une demande qui est ensuite examinée par un administrateur avant d'être confirmée.

L'objectif est d'offrir une expérience haut de gamme aussi bien pour les voyageurs que pour les administrateurs.

Ce projet est développé comme une véritable application destinée à être déployée en production, en suivant les bonnes pratiques du développement logiciel moderne.

---

# Objectifs

Le projet STAY a pour objectifs de :

- Faciliter la découverte d'hôtels et resorts premium.
- Permettre aux clients d'effectuer des demandes de réservation facilement.
- Offrir un espace personnel permettant aux clients de suivre leurs réservations.
- Fournir aux administrateurs un tableau de bord sécurisé pour gérer efficacement les demandes.
- Concevoir une application moderne, élégante, sécurisée et évolutive.
- Créer une plateforme pouvant évoluer vers un véritable service commercial.

---

# Fonctionnalités principales

## Espace Client

Les clients peuvent :

- Découvrir les destinations disponibles.
- Consulter les informations des hôtels.
- Créer un compte.
- Se connecter en toute sécurité.
- Effectuer une demande de réservation.
- Suivre l'état de leurs réservations.
- Consulter leur historique.
- Contacter STAY par WhatsApp ou téléphone.

---

## Espace Administrateur

Les administrateurs peuvent :

- Se connecter avec un compte administrateur.
- Accéder à un tableau de bord sécurisé.
- Consulter toutes les demandes de réservation.
- Rechercher des réservations.
- Filtrer les réservations par statut.
- Modifier le statut des réservations.
- Consulter les statistiques générales.
- Gérer efficacement les demandes des clients.

Lorsqu'un administrateur se connecte, il est automatiquement redirigé vers le tableau de bord d'administration.

---

# Processus de réservation

1. Le client choisit une destination.

2. Il complète le formulaire de réservation.

3. La demande est enregistrée dans la base de données.

4. L'administrateur examine la demande.

5. L'administrateur contacte le client si nécessaire.

6. Le statut de la réservation est mis à jour.

7. Le client peut consulter le nouveau statut dans son espace personnel.

---

# Technologies utilisées

## Frontend

- React
- Vite
- React Router
- CSS

## Backend

- Node.js
- Express.js

## Base de données

- MySQL

## Authentification

- JSON Web Token (JWT)

## Gestion de versions

- Git
- GitHub

---

# Architecture du projet

Le projet est divisé en deux parties principales.

## Frontend

Le frontend est responsable de :

- l'interface utilisateur
- la navigation
- les formulaires
- les interactions utilisateur

---

## Backend

Le backend est responsable de :

- l'authentification
- la logique métier
- les réservations
- la communication avec la base de données
- la sécurisation des routes

---

## Base de données

La base de données stocke notamment :

- les utilisateurs
- les administrateurs
- les réservations
- les destinations

---

# Fonctionnalités actuellement développées

## Authentification

- Création de compte
- Connexion
- Déconnexion
- Gestion des rôles
- Sessions utilisateur

---

## Réservations

- Formulaire de réservation
- Réservations invitées
- Réservations utilisateur connecté
- Génération automatique d'une référence
- Estimation du prix
- Historique des réservations

---

## Tableau de bord Administrateur

- Accès sécurisé
- Redirection automatique des administrateurs
- Tableau de bord
- Statistiques
- Recherche
- Filtres
- Consultation des réservations
- Modification du statut d'une réservation

---

# Statuts des réservations

Chaque réservation peut avoir l'un des statuts suivants :

- En attente
- Contactée
- Confirmée
- Annulée
- Terminée

---

# Sécurité

Le projet met actuellement en œuvre :

- Authentification JWT
- Hachage sécurisé des mots de passe
- Contrôle des rôles
- Protection des routes
- Validation des données
- Gestion des erreurs

Des améliorations de sécurité sont prévues avant la mise en production.

---

# Structure du projet

```
STAY/

├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── database/
│   └── stay.sql
│
└── README.md
```

---

# Améliorations prévues

Les prochaines fonctionnalités prévues sont :

- Gestion des clients
- Notifications par e-mail
- Paiement en ligne
- Calendrier de disponibilité
- Avis clients
- Promotions
- Tableau de bord analytique
- Gestion des images
- Interface multilingue
- Optimisation de la sécurité
- Déploiement en production

---

# Philosophie du projet

STAY a été conçu avec une approche orientée expérience utilisateur.

Les principes de conception sont :

- simplicité
- élégance
- lisibilité
- performance
- accessibilité
- interface premium
- architecture évolutive

L'ensemble de l'application est développé en français.

---

# État actuel du projet

Le projet est actuellement en développement actif.

Fonctionnalités terminées :

- Authentification
- Comptes utilisateurs
- Réservations
- Historique des réservations
- Tableau de bord administrateur
- Gestion des statuts
- Protection des accès

Fonctionnalités en cours :

- Gestion avancée des clients
- Notifications
- Optimisation de l'interface
- Déploiement

---

# Vision du projet

L'objectif de STAY est de devenir une plateforme complète de gestion hôtelière permettant aux établissements et aux voyageurs de gérer efficacement leurs réservations grâce à une interface moderne, intuitive et sécurisée.

Le projet est développé selon les standards professionnels afin d'être facilement maintenable, évolutif et prêt pour une utilisation réelle.

---

# Auteur

**Emma Da Silva**

Créatrice & Développeuse

Projet : **STAY – Plateforme Premium de Gestion Hôtelière**