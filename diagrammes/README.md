# Documentation UML & Processus 2TUP — JobMentor

Ce dossier contient la modélisation UML du projet **JobMentor (Simulateur d'Entretien)** selon les standards **UML 2.5** et la démarche du processus unifié **2TUP (Two Track Unified Process)**.

---

## 1. Cadre Méthodologique : Le Processus 2TUP

Le processus **2TUP (2 Track Unified Process)** est un processus de développement logiciel itératif et incrémental qui dissocie l'étude fonctionnelle des contraintes d'architecture technique :

```
             ┌────────────────────────────────┐
             │     Branche Fonctionnelle      │
             │   (Capture des besoins &       │
             │    Analyse métier du système)  │
             └───────────────┬────────────────┘
                             │
     ┌───────────────────────┴───────────────────────┐
     │  Convergence : Conception & Réalisation       │
     │  (Conception préliminaire & détaillée, Tests) │
     └───────────────────────┬───────────────────────┘
                             │
             ┌───────────────┴────────────────┐
             │       Branche Technique        │
             │   (Architecture, Frameworks,   │
             │    Sécurité, Persistance)      │
             └────────────────────────────────┘
```

Le présent diagramme se situe au tout début de la **Branche Fonctionnelle**, dans l'étape fondamentale : **Capture des Besoins Fonctionnels**. Il formalise le périmètre global du système sous forme de **Cas d'Utilisation (Use Cases)** regroupés en paquetages fonctionnels.

---

## 2. Fichiers Disponibles

| Fichier | Format | Description / Utilisation |
| :--- | :--- | :--- |
| [`diagramme_cas_utilisation_global.drawio`](./diagramme_cas_utilisation_global.drawio) | **Draw.io / XML** | **Fichier source éditable** sous [app.diagrams.net](https://app.diagrams.net) ou Draw.io Desktop. |
| [`diagramme_cas_utilisation_global.drawio`](../diagramme_cas_utilisation_global.drawio) | **Draw.io / XML** | Copie miroir disponible à la racine du projet pour un accès direct. |
| [`diagramme_cas_utilisation_global.svg`](./diagramme_cas_utilisation_global.svg) | **SVG Vectoriel** | Diagramme haute définition vectoriel sans perte de qualité. |
| [`diagramme_cas_utilisation_global.png`](./diagramme_cas_utilisation_global.png) | **Image PNG** | Aperçu image haute résolution prêt à l'insertion dans un rapport ou mémoire. |
| [`apercu_diagramme.html`](./apercu_diagramme.html) | **HTML Preview** | Visualiseur interactif dans n'importe quel navigateur web. |

---

## 3. Typologie des Acteurs Identifiés

### 3.1. Acteurs Humains (Primaires)
1. **`Utilisateur` (Visiteur non authentifié - Acteur Abstrait)** :
   - Représente toute personne arrivant sur la plateforme web.
   - Cas associés : *S'inscrire*, *Confirmer son adresse e-mail*, *S'authentifier (Connexion)*.

2. **`Candidat` (Utilisateur standard authentifié)** :
   - Spécialisation (hérite) de l'acteur `Utilisateur`.
   - Dispose d'un espace personnel pour préparer ses entretiens, analyser et générer des CV, et suivre ses résultats.

3. **`Administrateur` (Superviseur de la plateforme)** :
   - Spécialisation (hérite) de l'acteur `Utilisateur`.
   - Dispose d'un portail dédié avec des droits étendus pour administrer les utilisateurs, les sessions d'entretien, la banque de questions et la base de données MySQL.

### 3.2. Acteurs Secondaires (Systèmes Externes & APIs)
1. **`Fournisseur IA (OpenAI / Groq API)`** :
   - Fournit les capacités de raisonnement sémantique pour générer des questions ciblées selon le persona de recruteur choisi, analyser et noter les réponses, synthétiser les feedbacks et analyser la compatibilité des CV avec les offres.

2. **`Service de Messagerie (SMTP / Resend)`** :
   - Système externe responsable de l'expédition des e-mails transactionnels (confirmation de compte par jeton sécurisé, message d'accueil).

---

## 4. Organisation en Paquetages Fonctionnels (Packages 2TUP)

Le diagramme regroupe les cas d'utilisation au sein de la frontière du système (*Simulateur d'Entretien JobMentor*) selon **6 paquetages fonctionnels** :

### 📦 Package 1 : Authentification & Gestion de Compte
- **S'inscrire (Créer un compte)** : Création d'un profil candidat avec validation Zod.
  - `«include»` **Confirmer son adresse e-mail** : Activation obligatoire par jeton de vérification (relié au *Service Messagerie*).
- **S'authentifier (Connexion)** : Connexion sécurisée avec délivrance de jeton JWT.
- **Gérer son profil & paramètres** : Mise à jour des informations personnelles, mot de passe et langue de l'interface (FR / EN).

### 📦 Package 2 : Simulation d'Entretien & Coaching IA (Cœur Métier)
- **Configurer une simulation d'entretien** : Paramétrage du poste cible, de l'entreprise, du niveau (débutant/confirmé/expert), de la difficulté, du recruteur virtuel (persona IA), de la durée et des questions surprises.
- **Passer l'entretien interactif** : Interface de simulation avec chronomètre et saisie vocale ou textuelle.
  - `«include»` **Générer les questions ciblées & personnalisées** : Interroge le *Fournisseur IA* ou la banque locale selon le contexte du poste.
  - `«include»` **Évaluer la réponse & feedback en temps réel** : Analyse sémantique de chaque réponse (clarté, pertinence, structure STAR, points forts, axes d'amélioration) via le *Fournisseur IA*.
- **Clôturer la session & obtenir le débrief global** : Clôture de l'entretien.
  - `«include»` **Générer la synthèse, scoring & plan d'action** : Calcul de la note globale sur 100, synthèse exécutive et recommandations d'entraînement par le *Fournisseur IA*.

### 📦 Package 3 : Suivi des Performances & Historique
- **Consulter le tableau de bord candidat (KPIs)** : Visualisation du score moyen, du nombre d'heures d'entraînement et des graphiques de progression.
- **Consulter l'historique des entretiens** : Liste paginée des sessions passées avec filtres par statut.
  - `«extend»` **Consulter le détail & transcription d'une session** : Relecture des échanges complets question par question avec les retours du coach IA.
  - `«extend»` **Supprimer une session d'entraînement** : Suppression d'un historique obsolète.

### 📦 Package 4 : Analyse & Conception de CV
- **Analyser son CV face à une offre d'emploi** :
  - `«include»` **Extraire le contenu du CV (PDF / DOCX)** : Téléversement et parsing de documents.
  - `«include»` **Calculer l'adéquation & recommandations IA** : Évaluation du taux de matching avec l'offre cible et identification des mots-clés manquants (via le *Fournisseur IA*).
- **Concevoir un CV adapté (CV Builder IA)** : Édition guidée de CV avec restructuration automatique par l'IA.
  - `«extend»` **Exporter le CV au format PDF** : Génération du document final prêt pour candidature.

### 📦 Package 5 : Entraînements Thématiques
- **S'entraîner sur la banque de questions thématiques** : Entraînement ciblé par famille de questions (présentation, motivation, comportemental, technique, questions pièges).
  - `«include»` **Consulter les conseils méthodologiques (STAR)** : Guide de formulation (Situation, Tâche, Action, Résultat).

### 📦 Package 6 : Administration & Supervision Système
- **S'authentifier à l'espace Administration** : Accès au portail admin distinct (`/admin/login`).
  - `«extend»` **S'inscrire avec clé d'invitation secrète** : Inscription d'un nouvel administrateur via code confidentiel (`ADMIN_INVITE_CODE`).
- **Consulter les métriques & KPIs globaux** : Statistiques globales (nombre d'inscrits, volume de simulations, top candidats, moyennes générales).
- **Gérer les utilisateurs (CRUD, rôles, reset mdp)** : Création, modification de rôle (`user` / `admin`), réinitialisation de mot de passe et suppression de comptes.
- **Superviser & purger les sessions d'entretien** : Consultation des transcriptions de tous les candidats et suppression de sessions.
- **Gérer la banque de questions (CRUD, seed)** : Ajout, modification de questions, mise à jour du focus et relance, réinitialisation aux questions par défaut.
- **Superviser l'état & synchroniser la base MySQL** : Visualisation de l'état de l'ORM Sequelize, comptage en direct et exécution de synchronisation (`alter: true`).

---

## 5. Comment Modifier le Diagramme dans Draw.io

1. **En ligne (aucun logiciel à installer)** :
   - Ouvrez votre navigateur sur [https://app.diagrams.net](https://app.diagrams.net).
   - Cliquez sur **Ouvrir un diagramme existant** (*Open Existing Diagram*).
   - Sélectionnez le fichier `diagramme_cas_utilisation_global.drawio`.
   - Modifiez les formes, textes, couleurs ou liens en glisser-déposer.
   - Enregistrez directement le fichier mis à jour.

2. **Dans VS Code / Antigravity IDE** :
   - Installez l'extension officielle `Draw.io Integration` (ou `Diagrams.net`).
   - Cliquez simplement sur `diagramme_cas_utilisation_global.drawio` dans l'explorateur pour l'éditer visuellement dans l'IDE.

3. **Avec l'application bureau Draw.io Desktop** :
   - Téléchargeable gratuitement sur [get.diagrams.net](https://get.diagrams.net).
   - Fichier > Ouvrir > `diagramme_cas_utilisation_global.drawio`.
