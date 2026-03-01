import React, { useState, useEffect, useRef } from 'react';
import { subscribeToGame, saveTeamGameProgress, subscribeToTeamGameProgress, addPoints } from '../services/gameService';
import Triceracoin from './Triceracoin';

const CoopSudoku = ({ gameId, teamId }) => {
  const [masterGrid, setMasterGrid] = useState(null); // Grille maître (de l'admin)
  const [teamGrid, setTeamGrid] = useState(null); // Grille de l'équipe
  const [initialGrid, setInitialGrid] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const isInitializedRef = useRef(false); // Utiliser useRef au lieu de useState pour éviter les re-renders
  const isRestoringRef = useRef(false); // Flag pour éviter de sauvegarder lors de la restauration

  // Charger la grille maître et la progression de l'équipe
  useEffect(() => {
    let unsubGame, unsubProgress;

    try {
      // S'abonner à la grille maître (lecture seule)
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
        
        // Convertir la grille Firebase en array si nécessaire
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
        setLoading(false);
      });

      // S'abonner à la progression de l'équipe
      unsubProgress = subscribeToTeamGameProgress(teamId, gameId, (progressData) => {
        if (progressData && progressData.progress) {
          // L'équipe a déjà une progression sauvegardée (déjà convertie en array par gameService)
          isRestoringRef.current = true; // Marquer qu'on est en train de restaurer
          setTeamGrid(progressData.progress.grid);
          setCompleted(progressData.progress.completed || false);
          isInitializedRef.current = true;
          
          // Reset le flag après un court délai
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
  }, [gameId, teamId]); // ENLEVÉ: initialGrid de la dépendance

  // Initialisation séparée : une seule fois quand on a initialGrid ET qu'on n'est pas déjà initialisé
  useEffect(() => {
    const initializeGrid = async () => {
      // Vérifier avec ref pour ne pas causer de re-render
      if (initialGrid && !isInitializedRef.current && !teamGrid) {
        console.log('CoopSudoku - Initialisation grille équipe');
        const newGrid = initialGrid.map(row => [...row]);
        setTeamGrid(newGrid);
        
        // Sauvegarder immédiatement pour créer le document (conversion en objet faite par gameService)
        try {
          await saveTeamGameProgress(teamId, gameId, 'sudoku', {
            grid: newGrid,
            completed: false
          });
          isInitializedRef.current = true;
          console.log('CoopSudoku - Grille initialisée et sauvegardée');
        } catch (error) {
          console.error('Erreur initialisation:', error);
        }
      }
    };

    initializeGrid();
  }, [initialGrid, teamGrid, teamId, gameId]); // Removed isInitialized from dependencies

  const handleCellChange = async (row, col, value) => {
    if (!teamGrid || !initialGrid) return;
    
    // Vérifier si la cellule est modifiable
    if (initialGrid[row][col] !== 0) return;

    const newGrid = teamGrid.map(r => [...r]);
    newGrid[row][col] = value === '' ? 0 : parseInt(value) || 0;
    
    setTeamGrid(newGrid);
    
    // Debouncing - sauvegarder après 2s d'inactivité
    if (saveTimeout) clearTimeout(saveTimeout);
    
    const timeout = setTimeout(async () => {
      // Ne pas sauvegarder si on est en train de restaurer
      if (isRestoringRef.current) {
        console.log('CoopSudoku - Sauvegarde annulée (restauration en cours)');
        return;
      }
      
      try {
        console.log('CoopSudoku - Sauvegarde...');
        await saveTeamGameProgress(teamId, gameId, 'sudoku', {
          grid: newGrid,
          completed: false
        });
        console.log('CoopSudoku - ✓ Sauvegardé');
      } catch (error) {
        console.error('Erreur sauvegarde:', error);
      }
    }, 2000);
    
    setSaveTimeout(timeout);
  };

  const validateSudoku = (grid) => {
    const size = 4;
    
    // Vérifier les lignes
    for (let i = 0; i < size; i++) {
      const row = new Set(grid[i].filter(n => n !== 0));
      if (row.size !== size) return false;
    }
    
    // Vérifier les colonnes
    for (let j = 0; j < size; j++) {
      const col = new Set();
      for (let i = 0; i < size; i++) {
        if (grid[i][j] !== 0) col.add(grid[i][j]);
      }
      if (col.size !== size) return false;
    }
    
    // Vérifier les blocs 2x2
    for (let blockRow = 0; blockRow < 2; blockRow++) {
      for (let blockCol = 0; blockCol < 2; blockCol++) {
        const block = new Set();
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            const val = grid[blockRow * 2 + i][blockCol * 2 + j];
            if (val !== 0) block.add(val);
          }
        }
        if (block.size !== 4) return false;
      }
    }
    
    return true;
  };

  const handleValidate = async () => {
    if (!teamGrid) return;
    
    if (validateSudoku(teamGrid)) {
      setCompleted(true);
      const points = 50;
      
      await saveTeamGameProgress(teamId, gameId, 'sudoku', {
        grid: teamGrid,
        completed: true,
        completedAt: new Date().toISOString()
      });
      
      await addPoints(teamId, points);
      alert(`🎉 Bravo ! Sudoku résolu ! +${points} Triceracoins !`);
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

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-[#63006A]">
        🧩 Sudoku 4x4
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
          <strong>Règle :</strong> Chaque ligne, colonne et carré 2×2 doit contenir les chiffres 1, 2, 3, 4 sans répétition.
        </p>
      </div>

      {/* Grille Sudoku */}
      <div className="inline-block border-4 border-[#63006A] rounded-lg overflow-hidden mb-4">
        {teamGrid.map((row, i) => (
          <div key={i} className="flex">
            {row.map((cell, j) => {
              const isInitial = initialGrid[i][j] !== 0;
              const isBlockBorder = (j === 1);
              const isRowBlockBorder = (i === 1);
              
              return (
                <input
                  key={`${i}-${j}`}
                  type="text"
                  maxLength="1"
                  value={cell === 0 ? '' : cell}
                  onChange={(e) => handleCellChange(i, j, e.target.value)}
                  disabled={isInitial || completed}
                  className={`
                    w-14 h-14 text-center text-xl font-bold
                    ${isInitial 
                      ? 'bg-gray-200 text-[#63006A]' 
                      : 'bg-white text-[#F9AC30]'}
                    ${isBlockBorder ? 'border-r-4 border-[#63006A]' : 'border-r border-gray-300'}
                    ${isRowBlockBorder ? 'border-b-4 border-[#63006A]' : 'border-b border-gray-300'}
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
        <div className="flex gap-3">
          <button
            onClick={handleValidate}
            className="flex-1 py-3 px-6 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D] transition-all"
          >
            ✓ Valider
          </button>
        </div>
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
