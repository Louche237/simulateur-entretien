# Spécification UML 2.5.1 — Package 5 : Suivi des Performances & Historique

## 1. Vue d'Ensemble du Package
Ce paquetage modélise l'ensemble des fonctionnalités de restitution analytique, de mesure de la progression et de consultation rétrospective des simulations passées pour le candidat.

---

## 2. Fiches Détaillées des Cas d'Utilisation

### UC-HIST-01 : Consulter le tableau de bord candidat (Dashboard)
- **Acteur(s)** : `Candidat` (Primaire).
- **Préconditions** : Le candidat est authentifié.
- **Scénario Nominal** :
  1. Le candidat accède à la page d'accueil de son espace (`/dashboard`).
  2. Le système calcule et affiche les indicateurs clés de performance (KPIs) :
     - Score moyen général aux entretiens simulés.
     - Nombre total d'entretiens réalisés et temps d'entraînement cumulé.
     - Graphique d'évolution des scores sur les 30 derniers jours (SVG dynamique).
     - Raccourci vers la prochaine session recommandée et les points de vigilance prioritaires.

---

### UC-HIST-02 : Consulter l'historique des sessions d'entretien
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** :
  - `<--«extend»--` par **UC-HIST-03 (Consulter la transcription détaillée & retours coach)**.
  - `<--«extend»--` par **UC-HIST-04 (Supprimer une session de l'historique)**.
- **Scénario Nominal** :
  1. Le candidat accède à l'historique (`/historique`).
  2. Le système interroge le backend (`GET /api/sessions`) pour récupérer les sessions rattachées à son identifiant utilisateur.
  3. Le système affiche la liste ordonnée antichronologique avec : date, poste visé, persona du recruteur, score obtenu, statut et durée.
  4. Le candidat peut filtrer les sessions par statut (`terminee`, `en_cours`).

---

### UC-HIST-03 : Consulter la transcription détaillée & retours coach
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** : `«extend»` vers **UC-HIST-02 (Consulter l'historique des sessions)**.
- **Point d'extension** : Sélection d'une session terminée dans la liste.
- **Scénario Nominal** :
  1. Le candidat clique sur « Voir le rapport » d'une session passée.
  2. Le système affiche le débrief exhaustif :
     - Relecture question par question des énoncés et réponses exactes du candidat.
     - Feedbacks détaillés du coach IA pour chaque question.
     - Synthèse globale, radar de compétences et plan d'amélioration personnalisé.

---

### UC-HIST-04 : Supprimer une session de l'historique
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** : `«extend»` vers **UC-HIST-02 (Consulter l'historique des sessions)**.
- **Point d'extension** : Action de suppression sur un élément de l'historique.
- **Scénario Nominal** :
  1. Le candidat clique sur l'icône de suppression d'une session.
  2. Le système affiche une modale de confirmation.
  3. Dès validation, le client envoie une requête `DELETE /api/sessions/:id`.
  4. Le système supprime la session de la base de données et actualise l'affichage instantanément.
