import React, { useState, useEffect } from 'react';
import { subscribeToGame, updateGameState, completeGame, addPoints } from '../services/gameService';

const CoopCrossword = ({ gameId, teamId }) => {
  const [grid, setGrid] = useState(null);
  const [words, setWords] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [validatedWords, setValidatedWords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [currentInput, setCurrentInput] = useState('');

  console.log('CoopCrossword - gameId:', gameId, 'teamId:', teamId);

  useEffect(() => {
    console.log('CoopCrossword - Subscription');
    try {
      const unsubscribe = subscribeToGame(gameId, (gameData) => {
        console.log('CoopCrossword - Données reçues:', gameData);
        
        if (!gameData || !gameData.state) {
          setError('Jeu non trouvé');
          setLoading(false);
          return;
        }

        setGrid(gameData.state.grid);
        setWords(gameData.state.words || []);
        setValidatedWords(gameData.state.validatedWords || {});
        setLoading(false);
      });

      return () => {
        console.log('CoopCrossword - Cleanup');
        unsubscribe();
      };
    } catch (err) {
      console.error('CoopCrossword - Erreur:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [gameId]);

  const handleWordClick = (word) => {
    if (validatedWords[word.number]) return; // Mot déjà validé
    setSelectedWord(word);
    setCurrentInput(userAnswers[word.number] || '');
  };

  const handleInputChange = (value) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');
    setCurrentInput(sanitized);
    
    // Mise à jour locale
    setUserAnswers(prev => ({
      ...prev,
      [selectedWord.number]: sanitized
    }));
  };

  const handleValidate = async () => {
    if (!selectedWord || !currentInput) return;

    const isCorrect = currentInput === selectedWord.word;

    if (isCorrect) {
      // Mot correct ! Mettre à jour Firebase
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

      // Ajouter des points (10 points par mot)
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

  if (!grid || !words) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Aucune grille trouvée...</p>
      </div>
    );
  }

  const totalWords = words.length;
  const validatedCount = Object.keys(validatedWords).length;
  const percentage = Math.round((validatedCount / totalWords) * 100);

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        📝 Mots Fléchés Coopératifs
      </h3>

      {/* Progression */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
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
        {/* Grille */}
        <div>
          <h4 className="font-bold mb-2 text-gray-800">Grille</h4>
          <div className="inline-block bg-gray-800 p-2 rounded">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => {
                  // Trouver si cette case est le début d'un mot
                  const wordAtPosition = words.find(
                    w => w.row === rowIndex && w.col === colIndex
                  );

                  const isValidated = cell.letter && words.some(w => {
                    if (!validatedWords[w.number]) return false;
                    
                    if (w.direction === 'horizontal') {
                      return rowIndex === w.row && 
                             colIndex >= w.col && 
                             colIndex < w.col + w.word.length;
                    } else {
                      return colIndex === w.col && 
                             rowIndex >= w.row && 
                             rowIndex < w.row + w.word.length;
                    }
                  });

                  const isSelected = selectedWord && (
                    (selectedWord.direction === 'horizontal' &&
                     rowIndex === selectedWord.row &&
                     colIndex >= selectedWord.col &&
                     colIndex < selectedWord.col + selectedWord.word.length) ||
                    (selectedWord.direction === 'vertical' &&
                     colIndex === selectedWord.col &&
                     rowIndex >= selectedWord.row &&
                     rowIndex < selectedWord.row + selectedWord.word.length)
                  );

                  return (
                    <div
                      key={colIndex}
                      className={`
                        w-8 h-8 border border-gray-400 relative
                        ${cell.letter ? 'bg-white' : 'bg-gray-900'}
                        ${isSelected ? 'ring-2 ring-blue-500' : ''}
                        ${isValidated ? 'bg-green-100' : ''}
                      `}
                    >
                      {wordAtPosition && (
                        <span className="absolute top-0 left-0.5 text-[8px] font-bold text-blue-600">
                          {wordAtPosition.number}
                        </span>
                      )}
                      {/* Afficher la lettre UNIQUEMENT si le mot est validé */}
                      {cell.letter && isValidated && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-bold text-sm text-green-700">
                            {cell.letter}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Définitions */}
        <div>
          <h4 className="font-bold mb-2 text-gray-800">Définitions</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {words.map((word) => {
              const isValidated = validatedWords[word.number];
              const validatingTeam = isValidated?.teamId;

              return (
                <div
                  key={word.number}
                  onClick={() => handleWordClick(word)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all
                    ${isValidated 
                      ? 'bg-green-100 border-2 border-green-400' 
                      : selectedWord?.number === word.number
                        ? 'bg-blue-100 border-2 border-blue-400'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="font-bold text-blue-600 mr-2">
                        {word.number}. {word.direction === 'horizontal' ? '→' : '↓'}
                      </span>
                      <span className="text-gray-800">{word.definition}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({word.word.length} lettres)
                      </span>
                    </div>
                    {isValidated && (
                      <span className="text-green-600 font-bold ml-2">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone de saisie */}
      {selectedWord && !validatedWords[selectedWord.number] && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-bold mb-2 text-gray-800">
            Réponse pour : {selectedWord.definition}
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
              placeholder={`${selectedWord.word.length} lettres`}
              maxLength={selectedWord.word.length}
              className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase font-mono text-lg"
              autoFocus
            />
            <button
              onClick={handleValidate}
              disabled={currentInput.length !== selectedWord.word.length}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            💡 Chaque mot trouvé = +10 points pour votre équipe
          </p>
        </div>
      )}
    </div>
  );
};

export default CoopCrossword;
