import React, { useState, useEffect } from 'react';
import { subscribeToGame, updateGameState, completeGame } from '../services/gameService';

const CoopSudoku = ({ gameId, teamId }) => {
  const [grid, setGrid] = useState(null);
  const [initialGrid, setInitialGrid] = useState(null);
  const [gridSize, setGridSize] = useState(9);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToGame(gameId, (gameData) => {
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
        // grid = solution, initialGrid = disposition initiale (cases vides = 0)
        setGrid(gameData.state.initialGrid || gameData.state.grid);
        setGridSize(gameData.state.gridSize || gameData.state.grid.length || 9);
        if (!initialGrid) {
          setInitialGrid(gameData.state.initialGrid);
        }
        setCompleted(gameData.completed);
        setLoading(false);
      });

      return () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        unsubscribe();
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [gameId, initialGrid]);

  const handleCellChange = async (row, col, value) => {
    if (initialGrid[row][col] !== 0) return;

    const parsed = parseInt(value);
    if (value !== '' && (isNaN(parsed) || parsed < 1 || parsed > 9)) return;

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value === '' ? 0 : parsed;

    setGrid(newGrid);

    if (saveTimeout) clearTimeout(saveTimeout);

    const timeoutId = setTimeout(async () => {
      await updateGameState(gameId, 'sudoku', { grid: newGrid });
      checkCompletion(newGrid);
    }, 10000);

    setSaveTimeout(timeoutId);
  };

  const checkCompletion = async (gridToCheck) => {
    if (isSudokuComplete(gridToCheck) && isSudokuValid(gridToCheck)) {
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
    await completeGame(gameId, teamId, 100);
  };

  const isSudokuComplete = (g) => g.every(row => row.every(cell => cell !== 0));

  const isSudokuValid = (g) => {
    const size = gridSize;
    const boxSize = Math.sqrt(size);

    for (let row of g) {
      const filtered = row.filter(n => n !== 0);
      if (new Set(filtered).size !== filtered.length) return false;
    }

    for (let col = 0; col < size; col++) {
      const column = g.map(row => row[col]).filter(n => n !== 0);
      if (new Set(column).size !== column.length) return false;
    }

    for (let boxRow = 0; boxRow < boxSize; boxRow++) {
      for (let boxCol = 0; boxCol < boxSize; boxCol++) {
        const box = [];
        for (let i = 0; i < boxSize; i++) {
          for (let j = 0; j < boxSize; j++) {
            const val = g[boxRow * boxSize + i][boxCol * boxSize + j];
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
    const size = gridSize;
    const boxSize = Math.sqrt(size);

    for (let c = 0; c < size; c++) {
      if (c !== col && grid[row][c] === value) return true;
    }
    for (let r = 0; r < size; r++) {
      if (r !== row && grid[r][col] === value) return true;
    }

    const boxRow = Math.floor(row / boxSize) * boxSize;
    const boxCol = Math.floor(col / boxSize) * boxSize;
    for (let r = boxRow; r < boxRow + boxSize; r++) {
      for (let c = boxCol; c < boxCol + boxSize; c++) {
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

  const filled = grid.flat().filter(cell => cell !== 0).length;
  const total = gridSize * gridSize;
  const percentage = Math.round((filled / total) * 100);

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        🧩 Sudoku Coopératif {gridSize}×{gridSize}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Complétez le sudoku en équipe ! Chaque ligne, colonne et carré {Math.sqrt(gridSize)}×{Math.sqrt(gridSize)} doit contenir les chiffres 1 à {gridSize}.
      </p>

      {completed && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg font-bold text-center">
          🎉 Sudoku complété ! +100 points
        </div>
      )}

      <div className="inline-block border-4 border-gray-800 rounded-lg overflow-hidden">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => {
              const isInitial = initialGrid[rowIndex][colIndex] !== 0;
              const boxSize = Math.sqrt(gridSize);
              const isBlockBorderRight = (colIndex + 1) % boxSize === 0 && colIndex < gridSize - 1;
              const isBlockBorderBottom = (rowIndex + 1) % boxSize === 0 && rowIndex < gridSize - 1;
              const hasError = getCellError(rowIndex, colIndex);

              return (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={cell === 0 ? '' : cell}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  disabled={isInitial || completed}
                  className={`
                    w-10 h-10 text-center text-base font-bold
                    ${isInitial
                      ? 'bg-gray-200 text-gray-800 cursor-not-allowed'
                      : hasError
                        ? 'bg-red-100 text-red-600 border-2 border-red-400'
                        : 'bg-white text-blue-600'}
                    ${isBlockBorderRight ? 'border-r-4 border-gray-800' : 'border-r border-gray-300'}
                    ${isBlockBorderBottom ? 'border-b-4 border-gray-800' : 'border-b border-gray-300'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${completed ? 'opacity-50' : ''}
                  `}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 Cases grises = chiffres fixes</p>
        <p>💡 Cases rouges = erreur</p>
      </div>

      {!completed && (
        <div className="mt-6">
          <button
            onClick={handleManualValidation}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
          >
            ✓ Valider le Sudoku
          </button>

          <div className="mt-3 text-center">
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
        </div>
      )}
    </div>
  );
};

export default CoopSudoku;
