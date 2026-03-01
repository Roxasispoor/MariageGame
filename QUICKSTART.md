# 🚀 Guide de démarrage rapide

## Étape 1 : Firebase (5 minutes)

1. **Créer un compte Firebase**
   - Allez sur https://console.firebase.google.com
   - Connectez-vous avec votre compte Google
   - Cliquez "Ajouter un projet"

2. **Configurer le projet**
   - Nom du projet : "mariage-game" (ou ce que vous voulez)
   - Désactivez Google Analytics (pas nécessaire)
   - Cliquez "Créer le projet"

3. **Activer Firestore**
   - Dans le menu de gauche : **Build** → **Firestore Database**
   - Cliquez "Créer une base de données"
   - Choisissez "Démarrer en mode test"
   - Choisissez votre région (ex: europe-west1)
   - Cliquez "Activer"

4. **Récupérer la configuration**
   - Cliquez sur l'icône ⚙️ (Paramètres du projet)
   - Descendez jusqu'à "Vos applications"
   - Cliquez sur l'icône `</>` (Web)
   - Nom de l'app : "Wedding Game"
   - Copiez tout le bloc `firebaseConfig`

## Étape 2 : Installation locale (2 minutes)

```bash
cd wedding-game
npm install
```

Ouvrez `src/services/firebase.js` et remplacez les valeurs par celles de votre config Firebase.

## Étape 3 : Lancer l'app (1 minute)

```bash
npm run dev
```

Ouvrez http://localhost:5173

## Étape 4 : Premier test (2 minutes)

1. Cliquez sur "Panel Admin"
2. Créez une équipe de test :
   - Nom : "Test Team"
   - Couleur : Rose
   - Cliquez "Créer l'équipe"
3. Notez l'ID généré (ex: `team_1234567890`)
4. Créez un code :
   - Code : "TEST123"
   - Points : 50
   - Cliquez "Créer le code"

5. Retournez à l'accueil (bouton "← Retour")
6. Entrez l'ID de l'équipe
7. Cliquez "Rejoindre mon équipe"
8. Entrez le code "TEST123"
9. Vous devriez voir +50 points ! 🎉

## Étape 5 : Personnalisation

### Changer les couleurs
Éditez `tailwind.config.js` ligne 7-8

### Changer le gradient de fond
Éditez `src/index.css` ligne 11

### Ajouter votre logo
Remplacez `public/vite.svg` par votre image

## Prêt pour le mariage ! 💍

Avant le jour J :
1. Créez toutes vos équipes
2. Créez tous vos codes secrets
3. Imprimez les codes et cachez-les
4. Donnez à chaque équipe son ID
5. Projetez le classement sur un écran

Bon mariage ! 🎊
