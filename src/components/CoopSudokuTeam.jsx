import React, { useState, useEffect, useRef } from 'react';
import { subscribeToGame, saveTeamGameProgress, subscribeToTeamGameProgress, addPoints } from '../services/gameService';
import Triceracoin from './Triceracoin';

const CoopSudoku = ({ gameId, teamId }) => {
  const [masterGrid, setMasterGrid] = useState(null);
  const [teamGrid, setTeamGrid] = useState(null);
  const [initialGrid, setInitialGrid] = useState(null);
  const [gridSize, setGridSize] = useState(9);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const isInitializedRef = useRef(false);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    let unsubGame, unsubProgress;

    try {
      unsubGame = subscribeToGame(gameId, (gameData) => {
        if (!gameData) {
          setError('Jeu non trouvé. Vérifiez que l\'admin a créé ce jeu.');
          setLoading(false);
          return;
        }
        if (!gameData.state || !gameData.state.grid) {
          setError('Grille invalide');
          setLoading(false);
          return;
        }

        const gridData = gameData.state.grid;
        const gridArray = Array.isArray(gridData)
          ? gridData
          : Object.values(gridData).map(row =>
              Array.isArray(row) ? row : Object.values(row)
            );

        const initialGridData = gameData.state.initialGrid;
        const initialGridArray = Array.isArray(initialGridData)
          ? initialGridData
          : Object.values(initialGridData).map(row =>
              Array.isArray(row) ? row : Object.values(row)
            );

        setMasterGrid(gridArray);
        setInitialGrid(initialGridArray);
        setGridSize(gameData.state.gridSize || gridArray.length || 9);
        setLoading(false);
      });

      unsubProgress = subscribeToTeamGameProgress(teamId, gameId, (progressData) => {
        if (progressData && progressData.progress) {
          isRestoringRef.current = true;
          setTeamGrid(progressData.progress.grid);
          setCompleted(progressData.progress.completed || false);
          isInitializedRef.current = true;

          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        }
      });

      return () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        if (unsubGame) unsubGame();
        if (unsubProgress) unsubProgress();
      };
    } catch (err) {
      console.error('Erreur Sudoku:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [gameId, teamId]);

  useEffect(() => {
    const initializeGrid = async () => {
      if (initialGrid && !isInitializedRef.current && !teamGrid) {
        const newGrid = initialGrid.map(row => [...row]);
        setTeamGrid(newGrid);

        try {
          await saveTeamGameProgress(teamId, gameId, 'sudoku', {
            grid: newGrid,
            completed: false
          });
          isInitializedRef.current = true;
        } catch (error) {
          console.error('Erreur initialisation:', error);
        }
      }
    };

    initializeGrid();
  }, [initialGrid, teamGrid, teamId, gameId]);

  const handleCellChange = async (row, col, value) => {
    if (!teamGrid || !initialGrid) return;
    if (initialGrid[row][col] !== 0) return;

    const parsed = parseInt(value);
    if (value !== '' && (isNaN(parsed) || parsed < 1 || parsed > 9)) return;

    const newGrid = teamGrid.map(r => [...r]);
    newGrid[row][col] = value === '' ? 0 : parsed;

    setTeamGrid(newGrid);

    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(async () => {
      if (isRestoringRef.current) return;

      try {
        await saveTeamGameProgress(teamId, gameId, 'sudoku', {
          grid: newGrid,
          completed: false
        });
      } catch (error) {
        console.error('Erreur sauvegarde:', error);
      }
    }, 2000);

    setSaveTimeout(timeout);
  };

  // Valide en comparant case par case à la solution (masterGrid = grid stockée dans Firebase)
  const validateSudoku = (teamG) => {
    if (!masterGrid) return false;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (teamG[i][j] !== masterGrid[i][j]) return false;
      }
    }
    return true;
  };

  const handleValidate = async () => {
    if (!teamGrid) return;

    if (validateSudoku(teamGrid)) {
      setCompleted(true);
      const points = gridSize === 9 ? 100 : 30;

      await saveTeamGameProgress(teamId, gameId, 'sudoku', {
        grid: teamGrid,
        completed: true,
        completedAt: new Date().toISOString()
      });

      await addPoints(teamId, points);
      alert(`🎉 Bravo ! Sudoku résolu ! +${points} grue${points > 1 ? 's' : ''} !`);
    } else {
      alert('❌ Pas encore correct... Continuez !');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p>Chargement du Sudoku...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <p className="text-red-600 font-bold mb-2">❌ Erreur</p>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!teamGrid) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p>Initialisation...</p>
      </div>
    );
  }

  const filled = teamGrid.flat().filter(cell => cell !== 0).length;
  const total = gridSize * gridSize;
  const percentage = Math.round((filled / total) * 100);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-[#63006A]">
        🧩 Sudoku {gridSize}×{gridSize}
      </h3>

      {completed && (
        <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
          <p className="text-green-800 font-bold text-lg">
            ✅ Sudoku terminé ! Bravo !
          </p>
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Règle :</strong> Chaque ligne, colonne et carré {Math.sqrt(gridSize)}×{Math.sqrt(gridSize)} doit contenir les chiffres 1 à {gridSize} sans répétition.
        </p>
      </div>

      {/* Grille Sudoku */}
      <div className="inline-block border-4 border-[#63006A] rounded-lg overflow-hidden mb-4">
        {teamGrid.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => {
              const isInitial = initialGrid[i][j] !== 0;
              const boxSize = Math.sqrt(gridSize);
              const isBlockBorderRight = (j + 1) % boxSize === 0 && j < gridSize - 1;
              const isBlockBorderBottom = (i + 1) % boxSize === 0 && i < gridSize - 1;

              return (
                <input
                  key={`${i}-${j}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={cell === 0 ? '' : cell}
                  onChange={(e) => handleCellChange(i, j, e.target.value)}
                  disabled={isInitial || completed}
                  className={`
                    w-10 h-10 text-center text-base font-bold
                    ${isInitial
                      ? 'bg-gray-200 text-[#63006A]'
                      : 'bg-white text-[#F9AC30]'}
                    ${isBlockBorderRight ? 'border-r-4 border-[#63006A]' : 'border-r border-gray-300'}
                    ${isBlockBorderBottom ? 'border-b-4 border-[#63006A]' : 'border-b border-gray-300'}
                    ${completed ? 'opacity-75' : ''}
                    focus:outline-none focus:ring-2 focus:ring-[#F9AC30]
                  `}
                />
              );
            })}
          </div>
        ))}
      </div>

      {!completed && (
        <>
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-[#F9AC30] h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              {filled} / {total} cases remplies ({percentage}%)
            </p>
          </div>

          <button
            onClick={handleValidate}
            className="w-full py-3 px-6 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D] transition-all"
          >
            ✓ Valider
          </button>
        </>
      )}

      {completed && (
        <div className="text-center">
          <Triceracoin amount={50} size="xl" textColor="text-[#F9AC30]" />
        </div>
      )}
    </div>
  );
};

export default CoopSudoku;
