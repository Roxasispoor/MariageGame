import React, { useState, useEffect } from 'react';
import { subscribeToGame, saveTeamGameProgress, subscribeToTeamGameProgress, addPoints } from '../services/gameService';
import Triceracoin from './Triceracoin';

const CruciverbistTeam = ({ gameId, teamId }) => {
  const [masterData, setMasterData] = useState(null); // Données maître (de l'admin)
  const [validatedWords, setValidatedWords] = useState([]); // Mots validés par l'équipe
  const [selectedWord, setSelectedWord] = useState(null);
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données maître et la progression de l'équipe
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
        if (!gameData.state || !gameData.state.words) {
          setError('Grille invalide');
          setLoading(false);
          return;
        }
        
        // Convertir words en array si nécessaire (format Firebase)
        const wordsData = gameData.state.words;
        const wordsArray = Array.isArray(wordsData) 
          ? wordsData 
          : Object.values(wordsData);
        
        setMasterData({
          ...gameData.state,
          words: wordsArray
        });
        setLoading(false);
      });

      // S'abonner à la progression de l'équipe
      unsubProgress = subscribeToTeamGameProgress(teamId, gameId, async (progressData) => {
        if (progressData && progressData.progress) {
          setValidatedWords(progressData.progress.validatedWords || []);
        } else {
          // Première fois : initialiser avec un tableau vide
          await saveTeamGameProgress(teamId, gameId, 'crossword', {
            validatedWords: [],
            completed: false
          });
        }
      });

      return () => {
        if (unsubGame) unsubGame();
        if (unsubProgress) unsubProgress();
      };
    } catch (err) {
      console.error('Erreur Mots Croisés:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [gameId, teamId]);

  const buildGrid = (words, bounds) => {
    const grid = [];
    const { minRow, maxRow, minCol, maxCol } = bounds;
    
    for (let i = minRow; i <= maxRow; i++) {
      const row = [];
      for (let j = minCol; j <= maxCol; j++) {
        row.push({
          letter: null,
          wordIds: [],
          isIntersection: false,
          wordStart: null
        });
      }
      grid.push(row);
    }
    
    words.forEach(word => {
      const { startRow, startCol, direction, word: wordText, id } = word;
      
      for (let i = 0; i < wordText.length; i++) {
        const row = direction === 'horizontal' ? startRow - minRow : startRow + i - minRow;
        const col = direction === 'horizontal' ? startCol + i - minCol : startCol - minCol;
        
        if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
          const cell = grid[row][col];
          cell.letter = wordText[i];
          cell.wordIds.push(id);
          
          if (i === 0) {
            cell.wordStart = id;
          }
          
          if (cell.wordIds.length > 1) {
            cell.isIntersection = true;
          }
        }
      }
    });
    
    return grid;
  };

  const handleCellClick = (cell) => {
    if (!cell.letter || cell.isIntersection) return;
    
    const wordId = cell.wordIds[0];
    const word = masterData.words.find(w => w.id === wordId);
    
    if (word && !validatedWords.includes(wordId)) {
      setSelectedWord(word);
      setCurrentInput('');
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWord || !currentInput.trim()) return;

    const userAnswer = currentInput.trim().toUpperCase();
    const correctAnswer = selectedWord.word.toUpperCase();

    if (userAnswer === correctAnswer) {
      const newValidatedWords = [...validatedWords, selectedWord.id];
      setValidatedWords(newValidatedWords);
      
      const points = 10;
      await saveTeamGameProgress(teamId, gameId, 'crossword', {
        validatedWords: newValidatedWords,
        completed: newValidatedWords.length === masterData.words.length
      });
      
      await addPoints(teamId, points);
      
      setMessage(`✅ Correct ! +${points} Triceracoins`);
      setSelectedWord(null);
      setCurrentInput('');
      
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('❌ Incorrect, essayez encore !');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p>Chargement des mots croisés...</p>
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

  if (!masterData) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p>Initialisation...</p>
      </div>
    );
  }

  const grid = buildGrid(masterData.words, masterData.bounds);
  const completed = validatedWords.length === masterData.words.length;
  const progress = Math.round((validatedWords.length / masterData.words.length) * 100);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-[#63006A]">
          📝 Mots Croisés
        </h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {validatedWords.length} / {masterData.words.length} mots
          </p>
          <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-[#F9AC30] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {completed && (
        <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
          <p className="text-green-800 font-bold text-lg">
            ✅ Tous les mots trouvés ! Bravo !
          </p>
          <Triceracoin amount={validatedWords.length * 10} size="lg" textColor="text-green-800" />
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Comment jouer :</strong> Cliquez sur une case blanche (non-intersection) pour sélectionner le mot, puis entrez votre réponse.
        </p>
      </div>

      {/* Grille */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-block border-2 border-[#63006A]">
          {grid.map((row, i) => (
            <div key={i} className="flex">
              {row.map((cell, j) => {
                const isValidated = cell.wordIds.some(id => validatedWords.includes(id));
                const isSelected = selectedWord && cell.wordIds.includes(selectedWord.id);
                
                if (!cell.letter) {
                  return (
                    <div
                      key={`${i}-${j}`}
                      className="w-10 h-10 bg-black"
                    />
                  );
                }
                
                return (
                  <div
                    key={`${i}-${j}`}
                    onClick={() => handleCellClick(cell)}
                    className={`
                      w-10 h-10 border border-gray-400 flex items-center justify-center relative
                      ${cell.isIntersection ? 'bg-yellow-50' : 'bg-white'}
                      ${isValidated ? 'bg-green-100' : ''}
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${!cell.isIntersection && !isValidated ? 'cursor-pointer hover:bg-gray-50' : ''}
                    `}
                  >
                    {cell.wordStart && (
                      <span className="absolute top-0 left-0 text-xs font-bold text-gray-500 pl-0.5">
                        {cell.wordStart}
                      </span>
                    )}
                    {isValidated && (
                      <span className="text-lg font-bold text-green-800">
                        {cell.letter}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Définitions */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Horizontal */}
        <div>
          <h4 className="font-bold text-[#63006A] mb-2">→ Horizontal</h4>
          <div className="space-y-2">
            {masterData.words
              .filter(w => w.direction === 'horizontal')
              .sort((a, b) => a.id - b.id)
              .map(word => (
                <div
                  key={word.id}
                  className={`p-2 rounded ${
                    validatedWords.includes(word.id)
                      ? 'bg-green-100 line-through'
                      : selectedWord?.id === word.id
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="font-bold text-[#63006A]">{word.id}.</span>{' '}
                  {word.clue}
                  {validatedWords.includes(word.id) && (
                    <span className="ml-2 text-green-600">✓</span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Vertical */}
        <div>
          <h4 className="font-bold text-[#63006A] mb-2">↓ Vertical</h4>
          <div className="space-y-2">
            {masterData.words
              .filter(w => w.direction === 'vertical')
              .sort((a, b) => a.id - b.id)
              .map(word => (
                <div
                  key={word.id}
                  className={`p-2 rounded ${
                    validatedWords.includes(word.id)
                      ? 'bg-green-100 line-through'
                      : selectedWord?.id === word.id
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="font-bold text-[#63006A]">{word.id}.</span>{' '}
                  {word.clue}
                  {validatedWords.includes(word.id) && (
                    <span className="ml-2 text-green-600">✓</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Input */}
      {selectedWord && !validatedWords.includes(selectedWord.id) && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Mot {selectedWord.id} :</strong> {selectedWord.clue}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Votre réponse..."
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F9AC30] uppercase"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D]"
              >
                Valider
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-center font-bold ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CruciverbistTeam;
