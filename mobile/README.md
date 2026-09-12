# 📱 JobMentor Mobile (React Native + Expo)

Application mobile de JobMentor construite avec **React Native (Expo)**. Le backend reste **identique** à la version web (Express.js).

---

## 🚀 Démarrer rapidement

### Prérequis
- Node.js ≥ 18
- Smartphone **iOS** ou **Android** (ou émulateur)
- App **Expo Go** installée sur votre téléphone

---

### Étape 1 : Installer les dépendances
```bash
cd mobile
npm install
```

### Étape 2 : Configurer l'URL du backend
Ouvrez le fichier `src/utils/api.js` et modifiez la ligne :
```js
const API_URL = __DEV__
  ? 'http://localhost:3001/api'     // ← Si émulateur
  : 'https://votre-backend.onrender.com/api';
```

💡 **Sur smartphone physique** (même réseau WiFi) :
- Récupérez l'IP locale de votre ordinateur : `ifconfig` / `ipconfig`
- Remplacez `localhost` par cette IP (ex: `http://192.168.1.42:3001/api`)

### Étape 3 : Démarrer l'app
```bash
npm start
```
Un **QR Code** apparaît dans le terminal.

- **Android** : Ouvrez Expo Go → Scanner le QR
- **iPhone** : Ouvrez l'app **Caméra** → Scanner le QR

L'application démarre ! 🎉

---

## 🧱 Stack utilisée
| Couche | Technologie |
|---|---|
| Framework mobile | **React Native** + **Expo SDK 51** |
| Navigation | **React Navigation** (Tabs + Stack) |
| Appels API | `fetch` natif |
| Stockage local | **AsyncStorage** (token + user) |
| Fichiers | `expo-document-picker`, `expo-file-system` |
| PDF / Partage | `expo-print`, `expo-sharing` |

---

## 📁 Structure
```
mobile/
├── App.js                        # Point d'entrée + navigation globale
├── app.json                      # Config Expo
├── babel.config.js
├── package.json
└── src/
    ├── theme.js                  # Couleurs, espacement, tailles
    ├── utils/
    │   └── api.js                # Client API (mêmes endpoints que web)
    └── screens/
        ├── AuthScreen.jsx        # Inscription / Connexion (avec warmup)
        ├── Dashboard.jsx         # Accueil stats + actions rapides
        ├── Simulation.jsx        # Paramétrage entretien
        ├── Entretien.jsx         # Chat entretien en temps réel
        ├── AnalyseCV.jsx         # Upload CV + Analyse (onglets)
        ├── Historique.jsx        # Historique sessions + Export PDF
        └── Parametres.jsx        # Profil + mot de passe + déconnexion
```

---

## 📝 Commandes utiles
```bash
npm start           # Démarrer Expo (QR code)
npm run android     # Ouvrir sur émulateur Android
npm run ios         # Ouvrir sur simulateur iOS
npm run web         # Version web du mobile (pour tests)
```

---

## 🔗 Connexion au backend
Le client API mobile utilise **exactement les mêmes endpoints** que la version web :
- `POST /api/auth/register`, `/login`
- `GET  /api/users/stats`, `/users/profile`
- `CRUD /api/sessions`
- `POST /api/cv/*` (analyse, extraction, adapt)
- `POST /api/simulation/*`

Aucune modification du backend n'est nécessaire ! ✅
