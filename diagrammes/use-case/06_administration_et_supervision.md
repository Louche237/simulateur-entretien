# Spécification UML 2.5.1 — Package 6 : Administration & Supervision Système

## 1. Vue d'Ensemble du Package
Ce paquetage modélise l'ensemble des prérogatives de gestion globale de la plateforme réservées au rôle `Administrateur`. Il dispose d'un portail dédié (`/admin`) avec isolation stricte des privilèges, gestion du cycle de vie des utilisateurs, supervision des sessions d'entretien, pilotage de la banque de questions et maintenance de l'ORM Sequelize MySQL.

---

## 2. Fiches Détaillées des Cas d'Utilisation

### UC-ADM-01 : S'authentifier à l'espace Administration
- **Acteur(s)** : `Administrateur` (Primaire).
- **Relations** : `<--«extend»--` par **UC-ADM-02 (S'inscrire avec clé d'invitation secrète)**.
- **Préconditions** : L'utilisateur dispose des droits `role: 'admin'`.
- **Scénario Nominal** :
  1. L'administrateur se rend sur l'URL dédiée `/admin/login`.
  2. Il saisit ses identifiants administrateur.
  3. Le middleware `requireAdmin` vérifie la validité du jeton JWT et le rôle `admin`.
  4. L'administrateur accède au tableau de bord de supervision générale (`/admin`).

---

### UC-ADM-02 : S'inscrire avec clé d'invitation secrète
- **Acteur(s)** : `Administrateur` (Primaire).
- **Relations** : `«extend»` vers **UC-ADM-01 (S'authentifier à l'espace Administration)**.
- **Point d'extension** : Inscription d'un nouveau membre de l'équipe d'administration (`/admin/register`).
- **Scénario Nominal** :
  1. L'administrateur renseigne son identité, son adresse e-mail, son mot de passe et le code d'accès administrateur confidentiel (`ADMIN_INVITE_CODE`).
  2. Le backend compare la clé avec la configuration serveur (`config.adminInviteCode`).
  3. En cas de succès, le compte est créé avec le privilège `role = 'admin'`.

---

### UC-ADM-03 : Superviser le tableau de bord global (KPIs)
- **Acteur(s)** : `Administrateur` (Primaire).
- **Scénario Nominal** :
  1. L'administrateur consulte les métriques globales agrégées :
     - Nombre total de comptes utilisateurs et répartition des rôles.
     - Volume de sessions créées, en cours et terminées.
     - Score moyen général de la plateforme et taux de réussite.
     - Classement des meilleurs candidats (*Top Performers*).

---

### UC-ADM-04 : Gérer les comptes utilisateurs (CRUD)
- **Acteur(s)** : `Administrateur` (Primaire).
- **Scénario Nominal** :
  1. L'administrateur liste l'ensemble des utilisateurs enregistrés (`GET /api/admin/users`).
  2. L'administrateur peut :
     - **Créer un utilisateur** manuellement en définissant son rôle (`user` ou `admin`).
     - **Consulter la fiche détaillée** d'un utilisateur et l'historique complet de ses entretiens.
     - **Modifier le rôle** ou les coordonnées du compte.
     - **Réinitialiser le mot de passe** d'un utilisateur en cas de blocage.
     - **Supprimer un compte** (avec protection interdisant l'auto-suppression du compte connecté).

---

### UC-ADM-05 : Superviser & purger toutes les sessions candidats
- **Acteur(s)** : `Administrateur` (Primaire).
- **Scénario Nominal** :
  1. L'administrateur accède à la liste consolidée de toutes les simulations réalisées sur la plateforme (`GET /api/admin/sessions`).
  2. Il peut inspecter les transcriptions détaillées des réponses d'un candidat, les notes et les retours IA.
  3. Il peut supprimer les sessions de test, obsolètes ou non conformes.

---

### UC-ADM-06 : Gérer la banque de questions (CRUD)
- **Acteur(s)** : `Administrateur` (Primaire).
- **Scénario Nominal** :
  1. L'administrateur consulte les questions de référence stockées dans la table MySQL `QuestionBank`.
  2. Il peut ajouter une nouvelle question avec catégorie (générale, technique, comportementale), focus attendu et relance type.
  3. Il peut modifier ou désactiver temporairement une question (`isActive: false`).
  4. Il peut exécuter un bouton de **réinitialisation d'usine** (`POST /api/admin/questions/reset`) restaurant la banque par défaut (`DEFAULT_QUESTION_BANK`).

---

### UC-ADM-07 : Superviser l'état & synchroniser la base MySQL
- **Acteur(s)** : `Administrateur` (Primaire).
- **Scénario Nominal** :
  1. L'administrateur visualise l'état de santé de la connexion MySQL en direct (latence, dialecte, nombre d'enregistrements par table).
  2. L'administrateur peut déclencher une **synchronisation de schéma** (`sequelize.sync({ alter: true })`) pour appliquer les évolutions structurelles sans perte de données.
  3. L'administrateur peut lancer une réinitialisation/seeding contrôlée de la base.
