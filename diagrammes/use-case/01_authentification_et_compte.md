# Spécification UML 2.5.1 — Package 1 : Authentification & Compte

## 1. Vue d'Ensemble du Package
Ce paquetage fonctionnel regroupe les cas d'utilisation liés à l'accès au système, à l'enregistrement des nouveaux candidats, à la vérification par e-mail et à la gestion du profil utilisateur personnel.

---

## 2. Fiches Détaillées des Cas d'Utilisation

### UC-AUTH-01 : S'authentifier (Connexion Candidat)
- **Acteur(s)** : `Utilisateur` (Primaire).
- **Préconditions** : L'utilisateur dispose d'un compte candidat valide et actif.
- **Déclencheur** : L'utilisateur accède au formulaire de connexion (`/`).
- **Scénario Nominal** :
  1. L'utilisateur saisit son adresse e-mail et son mot de passe.
  2. Le système valide le schéma syntaxique via Zod (`loginSchema`).
  3. Le système recherche l'utilisateur en base de données MySQL (`getUserRecordByEmail`).
  4. Le système vérifie la correspondance du mot de passe avec le hash chiffré (`bcrypt.compare`).
  5. Le système génère un jeton sécurisé JWT contenant l'identifiant et les rôles de l'utilisateur.
  6. Le système redirige l'utilisateur vers son tableau de bord (`/dashboard`).
- **Scénarios Alternatifs** :
  - *2a. Données invalides* : Le système affiche un message d'erreur et invite à corriger les champs.
  - *4a. Identifiants erronés* : Le système renvoie une erreur 401 (« Email ou mot de passe incorrect »).
- **Postconditions** : Une session authentifiée avec jeton JWT est initialisée.

---

### UC-AUTH-02 : S'inscrire (Créer un compte)
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** : `«include»` vers **UC-AUTH-05 : Confirmer son adresse e-mail**.
- **Préconditions** : L'adresse e-mail n'est pas déjà enregistrée dans le système.
- **Scénario Nominal** :
  1. Le candidat renseigne son prénom, son nom, son adresse e-mail et son mot de passe (min. 8 caractères).
  2. Le système valide la conformité des données (`registerSchema`).
  3. Le système vérifie l'unicité de l'adresse e-mail.
  4. Le système hache le mot de passe (`bcrypt.hash`).
  5. Le système enregistre l'utilisateur en base de données avec le rôle `user`.
  6. Le système déclenche automatiquement le cas inclus **UC-AUTH-05 (Confirmer son adresse e-mail)**.
  7. Le système renvoie un message de confirmation invitant le candidat à consulter sa messagerie.
- **Scénarios Alternatifs** :
  - *3a. Adresse e-mail déjà existante* : Le système bloque l'inscription avec un code 409 et informe l'utilisateur.

---

### UC-AUTH-03 : Confirmer son adresse e-mail
- **Acteur(s)** : `Service de Messagerie (SMTP / Resend)` (Secondaire), `Candidat` (Primaire).
- **Relations** : Inclus par **UC-AUTH-02 (S'inscrire)**.
- **Scénario Nominal** :
  1. Le système génère un jeton cryptographique aléatoire de confirmation (`confirmationToken`).
  2. Le système transmet la demande d'expédition au **Service de Messagerie**.
  3. L'acteur secondaire délivre l'e-mail contenant le lien de vérification (`/confirm-email?token=...`).
  4. Le candidat clique sur le lien et le système active définitivement l'adresse e-mail (`emailConfirmed: true`).

---

### UC-AUTH-04 : Gérer son profil & ses préférences
- **Acteur(s)** : `Utilisateur` (Primaire).
- **Préconditions** : L'utilisateur est authentifié avec un jeton JWT valide.
- **Scénario Nominal** :
  1. L'utilisateur consulte ses informations personnelles dans l'espace Paramètres (`/parametres`).
  2. L'utilisateur modifie son nom, prénom, ou sa langue préférée (`fr` ou `en`).
  3. L'utilisateur peut mettre à jour son mot de passe en fournissant l'ancien mot de passe.
  4. Le système enregistre les modifications dans la table `users` de MySQL.

---

### UC-AUTH-05 : Supprimer son compte
- **Acteur(s)** : `Utilisateur` (Primaire).
- **Préconditions** : L'utilisateur est authentifié.
- **Scénario Nominal** :
  1. L'utilisateur demande la suppression définitive de son compte.
  2. Le système demande une confirmation explicite.
  3. Le système purge le compte utilisateur et cascade la suppression des sessions associées.
  4. L'utilisateur est déconnecté et redirigé vers l'accueil.
