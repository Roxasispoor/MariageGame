import React, { useState, useEffect } from 'react';
import { listAvailableGames, getTeamGameProgress } from '../services/gameService';

const GameSelector = ({ gameType, teamId, onSelect, onBack }) => {
  const [games, setGames] = useState([]);
  const [gamesProgress, setGamesProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, [gameType]);

  const loadGames = async () => {
    try {
      const availableGames = await listAvailableGames(gameType);
      console.log('GameSelector - Jeux disponibles:', availableGames);
      setGames(availableGames);
      
      // Charger la progression pour chaque jeu
      const progressPromises = availableGames.map(async (game) => {
        const progress = await getTeamGameProgress(teamId, game.id);
        console.log(`GameSelector - Progression pour ${game.id}:`, progress);
        return { gameId: game.id, progress };
      });
      
      const progressResults = await Promise.all(progressPromises);
      const progressMap = {};
      progressResults.forEach(({ gameId, progress }) => {
        progressMap[gameId] = progress;
      });
      
      console.log('GameSelector - progressMap:', progressMap);
      setGamesProgress(progressMap);
    } catch (error) {
      console.error('Erreur chargement jeux:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (game, progressData) => {
    if (!progressData) return { percent: 0, completed: false };
    
    if (progressData.progress?.completed) {
      return { percent: 100, completed: true };
    }
    
    if (gameType === 'sudoku') {
      // Pour Sudoku, compter les cases remplies
      const grid = progressData.progress?.grid;
      if (!grid) return { percent: 0, completed: false };
      
      let filled = 0;
      let total = 0;
      
      // Si grid est un objet (format Firebase), le convertir
      const gridArray = Array.isArray(grid) ? grid : Object.values(grid).map(row => 
        Array.isArray(row) ? row : Object.values(row)
      );
      
      gridArray.forEach(row => {
        row.forEach(cell => {
          total++;
          if (cell !== 0) filled++;
        });
      });
      
      return { 
        percent: total > 0 ? Math.round((filled / total) * 100) : 0,
        completed: false
      };
    }
    
    if (gameType === 'crossword') {
      // Pour mots croisés, compter les mots validés
      const validatedWords = progressData.progress?.validatedWords || [];
      
      // Trouver le nombre total de mots dans le jeu
      let totalWords = 0;
      if (game.state?.words) {
        totalWords = Array.isArray(game.state.words) ? game.state.words.length : Object.keys(game.state.words).length;
      }
      
      if (totalWords === 0) return { percent: 0, completed: false };
      
      return {
        percent: Math.round((validatedWords.length / totalWords) * 100),
        completed: validatedWords.length === totalWords
      };
    }
    
    return { percent: 0, completed: false };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des jeux disponibles...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <p className="text-2xl mb-4">😔</p>
        <h3 className="text-xl font-bold text-[#63006A] mb-2">
          Aucun jeu disponible
        </h3>
        <p className="text-gray-600 mb-4">
          L'organisateur n'a pas encore créé de jeu de ce type.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D]"
        >
          Retour
        </button>
      </div>
    );
  }

  const getGameTypeLabel = () => {
    switch (gameType) {
      case 'sudoku': return '🧩 Sudoku';
      case 'crossword': return '📝 Mots Croisés';
      default: return 'Jeux';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#63006A]">
          {getGameTypeLabel()} disponibles
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Retour
        </button>
      </div>

      <div className="space-y-3">
        {games.map((game) => {
          const { percent, completed } = calculateProgress(game, gamesProgress[game.id]);
          console.log(`GameSelector - Jeu ${game.id}: ${percent}% (completed: ${completed})`, {
            game,
            progressData: gamesProgress[game.id]
          });
          
          return (
            <button
              key={game.id}
              onClick={() => onSelect(game)}
              className="w-full bg-gray-50 hover:bg-[#F9AC30]/10 border-2 border-gray-200 hover:border-[#F9AC30] rounded-lg p-4 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-[#63006A] group-hover:text-[#F9AC30] transition-colors">
                      {game.name || `${getGameTypeLabel()} #${game.id.slice(-4)}`}
                    </h3>
                    {completed && (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        ✓ Terminé
                      </span>
                    )}
                  </div>
                  
                  {game.description && (
                    <p className="text-sm text-gray-600">{game.description}</p>
                  )}
                  
                  {/* Barre de progression */}
                  {percent > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              completed ? 'bg-green-500' : 'bg-[#F9AC30]'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Créé le {new Date(game.createdAt?.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-3xl text-[#F9AC30] ml-4">
                  ▶
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        💡 Choisissez un jeu pour {gamesProgress && Object.values(gamesProgress).some(p => p) ? 'continuer' : 'commencer'}
      </p>
    </div>
  );
};

export default GameSelector;
