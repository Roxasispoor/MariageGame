# 💍 Jeu de Mariage - Wedding Game

Application web interactive pour animer votre mariage avec des équipes, codes secrets et mini-jeux coopératifs.

## 🎯 Fonctionnalités

- ✅ **Système d'équipes** : Création et gestion d'équipes avec couleurs personnalisées
- ✅ **Codes secrets** : Les équipes gagnent des points en trouvant des codes cachés
- ✅ **Classement en temps réel** : Leaderboard qui se met à jour instantanément
- ✅ **Mini-jeux coopératifs** : Sudoku 4x4 collaboratif (extensible)
- ✅ **Interface admin** : Panel pour créer équipes, codes et jeux
- ✅ **100% temps réel** : Grâce à Firebase Firestore

## 🚀 Installation rapide

### 1. Prérequis
- Node.js (version 18+)
- Un compte Firebase gratuit

### 2. Configuration Firebase

1. Allez sur https://console.firebase.google.com
2. Créez un nouveau projet (ex: "mariage-game")
3. Dans le menu, allez dans **Build > Firestore Database**
4. Cliquez "Create database" → Mode **Test** → Choisissez votre région
5. Dans le menu, allez dans **Project Settings** (⚙️)
6. Descendez jusqu'à "Your apps" → Cliquez sur l'icône Web `</>`
7. Enregistrez votre app (nom: "Wedding Game")
8. Copiez la configuration Firebase

### 3. Configurer le projet

```bash
# Installer les dépendances
npm install

# Ouvrir le fichier de config Firebase
# Collez votre configuration dans src/services/firebase.js
```

Remplacez les valeurs dans `src/services/firebase.js` :
```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:5173 dans votre navigateur.

## 📱 Utilisation

### Pour l'organisateur (Admin)

1. Cliquez sur "Panel Admin"
2. Créez vos équipes (ex: "Les Mariés", "Famille Bride", etc.)
3. Notez les IDs d'équipes générés (ex: `team_1234567890`)
4. Créez des codes secrets à cacher (ex: "AMOUR2024" = 50 points)
5. Créez des mini-jeux (Sudoku, etc.)

### Pour les invités (Équipes)

1. Chaque équipe reçoit son ID unique
2. Sur la page d'accueil, entrez l'ID d'équipe
3. Entrez les codes trouvés pour gagner des points
4. Participez aux mini-jeux coopératifs
5. Suivez le classement en temps réel

## 🎮 Architecture technique

```
wedding-game/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Leaderboard.jsx  # Classement temps réel
│   │   ├── CodeInput.jsx    # Validation de codes
│   │   └── CoopSudoku.jsx   # Mini-jeu Sudoku 4x4
│   ├── pages/               # Pages principales
│   │   ├── TeamView.jsx     # Interface équipe
│   │   └── Admin.jsx        # Panel admin
│   ├── services/            # Logique métier
│   │   ├── firebase.js      # Configuration Firebase
│   │   └── gameService.js   # Fonctions Firestore
│   ├── hooks/               # Custom hooks React
│   │   ├── useTeam.js       # Hook pour les équipes
│   │   └── useLeaderboard.js# Hook pour le classement
│   ├── App.jsx              # Composant racine
│   └── main.jsx             # Point d'entrée
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎨 Personnalisation

### Couleurs du thème

Éditez `tailwind.config.js` :
```javascript
theme: {
  extend: {
    colors: {
      primary: '#FF69B4',    // Rose
      secondary: '#FFD700',  // Or
    }
  }
}
```

### Gradient de fond

Éditez `src/index.css` :
```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🔧 Ajouter un nouveau mini-jeu

1. Créez un composant dans `src/components/`
2. Utilisez `subscribeToGame()` pour le temps réel
3. Appelez `updateGameState()` pour synchroniser
4. Utilisez `completeGame()` pour attribuer les points

Exemple minimal :
```jsx
import { subscribeToGame, updateGameState } from '../services/gameService';

const MyMiniGame = ({ gameId }) => {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    return subscribeToGame(gameId, (data) => setState(data.state));
  }, [gameId]);
  
  const handleAction = async (newState) => {
    await updateGameState(gameId, newState);
  };
  
  return <div>Votre jeu ici</div>;
};
```

## 📊 Base de données Firestore

Structure :
```
teams/
  {teamId}/
    name: string
    color: string
    score: number
    codesUsed: array
    
codes/
  {codeId}/
    code: string
    points: number
    description: string
    usedBy: array
    
games/
  {gameId}/
    type: string
    state: object
    completed: boolean
```

## 🚢 Déploiement

### Firebase Hosting (gratuit)

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

Votre app sera disponible sur `https://VOTRE_PROJECT.web.app`

### Alternatives
- **Vercel** : Connectez votre repo GitHub, deploy automatique
- **Netlify** : Drag & drop du dossier `dist/`

## 💡 Idées d'amélioration

- [ ] Photo upload pour valider les défis
- [ ] QR codes pour les codes secrets
- [ ] Timer pour certains jeux
- [ ] Système de badges/achievements
- [ ] Mode nuit/jour automatique
- [ ] Historique des actions
- [ ] Chat entre équipes
- [ ] Mode quiz avec questions
- [ ] Chasse au trésor GPS
- [ ] Récompenses virtuelles

## 🎯 Concepts pour un dev game engine

En tant que dev Unity/Godot, voici les équivalences :

| Game Engine | React/Web |
|-------------|-----------|
| GameObject | Component React |
| Scene | Page/View |
| Script | Hook/Service |
| Event System | State management |
| Prefab | Composant réutilisable |
| Inspector | Props du composant |
| Update() | useEffect() |
| Network | Firebase listeners |

## 🐛 Troubleshooting

**Erreur Firebase** : Vérifiez que vous avez bien copié la config
**Rien ne s'affiche** : Vérifiez la console (F12) pour les erreurs
**Pas de temps réel** : Vérifiez les règles Firestore (mode test activé)

## 📝 Licence

Libre d'utilisation pour votre mariage ! 🎉

---

Créé avec ❤️ pour votre grand jour
