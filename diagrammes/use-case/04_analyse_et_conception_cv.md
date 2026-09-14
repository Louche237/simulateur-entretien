# Spécification UML 2.5.1 — Package 4 : Analyse & Conception de CV

## 1. Vue d'Ensemble du Package
Ce paquetage modélise l'outillage de candidature de **JobMentor** : l'audit automatisé de CV face à des offres d'emploi réelles et l'éditeur dynamique de CV assisté par IA avec export au format PDF.

---

## 2. Fiches Détaillées des Cas d'Utilisation

### UC-CV-01 : Analyser un CV face à une offre d'emploi
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** :
  - `«include»` vers **UC-CV-02 (Extraire les données du document)**.
  - `«include»` vers **UC-CV-03 (Calculer l'adéquation & recommandations IA)**.
- **Préconditions** : Le candidat dispose d'un fichier CV (PDF, DOC ou DOCX) et d'un descriptif d'offre d'emploi.
- **Scénario Nominal** :
  1. Le candidat dépose son fichier CV sur l'interface (`/analyse-cv`).
  2. Le candidat colle le texte de l'offre d'emploi visée (minimum 20 caractères).
  3. Le système déclenche automatiquement l'extraction de texte (**UC-CV-02**).
  4. Le système déclenche le calcul de matching sémantique par l'IA (**UC-CV-03**).
  5. Le système affiche le rapport d'audit : note globale d'adéquation (score / 100), compétences validées, mots-clés manquants et suggestions concrètes de reformulation.

---

### UC-CV-02 : Extraire les données du document (PDF / DOCX)
- **Acteur(s)** : Système interne.
- **Relations** : Inclus par **UC-CV-01 (Analyser un CV face à une offre)**.
- **Scénario Nominal** :
  1. Le module backend `cv.js` reçoit le fichier téléversé via `multer` (limite 10 Mo).
  2. Le système parse le contenu textuel et structure les sections : identité, expériences professionnelles, diplômes, compétences techniques et linguistiques.
  3. Les données normalisées sont retournées sous forme d'objet structuré `cvData`.

---

### UC-CV-03 : Calculer l'adéquation & recommandations IA
- **Acteur(s)** : `Fournisseur IA (OpenAI / Groq API)` (Secondaire).
- **Relations** : Inclus par **UC-CV-01 (Analyser un CV face à une offre)**.
- **Scénario Nominal** :
  1. Le système transmet les données extraites du CV et le texte de l'offre au **Fournisseur IA**.
  2. Le modèle IA procède à l'analyse de concordance :
     - Détection des compétences requises vs compétences présentes.
     - Analyse du niveau de séniorité attendu vs profil.
     - Identification des termes clés ATS (Applicant Tracking Systems) absents.
  3. L'IA génère les points forts, points faibles et recommandations de mise en valeur.

---

### UC-CV-04 : Concevoir un CV personnalisé (CV Builder dynamique)
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** :
  - `<--«extend»--` par **UC-CV-05 (Adapter le CV à l'offre ciblée avec l'IA)**.
  - `<--«extend»--` par **UC-CV-06 (Exporter le CV au format PDF)**.
- **Scénario Nominal** :
  1. Le candidat accède au constructeur de CV (`/cv-builder`).
  2. Le candidat configure le modèle visuel (Classique, Minimal, Moderne) et la palette de couleurs.
  3. Le candidat renseigne ou importe ses sections dynamiques :
     - Informations personnelles & coordonnées (LinkedIn, téléphone, etc.).
     - Expériences professionnelles détaillées.
     - Formations et diplômes.
     - Compétences et certifications.
     - Projets personnels et langues.
  4. Le système met à jour la prévisualisation en temps réel avec calcul de complétion du profil.

---

### UC-CV-05 : Adapter le CV à l'offre ciblée avec l'IA
- **Acteur(s)** : `Fournisseur IA (OpenAI / Groq API)` (Secondaire), `Candidat` (Primaire).
- **Relations** : `«extend»` vers **UC-CV-04 (Concevoir un CV personnalisé)**.
- **Scénario Nominal** :
  1. Depuis le CV Builder, le candidat clique sur « Adapter à une offre ».
  2. Le candidat renseigne la description de l'offre d'emploi ciblée.
  3. Le **Fournisseur IA** reformule l'accroche, met en exergue les compétences les plus pertinentes pour le recruteur et réorganise les priorités du CV.
  4. Les suggestions sont injectées dans l'éditeur pour validation par le candidat.

---

### UC-CV-06 : Exporter le CV au format PDF
- **Acteur(s)** : `Candidat` (Primaire).
- **Relations** : `«extend»` vers **UC-CV-04 (Concevoir un CV personnalisé)**.
- **Scénario Nominal** :
  1. Le candidat clique sur « Télécharger en PDF ».
  2. La librairie cliente `html2pdf.js` compile le rendu visuel vectoriel du template choisi.
  3. Le document PDF haute définition est généré et téléchargé sur l'appareil du candidat.
