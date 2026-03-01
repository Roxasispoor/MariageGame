import React, { useState, useEffect } from 'react';
import { subscribeToGame, updateGameState, completeGame } from '../services/gameService';

// Mini Sudoku 4x4 pour simplifier (peut être étendu à 9x9)
const CoopSudoku = ({ gameId, teamId }) => {
  const [grid, setGrid] = useState(null);
  const [initialGrid, setInitialGrid] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);

  console.log('CoopSudoku - Rendu avec gameId:', gameId, 'teamId:', teamId);

  useEffect(() => {
    console.log('CoopSudoku - useEffect déclenché');
    try {
      const unsubscribe = subscribeToGame(gameId, (gameData) => {
        console.log('CoopSudoku - Données reçues:', gameData);
        if (!gameData) {
          setError('Jeu non trouvé');
          setLoading(false);
          return;
        }
        if (!gameData.state || !gameData.state.grid) {
          setError('Grille invalide');
          setLoading(false);
          return;
        }
        setGrid(gameData.state.grid);
        if (!initialGrid) {
          setInitialGrid(gameData.state.initialGrid);
        }
        setCompleted(gameData.completed);
        setLoading(false);
      });

      return () => {
        console.log('CoopSudoku - Cleanup');
        if (saveTimeout) clearTimeout(saveTimeout);
        unsubscribe();
      };
    } catch (err) {
      console.error('CoopSudoku - Erreur:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [gameId, initialGrid]);

  const handleCellChange = async (row, col, value) => {
    // Vérifier si la cellule est modifiable
    if (initialGrid[row][col] !== 0) return;

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value === '' ? 0 : parseInt(value);
    
    setGrid(newGrid);
    
    // Annuler le timeout précédent
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Créer un nouveau timeout pour sauvegarder après 10 secondes d'inactivité
    const timeoutId = setTimeout(async () => {
      console.log('Sauvegarde de la grille dans Firebase...');
      await updateGameState(gameId, 'sudoku', { grid: newGrid });
      
      // Vérifier automatiquement si le sudoku est complet et correct
      checkCompletion(newGrid);
    }, 10000); // Attendre 10 secondes d'inactivité
    
    setSaveTimeout(timeoutId);
  };

  const checkCompletion = async (gridToCheck) => {
    if (isSudokuComplete(gridToCheck) && isSudokuValid(gridToCheck)) {
      console.log('Sudoku complété et valide !');
      await completeGame(gameId, teamId, 100);
    }
  };

  const handleManualValidation = async () => {
    if (!isSudokuComplete(grid)) {
      alert('Le Sudoku n\'est pas encore complet !');
      return;
    }
    
    if (!isSudokuValid(grid)) {
      alert('Le Sudoku contient des erreurs ! Vérifiez les lignes, colonnes et carrés.');
      return;
    }

    // Sudoku valide !
    await completeGame(gameId, teamId, 100);
  };

  const isSudokuComplete = (g) => {
    return g.every(row => row.every(cell => cell !== 0));
  };

  const isSudokuValid = (g) => {
    // Vérifier les lignes
    for (let row of g) {
      const filtered = row.filter(n => n !== 0);
      if (new Set(filtered).size !== filtered.length) return false;
    }

    // Vérifier les colonnes
    for (let col = 0; col < 4; col++) {
      const column = g.map(row => row[col]).filter(n => n !== 0);
      if (new Set(column).size !== column.length) return false;
    }

    // Vérifier les carrés 2x2
    for (let boxRow = 0; boxRow < 2; boxRow++) {
      for (let boxCol = 0; boxCol < 2; boxCol++) {
        const box = [];
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            const val = g[boxRow * 2 + i][boxCol * 2 + j];
            if (val !== 0) box.push(val);
          }
        }
        if (new Set(box).size !== box.length) return false;
      }
    }

    return true;
  };

  const getCellError = (row, col) => {
    if (!grid || grid[row][col] === 0) return false;
    
    const value = grid[row][col];
    
    // Vérifier la ligne
    for (let c = 0; c < 4; c++) {
      if (c !== col && grid[row][c] === value) return true;
    }
    
    // Vérifier la colonne
    for (let r = 0; r < 4; r++) {
      if (r !== row && grid[r][col] === value) return true;
    }
    
    // Vérifier le carré 2x2
    const boxRow = Math.floor(row / 2) * 2;
    const boxCol = Math.floor(col / 2) * 2;
    for (let r = boxRow; r < boxRow + 2; r++) {
      for (let c = boxCol; c < boxCol + 2; c++) {
        if ((r !== row || c !== col) && grid[r][c] === value) return true;
      }
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>Chargement du Sudoku...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 font-bold mb-2">❌ Erreur : {error}</p>
        <p className="text-gray-600">Vérifiez que l'ID du jeu est correct.</p>
        <p className="text-sm text-gray-500 mt-2">ID utilisé : {gameId}</p>
      </div>
    );
  }

  if (!grid || !initialGrid) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Aucune grille trouvée...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        🧩 Sudoku Coopératif
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Complétez le sudoku en équipe ! Chaque joueur peut modifier les cases. 
        Utilisez les chiffres 1-4.
      </p>

      {completed && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg font-bold text-center">
          🎉 Sudoku complété ! +100 points
        </div>
      )}

      <div className="inline-block">
        <div className="grid grid-cols-4 gap-1 bg-gray-800 p-2 rounded-lg">
          {grid && grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isInitial = initialGrid[rowIndex][colIndex] !== 0;
              const isInTopBox = rowIndex < 2;
              const isInLeftBox = colIndex < 2;
              const hasError = getCellError(rowIndex, colIndex);
              
              return (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="text"
                  maxLength="1"
                  value={cell === 0 ? '' : cell}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  disabled={isInitial || completed}
                  className={`
                    w-14 h-14 text-center text-xl font-bold
                    ${isInitial 
                      ? 'bg-gray-200 text-gray-800 cursor-not-allowed' 
                      : hasError
                        ? 'bg-red-100 text-red-600 border-2 border-red-400'
                        : 'bg-white text-blue-600'
                    }
                    ${!isInTopBox && rowIndex % 2 === 0 ? 'border-t-2 border-gray-800' : ''}
                    ${!isInLeftBox && colIndex % 2 === 0 ? 'border-l-2 border-gray-800' : ''}
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${completed ? 'opacity-50' : ''}
                  `}
                />
              );
            })
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 Cases grises = chiffres fixes</p>
        <p>💡 Cases blanches = à compléter</p>
      </div>

      {/* Bouton de validation */}
      {!completed && (
        <div className="mt-6">
          <button
            onClick={handleManualValidation}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
          >
            ✓ Valider le Sudoku
          </button>
          
          {/* Indicateur de progression */}
          <div className="mt-3 text-center">
            {(() => {
              const filled = grid.flat().filter(cell => cell !== 0).length;
              const total = 16;
              const percentage = Math.round((filled / total) * 100);
              return (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {filled} / {total} cases remplies ({percentage}%)
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoopSudoku;
