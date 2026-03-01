// Générateur de mots croisés (cruciverbiste)

/**
 * Génère un mot croisé à partir d'une liste de mots
 * Structure simple : chaque mot a une position, direction et définition
 */

export const generateCruciverbist = (wordsList) => {
  const sortedWords = wordsList
    .map(item => ({
      word: item.word.toUpperCase().replace(/[^A-Z]/g, ''),
      clue: item.definition,
      original: item.word
    }))
    .filter(item => item.word.length >= 2)
    .sort((a, b) => b.word.length - a.word.length);

  if (sortedWords.length === 0) {
    return { success: false, error: 'Aucun mot valide fourni', unusedWords: [] };
  }

  const placedWords = [];
  const unusedWords = [];
  const grid = {}; // Simple object: "row,col" -> letter

  // Placer le premier mot au centre horizontalement
  const firstWord = sortedWords[0];
  const firstWordData = {
    id: 1,
    word: firstWord.word,
    clue: firstWord.clue,
    startRow: 10,
    startCol: 10,
    direction: 'horizontal'
  };
  
  placeWordInGrid(grid, firstWordData);
  placedWords.push(firstWordData);

  // Essayer de placer les autres mots
  let nextId = 2;
  for (let i = 1; i < sortedWords.length; i++) {
    const wordData = sortedWords[i];
    const placement = findPlacementForWord(grid, wordData.word, placedWords);
    
    if (placement) {
      const wordEntry = {
        id: nextId++,
        word: wordData.word,
        clue: wordData.clue,
        ...placement
      };
      placeWordInGrid(grid, wordEntry);
      placedWords.push(wordEntry);
    } else {
      unusedWords.push(wordData.original);
    }
  }

  // Calculer les dimensions de la grille
  const bounds = calculateBounds(placedWords);

  return {
    success: true,
    words: placedWords.map((w, idx) => ({ ...w, id: idx + 1 })),
    unusedWords: unusedWords,
    bounds: bounds
  };
};

function placeWordInGrid(grid, wordData) {
  const { word, startRow, startCol, direction } = wordData;
  
  for (let i = 0; i < word.length; i++) {
    const key = direction === 'horizontal' 
      ? `${startRow},${startCol + i}`
      : `${startRow + i},${startCol}`;
    grid[key] = word[i];
  }
}

function findPlacementForWord(grid, word, placedWords) {
  // Essayer de trouver une intersection avec chaque mot déjà placé
  for (const placedWord of placedWords) {
    for (let i = 0; i < word.length; i++) {
      for (let j = 0; j < placedWord.word.length; j++) {
        if (word[i] === placedWord.word[j]) {
          // Intersection potentielle trouvée !
          const newDirection = placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
          
          let startRow, startCol;
          if (newDirection === 'horizontal') {
            // Le nouveau mot est horizontal
            startRow = placedWord.startRow + j;
            startCol = placedWord.startCol - i;
          } else {
            // Le nouveau mot est vertical
            startRow = placedWord.startRow - i;
            startCol = placedWord.startCol + j;
          }
          
          // Vérifier si cette position est valide
          if (isPlacementValid(grid, word, startRow, startCol, newDirection)) {
            return { startRow, startCol, direction: newDirection };
          }
        }
      }
    }
  }
  
  return null;
}

function isPlacementValid(grid, word, startRow, startCol, direction) {
  // Vérifier que le mot ne chevauche pas incorrectement
  for (let i = 0; i < word.length; i++) {
    const row = direction === 'horizontal' ? startRow : startRow + i;
    const col = direction === 'horizontal' ? startCol + i : startCol;
    const key = `${row},${col}`;
    
    if (grid[key] && grid[key] !== word[i]) {
      return false; // Conflit de lettre
    }
  }
  
  // Vérifier qu'il n'y a pas de lettres avant ou après le mot
  if (direction === 'horizontal') {
    // Vérifier avant le mot
    const before = `${startRow},${startCol - 1}`;
    if (grid[before]) return false;
    
    // Vérifier après le mot
    const after = `${startRow},${startCol + word.length}`;
    if (grid[after]) return false;
    
    // Vérifier au-dessus et en-dessous de CHAQUE lettre
    for (let i = 0; i < word.length; i++) {
      const col = startCol + i;
      const above = `${startRow - 1},${col}`;
      const below = `${startRow + 1},${col}`;
      
      // S'il y a une lettre au-dessus ou en-dessous
      if (grid[above] || grid[below]) {
        // C'est OK SEULEMENT si c'est une intersection (la lettre actuelle est déjà dans la grille)
        const currentKey = `${startRow},${col}`;
        if (!grid[currentKey]) {
          // Nouvelle lettre avec adjacence = INTERDIT
          return false;
        }
        // Sinon c'est une intersection valide, on continue
      }
    }
  } else {
    // Vertical
    // Vérifier avant le mot
    const before = `${startRow - 1},${startCol}`;
    if (grid[before]) return false;
    
    // Vérifier après le mot
    const after = `${startRow + word.length},${startCol}`;
    if (grid[after]) return false;
    
    // Vérifier à gauche et à droite de CHAQUE lettre
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i;
      const left = `${row},${startCol - 1}`;
      const right = `${row},${startCol + 1}`;
      
      // S'il y a une lettre à gauche ou à droite
      if (grid[left] || grid[right]) {
        // C'est OK SEULEMENT si c'est une intersection
        const currentKey = `${row},${startCol}`;
        if (!grid[currentKey]) {
          // Nouvelle lettre avec adjacence = INTERDIT
          return false;
        }
      }
    }
  }
  
  return true;
}

function calculateBounds(placedWords) {
  let minRow = Infinity, maxRow = -Infinity;
  let minCol = Infinity, maxCol = -Infinity;
  
  for (const word of placedWords) {
    minRow = Math.min(minRow, word.startRow);
    minCol = Math.min(minCol, word.startCol);
    
    if (word.direction === 'horizontal') {
      maxRow = Math.max(maxRow, word.startRow);
      maxCol = Math.max(maxCol, word.startCol + word.word.length - 1);
    } else {
      maxRow = Math.max(maxRow, word.startRow + word.word.length - 1);
      maxCol = Math.max(maxCol, word.startCol);
    }
  }
  
  return { 
    minRow, 
    maxRow, 
    minCol, 
    maxCol,
    height: maxRow - minRow + 1,
    width: maxCol - minCol + 1
  };
}
