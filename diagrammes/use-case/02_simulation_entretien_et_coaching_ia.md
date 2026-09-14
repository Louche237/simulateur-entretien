# Spécification UML 2.5.1 — Package 2 : Simulation d'Entretien & Coaching IA

## 1. Vue d'Ensemble du Package
Ce paquetage constitue le cœur de métier de **JobMentor**. Il modélise l'ensemble du cycle de vie d'un entretien d'embauche simulé : du paramétrage initial jusqu'au débriefing sémantique approfondi assisté par Intelligence Artificielle.

---

## 2. Fiches Détaillées des Cas d'Utilisation

### UC-SIM-01 : Configurer une simulation d'entretien
- **Acteur(s)** : `Candidat` (Primaire).
- **Préconditions** : Le candidat est connecté.
- **Scénario Nominal** :
  1. Le candidat accède à l'écran de configuration (`/simulation`).
  2. Le candidat définit les critères de l'entretien :
     - Poste cible (ex: *Développeur Full-Stack*, *Product Manager*, etc.).
     - Entreprise cible (optionnel).
     - Type d'entretien : RH, Technique, Comportemental, Direction.
     - Niveau d'expérience : Débutant, Intermédiaire, Confirmé, Expert.
     - Degré de difficulté : Facile, Moyen, Difficile, Élite.
     - Recruteur virtuel (Persona IA) : Aria (bienveillante), Marcus (exigeant / direct), Elena (analytique), Lucas (innovant).
     - Durée globale souhaitée (5 à 60 minutes) et activation éventuelle de questions surprises.
     - Import optionnel d'un CV préalablement analysé ou de compétences spécifiques.
  3. Le candidat valide le lancement de la session.
  4. Le système initialise un enregistrement de session en statut `en_cours` dans la table `sessions`.
  5. Le système redirige vers la salle d'entretien (`/entretien`).

---

### UC-SIM-02 : Passer l'entretien interactif
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** :
  - `«include»` vers **UC-SIM-03 (Générer les questions contextuelles)**.
  - `«include»` vers **UC-SIM-04 (Évaluer la réponse & feedback en temps réel)**.
- **Scénario Nominal** :
  1. Le candidat découvre la question posée à l'écran, avec l'animation du recruteur virtuel et un chronomètre actif.
  2. Le candidat formule sa réponse :
     - Soit par saisie vocale (Speech-to-Text avec indicateur audio temps réel).
     - Soit par saisie textuelle directe.
  3. Le candidat valide l'envoi de sa réponse.
  4. Le système déclenche l'évaluation instantanée (**UC-SIM-04**) et présente un retour constructif (points forts, points d'amélioration, structure STAR).
  5. Le candidat passe à la question suivante jusqu'à épuisement du protocole.

---

### UC-SIM-03 : Générer les questions contextuelles
- **Acteur(s)** : `Fournisseur IA (OpenAI / Groq API)` (Secondaire).
- **Relations** : Inclus par **UC-SIM-02 (Passer l'entretien interactif)**.
- **Scénario Nominal** :
  1. Le système construit le prompt contextuel intégrant le poste, le persona du recruteur, le niveau de difficulté, la langue et les compétences cibles.
  2. Le système sollicite l'API de l'acteur secondaire **Fournisseur IA**.
  3. Si l'IA est inaccessible ou indisponible, le système bascule sur la banque de questions locale MySQL (`QuestionBank`).
  4. Le système ordonnance la série de questions adaptées au profil du candidat.

---

### UC-SIM-04 : Évaluer la réponse & feedback en temps réel
- **Acteur(s)** : `Fournisseur IA (OpenAI / Groq API)` (Secondaire).
- **Relations** : Inclus par **UC-SIM-02 (Passer l'entretien interactif)**.
- **Scénario Nominal** :
  1. Le système transmet au **Fournisseur IA** l'énoncé de la question, la réponse du candidat et le contexte du poste.
  2. L'IA effectue une analyse sémantique multicritère : pertinence, niveau de précision, méthodologie STAR, impact et fluidité.
  3. Le système enregistre l'analyse et la note partielle dans l'historique de la session.
  4. Le retour d'évaluation immédiat est affiché au candidat.

---

### UC-SIM-05 : Clôturer l'entretien & bilan global
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** : `«include»` vers **UC-SIM-06 (Générer scoring global, synthèse & plan d'action)**.
- **Scénario Nominal** :
  1. Le candidat termine la dernière question ou clique sur « Clôturer l'entretien ».
  2. Le système déclenche automatiquement le calcul du débrief global (**UC-SIM-06**).
  3. Le statut de la session passe à `terminee`.
  4. Le système présente le tableau de synthèse avec la note sur 100, les forces majeures et les axes de travail prioritaires.

---

### UC-SIM-06 : Générer scoring global, synthèse & plan d'action
- **Acteur(s)** : `Fournisseur IA (OpenAI / Groq API)` (Secondaire).
- **Relations** : Inclus par **UC-SIM-05 (Clôturer l'entretien & bilan global)**.
- **Scénario Nominal** :
  1. Le système agrège toutes les réponses et feedbacks individuels de la session.
  2. Le **Fournisseur IA** évalue la cohérence d'ensemble, calcule la note globale d'aptitude et émet des recommandations stratégiques.
  3. Le score et la synthèse sont persistés de manière durable dans la base MySQL.
