import React, { useState } from 'react';
import { useTeam } from '../hooks/useTeam';
import CodeInput from '../components/CodeInput';
import Leaderboard from '../components/Leaderboard';
import RansomProgress from '../components/RansomProgress';
import CoopSudoku from '../components/CoopSudoku';
import Cruciverbist from '../components/Cruciverbist';
import WordChain from '../components/WordChain';
import InfiniteCraft from '../components/InfiniteCraft';

const TeamView = ({ teamId }) => {
  console.log('TeamView - teamId reçu:', teamId);
  const { team, loading } = useTeam(teamId);
  console.log('TeamView - loading:', loading, 'team:', team);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Équipe non trouvée</h2>
          <p className="mt-4 text-gray-600">Veuillez vérifier l'ID de l'équipe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header avec nom et score de l'équipe */}
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-4xl font-bold mb-2" 
                style={{ color: team.color }}
              >
                {team.name}
              </h1>
              <p className="text-gray-600">
                Codes utilisés : {team.codesUsed?.length || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-6xl font-bold text-gray-800">{team.score}</p>
              <p className="text-xl text-gray-600">points</p>
            </div>
          </div>
        </div>

        {/* Objectif global de rançon */}
        <div className="mb-6">
          <RansomProgress />
        </div>

        {/* Grille avec composants */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Input de code */}
          <CodeInput teamId={teamId} teamColor={team.color} />

          {/* Classement */}
          <Leaderboard />
        </div>

        {/* Section mini-jeux (à ajouter) */}
        <div className="mt-6 bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            🎮 Mini-jeux disponibles
          </h2>
          
          <div className="space-y-4">
            {/* Sudoku */}
            <div>
              <h3 className="font-bold mb-2 text-purple-800">🧩 Sudoku</h3>
              <SudokuSection teamId={teamId} />
            </div>

            {/* Mots croisés */}
            <div className="mt-6">
              <h3 className="font-bold mb-2 text-blue-800">🔤 Mots Croisés</h3>
              <CrosswordSection teamId={teamId} />
            </div>

            {/* Chaîne de mots */}
            <div className="mt-6">
              <h3 className="font-bold mb-2 text-green-800">🔗 Chaîne de Mots</h3>
              <WordChainSection teamId={teamId} />
            </div>

            {/* Alchimie des éléments */}
            <div className="mt-6">
              <h3 className="font-bold mb-2 text-purple-800">🎨 Alchimie des Éléments</h3>
              <InfiniteCraft teamId={teamId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour accéder au Sudoku
const SudokuSection = ({ teamId }) => {
  const [gameId, setGameId] = useState('');
  const [showSudoku, setShowSudoku] = useState(false);
  const [savedGames, setSavedGames] = useState([]);

  // Charger les jeux sauvegardés au démarrage
  useState(() => {
    const saved = localStorage.getItem('weddingGame_sudokuGames');
    if (saved) {
      setSavedGames(JSON.parse(saved));
    }
  }, []);

  const handleJoinSudoku = () => {
    if (gameId.trim()) {
      // Sauvegarder le jeu si pas déjà dans la liste
      if (!savedGames.includes(gameId.trim())) {
        const newGames = [...savedGames, gameId.trim()];
        setSavedGames(newGames);
        localStorage.setItem('weddingGame_sudokuGames', JSON.stringify(newGames));
      }
      setShowSudoku(true);
    }
  };

  const handleJoinSavedGame = (savedGameId) => {
    setGameId(savedGameId);
    setShowSudoku(true);
  };

  const handleRemoveSavedGame = (gameIdToRemove) => {
    const newGames = savedGames.filter(id => id !== gameIdToRemove);
    setSavedGames(newGames);
    localStorage.setItem('weddingGame_sudokuGames', JSON.stringify(newGames));
  };

  if (showSudoku) {
    return (
      <div>
        <button
          onClick={() => setShowSudoku(false)}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          ← Retour
        </button>
        <CoopSudoku gameId={gameId} teamId={teamId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Liste des jeux sauvegardés */}
      {savedGames.length > 0 && (
        <div className="mb-4">
          <h4 className="font-bold text-gray-800 mb-2">🎮 Mes Sudokus :</h4>
          <div className="space-y-2">
            {savedGames.map((savedGameId) => (
              <div key={savedGameId} className="flex gap-2">
                <button
                  onClick={() => handleJoinSavedGame(savedGameId)}
                  className="flex-1 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-all text-left font-mono text-sm"
                >
                  📋 {savedGameId}
                </button>
                <button
                  onClick={() => handleRemoveSavedGame(savedGameId)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <hr className="my-4 border-gray-300" />
        </div>
      )}

      <p className="text-gray-600">
        {savedGames.length > 0 
          ? 'Ou entrez un nouvel ID de Sudoku :' 
          : 'Demandez l\'ID du Sudoku à l\'organisateur et entrez-le ci-dessous :'}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="sudoku_1234567890"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleJoinSudoku}
          disabled={!gameId.trim()}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
        >
          Jouer
        </button>
      </div>
    </div>
  );
};

// Composant pour accéder aux Mots Croisés
const CrosswordSection = ({ teamId }) => {
  const [gameId, setGameId] = useState('');
  const [showCrossword, setShowCrossword] = useState(false);
  const [savedGames, setSavedGames] = useState([]);

  // Charger les jeux sauvegardés au démarrage
  useState(() => {
    const saved = localStorage.getItem('weddingGame_crosswordGames');
    if (saved) {
      setSavedGames(JSON.parse(saved));
    }
  }, []);

  const handleJoinCrossword = () => {
    if (gameId.trim()) {
      // Sauvegarder le jeu si pas déjà dans la liste
      if (!savedGames.includes(gameId.trim())) {
        const newGames = [...savedGames, gameId.trim()];
        setSavedGames(newGames);
        localStorage.setItem('weddingGame_crosswordGames', JSON.stringify(newGames));
      }
      setShowCrossword(true);
    }
  };

  const handleJoinSavedGame = (savedGameId) => {
    setGameId(savedGameId);
    setShowCrossword(true);
  };

  const handleRemoveSavedGame = (gameIdToRemove) => {
    const newGames = savedGames.filter(id => id !== gameIdToRemove);
    setSavedGames(newGames);
    localStorage.setItem('weddingGame_crosswordGames', JSON.stringify(newGames));
  };

  if (showCrossword) {
    return (
      <div>
        <button
          onClick={() => setShowCrossword(false)}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          ← Retour
        </button>
        <Cruciverbist gameId={gameId} teamId={teamId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Liste des jeux sauvegardés */}
      {savedGames.length > 0 && (
        <div className="mb-4">
          <h4 className="font-bold text-gray-800 mb-2">🎮 Mes Mots Croisés :</h4>
          <div className="space-y-2">
            {savedGames.map((savedGameId) => (
              <div key={savedGameId} className="flex gap-2">
                <button
                  onClick={() => handleJoinSavedGame(savedGameId)}
                  className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-all text-left font-mono text-sm"
                >
                  📋 {savedGameId}
                </button>
                <button
                  onClick={() => handleRemoveSavedGame(savedGameId)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <hr className="my-4 border-gray-300" />
        </div>
      )}

      <p className="text-gray-600">
        {savedGames.length > 0 
          ? 'Ou entrez un nouvel ID de mots croisés :' 
          : 'Demandez l\'ID des mots croisés à l\'organisateur et entrez-le ci-dessous :'}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="crossword_1234567890"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleJoinCrossword}
          disabled={!gameId.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          Jouer
        </button>
      </div>
    </div>
  );
};

// Composant pour accéder à la Chaîne de Mots
const WordChainSection = ({ teamId }) => {
  const [gameId, setGameId] = useState('');
  const [showGame, setShowGame] = useState(false);
  const [savedGames, setSavedGames] = useState([]);

  useState(() => {
    const saved = localStorage.getItem('weddingGame_wordchainGames');
    if (saved) {
      setSavedGames(JSON.parse(saved));
    }
  }, []);

  const handleJoinGame = () => {
    if (gameId.trim()) {
      if (!savedGames.includes(gameId.trim())) {
        const newGames = [...savedGames, gameId.trim()];
        setSavedGames(newGames);
        localStorage.setItem('weddingGame_wordchainGames', JSON.stringify(newGames));
      }
      setShowGame(true);
    }
  };

  const handleJoinSavedGame = (savedGameId) => {
    setGameId(savedGameId);
    setShowGame(true);
  };

  const handleRemoveSavedGame = (gameIdToRemove) => {
    const newGames = savedGames.filter(id => id !== gameIdToRemove);
    setSavedGames(newGames);
    localStorage.setItem('weddingGame_wordchainGames', JSON.stringify(newGames));
  };

  if (showGame) {
    return (
      <div>
        <button
          onClick={() => setShowGame(false)}
          className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          ← Retour
        </button>
        <WordChain gameId={gameId} teamId={teamId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedGames.length > 0 && (
        <div className="mb-4">
          <h4 className="font-bold text-gray-800 mb-2">🎮 Mes Chaînes de Mots :</h4>
          <div className="space-y-2">
            {savedGames.map((savedGameId) => (
              <div key={savedGameId} className="flex gap-2">
                <button
                  onClick={() => handleJoinSavedGame(savedGameId)}
                  className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-all text-left font-mono text-sm"
                >
                  📋 {savedGameId}
                </button>
                <button
                  onClick={() => handleRemoveSavedGame(savedGameId)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <hr className="my-4 border-gray-300" />
        </div>
      )}

      <p className="text-gray-600">
        {savedGames.length > 0 
          ? 'Ou entrez un nouvel ID de chaîne de mots :' 
          : 'Demandez l\'ID de la chaîne de mots à l\'organisateur :'}
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="wordchain_1234567890"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleJoinGame}
          disabled={!gameId.trim()}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
        >
          Jouer
        </button>
      </div>
    </div>
  );
};

export default TeamView;
