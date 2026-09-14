# Spécification UML 2.5.1 — Package 3 : Entraînements Thématiques & Méthodologiques

## 1. Vue d'Ensemble du Package
Ce paquetage modélise les fonctionnalités d'entraînement modulaire et d'apprentissage ciblé, permettant au candidat de perfectionner des compétences comportementales et techniques précises (méthode STAR, pitch d'introduction, gestion du stress, négociation salariale).

---

## 2. Fiches Détaillées des Cas d'Utilisation

### UC-TRAIN-01 : Configurer son profil & objectifs d'entraînement
- **Acteur(s)** : `Candidat` (Primaire).
- **Préconditions** : Le candidat accède à l'espace `/entrainements`.
- **Scénario Nominal** :
  1. Le candidat lance l'assistant de configuration (*Setup Wizard*).
  2. Le candidat définit ses métiers cibles (jusqu'à 5 postes).
  3. Le candidat sélectionne son objectif d'entraînement :
     - *Décrocher mon premier job*
     - *Préparer mes futurs entretiens*
     - *Me reconvertir*
     - *Préparer un entretien précis (échéance imminente)*
     - *Progresser en aisance orale*
  4. Le candidat choisit son secteur d'activité (Tech, Finance, Conseil, Retail, Santé, etc.).
  5. Le candidat renseigne ses compétences clés à mettre en valeur.
  6. Le système génère automatiquement un programme personnalisé et un ensemble de questions quotidiennes adaptées.

---

### UC-TRAIN-02 : S'entraîner par compétence ciblée
- **Acteur(s)** : `Candidat` (Primaire).
- **Scénario Nominal** :
  1. Le candidat choisit un module d'entraînement parmi les familles de compétences :
     - **Pitch personnel** : Se présenter de façon percutante en 60 à 90 secondes.
     - **Storytelling STAR** : Structurer une expérience passée (*Situation, Tâche, Action, Résultat*).
     - **Motivation & sens** : Argumenter sur le choix du poste et de l'entreprise.
     - **Négociation salariale** : Justifier ses prétentions et valoriser ses compétences.
     - **Parler d'un échec** : Présenter une difficulté surmontée et la leçon apprise.
     - **Gestion du stress & questions pièges** : Désamorcer les objections.
     - **Gestion de conflit** : Résoudre un désaccord professionnel avec diplomatie.
     - **Leadership & influence** : Démontrer sa capacité d'entraînement d'équipe.
     - **Technique métier** : Vulgariser des concepts spécialisés.
  2. Le candidat répond à la série de questions dédiées.
  3. Le système enregistre l'évolution du taux de maîtrise par compétence.

---

### UC-TRAIN-03 : Réaliser le défi / question du jour
- **Acteur(s)** : `Candidat` (Primaire).
- **Scénario Nominal** :
  1. Le candidat accède à la question quotidienne calculée selon son profil cible.
  2. Le candidat enregistre sa réponse sous contrainte de temps (entraînement flash).
  3. Le système met à jour la série de jours consécutifs d'entraînement (*streak*).
