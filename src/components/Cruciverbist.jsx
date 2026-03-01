import React, { useState, useEffect } from 'react';
import { subscribeToGame, updateGameState, addPoints } from '../services/gameService';

const Cruciverbist = ({ gameId, teamId }) => {
  const [words, setWords] = useState([]);
  const [bounds, setBounds] = useState(null);
  const [validatedWords, setValidatedWords] = useState({});
  const [userInputs, setUserInputs] = useState({}); // Stocke les inputs locaux
  const [selectedWord, setSelectedWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToGame(gameId, (gameData) => {
        console.log('Cruciverbist - gameData reçu:', gameData);
        console.log('Cruciverbist - gameData.state:', gameData?.state);
        
        if (!gameData || !gameData.state) {
          setError('Jeu non trouvé');
          setLoading(false);
          return;
        }

        console.log('Cruciverbist - words:', gameData.state.words);
        console.log('Cruciverbist - bounds:', gameData.state.bounds);

        setWords(gameData.state.words || []);
        setBounds(gameData.state.bounds);
        setValidatedWords(gameData.state.validatedWords || {});
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Cruciverbist - Erreur:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [gameId]);

  // Construire la grille à partir des mots
  const buildGrid = () => {
    if (!bounds || !words.length) return [];
    
    const { minRow, minCol, height, width } = bounds;
    const grid = Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => ({ 
        letter: null, 
        wordIds: [], // IDs des mots qui passent par cette case
        isIntersection: false 
      }))
    );

    // Remplir la grille
    words.forEach(word => {
      for (let i = 0; i < word.word.length; i++) {
        const row = word.direction === 'horizontal' 
          ? word.startRow - minRow
          : word.startRow - minRow + i;
        const col = word.direction === 'horizontal'
          ? word.startCol - minCol + i
          : word.startCol - minCol;

        if (!grid[row][col].letter) {
          grid[row][col].letter = word.word[i];
          grid[row][col].wordIds = [word.id];
        } else {
          // Intersection
          grid[row][col].wordIds.push(word.id);
          grid[row][col].isIntersection = true;
        }

        // Marquer le début du mot
        if (i === 0) {
          grid[row][col].wordStart = word.id;
        }
      }
    });

    return grid;
  };

  const handleCellClick = (row, col, cell) => {
    if (!cell.letter || cell.isIntersection || cell.wordIds.length === 0) return;
    
    // Trouver le mot qui passe par cette case
    const wordId = cell.wordIds[0];
    const word = words.find(w => w.id === wordId);
    
    if (word && !validatedWords[word.id]) {
      setSelectedWord(word);
    }
  };

  const handleInputChange = (wordId, value) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z]/g, '');
    setUserInputs(prev => ({
      ...prev,
      [wordId]: sanitized
    }));
  };

  const handleValidate = async (word) => {
    const userInput = userInputs[word.id] || '';
    
    if (userInput === word.word) {
      // Correct !
      const newValidatedWords = {
        ...validatedWords,
        [word.id]: {
          word: word.word,
          teamId: teamId,
          validatedAt: new Date().toISOString()
        }
      };

      await updateGameState(gameId, 'crossword', {
        validatedWords: newValidatedWords
      });

      await addPoints(teamId, 10);

      setSelectedWord(null);
      setUserInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[word.id];
        return newInputs;
      });
    } else {
      alert('❌ Mot incorrect !');
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p>Chargement du mot croisé...</p>
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

  if (!words.length || !bounds) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Aucun mot trouvé...</p>
      </div>
    );
  }

  const grid = buildGrid();
  const totalWords = words.length;
  const validatedCount = Object.keys(validatedWords).length;
  const percentage = Math.round((validatedCount / totalWords) * 100);

  const horizontalWords = words.filter(w => w.direction === 'horizontal');
  const verticalWords = words.filter(w => w.direction === 'vertical');

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        🔤 Mots Croisés
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Grille */}
        <div className="lg:col-span-2">
          <h4 className="font-bold mb-3 text-gray-800">Grille</h4>
          <div className="inline-block bg-gray-100 p-4 rounded-lg">
            <div className="bg-black p-0.5 rounded">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {row.map((cell, colIndex) => {
                    if (!cell.letter) {
                      return (
                        <div
                          key={colIndex}
                          className="w-10 h-10 bg-black"
                        />
                      );
                    }

                    const isValidated = cell.wordIds.some(id => validatedWords[id]);
                    const isSelected = selectedWord && cell.wordIds.includes(selectedWord.id);
                    const isClickable = cell.wordIds.length === 1 && !isValidated;

                    return (
                      <div
                        key={colIndex}
                        onClick={() => handleCellClick(rowIndex, colIndex, cell)}
                        className={`
                          w-10 h-10 border border-gray-400 relative flex items-center justify-center
                          ${isValidated ? 'bg-green-100' : 'bg-white'}
                          ${isSelected ? 'ring-2 ring-blue-500' : ''}
                          ${isClickable ? 'cursor-pointer hover:bg-blue-50' : ''}
                          ${cell.isIntersection ? 'bg-yellow-50' : ''}
                        `}
                      >
                        {cell.wordStart && (
                          <span className="absolute top-0.5 left-0.5 text-[10px] font-bold text-blue-600">
                            {cell.wordStart}
                          </span>
                        )}
                        <span className={`font-bold text-lg ${isValidated ? 'text-green-700' : 'text-transparent'}`}>
                          {cell.letter}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            💡 Cliquez sur une case blanche pour remplir le mot
          </p>
        </div>

        {/* Définitions */}
        <div>
          <h4 className="font-bold mb-3 text-gray-800">Définitions</h4>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Horizontal */}
            <div>
              <h5 className="font-semibold text-sm text-gray-700 mb-2">→ Horizontal</h5>
              {horizontalWords.map(word => (
                <div
                  key={word.id}
                  className={`
                    p-2 mb-2 rounded text-sm
                    ${validatedWords[word.id] ? 'bg-green-100 text-green-800' : 'bg-gray-50'}
                    ${selectedWord?.id === word.id ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <span className="font-bold">{word.id}.</span> {word.clue}
                  {validatedWords[word.id] && <span className="ml-2">✓</span>}
                </div>
              ))}
            </div>

            {/* Vertical */}
            <div>
              <h5 className="font-semibold text-sm text-gray-700 mb-2">↓ Vertical</h5>
              {verticalWords.map(word => (
                <div
                  key={word.id}
                  className={`
                    p-2 mb-2 rounded text-sm
                    ${validatedWords[word.id] ? 'bg-green-100 text-green-800' : 'bg-gray-50'}
                    ${selectedWord?.id === word.id ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <span className="font-bold">{word.id}.</span> {word.clue}
                  {validatedWords[word.id] && <span className="ml-2">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zone de saisie */}
      {selectedWord && !validatedWords[selectedWord.id] && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <h4 className="font-bold mb-2 text-gray-800">
            {selectedWord.id}. {selectedWord.clue}
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={userInputs[selectedWord.id] || ''}
              onChange={(e) => handleInputChange(selectedWord.id, e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleValidate(selectedWord)}
              placeholder={`${selectedWord.word.length} lettres`}
              maxLength={selectedWord.word.length}
              className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase font-mono text-lg"
              autoFocus
            />
            <button
              onClick={() => handleValidate(selectedWord)}
              disabled={(userInputs[selectedWord.id] || '').length !== selectedWord.word.length}
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
    </div>
  );
};

export default Cruciverbist;
