# Guide d'installation et d'utilisation de JobMentor

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation locale](#installation-locale)
3. [Configuration](#configuration)
4. [Lancement de l'application](#lancement-de-lapplication)
5. [Utilisation](#utilisation)
6. [Déploiement](#déploiement)

---

## Prérequis
Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (version 18 ou supérieure) : [Télécharger Node.js](https://nodejs.org/)
- **Git** : [Télécharger Git](https://git-scm.com/)
- Un éditeur de code (ex: VS Code, Sublime Text, etc.)

---

## Installation locale

### Étape 1 : Récupérer le code source
Si vous n'avez pas encore le projet :
```bash
git clone https://github.com/Louche237/simulateur-entretien.git
cd simulateur-entretien
```

### Étape 2 : Installer les dépendances du frontend
```bash
# Dans le dossier racine du projet
npm install
```

### Étape 3 : Installer les dépendances du backend
```bash
cd backend
npm install
cd ..  # Retourner au dossier racine
```

---

## Configuration

### Configuration du frontend
1. Copiez le fichier `.env.example` (à la racine) et renommez-le en `.env`
2. Remplissez les variables d'environnement :
```env
# URL du backend (pour le développement local)
VITE_API_URL=http://localhost:3001
```

### Configuration du backend
1. Allez dans le dossier `backend/`
2. Copiez le fichier `.env.example` et renommez-le en `.env`
3. Remplissez les variables d'environnement :
```env
# Port sur lequel le backend va écouter
PORT=3001

# Clé secrète pour les tokens JWT (générez une chaîne aléatoire sécurisée)
JWT_SECRET=votre_cle_secrete_tres_longue_et_securisee

# (Optionnel) Clé API OpenAI pour les fonctionnalités IA
OPENAI_API_KEY=sk-votre_cle_openai
```

---

## Lancement de l'application

### Lancer le backend
Ouvrez un terminal et exécutez :
```bash
cd backend
npm run dev  # Mode développement avec rechargement automatique
# OU
npm start    # Mode production
```
Le backend sera accessible sur `http://localhost:3001`

### Lancer le frontend
Ouvrez un **deuxième terminal** (gardez le backend ouvert) et exécutez :
```bash
# Dans le dossier racine du projet
npm run dev
```
Le frontend se lance automatiquement dans votre navigateur, souvent sur `http://localhost:5173` (ou un port adjacent si 5173 est occupé).

---

## Utilisation

### 1. Créer un compte
- Allez sur la page d'accueil
- Cliquez sur « Inscription »
- Remplissez le formulaire (prénom, nom, email, mot de passe)
- Validez ! Le premier compte créé sera automatiquement **administrateur**

### 2. Fonctionnalités principales
#### 📊 Dashboard
- Vue d'ensemble de vos performances
- Statistiques rapides (score moyen, nombre de sessions, etc.)

#### 🎙️ Simulation d'entretien
- Choisissez le poste cible
- Sélectionnez le type d'entretien (RH, technique, comportemental, direction)
- Réglez la difficulté, la durée et le recruteur virtuel
- Lancez l'entretien !

#### 📄 Analyse de CV
- Uploadez votre CV (PDF, DOC ou DOCX)
- Collez la description de l'offre d'emploi
- Obtenez un rapport détaillé (score, points forts, points à améliorer)

#### ✏️ Générateur de CV
- Créez ou importez votre CV
- Ajoutez une offre d'emploi
- Générez un CV adapté à l'offre !
- Exporter en PDF

#### 📜 Historique
- Revoyez toutes vos sessions passées
- Suivez votre progression

#### ⚙️ Paramètres
- Modifiez votre profil
- Changez votre mot de passe
- Choisissez la langue (français/anglais)

---

## Déploiement
Pour mettre JobMentor en ligne (comme expliqué précédemment) :
1. Poussez le code sur GitHub
2. Déployez le backend sur **Render**
3. Déployez le frontend sur **Vercel**
4. Mettez à jour la variable `VITE_API_URL` sur Vercel avec l'URL de votre backend Render

---

## Problèmes courants et solutions
1. **Erreur « Module not found »** → Réinstallez les dépendances (`npm install`)
2. **Port déjà occupé** → Changez le port dans les fichiers `.env` ou fermez l'application qui utilise le port
3. **Cold start sur Render** → Le serveur met quelques secondes à démarrer, patientez !
4. **Pas de connexion au backend** → Vérifiez que le backend est bien lancé et que l'URL dans `.env` est correcte

---

## Auteurs
Projet réalisé par [Votre Prénom NOM]
