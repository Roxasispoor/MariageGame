import React, { useState, useEffect } from 'react';
import { subscribeToGame, updateGameState, addPoints } from '../services/gameService';

const WordChain = ({ gameId, teamId }) => {
  const [startWord, setStartWord] = useState('');
  const [endWord, setEndWord] = useState('');
  const [chain, setChain] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    try {
      const unsubscribe = subscribeToGame(gameId, (gameData) => {
        if (!gameData || !gameData.state) {
          setError('Jeu non trouvé');
          setLoading(false);
          return;
        }

        setStartWord(gameData.state.startWord);
        setEndWord(gameData.state.endWord);
        setChain(gameData.state.chain || [gameData.state.startWord]);
        setCompleted(gameData.completed || false);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [gameId]);

  const validateWord = async (word) => {
    setValidating(true);
    setFeedback('');

    try {
      // Appeler Claude pour valider la proximité sémantique
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Tu es un juge pour un jeu de chaîne de mots. 
            
Règles :
- Deux mots sont "liés" s'ils ont un lien sémantique clair (même catégorie, cause-effet, association commune, etc.)
- Le lien doit être évident pour la plupart des gens

Mot précédent : "${chain[chain.length - 1]}"
Nouveau mot proposé : "${word}"

Le nouveau mot est-il lié sémantiquement au mot précédent ?

Réponds UNIQUEMENT par un JSON :
{
  "valid": true ou false,
  "reason": "explication courte (une phrase)"
}`
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      
      // Parser la réponse JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Réponse invalide de l\'API');
      }
      
      const result = JSON.parse(jsonMatch[0]);

      if (result.valid) {
        // Mot accepté !
        const newChain = [...chain, word.toUpperCase()];
        
        // Vérifier si on a atteint le mot cible
        if (word.toUpperCase() === endWord.toUpperCase()) {
          // GAGNÉ !
          await updateGameState(gameId, 'wordchain', {
            chain: newChain,
            completed: true,
            completedAt: new Date().toISOString(),
            teamId: teamId
          });
          
          // Points : moins il y a de mots, plus on gagne
          const bonus = Math.max(50, 100 - (newChain.length * 10));
          await addPoints(teamId, bonus);
          
          setCompleted(true);
          setFeedback(`🎉 Gagné ! +${bonus} points (${newChain.length} mots)`);
        } else {
          // Continuer la chaîne
          await updateGameState(gameId, 'wordchain', {
            chain: newChain
          });
          
          setFeedback(`✅ ${result.reason}`);
        }
        
        setChain(newChain);
        setCurrentInput('');
      } else {
        // Mot refusé
        setFeedback(`❌ ${result.reason}`);
      }
    } catch (err) {
      console.error('Erreur validation:', err);
      setFeedback('❌ Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentInput.trim() || validating) return;
    validateWord(currentInput.trim());
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 font-bold mb-2">❌ Erreur : {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        🔗 Chaîne de Mots
      </h3>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700 mb-2">
          <strong>But :</strong> Reliez <span className="font-bold text-blue-600">{startWord}</span> à{' '}
          <span className="font-bold text-green-600">{endWord}</span> en ajoutant des mots qui ont un lien sémantique.
        </p>
        <p className="text-xs text-gray-600">
          💡 Chaque mot doit être lié au précédent. Moins vous utilisez de mots, plus vous gagnez de points !
        </p>
      </div>

      {/* La chaîne */}
      <div className="mb-6">
        <h4 className="font-bold mb-3 text-gray-700">Votre chaîne :</h4>
        <div className="flex flex-wrap items-center gap-2">
          {chain.map((word, index) => (
            <React.Fragment key={index}>
              <div className={`
                px-4 py-2 rounded-lg font-bold text-lg
                ${index === 0 
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400' 
                  : 'bg-gray-100 text-gray-800'
                }
                ${word.toUpperCase() === endWord.toUpperCase()
                  ? 'bg-green-100 text-green-800 border-2 border-green-400'
                  : ''
                }
              `}>
                {word}
              </div>
              {index < chain.length - 1 && (
                <span className="text-2xl text-gray-400">→</span>
              )}
            </React.Fragment>
          ))}
          
          {!completed && (
            <>
              <span className="text-2xl text-gray-400">→</span>
              <div className="px-4 py-2 border-2 border-dashed border-gray-400 rounded-lg text-gray-400 font-bold">
                ?
              </div>
            </>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 p-3 rounded-lg ${
          feedback.includes('✅') || feedback.includes('🎉')
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {feedback}
        </div>
      )}

      {/* Input */}
      {!completed && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Entrez un mot..."
              disabled={validating}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase"
            />
            <button
              type="submit"
              disabled={!currentInput.trim() || validating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? 'Validation...' : 'Valider'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Le mot suivant doit avoir un lien avec "<strong>{chain[chain.length - 1]}</strong>"
          </p>
        </form>
      )}

      {completed && (
        <div className="mt-6 p-6 bg-green-100 rounded-lg text-center">
          <p className="text-green-800 font-bold text-xl mb-2">
            🎉 Félicitations !
          </p>
          <p className="text-green-700">
            Vous avez relié les deux mots en {chain.length} étapes !
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Nombre de mots : {chain.length}</span>
          <span>Points potentiels : {Math.max(50, 100 - (chain.length * 10))}</span>
        </div>
      </div>
    </div>
  );
};

export default WordChain;
