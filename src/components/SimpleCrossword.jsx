import React, { useState, useEffect } from 'react';
import { subscribeToGame, updateGameState, addPoints } from '../services/gameService';

const SimpleCrossword = ({ gameId, teamId }) => {
  const [words, setWords] = useState([]);
  const [validatedWords, setValidatedWords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [currentInput, setCurrentInput] = useState('');

  useEffect(() => {
    try {
      const unsubscribe = subscribeToGame(gameId, (gameData) => {
        if (!gameData || !gameData.state) {
          setError('Jeu non trouvé');
          setLoading(false);
          return;
        }

        setWords(gameData.state.words || []);
        setValidatedWords(gameData.state.validatedWords || {});
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('SimpleCrossword - Erreur:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [gameId]);

  const handleWordClick = (word) => {
    if (validatedWords[word.number]) return;
    setSelectedWord(word);
    setCurrentInput('');
  };

  const handleInputChange = (value) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');
    setCurrentInput(sanitized);
  };

  const handleValidate = async () => {
    if (!selectedWord || !currentInput) return;

    const isCorrect = currentInput === selectedWord.word;

    if (isCorrect) {
      const newValidatedWords = {
        ...validatedWords,
        [selectedWord.number]: {
          word: selectedWord.word,
          teamId: teamId,
          validatedAt: new Date().toISOString()
        }
      };

      await updateGameState(gameId, 'crossword', {
        validatedWords: newValidatedWords
      });

      await addPoints(teamId, 10);

      setSelectedWord(null);
      setCurrentInput('');
    } else {
      alert('❌ Mot incorrect ! Réessayez.');
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>Chargement des mots fléchés...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 font-bold mb-2">❌ Erreur : {error}</p>
        <p className="text-gray-600">Vérifiez que l'ID du jeu est correct.</p>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Aucun mot trouvé...</p>
      </div>
    );
  }

  const totalWords = words.length;
  const validatedCount = Object.keys(validatedWords).length;
  const percentage = Math.round((validatedCount / totalWords) * 100);

  // Séparer les mots horizontaux et verticaux
  const horizontalWords = words.filter(w => w.direction === 'horizontal');
  const verticalWords = words.filter(w => w.direction === 'vertical');

  const renderWord = (word) => {
    const isValidated = validatedWords[word.number];
    const isSelected = selectedWord?.number === word.number;

    return (
      <div
        key={word.number}
        onClick={() => handleWordClick(word)}
        className={`
          mb-4 cursor-pointer transition-all
          ${isValidated ? 'opacity-100' : 'opacity-90'}
        `}
      >
        {/* Numéro et définition */}
        <div className={`
          flex items-start gap-2 mb-2 p-2 rounded
          ${isSelected ? 'bg-blue-100' : isValidated ? 'bg-green-50' : 'hover:bg-gray-50'}
        `}>
          <span className="font-bold text-blue-600 min-w-[30px]">
            {word.number}.
          </span>
          <div className="flex-1">
            <p className="text-gray-800">{word.definition}</p>
            <p className="text-xs text-gray-500 mt-1">
              {word.word.length} lettres
            </p>
          </div>
          {isValidated && (
            <span className="text-green-600 font-bold">✓</span>
          )}
        </div>

        {/* Cases du mot */}
        <div className="flex gap-1 ml-8">
          {word.word.split('').map((letter, idx) => (
            <div
              key={idx}
              className={`
                w-10 h-10 border-2 flex items-center justify-center font-bold text-lg
                ${isValidated 
                  ? 'bg-green-100 border-green-400 text-green-700' 
                  : 'bg-white border-gray-300 text-transparent'}
                ${isSelected ? 'border-blue-400' : ''}
              `}
            >
              {isValidated ? letter : '?'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        📝 Mots Fléchés
      </h3>

      {/* Progression */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-blue-800">
            {validatedCount} / {totalWords} mots trouvés
          </span>
          <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Horizontalement */}
        <div>
          <h4 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
            <span className="text-blue-600">→</span> Horizontalement
          </h4>
          <div className="space-y-2">
            {horizontalWords.map(renderWord)}
          </div>
        </div>

        {/* Verticalement */}
        <div>
          <h4 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
            <span className="text-blue-600">↓</span> Verticalement
          </h4>
          <div className="space-y-2">
            {verticalWords.map(renderWord)}
          </div>
        </div>
      </div>

      {/* Zone de saisie */}
      {selectedWord && !validatedWords[selectedWord.number] && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <h4 className="font-bold mb-2 text-gray-800">
            {selectedWord.number}. {selectedWord.definition}
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
              placeholder={`${selectedWord.word.length} lettres`}
              maxLength={selectedWord.word.length}
              className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase font-mono text-lg"
              autoFocus
            />
            <button
              onClick={handleValidate}
              disabled={currentInput.length !== selectedWord.word.length}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ Valider
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            💡 +10 points si correct
          </p>
        </div>
      )}

      {percentage === 100 && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg text-center">
          <p className="text-green-800 font-bold text-lg">
            🎉 Tous les mots ont été trouvés ! Félicitations ! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleCrossword;
