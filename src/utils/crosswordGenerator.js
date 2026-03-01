// Générateur de mots fléchés

/**
 * Structure d'un mot placé dans la grille
 * {
 *   word: string,
 *   definition: string,
 *   row: number,
 *   col: number,
 *   direction: 'horizontal' | 'vertical',
 *   number: number
 * }
 */

export const generateCrossword = (wordsList, gridSize = 15) => {
  // Trier les mots par longueur (les plus longs d'abord)
  const sortedWords = wordsList
    .map(item => ({
      word: item.word.toUpperCase().replace(/[^A-Z]/g, ''),
      definition: item.definition,
      original: item.word
    }))
    .filter(item => item.word.length >= 2)
    .sort((a, b) => b.word.length - a.word.length);

  if (sortedWords.length === 0) {
    return { success: false, error: 'Aucun mot valide fourni', unusedWords: [] };
  }

  // Initialiser la grille
  const grid = Array(gridSize).fill(null).map(() => 
    Array(gridSize).fill(null).map(() => ({ letter: '', number: 0 }))
  );

  const placedWords = [];
  const unusedWords = [];

  // Placer le premier mot au centre horizontalement
  const firstWord = sortedWords[0];
  const startCol = Math.floor((gridSize - firstWord.word.length) / 2);
  const startRow = Math.floor(gridSize / 2);

  if (placeWord(grid, firstWord.word, startRow, startCol, 'horizontal')) {
    placedWords.push({
      ...firstWord,
      row: startRow,
      col: startCol,
      direction: 'horizontal',
      number: 1
    });
  } else {
    unusedWords.push(firstWord.original);
  }

  // Essayer de placer les autres mots
  for (let i = 1; i < sortedWords.length; i++) {
    const wordData = sortedWords[i];
    const placed = tryPlaceWord(grid, wordData, placedWords);
    
    if (placed) {
      placedWords.push(placed);
    } else {
      unusedWords.push(wordData.original);
    }
  }

  // Numéroter les mots
  numberWords(placedWords);

  // Nettoyer la grille (retirer les cases vides inutiles)
  const bounds = getBounds(placedWords);
  const cleanedGrid = extractSubGrid(grid, bounds, gridSize);

  return {
    success: true,
    grid: cleanedGrid,
    words: placedWords,
    unusedWords: unusedWords,
    gridSize: Math.max(bounds.maxRow - bounds.minRow + 1, bounds.maxCol - bounds.minCol + 1)
  };
};

function placeWord(grid, word, row, col, direction) {
  const gridSize = grid.length;
  
  // Vérifier si le mot rentre dans la grille
  if (direction === 'horizontal') {
    if (col + word.length > gridSize) return false;
    
    // Vérifier les conflits
    for (let i = 0; i < word.length; i++) {
      const currentLetter = grid[row][col + i].letter;
      if (currentLetter && currentLetter !== word[i]) {
        return false;
      }
    }
    
    // Vérifier qu'il n'y a pas de lettres avant/après
    if (col > 0 && grid[row][col - 1].letter) return false;
    if (col + word.length < gridSize && grid[row][col + word.length].letter) return false;
    
    // Placer le mot
    for (let i = 0; i < word.length; i++) {
      grid[row][col + i].letter = word[i];
    }
  } else {
    if (row + word.length > gridSize) return false;
    
    // Vérifier les conflits
    for (let i = 0; i < word.length; i++) {
      const currentLetter = grid[row + i][col].letter;
      if (currentLetter && currentLetter !== word[i]) {
        return false;
      }
    }
    
    // Vérifier qu'il n'y a pas de lettres avant/après
    if (row > 0 && grid[row - 1][col].letter) return false;
    if (row + word.length < gridSize && grid[row + word.length][col].letter) return false;
    
    // Placer le mot
    for (let i = 0; i < word.length; i++) {
      grid[row + i][col].letter = word[i];
    }
  }
  
  return true;
}

function tryPlaceWord(grid, wordData, placedWords) {
  const word = wordData.word;
  const gridSize = grid.length;
  
  // Chercher des intersections possibles avec les mots déjà placés
  for (const placedWord of placedWords) {
    // Essayer de croiser avec ce mot
    for (let i = 0; i < word.length; i++) {
      for (let j = 0; j < placedWord.word.length; j++) {
        if (word[i] === placedWord.word[j]) {
          // Intersection trouvée !
          const newDirection = placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
          
          let newRow, newCol;
          if (newDirection === 'horizontal') {
            newRow = placedWord.row + j;
            newCol = placedWord.col - i;
          } else {
            newRow = placedWord.row - i;
            newCol = placedWord.col + j;
          }
          
          // Vérifier si valide
          if (newRow >= 0 && newCol >= 0 && newRow < gridSize && newCol < gridSize) {
            // Sauvegarder l'état de la grille
            const gridCopy = grid.map(row => row.map(cell => ({ ...cell })));
            
            if (placeWord(grid, word, newRow, newCol, newDirection)) {
              return {
                ...wordData,
                row: newRow,
                col: newCol,
                direction: newDirection,
                number: 0 // Sera numéroté plus tard
              };
            } else {
              // Restaurer la grille
              grid.splice(0, grid.length, ...gridCopy);
            }
          }
        }
      }
    }
  }
  
  return null;
}

function numberWords(placedWords) {
  // Trier par position (haut-gauche vers bas-droite)
  const sorted = [...placedWords].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
  
  let number = 1;
  const numbered = new Set();
  
  for (const word of sorted) {
    const key = `${word.row}-${word.col}`;
    if (!numbered.has(key)) {
      word.number = number;
      number++;
      numbered.add(key);
    }
  }
}

function getBounds(placedWords) {
  let minRow = Infinity, maxRow = -Infinity;
  let minCol = Infinity, maxCol = -Infinity;
  
  for (const word of placedWords) {
    minRow = Math.min(minRow, word.row);
    minCol = Math.min(minCol, word.col);
    
    if (word.direction === 'horizontal') {
      maxRow = Math.max(maxRow, word.row);
      maxCol = Math.max(maxCol, word.col + word.word.length - 1);
    } else {
      maxRow = Math.max(maxRow, word.row + word.word.length - 1);
      maxCol = Math.max(maxCol, word.col);
    }
  }
  
  return { minRow, maxRow, minCol, maxCol };
}

function extractSubGrid(grid, bounds, maxSize) {
  const height = bounds.maxRow - bounds.minRow + 1;
  const width = bounds.maxCol - bounds.minCol + 1;
  
  const subGrid = [];
  for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
    const row = [];
    for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
      row.push(grid[r][c]);
    }
    subGrid.push(row);
  }
  
  return subGrid;
}
