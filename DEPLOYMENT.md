# Déploiement Simulateur d'Entretien

## Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Compte Render (gratuit)

## Étapes de déploiement

### 1. Pousser le projet sur GitHub

```bash
# Initialiser le dépôt (déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit"

# Créer un repo sur GitHub puis pousser
git remote add origin <VOTRE_URL_GITHUB>
git branch -M main
git push -u origin main
```

### 2. Déployer le backend sur Render

1. Allez sur [Render.com](https://render.com) et connectez-vous avec GitHub
2. Cliquez sur **"New +"** → **"Web Service"**
3. Sélectionnez votre repo GitHub
4. Configurez :
   - **Name**: `simulateur-entretien-backend` (ou ce que vous voulez)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Choisissez le plan **Free**
6. Dans **Environment Variables**, ajoutez :
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: (générez une chaîne aléatoire)
   - `OPENAI_API_KEY`: (optionnel, votre clé OpenAI)
7. Cliquez sur **"Create Web Service"**

Une fois déployé, copiez l'URL de votre backend (ex: `https://simulateur-entretien-backend.onrender.com`)

### 3. Déployer le frontend sur Vercel

1. Allez sur [Vercel.com](https://vercel.com) et connectez-vous avec GitHub
2. Cliquez sur **"New Project"**
3. Sélectionnez votre repo GitHub
4. Dans **Environment Variables**, ajoutez :
   - `VITE_API_URL`: `https://votre-backend-render.onrender.com/api` (remplacez par votre URL Render)
5. Cliquez sur **"Deploy"**

## Mises à jour ultérieures

Chaque fois que vous voulez mettre à jour :

```bash
# Faites vos modifications
git add .
git commit -m "Description des modifications"
git push origin main
```

Vercel et Render déploieront automatiquement les mises à jour !

## Structure du projet

```
simulateur-entretien/
├── src/             # Frontend React/Vite
├── backend/         # Backend Express.js
├── public/          # Assets publics
└── ...
```
