# Documentation Officielle UML 2.5.1 — Simulateur d'Entretien JobMentor

Ce dossier contient la modélisation formelle des **Cas d'Utilisation (Use Cases)** du projet **JobMentor (Simulateur d'Entretien)**, conçue en stricte conformité avec la spécification internationale **OMG UML 2.5.1 (Clause 18 : Use Cases)** et les standards d'interopérabilité **Draw.io**.

---

## 1. Cadre Normatif : La Spécification OMG UML 2.5.1

Selon la norme **ISO/IEC 19505 / OMG UML 2.5.1** :

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONT DU MODÈLE UML                                    │
│                                                                                          │
│    ACTEURS PRIMAIRES                                            ACTEURS SECONDAIRES      │
│   (Initiateurs humains)                                        (Systèmes / APIs ext.)    │
│                                                                                          │
│        «actor»                                                         «system»          │
│       Utilisateur                                                 Service Messagerie     │
│           ▲                                                              ▲               │
│      Généralisation                                                      │               │
│      (Triangle vide)                                                     │               │
│      ┌────┴────┐                                                    Association          │
│      │         │                                                         │               │
│   «actor»   «actor»         ┌───────────────────────────────┐            │               │
│   Candidat   Admin  ───────►│ «system» Subject (Application)│────────────┘               │
│                             │                               │                            │
│                             │   (Cas de base)               │                            │
│                             │         │                     │          «system»          │
│                             │    «include» (Obligatoire)    │       Fournisseur IA       │
│                             │         ▼                     │              ▲             │
│                             │   (Cas inclus) ───────────────┼──────────────┘             │
│                             │                               │                            │
│                             │   (Cas étendu)                │                            │
│                             │         ▲                     │                            │
│                             │     «extend» (Optionnel)      │                            │
│                             │         │                     │                            │
│                             │   (Cas d'extension)           │                            │
│                             └───────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Éléments Fondamentaux de la Norme
1. **Frontière du Système (`Subject`)** : Rectangle englobant (`Simulateur d'Entretien JobMentor`). Tous les cas d'utilisation sont obligatoirement situés à l'intérieur. Les acteurs sont obligatoirement situés **à l'extérieur**.
2. **Acteur (`Actor`)** : Représente un rôle joué par une entité externe interagissant directement avec le système :
   - **Acteur Abstrait Général** : `Utilisateur`.
   - **Acteurs Primaires Spécialisés** : `Candidat` et `Administrateur` (reliés à `Utilisateur` par une relation de **Généralisation** : trait plein terminé par une flèche triangulaire fermée non remplie).
   - **Acteurs Secondaires (Systèmes Externes)** : `Fournisseur IA (OpenAI / Groq API)` et `Service de Messagerie (SMTP / Resend)`, représentés avec le stéréotype `«system»`.
3. **Cas d'Utilisation (`Use Case`)** : Ovales avec intitulé à l'infinitif décrivant une action apportant une valeur observable pour l'acteur.
4. **Relations Formelles** :
   - **Association** : Trait plein continu simple (sans flèche directionnelle) reliant un acteur au cas d'utilisation qu'il déclenche.
   - **`«include»`** : Trait discontinu fléché ouvert orienté du cas de base **vers** le cas inclus (l'exécution du cas de base englobe systématiquement et obligatoirement celle du cas inclus).
   - **`«extend»`** : Trait discontinu fléché ouvert orienté du cas d'extension **vers** le cas de base étendu (l'extension ajoute un comportement optionnel ou sous condition).
   - **Généralisation** : Trait continu fléché avec pointe triangulaire fermée et non remplie (`endArrow=block;endFill=0;endSize=12`).
5. **Paquetages (`Package`)** : Découpage architectural structuré en 6 domaines fonctionnels cohérents.

---

## 2. Inventaire des Fichiers Disponibles

| Emplacement | Format | Rôle / Mode de consultation |
| :--- | :--- | :--- |
| [`diagramme_cas_utilisation_global.drawio`](./diagramme_cas_utilisation_global.drawio) | **Draw.io XML** | **Fichier source éditable** sous [app.diagrams.net](https://app.diagrams.net), Draw.io Desktop ou VS Code. |
| [`../diagramme_cas_utilisation_global.drawio`](../diagramme_cas_utilisation_global.drawio) | **Draw.io XML** | Copie miroir disponible à la racine du projet. |
| [`diagramme_cas_utilisation_global.svg`](./diagramme_cas_utilisation_global.svg) | **SVG Vectoriel** | Fichier vectoriel haute résolution affichable sans perte sur tout écran ou document de soutenance. |
| [`apercu_diagramme.html`](./apercu_diagramme.html) | **HTML Preview** | Visualiseur interactif autonome avec zoom, centrage et téléchargements rapides. |
| [`use-case/`](./use-case/) | **Markdown** | **Fiches détaillées de spécification** pour chacun des 6 paquetages fonctionnels. |

> **Note de compatibilité :** Un lien symbolique `diagramme -> diagrammes` est en place à la racine pour assurer la validité indifférente des deux chemins.

---

## 3. Cartographie des 6 Packages Fonctionnels

### 📦 Package 1 : Authentification & Compte
*(Spécification détaillée : [`use-case/01_authentification_et_compte.md`](./use-case/01_authentification_et_compte.md))*
- **S'authentifier (Connexion Candidat)** : Accès sécurisé par jeton JWT.
- **Gérer son profil & ses préférences** : Mise à jour du nom, prénom, langue de l'application (FR/EN) et mot de passe.
- **Supprimer son compte** : Droit à l'effacement des données personnelles et de l'historique.
- **S'inscrire (Créer un compte)** : Création d'un compte candidat validé via Zod.
  - `«include»` **Confirmer son adresse e-mail** : Envoi et validation d'un jeton par le `Service de Messagerie`.

### 📦 Package 2 : Simulation d'Entretien & Coaching IA (Cœur Métier)
*(Spécification détaillée : [`use-case/02_simulation_entretien_et_coaching_ia.md`](./use-case/02_simulation_entretien_et_coaching_ia.md))*
- **Configurer une simulation d'entretien** : Paramétrage du poste, niveau d'expérience, difficulté, persona du recruteur, durée et import de CV.
- **Passer l'entretien interactif** : Interface immersive avec chronomètre, réponse vocale ou textuelle.
  - `«include»` **Générer les questions contextuelles ciblées** : Génération sémantique par le `Fournisseur IA`.
  - `«include»` **Évaluer la réponse & feedback en temps réel** : Analyse sémantique immédiate par le `Fournisseur IA`.
- **Clôturer la session & obtenir le débrief** : Fin de simulation.
  - `«include»` **Générer scoring global, synthèse & plan d'action** : Bilan global et notation sur 100 par le `Fournisseur IA`.

### 📦 Package 3 : Entraînements Thématiques & Méthodologiques
*(Spécification détaillée : [`use-case/03_entrainements_thematiques.md`](./use-case/03_entrainements_thematiques.md))*
- **Configurer son profil & objectifs d'entraînement** : Wizard ciblant métiers, objectifs, secteurs et compétences.
- **S'entraîner par compétence ciblée** : Modules spécifiques (Pitch 90s, Storytelling STAR, Motivation, Négociation de salaire, Échec, Gestion du stress, Questions pièges).
- **Réaliser le défi / question du jour** : Entraînement flash quotidien avec suivi de streak.

### 📦 Package 4 : Analyse & Conception de CV (CV Builder)
*(Spécification détaillée : [`use-case/04_analyse_et_conception_cv.md`](./use-case/04_analyse_et_conception_cv.md))*
- **Analyser un CV face à une offre d'emploi** :
  - `«include»` **Extraire les données du document (PDF / DOCX)** : Téléversement et parsing structuré.
  - `«include»` **Calculer l'adéquation & recommandations IA** : Score de match et mots-clés ATS par le `Fournisseur IA`.
- **Concevoir un CV personnalisé (CV Builder dynamique)** : Éditeur modulaire avec prévisualisation en temps réel.
  - `«extend»` **Adapter le CV à l'offre ciblée avec l'IA** : Optimisation contextuelle par le `Fournisseur IA`.
  - `«extend»` **Exporter le CV au format PDF** : Génération vectorielle haute définition (`html2pdf.js`).

### 📦 Package 5 : Suivi des Performances & Historique
*(Spécification détaillée : [`use-case/05_suivi_performances_et_historique.md`](./use-case/05_suivi_performances_et_historique.md))*
- **Consulter le tableau de bord candidat** : Indicateurs clés (KPIs), score moyen, temps d'entraînement et courbe d'évolution sur 30 jours.
- **Consulter l'historique des sessions d'entretien** : Liste filtrable des sessions passées.
  - `«extend»` **Consulter la transcription détaillée & retours coach** : Relecture intégrale des questions, réponses et feedbacks.
  - `«extend»` **Supprimer une session de l'historique** : Purge d'une session obsolète.

### 📦 Package 6 : Administration & Supervision Système
*(Spécification détaillée : [`use-case/06_administration_et_supervision.md`](./use-case/06_administration_et_supervision.md))*
- **S'authentifier à l'espace Administration** : Connexion dédiée sur `/admin/login` avec vérification stricte du rôle `admin`.
  - `«extend»` **S'inscrire avec clé d'invitation secrète** : Inscription réservée via le code `ADMIN_INVITE_CODE`.
- **Superviser le tableau de bord global** : Métriques globales de la plateforme et classement des top candidats.
- **Gérer les comptes utilisateurs (CRUD)** : Consultation, modification de profil et de rôle, réinitialisation de mot de passe, suppression.
- **Superviser & purger toutes les sessions candidats** : Audit des transcriptions et suppression de sessions.
- **Gérer la banque de questions (CRUD)** : Ajout, modification de focus/relance, activation/désactivation et réinitialisation d'usine.
- **Superviser l'état & synchroniser la base MySQL** : Statut Sequelize en temps réel, comptage d'enregistrements et synchronisation de schéma (`alter: true`).

---

## 4. Guide d'Ouverture et d'Édition

### Option A : Dans le navigateur (Sans installation)
1. Ouvrez [https://app.diagrams.net](https://app.diagrams.net).
2. Choisissez **Ouvrir un diagramme existant** (*Open Existing Diagram*).
3. Sélectionnez le fichier `diagramme_cas_utilisation_global.drawio`.
4. Tous les éléments sont modifiables en glisser-déposer tout en conservant les styles UML 2.5.1 configurés.

### Option B : Dans VS Code / Antigravity IDE
1. Installez l'extension recommandée `Draw.io Integration` (ou `Diagrams.net`).
2. Cliquez simplement sur `diagramme_cas_utilisation_global.drawio` dans l'arborescence des fichiers pour l'ouvrir visuellement.

### Option C : Visualisation instantanée
Double-cliquez sur `diagrammes/apercu_diagramme.html` ou ouvrez-le dans Google Chrome / Firefox pour explorer le diagramme avec les contrôles de zoom et de navigation.
