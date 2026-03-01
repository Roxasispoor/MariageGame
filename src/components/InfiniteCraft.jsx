import React, { useState, useEffect } from 'react';
import { addPoints, subscribeToTeamDiscoveries, updateTeamDiscoveries, getCraftConfig } from '../services/gameService';
import { startingElements, combineElements, getProgressByLevel, countAvailableRecipes, pickRandomHint } from '../utils/craftingSystem';

const InfiniteCraft = ({ teamId }) => {
  const [discovered, setDiscovered] = useState([...startingElements]);
  const [selected, setSelected] = useState([null, null]);
  const [message, setMessage] = useState('');
  const [basePoints, setBasePoints] = useState(5);
  const [bonusElements, setBonusElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [hintElement, setHintElement] = useState(null); // L'élément avec le badge

  useEffect(() => {
    // Charger la configuration des récompenses
    getCraftConfig().then(config => {
      setBasePoints(config.basePoints || 5);
      setBonusElements(config.bonusElements || []);
      setLoading(false);
    });

    // S'abonner aux découvertes de l'équipe (temps réel)
    const unsubscribe = subscribeToTeamDiscoveries(teamId, (discoveries) => {
      if (discoveries && discoveries.length > 0) {
        setDiscovered(discoveries);
      }
    });

    return () => unsubscribe();
  }, [teamId]);

  // Choisir un nouvel élément hint quand les découvertes changent
  useEffect(() => {
    const newHint = pickRandomHint(discovered);
    setHintElement(newHint);
  }, [discovered]);

  const handleSelectElement = (element) => {
    if (selected[0] === null) {
      setSelected([element, null]);
      setMessage(`${element.emoji} ${element.name} sélectionné`);
    } else if (selected[1] === null) {
      setSelected([selected[0], element]);
      // Combiner automatiquement
      setTimeout(() => handleCombine(selected[0], element), 100);
    }
  };

  const handleCombine = async (elem1, elem2) => {
    if (!elem1 || !elem2) return;

    const result = combineElements(elem1.id, elem2.id);

    if (result.success) {
      // Vérifier si c'est une nouvelle découverte pour l'équipe
      const alreadyDiscovered = discovered.some(e => e.id === result.result.id);
      
      if (!alreadyDiscovered) {
        const newElement = { ...result.result, discovered: true };
        const newDiscovered = [...discovered, newElement];
        
        // Mettre à jour Firebase (partagé avec toute l'équipe)
        await updateTeamDiscoveries(teamId, newDiscovered);
        
        // Calculer les points : base + bonus éventuel
        let totalPoints = basePoints;
        const bonus = bonusElements.find(b => b.id === newElement.id);
        if (bonus) {
          totalPoints += bonus.bonus;
        }
        
        await addPoints(teamId, totalPoints);
        
        if (bonus) {
          setMessage(`✨ ${newElement.emoji} ${newElement.name} découvert ! +${basePoints} pts + ${bonus.bonus} pts bonus = ${totalPoints} pts total !`);
        } else {
          setMessage(`✨ ${newElement.emoji} ${newElement.name} découvert ! +${basePoints} pts`);
        }
      } else {
        setMessage(`✅ ${result.result.emoji} ${result.result.name} (déjà trouvé)`);
      }
    } else {
      setMessage('❌ Aucune combinaison trouvée');
    }

    setSelected([null, null]);
  };

  const handleReset = () => {
    setSelected([null, null]);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        🎨 Alchimie des Éléments
      </h3>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>But :</strong> Combinez deux éléments pour en découvrir de nouveaux !
        </p>
        <p className="text-xs text-gray-600 mt-1">
          💡 Cliquez sur deux éléments pour les combiner
        </p>
      </div>

      {/* Stats et progression */}
      <div className="mb-4">
        <div className="flex gap-4 text-sm mb-3 flex-wrap">
          <div className="px-3 py-2 bg-purple-100 rounded-lg">
            <span className="font-bold text-purple-800">
              {discovered.length} éléments découverts
            </span>
          </div>
          <div className="px-3 py-2 bg-blue-100 rounded-lg">
            <span className="text-blue-700">
              🔓 Partagé avec toute l'équipe
            </span>
          </div>
          <button
            onClick={() => setShowProgress(!showProgress)}
            className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-all"
          >
            {showProgress ? '📊 Masquer' : '📊 Progression'}
          </button>
          <button
            onClick={() => setHintElement(pickRandomHint(discovered))}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
            💡 Nouvel indice
          </button>
        </div>

        {/* Tableau de progression par niveau */}
        {showProgress && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <h4 className="font-bold mb-3 text-gray-800">Progression par niveau :</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(getProgressByLevel(discovered)).map(([level, progress]) => {
                const percentage = progress.total > 0 ? Math.round((progress.discovered / progress.total) * 100) : 0;
                const levelNames = ['Départ', 'Base', 'Nature', 'Vie', 'Êtres', 'Nourriture', 'Maison', 'Émotions', 'Mariage'];
                
                return (
                  <div key={level} className="p-2 bg-white rounded-lg shadow-sm">
                    <div className="text-xs font-bold text-gray-600 mb-1">
                      Niveau {level}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {levelNames[level] || 'Extra'}
                    </div>
                    <div className="text-sm font-bold text-purple-800">
                      {progress.discovered}/{progress.total}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Zone de combinaison */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
        <div className="flex items-center justify-center gap-4">
          <div className={`
            w-24 h-24 rounded-lg flex items-center justify-center text-4xl
            ${selected[0] ? 'bg-white shadow-lg' : 'bg-gray-200 border-2 border-dashed border-gray-400'}
          `}>
            {selected[0] ? selected[0].emoji : '?'}
          </div>
          
          <span className="text-3xl font-bold text-purple-600">+</span>
          
          <div className={`
            w-24 h-24 rounded-lg flex items-center justify-center text-4xl
            ${selected[1] ? 'bg-white shadow-lg' : 'bg-gray-200 border-2 border-dashed border-gray-400'}
          `}>
            {selected[1] ? selected[1].emoji : '?'}
          </div>
          
          <span className="text-3xl font-bold text-purple-600">=</span>
          
          <div className="w-24 h-24 rounded-lg bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-4xl">
            ❓
          </div>
        </div>

        {/* Bouton toujours visible pour éviter le décalage */}
        <div className="mt-3 text-center h-10 flex items-center justify-center">
          {selected[0] && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm transition-all"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`
          mb-4 p-3 rounded-lg text-center font-bold
          ${message.includes('✨') ? 'bg-green-100 text-green-800' :
            message.includes('✅') ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'}
        `}>
          {message}
        </div>
      )}

      {/* Liste des éléments découverts organisés par niveau */}
      <div>
        <h4 className="font-bold mb-3 text-gray-700">Vos éléments (organisés par niveau) :</h4>
        
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(level => {
          const elementsOfLevel = discovered.filter(e => e.level === level);
          const levelNames = ['🌟 Départ', '⚡ Base', '🌍 Nature', '🌱 Vie', '🐾 Êtres', '🍎 Nourriture', '🏠 Maison', '❤️ Émotions', '💒 Mariage'];
          
          if (elementsOfLevel.length === 0) return null;
          
          return (
            <div key={level} className="mb-4">
              <h5 className="font-semibold text-sm text-gray-600 mb-2">
                {levelNames[level]} ({elementsOfLevel.length})
              </h5>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {elementsOfLevel.map((element) => {
                  const availableCount = countAvailableRecipes(element.id, discovered);
                  const showBadge = element.id === hintElement && availableCount > 0;
                  
                  return (
                    <button
                      key={element.id}
                      onClick={() => handleSelectElement(element)}
                      className={`
                        p-3 rounded-lg transition-all flex flex-col items-center gap-1 relative
                        ${selected[0]?.id === element.id || selected[1]?.id === element.id
                          ? 'bg-purple-200 ring-2 ring-purple-500 scale-105'
                          : 'bg-white hover:bg-gray-100 hover:scale-105'
                        }
                        ${showBadge ? 'ring-2 ring-blue-300' : ''}
                        shadow-md
                      `}
                    >
                      {/* Badge seulement sur l'élément hint */}
                      {showBadge && (
                        <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {availableCount}
                        </span>
                      )}
                      <span className="text-3xl">{element.emoji}</span>
                      <span className="text-xs font-medium text-gray-700 text-center">
                        {element.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Objectif secret */}
      {discovered.some(e => e.id === 'mariage') && (
        <div className="mt-6 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg text-center">
          <p className="text-2xl font-bold text-purple-800 mb-2">
            🎉 Vous avez découvert le MARIAGE ! 🎉
          </p>
          <p className="text-purple-600">
            {bonusElements.find(b => b.id === 'mariage')?.bonus 
              ? `Avec le bonus de ${bonusElements.find(b => b.id === 'mariage').bonus} points en plus !`
              : 'Félicitations !'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InfiniteCraft;
