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

Le backend peut fonctionner sans clé OpenAI, mais il bascule alors sur des heuristiques locales.

- `PORT` `5000` par défaut
- `CLIENT_ORIGIN` `http://localhost:5173` par défaut
- `JWT_SECRET` clé de signature des tokens
- `OPENAI_API_KEY` clé OpenAI
- `OPENAI_MODEL` `gpt-5.5` par défaut

Un fichier d'exemple est disponible dans [`backend/.env.example`](./backend/.env.example).

## API disponible

- Authentification: `/api/auth/inscription`, `/api/auth/connexion`
- Profil utilisateur: `/api/users/profil`, `/api/users/password`, `/api/users/stats`, `/api/users/compte`
- Sessions d'entretien: `/api/sessions`
- Génération de questions: `/api/simulation/questions`
- Analyse CV: `/api/cv/extract`, `/api/cv/analyze-file`, `/api/cv/analyze`
- Santé serveur: `/api/health`

## Notes

- Les sessions créées depuis le front sont d'abord gérées en local puis synchronisées avec l'API.
- L'analyse CV accepte les fichiers PDF, DOC et DOCX.
- Si `OPENAI_API_KEY` n'est pas défini, le backend garde un comportement fonctionnel grâce aux fallbacks locaux.
