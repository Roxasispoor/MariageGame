import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// Collection references
const teamsCollection = collection(db, 'teams');
const codesCollection = collection(db, 'codes');
const gamesCollection = collection(db, 'games');
const configCollection = collection(db, 'config');

/**
 * CONFIGURATION GLOBALE
 */

// Récupérer la configuration du jeu
export const getGameConfig = async () => {
  const configRef = doc(configCollection, 'game');
  const configSnap = await getDoc(configRef);
  if (configSnap.exists()) {
    return configSnap.data();
  }
  // Créer une config par défaut si elle n'existe pas
  const defaultConfig = {
    ransomGoal: 1000,
    ransomMessage: "Payez la rançon pour libérer les mariés !",
    ransomCompleted: false
  };
  await setDoc(configRef, defaultConfig);
  return defaultConfig;
};

// Mettre à jour l'objectif de rançon
export const setRansomGoal = async (goal, message) => {
  const configRef = doc(configCollection, 'game');
  await setDoc(configRef, {
    ransomGoal: goal,
    ransomMessage: message || "Payez la rançon pour libérer les mariés !",
    ransomCompleted: false
  }, { merge: true });
};

// Écouter les changements de configuration en temps réel
export const subscribeToGameConfig = (callback) => {
  const configRef = doc(configCollection, 'game');
  return onSnapshot(configRef, async (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      // Créer la config si elle n'existe pas
      const defaultConfig = await getGameConfig();
      callback(defaultConfig);
    }
  });
};

// Vérifier et marquer la rançon comme payée
export const checkRansomCompletion = async (totalScore) => {
  const config = await getGameConfig();
  const globalOffset = config.globalOffset || 0;
  const effectiveTotal = Math.max(0, totalScore + globalOffset);
  
  if (!config.ransomCompleted && effectiveTotal >= config.ransomGoal) {
    const configRef = doc(configCollection, 'game');
    await setDoc(configRef, {
      ransomCompleted: true,
      completedAt: new Date()
    }, { merge: true });
    return true;
  }
  return false;
};

/**
 * TEAMS
 */

// Créer une nouvelle équipe
export const createTeam = async (teamId, teamName, color) => {
  const teamRef = doc(teamsCollection, teamId);
  await setDoc(teamRef, {
    name: teamName,
    color: color,
    score: 0,
    codesUsed: [],
    createdAt: new Date()
  });
  return teamId;
};

// Récupérer une équipe par ID
export const getTeam = async (teamId) => {
  const teamRef = doc(teamsCollection, teamId);
  const teamSnap = await getDoc(teamRef);
  return teamSnap.exists() ? { id: teamSnap.id, ...teamSnap.data() } : null;
};

// Récupérer une équipe par nom
export const getTeamByName = async (teamName) => {
  console.log('🔍 getTeamByName - Recherche de:', teamName);
  
  try {
    const q = query(teamsCollection, where('name', '==', teamName));
    console.log('📡 Requête Firebase créée');
    
    const snapshot = await getDocs(q);
    console.log('📦 Snapshot reçu, empty:', snapshot.empty, 'size:', snapshot.size);
    
    if (snapshot.empty) {
      console.log('❌ Aucune équipe trouvée avec ce nom');
      return null;
    }
    
    const teamDoc = snapshot.docs[0];
    const teamData = { 
      id: teamDoc.id, 
      score: 0,
      codesUsed: [],
      ...teamDoc.data() 
    };
    
    // Migration : ajouter les champs manquants
    if (teamData.score === undefined || teamData.codesUsed === undefined) {
      console.log('🔧 Migration de l\'équipe en cours...');
      const teamRef = doc(teamsCollection, teamDoc.id);
      const updates = {};
      if (teamData.score === undefined) updates.score = 0;
      if (teamData.codesUsed === undefined) updates.codesUsed = [];
      
      await updateDoc(teamRef, updates);
      console.log('✅ Équipe migrée:', updates);
      
      // Mettre à jour les données locales
      Object.assign(teamData, updates);
    }
    
    console.log('✅ Équipe trouvée:', teamData);
    return teamData;
  } catch (error) {
    console.error('❌ Erreur dans getTeamByName:', error);
    throw error;
  }
};

// Écouter les changements d'une équipe en temps réel
export const subscribeToTeam = (teamId, callback) => {
  console.log('subscribeToTeam - Début pour:', teamId);
  const teamRef = doc(teamsCollection, teamId);
  return onSnapshot(teamRef, 
    (doc) => {
      console.log('subscribeToTeam - Snapshot reçu, exists:', doc.exists());
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        console.error('subscribeToTeam - Document n\'existe pas:', teamId);
        callback(null);
      }
    },
    (error) => {
      console.error('subscribeToTeam - Erreur:', error);
      callback(null);
    }
  );
};

// Ajouter des points à une équipe
export const addPoints = async (teamId, points) => {
  const teamRef = doc(teamsCollection, teamId);
  const team = await getDoc(teamRef);
  if (team.exists()) {
    await updateDoc(teamRef, {
      score: team.data().score + points
    });
    
    // Vérifier si la rançon est atteinte
    const allTeams = await getLeaderboard();
    const totalScore = allTeams.reduce((sum, t) => sum + t.score, 0);
    await checkRansomCompletion(totalScore);
  }
};

/**
 * CODES
 */

// Créer un code secret
export const createCode = async (codeId, codeValue, points, description) => {
  const codeRef = doc(codesCollection, codeId);
  await setDoc(codeRef, {
    code: codeValue.toUpperCase(),
    points: points,
    description: description,
    usedBy: [],
    createdAt: new Date()
  });
};

// Valider un code pour une équipe
export const validateCode = async (teamId, codeValue) => {
  // Chercher le code dans la collection
  const codesSnapshot = await getDocs(codesCollection);
  let foundCode = null;
  let codeId = null;

  codesSnapshot.forEach((doc) => {
    if (doc.data().code === codeValue.toUpperCase()) {
      foundCode = doc.data();
      codeId = doc.id;
    }
  });

  if (!foundCode) {
    return { success: false, message: 'Code invalide' };
  }

  // Vérifier si l'équipe a déjà utilisé ce code
  if (foundCode.usedBy.includes(teamId)) {
    return { success: false, message: 'Code déjà utilisé par votre équipe' };
  }

  // Ajouter les points et marquer le code comme utilisé
  await addPoints(teamId, foundCode.points);
  
  const codeRef = doc(codesCollection, codeId);
  await updateDoc(codeRef, {
    usedBy: [...foundCode.usedBy, teamId]
  });

  const teamRef = doc(teamsCollection, teamId);
  const team = await getDoc(teamRef);
  await updateDoc(teamRef, {
    codesUsed: [...team.data().codesUsed, codeId]
  });

  return { 
    success: true, 
    message: `+${foundCode.points} points !`,
    points: foundCode.points,
    description: foundCode.description
  };
};

/**
 * MINI-JEUX (ex: Sudoku coopératif)
 */

// Convertir une grille 2D en objet pour Firestore (qui ne supporte pas les nested arrays)
const gridToObject = (grid) => {
  const obj = {};
  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      obj[`r${i}c${j}`] = cell;
    });
  });
  return obj;
};

// Convertir un objet Firestore en grille 2D
const objectToGrid = (obj, size = 4) => {
  if (!obj) {
    console.error('objectToGrid - obj est null ou undefined:', obj);
    return Array(size).fill(null).map(() => Array(size).fill(0));
  }
  
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));
  Object.keys(obj).forEach(key => {
    const match = key.match(/r(\d+)c(\d+)/);
    if (match) {
      const row = parseInt(match[1]);
      const col = parseInt(match[2]);
      grid[row][col] = obj[key];
    }
  });
  return grid;
};

// Convertir une grille de mots fléchés (avec objets {letter, number}) en format Firestore
const crosswordGridToObject = (grid) => {
  if (!grid) {
    console.error('crosswordGridToObject - grid est null ou undefined:', grid);
    return {};
  }
  
  const obj = {};
  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      // Chaque cellule est un objet {letter: string, number: number}
      obj[`r${i}c${j}`] = {
        letter: cell.letter || '',
        number: cell.number || 0
      };
    });
  });
  return obj;
};

// Convertir un objet Firestore en grille de mots fléchés
const objectToCrosswordGrid = (obj, size = 15) => {
  if (!obj) {
    console.error('objectToCrosswordGrid - obj est null ou undefined:', obj);
    return Array(size).fill(null).map(() => 
      Array(size).fill(null).map(() => ({ letter: '', number: 0 }))
    );
  }
  
  const grid = Array(size).fill(null).map(() => 
    Array(size).fill(null).map(() => ({ letter: '', number: 0 }))
  );
  
  Object.keys(obj).forEach(key => {
    const match = key.match(/r(\d+)c(\d+)/);
    if (match) {
      const row = parseInt(match[1]);
      const col = parseInt(match[2]);
      if (row < size && col < size) {
        grid[row][col] = {
          letter: obj[key].letter || '',
          number: obj[key].number || 0
        };
      }
    }
  });
  
  return grid;
};

// Créer une partie de mini-jeu
export const createGame = async (gameId, gameType, initialState) => {
  console.log('createGame - Début', { gameId, gameType, initialState });
  try {
    const gameRef = doc(gamesCollection, gameId);
    
    let stateToSave = initialState;
    
    if (gameType === 'sudoku' && initialState.grid && initialState.initialGrid) {
      // Sudoku : convertir les grilles de nombres
      stateToSave = {
        grid: gridToObject(initialState.grid),
        initialGrid: gridToObject(initialState.initialGrid)
      };
    } else if (gameType === 'crossword' && initialState.grid) {
      // Mots fléchés : convertir la grille d'objets {letter, number}
      stateToSave = {
        ...initialState,
        grid: crosswordGridToObject(initialState.grid)
      };
    }
    
    const gameData = {
      type: gameType,
      state: stateToSave,
      completed: false,
      createdAt: new Date()
    };
    console.log('createGame - Données à écrire:', gameData);
    await setDoc(gameRef, gameData);
    console.log('createGame - Succès !');
    return gameId;
  } catch (error) {
    console.error('createGame - ERREUR:', error);
    throw error;
  }
};

// Mettre à jour l'état d'un mini-jeu
export const updateGameState = async (gameId, gameType, newState) => {
  console.log('updateGameState - gameId:', gameId, 'gameType:', gameType, 'newState:', newState);
  const gameRef = doc(gamesCollection, gameId);
  
  if (gameType === 'sudoku' && newState.grid) {
    // Sudoku : convertir la grille et utiliser dot notation
    const gridObj = gridToObject(newState.grid);
    console.log('updateGameState - Grid convertie:', gridObj);
    await updateDoc(gameRef, {
      'state.grid': gridObj,
      lastUpdate: new Date()
    });
  } else if (gameType === 'crossword' && newState.validatedWords) {
    // Mots croisés : mettre à jour les mots validés
    await updateDoc(gameRef, {
      'state.validatedWords': newState.validatedWords,
      lastUpdate: new Date()
    });
  } else if (gameType === 'wordchain') {
    // Chaîne de mots : mettre à jour la chaîne et le statut
    const updateData = {
      lastUpdate: new Date()
    };
    
    if (newState.chain) {
      updateData['state.chain'] = newState.chain;
    }
    
    if (newState.completed !== undefined) {
      updateData['completed'] = newState.completed;
      if (newState.completedAt) {
        updateData['state.completedAt'] = newState.completedAt;
      }
      if (newState.teamId) {
        updateData['state.teamId'] = newState.teamId;
      }
    }
    
    await updateDoc(gameRef, updateData);
  } else {
    // Autres types de jeux
    await updateDoc(gameRef, {
      state: newState,
      lastUpdate: new Date()
    });
  }
  
  console.log('updateGameState - Mis à jour');
};

// Écouter les changements d'un mini-jeu en temps réel
export const subscribeToGame = (gameId, callback) => {
  const gameRef = doc(gamesCollection, gameId);
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      console.log('subscribeToGame - Données brutes de Firebase:', data);
      
      // Convertir les objets en grilles 2D si c'est un sudoku
      if (data.type === 'sudoku') {
        console.log('subscribeToGame - Type sudoku détecté');
        console.log('subscribeToGame - data.state:', data.state);
        console.log('subscribeToGame - data.state.grid:', data.state.grid);
        console.log('subscribeToGame - data.state.initialGrid:', data.state.initialGrid);
        
        if (data.state && data.state.grid && data.state.initialGrid) {
          data.state = {
            grid: objectToGrid(data.state.grid),
            initialGrid: objectToGrid(data.state.initialGrid)
          };
          console.log('subscribeToGame - Grilles converties:', data.state);
        } else {
          console.error('subscribeToGame - Structure de données invalide');
        }
      } else if (data.type === 'crossword') {
        console.log('subscribeToGame - Type crossword détecté');
        
        // Ancienne structure avec grille
        if (data.state && data.state.grid) {
          console.log('subscribeToGame - Ancienne structure avec grille');
          const gridSize = data.state.gridSize || 15;
          data.state.grid = objectToCrosswordGrid(data.state.grid, gridSize);
        }
        // Nouvelle structure avec words directement - pas de conversion nécessaire
        else if (data.state && data.state.words) {
          console.log('subscribeToGame - Nouvelle structure avec words directement');
          // Rien à faire, les données sont déjà bonnes
        }
      } else if (data.type === 'wordchain') {
        console.log('subscribeToGame - Type wordchain détecté');
        // Pas de conversion nécessaire pour wordchain
      }
      
      callback({ id: doc.id, ...data });
    } else {
      console.error('subscribeToGame - Document n\'existe pas');
      callback(null);
    }
  });
};

// Marquer un mini-jeu comme terminé et attribuer des points
export const completeGame = async (gameId, winningTeamId, points) => {
  const gameRef = doc(gamesCollection, gameId);
  await updateDoc(gameRef, {
    completed: true,
    completedAt: new Date(),
    winningTeam: winningTeamId
  });
  
  if (winningTeamId) {
    await addPoints(winningTeamId, points);
  }
};

/**
 * LEADERBOARD
 */

// Récupérer le classement
export const getLeaderboard = async () => {
  try {
    // Essayer d'abord avec orderBy (nouvelle structure)
    const q = query(teamsCollection, orderBy('score', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      score: 0, // Valeur par défaut
      ...doc.data() 
    }));
  } catch (error) {
    console.warn('⚠️ Erreur orderBy, récupération sans tri:', error);
    // Fallback : récupérer toutes les équipes sans tri
    const snapshot = await getDocs(teamsCollection);
    const teams = snapshot.docs.map(doc => ({ 
      id: doc.id,
      score: 0,
      codesUsed: [],
      ...doc.data()
    }));
    
    // Trier manuellement
    teams.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Migration : ajouter le champ score si manquant
    for (const team of teams) {
      if (team.score === undefined) {
        const teamRef = doc(teamsCollection, team.id);
        await updateDoc(teamRef, { score: 0, codesUsed: [] });
        console.log(`✅ Migration équipe ${team.name}: score ajouté`);
      }
    }
    
    return teams;
  }
};

// Écouter le classement en temps réel
export const subscribeToLeaderboard = (callback) => {
  const q = query(teamsCollection, orderBy('score', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(teams);
  });
};

/**
 * MIGRATION - Mettre à jour les anciennes équipes
 */
export const migrateOldTeams = async () => {
  console.log('🔄 Début de la migration des équipes...');
  const snapshot = await getDocs(teamsCollection);
  let migrated = 0;
  let errors = 0;
  
  for (const teamDoc of snapshot.docs) {
    try {
      const data = teamDoc.data();
      const updates = {};
      
      // Ajouter score si manquant
      if (data.score === undefined) {
        updates.score = 0;
      }
      
      // Ajouter codesUsed si manquant
      if (data.codesUsed === undefined) {
        updates.codesUsed = [];
      }
      
      // Ajouter gameProgress si manquant (pour la nouvelle structure)
      if (data.gameProgress === undefined) {
        updates.gameProgress = {};
      }
      
      // Appliquer les mises à jour si nécessaire
      if (Object.keys(updates).length > 0) {
        const teamRef = doc(teamsCollection, teamDoc.id);
        await updateDoc(teamRef, updates);
        console.log(`✅ Migré: ${data.name}`, updates);
        migrated++;
      }
    } catch (error) {
      console.error(`❌ Erreur migration ${teamDoc.id}:`, error);
      errors++;
    }
  }
  
  console.log(`✅ Migration terminée: ${migrated} équipe(s) migrée(s), ${errors} erreur(s)`);
  return { migrated, errors, total: snapshot.size };
};

/**
 * CRAFTING GAME (Alchimie)
 */

// Créer une configuration de jeu craft
export const createCraftConfig = async (rewardElements) => {
  /*
  rewardElements = [
    { id: 'mariage', points: 50 },
    { id: 'amour', points: 30 },
    ...
  ]
  */
  const configRef = doc(configCollection, 'craft');
  await setDoc(configRef, {
    rewardElements: rewardElements,
    createdAt: new Date()
  });
};

// Récupérer la config craft
export const getCraftConfig = async () => {
  const configRef = doc(configCollection, 'craft');
  const snap = await getDoc(configRef);
  if (snap.exists()) {
    return snap.data();
  }
  return { rewardElements: [] };
};

// Mettre à jour les découvertes d'une équipe
export const updateTeamDiscoveries = async (teamId, discoveries) => {
  const teamRef = doc(teamsCollection, teamId);
  await updateDoc(teamRef, {
    craftDiscoveries: discoveries,
    lastCraftUpdate: new Date()
  });
};

// Écouter les découvertes d'une équipe
export const subscribeToTeamDiscoveries = (teamId, callback) => {
  const teamRef = doc(teamsCollection, teamId);
  return onSnapshot(teamRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.craftDiscoveries || []);
    } else {
      callback([]);
    }
  });
};

/**
 * TEAM GAME PROGRESS (Progression individuelle par équipe)
 */

// Sauvegarder la progression d'une équipe sur un jeu
export const saveTeamGameProgress = async (teamId, gameId, gameType, progress) => {
  const teamRef = doc(teamsCollection, teamId);
  const fieldName = `gameProgress.${gameId}`;
  
  // Convertir les grilles en objets pour Firebase
  let convertedProgress = { ...progress };
  
  if (gameType === 'sudoku' && progress.grid) {
    convertedProgress.grid = gridToObject(progress.grid);
  }
  
  await updateDoc(teamRef, {
    [fieldName]: {
      type: gameType,
      progress: convertedProgress,
      lastUpdate: new Date()
    }
  });
};

// Récupérer la progression d'une équipe sur un jeu
export const getTeamGameProgress = async (teamId, gameId) => {
  const teamRef = doc(teamsCollection, teamId);
  const teamSnap = await getDoc(teamRef);
  
  if (teamSnap.exists()) {
    const data = teamSnap.data();
    const progressData = data.gameProgress?.[gameId] || null;
    
    if (!progressData) return null;
    
    // Convertir les grilles objet en arrays
    if (progressData.type === 'sudoku' && progressData.progress?.grid) {
      progressData.progress.grid = objectToGrid(progressData.progress.grid);
    }
    
    return progressData;
  }
  return null;
};

// Écouter la progression d'une équipe sur un jeu
export const subscribeToTeamGameProgress = (teamId, gameId, callback) => {
  const teamRef = doc(teamsCollection, teamId);
  return onSnapshot(teamRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const progressData = data.gameProgress?.[gameId] || null;
      
      // Convertir les grilles objet en arrays
      if (progressData && progressData.type === 'sudoku' && progressData.progress?.grid) {
        progressData.progress.grid = objectToGrid(progressData.progress.grid);
      }
      
      callback(progressData);
    } else {
      callback(null);
    }
  });
};

// Lister tous les jeux disponibles d'un certain type
export const listAvailableGames = async (gameType) => {
  const q = query(gamesCollection, where('type', '==', gameType));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * ÉVÉNEMENTS GLOBAUX (Voleur / Donateur)
 */

// Créer un événement global et ajuster l'offset global
export const createGlobalEvent = async (type, amount, message) => {
  const eventId = `event_${Date.now()}`;
  const eventRef = doc(collection(db, 'events'), eventId);
  
  // Sauvegarder l'événement
  await setDoc(eventRef, {
    type, // 'thief' ou 'donor'
    amount,
    message,
    createdAt: new Date(),
    acknowledged: {} // { teamId: true, ... }
  });
  
  // Ajuster l'offset global (pas les scores des équipes)
  const configRef = doc(configCollection, 'game');
  const configSnap = await getDoc(configRef);
  
  if (configSnap.exists()) {
    const currentOffset = configSnap.data().globalOffset || 0;
    await updateDoc(configRef, {
      globalOffset: currentOffset + amount
    });
  } else {
    // Créer la config avec l'offset
    await setDoc(configRef, {
      globalOffset: amount,
      ransomGoal: 1000,
      ransomMessage: "Payez la rançon pour libérer les mariés !",
      ransomCompleted: false
    });
  }
  
  return eventId;
};

// Écouter les événements non-acquittés pour une équipe
export const subscribeToUnacknowledgedEvents = (teamId, callback) => {
  const eventsCollection = collection(db, 'events');
  
  return onSnapshot(eventsCollection, (snapshot) => {
    const unacknowledged = [];
    
    snapshot.forEach((doc) => {
      const event = doc.data();
      // Si l'équipe n'a pas encore vu cet événement
      if (!event.acknowledged || !event.acknowledged[teamId]) {
        unacknowledged.push({ id: doc.id, ...event });
      }
    });
    
    callback(unacknowledged);
  });
};

// Marquer un événement comme vu par une équipe
export const acknowledgeEvent = async (eventId, teamId) => {
  const eventRef = doc(collection(db, 'events'), eventId);
  await updateDoc(eventRef, {
    [`acknowledged.${teamId}`]: true
  });
};

