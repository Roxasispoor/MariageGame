import React, { useState } from 'react';
import { useTeam } from '../hooks/useTeam';
import Triceracoin from '../components/Triceracoin';
import CodeInput from '../components/CodeInput';
import RansomProgress from '../components/RansomProgress';
import Leaderboard from '../components/Leaderboard';
import GameSelector from '../components/GameSelector';
import CoopSudoku from '../components/CoopSudokuTeam';
import Cruciverbist from '../components/CruciverbistTeam';
import InfiniteCraft from '../components/InfiniteCraft';

const TeamView = ({ teamId }) => {
  const { team, loading } = useTeam(teamId);
  const [selectedGameType, setSelectedGameType] = useState(null); // 'sudoku', 'crossword', 'alchemy'
  const [selectedGame, setSelectedGame] = useState(null); // Le jeu sélectionné

  if (loading) {
    return (
      <div className="min-h-screen bg-[#63006A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F9AC30] mx-auto mb-4"></div>
          <p className="text-white text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#63006A] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Équipe non trouvée</h2>
          <p className="mt-4 text-gray-600">Veuillez vérifier l'ID de l'équipe</p>
        </div>
      </div>
    );
  }

  // Si un type de jeu est sélectionné mais pas encore de jeu spécifique, afficher le sélecteur
  if (selectedGameType && !selectedGame) {
    return (
      <div className="min-h-screen bg-[#63006A] p-4">
        <div className="max-w-4xl mx-auto">
          <GameSelector
            gameType={selectedGameType}
            teamId={teamId}
            onSelect={(game) => setSelectedGame(game)}
            onBack={() => setSelectedGameType(null)}
          />
        </div>
      </div>
    );
  }

  // Si un jeu est sélectionné, afficher le jeu
  if (selectedGame) {
    return (
      <div className="min-h-screen bg-[#63006A] p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setSelectedGame(null);
              setSelectedGameType(null);
            }}
            className="mb-4 px-4 py-2 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D] transition-all"
          >
            ← Retour aux épreuves
          </button>
          
          {selectedGameType === 'sudoku' && (
            <CoopSudoku gameId={selectedGame.id} teamId={teamId} />
          )}
          {selectedGameType === 'crossword' && (
            <Cruciverbist gameId={selectedGame.id} teamId={teamId} />
          )}
          {selectedGameType === 'alchemy' && (
            <InfiniteCraft teamId={teamId} />
          )}
        </div>
      </div>
    );
  }

  // Vue principale avec catégories
  return (
    <div className="min-h-screen bg-[#63006A] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#63006A]">
                {team.name}
              </h1>
              <p className="text-gray-600 text-sm">Équipe {team.name}</p>
            </div>
            <div className="text-center bg-[#F9AC30] rounded-lg px-6 py-3">
              <Triceracoin amount={team.score} size="xl" textColor="text-white" />
            </div>
          </div>
        </div>

        {/* Objectif rançon */}
        <div className="mb-6">
          <RansomProgress />
        </div>

        {/* Codes secrets */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#63006A] mb-4">
            💰 Entrer un code
          </h2>
          <CodeInput teamId={teamId} />
        </div>

        {/* Épreuves en ligne */}
        <div className="bg-[#F9AC30] rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#63006A] mb-4 border-b-2 border-[#63006A] pb-2">
            Épreuves en ligne :
          </h2>
          
          <div className="space-y-3">
            {/* Sudoku */}
            <GameButton
              icon="🧩"
              title="Sudoku"
              description="Résolvez le Sudoku coopératif"
              completed={false}
              onClick={() => setSelectedGameType('sudoku')}
            />

            {/* Mots Croisés */}
            <GameButton
              icon="📝"
              title="Mots Fléchés"
              description="Complétez la grille de mots"
              completed={false}
              onClick={() => setSelectedGameType('crossword')}
            />

            {/* Alchimie - pas besoin de sélecteur, directement */}
            <GameButton
              icon="🎨"
              title="Associations de mots"
              description="Combinez les éléments"
              completed={false}
              onClick={() => {
                setSelectedGameType('alchemy');
                setSelectedGame({ id: 'alchemy', type: 'alchemy' });
              }}
            />
          </div>
        </div>

        {/* Classement */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-[#63006A] mb-4">
            🏆 Classement
          </h2>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

// Composant pour les boutons de jeu
const GameButton = ({ icon, title, description, completed, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg p-4 flex items-center gap-4 hover:bg-gray-50 transition-all shadow-md group"
    >
      <div className="text-4xl">{icon}</div>
      <div className="flex-1 text-left">
        <h3 className="text-lg font-bold text-[#63006A] group-hover:text-[#F9AC30] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {completed && (
        <div className="text-green-500 text-2xl">✓</div>
      )}
      <div className="text-[#63006A] text-2xl">▶</div>
    </button>
  );
};

export default TeamView;
