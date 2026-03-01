import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Remplacez avec vos credentials Firebase
// Allez sur https://console.firebase.google.com
// Créez un projet > Web App > Copiez la config ici
const firebaseConfig = {

  apiKey: "AIzaSyCHPIeS5gdl595egoyE9EyCJPDN1n90SjY",
  authDomain: "mariagegame.firebaseapp.com",
  projectId: "mariagegame",
  storageBucket: "mariagegame.firebasestorage.app",
  messagingSenderId: "1096334803512",
  appId: "1:1096334803512:web:5ba8ba93b1911d5daa9ccd",
  measurementId: "G-PPH40B70C3"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
