# Simulateur d'Entretien

Application React pour préparer des entretiens, analyser des CV et suivre des sessions de simulation.

## Structure

- `src/` pour le front React
- `backend/` pour l'API Express, l'authentification, les sessions et l'intégration OpenAI

## Lancer le projet

1. Installer les dépendances du front à la racine.
2. Installer les dépendances du backend dans `backend/`.
3. Démarrer le backend sur le port `5000`.
4. Démarrer le front Vite.

Exemple:

```bash
npm install
cd backend
npm install
npm run dev
```

Dans un autre terminal:

```bash
npm run dev
```

## Variables d'environnement backend

Le backend utilise désormais une véritable base de données relationnelle **MySQL** avec **Sequelize ORM** :

- `DB_HOST` : Hôte MySQL (`127.0.0.1` par défaut)
- `DB_PORT` : Port MySQL (`3306` par défaut)
- `DB_NAME` : Nom de la base (`jobmentor_db` par défaut, auto-créée si absente)
- `DB_USER` : Utilisateur MySQL (`root` par défaut)
- `DB_PASSWORD` : Mot de passe MySQL
- `ADMIN_INVITE_CODE` : Clé d'invitation secrète pour inscription administrateur (`ADMIN2026` par défaut)

Commandes de base de données disponibles dans `backend/` :
```bash
# Initialiser et synchroniser la base MySQL + seeder les données
npm run db:init
```

- `PORT` `5000` par défaut
- `CLIENT_ORIGIN` `http://localhost:5173` par défaut
- `JWT_SECRET` clé de signature des tokens
- `OPENAI_API_KEY` clé OpenAI ou Groq

## Interface Administrateur Dédiée

L'espace administrateur dispose d'une URL et d'écrans dédiés distincts de l'espace candidat :

- **Connexion Administrateur** : `http://localhost:5173/admin/login`
- **Inscription Administrateur** (avec clé secrète) : `http://localhost:5173/admin/register`
- **Dashboard Administrateur** : `http://localhost:5173/admin`
  - 📊 **Vue d'ensemble** : Métriques globales, KPIs et top candidats
  - 👥 **Gestion des Utilisateurs** : Création, modification, changement de rôle, réinitialisation de mot de passe et suppression
  - 🎯 **Sessions d'entretien** : Consultation des transcriptions de réponses des candidats, feedbacks IA et suppression
  - 💡 **Banque de questions** : Ajout, modification, suppression et réinitialisation de questions par catégorie
  - 🗄️ **Base de données MySQL** : Statut Sequelize en direct, nombre de lignes, boutons de synchronisation et maintenance

Compte administrateur par défaut :
- Email : `admin@jobmentor.fr`
- Mot de passe : `Admin2026!`
- Code d'inscription secret : `ADMIN2026`

