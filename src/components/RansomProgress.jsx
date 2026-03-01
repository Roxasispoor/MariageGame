import React, { useState, useEffect } from 'react';
import { subscribeToGameConfig, subscribeToLeaderboard } from '../services/gameService';
import Triceracoin from './Triceracoin';

const RansomProgress = () => {
  const [config, setConfig] = useState(null);
  const [teams, setTeams] = useState([]);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    // Écouter la config
    const unsubConfig = subscribeToGameConfig((configData) => {
      setConfig(configData);
    });

    // Écouter les équipes pour calculer le total
    const unsubTeams = subscribeToLeaderboard((teamsData) => {
      setTeams(teamsData);
      const total = teamsData.reduce((sum, team) => sum + team.score, 0);
      setTotalScore(total);
    });

    return () => {
      unsubConfig();
      unsubTeams();
    };
  }, []);

  if (!config) {
    return null;
  }

  // Calculer le total avec l'offset (voleur/donateur)
  const globalOffset = config.globalOffset || 0;
  const effectiveTotal = Math.max(0, totalScore + globalOffset);
  const percentage = Math.min((effectiveTotal / config.ransomGoal) * 100, 100);
  const isCompleted = config.ransomCompleted || percentage >= 100;

  return (
    <div className={`bg-white rounded-lg shadow-xl p-6 ${isCompleted ? 'border-4 border-green-500' : ''}`}>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-[#63006A] mb-2">
          {isCompleted ? '🎉 Objectif Atteint !' : 'Total des tricéracoins collectés :'}
        </h2>
        {config.ransomMessage && (
          <p className="text-gray-600">
            {config.ransomMessage}
          </p>
        )}
      </div>

      {/* Barre de progression */}
      <div className="relative mb-4">
        <div className="h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-[#63006A]">
          <div
            className={`h-full transition-all duration-1000 ease-out ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-[#F9AC30] to-[#FFB84D]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full">
            <Triceracoin amount={effectiveTotal} size="sm" textColor="text-[#63006A]" />
            <span className="text-lg font-bold text-[#63006A]">
              / {config.ransomGoal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Pourcentage */}
      <div className="text-center">
        <p className={`text-4xl font-bold ${isCompleted ? 'text-green-600' : 'text-[#F9AC30]'}`}>
          {Math.round(percentage)} % rançon
        </p>
        {!isCompleted && (
          <p className="text-sm text-gray-600 mt-1">
            Plus que <Triceracoin amount={config.ransomGoal - effectiveTotal} size="sm" textColor="text-[#63006A]" /> !
          </p>
        )}
        
        {/* Indicateur d'offset (voleur/donateur) */}
        {globalOffset !== 0 && (
          <div className={`mt-3 p-2 rounded-lg inline-block ${
            globalOffset < 0 ? 'bg-red-100' : 'bg-green-100'
          }`}>
            <p className={`text-sm font-bold ${
              globalOffset < 0 ? 'text-red-800' : 'text-green-800'
            }`}>
              {globalOffset < 0 ? '🦹 Voleur' : '🎅 Donateur'}: {globalOffset > 0 ? '+' : ''}{globalOffset} 🦖
            </p>
          </div>
        )}
      </div>

      {isCompleted && (
        <div className="mt-4 p-4 bg-green-100 rounded-lg text-center">
          <p className="text-green-800 font-bold text-lg">
            ✨ Félicitations à toutes les équipes ! ✨
          </p>
        </div>
      )}
    </div>
  );
};

export default RansomProgress;
