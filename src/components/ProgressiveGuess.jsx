import React, { useState, useEffect } from 'react';
import { subscribeToGame, saveTeamGameProgress, subscribeToTeamGameProgress, addPoints } from '../services/gameService';
import Triceracoin from './Triceracoin';

// Composant pour lecteur audio avec limitation de durée
const AudioPlayer = ({ audioUrl, segments, completed, audioRef }) => {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      const maxTime = completed ? audio.duration : (audio.duration / 9) * segments;
      
      setCurrentTime(audio.currentTime);
      
      // Limiter la lecture au nombre de segments révélés
      if (!completed && audio.currentTime >= maxTime) {
        audio.pause();
        audio.currentTime = maxTime;
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [segments, completed, audioRef]);

  const maxTime = completed ? duration : (duration / 9) * segments;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const maxPercent = duration > 0 ? (maxTime / duration) * 100 : 0;

  return (
    <div>
      <audio 
        ref={audioRef}
        controls 
        className="w-full"
      >
        <source src={audioUrl} type="audio/mpeg" />
        Votre navigateur ne supporte pas l'audio.
      </audio>
      
      <div className="mt-2 text-xs text-center text-gray-600">
        {completed ? (
          <span>🎵 Musique complète disponible</span>
        ) : (
          <span>
            🔒 Durée disponible : {Math.floor(maxTime)}s / {Math.floor(duration)}s
          </span>
        )}
      </div>
    </div>
  );
};

const ProgressiveGuess = ({ gameId, teamId }) => {
  const [gameData, setGameData] = useState(null);
  const [revealedCells, setRevealedCells] = useState([]);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isInitializedRef = React.useRef(false);
  
  // Pour l'audio
  const [audioSegments, setAudioSegments] = useState(1); // Nombre de segments révélés (1-9)
  const audioRef = React.useRef(null);

  // Points dégressifs selon le nombre de cases/segments révélés
  const getPoints = (revealed) => {
    const pointsTable = [100, 80, 60, 50, 40, 30, 20, 15, 10, 5];
    return pointsTable[revealed] || 5;
  };

  useEffect(() => {
    let unsubGame, unsubProgress;

    try {
      // S'abonner aux données du jeu (image/son + réponse)
      unsubGame = subscribeToGame(gameId, (data) => {
        if (!data) {
          setError('Jeu non trouvé');
          setLoading(false);
          return;
        }
        if (!data.state) {
          setError('Configuration invalide');
          setLoading(false);
          return;
        }
        
        setGameData(data.state);
        setLoading(false);
      });

      // S'abonner à la progression de l'équipe
      unsubProgress = subscribeToTeamGameProgress(teamId, gameId, async (progressData) => {
        if (progressData && progressData.progress) {
          // L'équipe a déjà une progression
          setRevealedCells(progressData.progress.revealedCells || []);
          setAudioSegments(progressData.progress.audioSegments || 1);
          setAttempts(progressData.progress.attempts || 0);
          setCompleted(progressData.progress.completed || false);
          isInitializedRef.current = true;
        } else if (!isInitializedRef.current) {
          // Première fois : révéler la première case/segment automatiquement
          const firstCell = Math.floor(Math.random() * 9);
          setRevealedCells([firstCell]);
          setAudioSegments(1);
          
          // Sauvegarder immédiatement
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            revealedCells: [firstCell],
            audioSegments: 1,
            attempts: 0,
            completed: false
          });
          
          isInitializedRef.current = true;
        }
      });

      return () => {
        if (unsubGame) unsubGame();
        if (unsubProgress) unsubProgress();
      };
    } catch (err) {
      console.error('Erreur ProgressiveGuess:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [gameId, teamId]);

  const handleRevealCell = async () => {
    if (completed || revealedCells.length >= 9) return;

    // Révéler une case aléatoire non encore révélée
    const unrevealed = [];
    for (let i = 0; i < 9; i++) {
      if (!revealedCells.includes(i)) {
        unrevealed.push(i);
      }
    }

    if (unrevealed.length === 0) return;

    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const newRevealed = [...revealedCells, randomIndex];
    
    setRevealedCells(newRevealed);
    
    // Sauvegarder avec le nouveau tableau
    await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
      revealedCells: newRevealed,
      audioSegments,
      attempts: attempts,
      completed: false
    });
    
    return newRevealed;
  };

  const handleRevealAudioSegment = async () => {
    if (completed || audioSegments >= 9) return;

    const newSegments = audioSegments + 1;
    setAudioSegments(newSegments);
    
    // Sauvegarder
    await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
      revealedCells,
      audioSegments: newSegments,
      attempts: attempts,
      completed: false
    });
    
    return newSegments;
  };

  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
      .replace(/[^a-z0-9\s]/g, '') // Garder lettres, chiffres et espaces
      .trim();
  };

  const removeArticles = (str) => {
    // Enlever les articles et mots courants
    const articlesAndWords = /\b(le|la|les|l|un|une|des|de|du|d)\b/gi;
    return str.replace(articlesAndWords, ' ').replace(/\s+/g, ' ').trim();
  };

  const checkAnswer = (userAnswer, correctAnswers) => {
    const normalizedUser = normalizeString(userAnswer);
    const normalizedUserWithoutArticles = removeArticles(normalizedUser);
    
    // Si l'admin a entré plusieurs réponses possibles (séparées par virgules)
    const acceptedAnswers = correctAnswers.split(',').map(a => a.trim());
    
    for (const accepted of acceptedAnswers) {
      const normalizedAccepted = normalizeString(accepted);
      const normalizedAcceptedWithoutArticles = removeArticles(normalizedAccepted);
      
      // Comparaison exacte
      if (normalizedUser === normalizedAccepted) return true;
      
      // Comparaison sans articles
      if (normalizedUserWithoutArticles === normalizedAcceptedWithoutArticles) return true;
      
      // Si la réponse utilisateur contient la réponse acceptée (ou vice-versa)
      if (normalizedUser.includes(normalizedAcceptedWithoutArticles) || 
          normalizedAccepted.includes(normalizedUserWithoutArticles)) {
        return true;
      }
      
      // Comparaison par mots (au moins 50% des mots en commun pour les réponses longues)
      const userWords = normalizedUserWithoutArticles.split(' ').filter(w => w.length > 2);
      const acceptedWords = normalizedAcceptedWithoutArticles.split(' ').filter(w => w.length > 2);
      
      if (userWords.length > 0 && acceptedWords.length > 0) {
        const commonWords = userWords.filter(w => acceptedWords.includes(w));
        const ratio = commonWords.length / Math.max(userWords.length, acceptedWords.length);
        
        if (ratio >= 0.5) return true; // Au moins 50% de mots en commun
      }
    }
    
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guess.trim() || completed) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Utiliser la nouvelle fonction de validation
    const isCorrect = checkAnswer(guess, gameData.answer);

    if (isCorrect) {
      // BONNE RÉPONSE !
      const currentRevealed = gameData.type === 'audio' ? audioSegments : revealedCells.length;
      const points = getPoints(currentRevealed);
      setCompleted(true);
      setMessage(`🎉 Correct ! C'est bien "${gameData.answer.split(',')[0]}" !`);
      
      await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
        revealedCells,
        audioSegments,
        attempts: newAttempts,
        completed: true,
        completedAt: new Date().toISOString()
      });
      
      await addPoints(teamId, points);
    } else {
      // MAUVAISE RÉPONSE
      if (gameData.type === 'audio') {
        // Pour l'audio, révéler un segment de plus
        if (audioSegments < 9) {
          setMessage(`❌ Incorrect ! Vous pouvez écouter un peu plus.`);
          const newSegments = await handleRevealAudioSegment();
          
          if (newSegments) {
            await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
              revealedCells,
              audioSegments: newSegments,
              attempts: newAttempts,
              completed: false
            });
          }
        } else {
          setMessage(`❌ Incorrect ! Toute la musique est révélée.`);
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            revealedCells,
            audioSegments,
            attempts: newAttempts,
            completed: false
          });
        }
      } else {
        // Pour l'image, révéler une case
        if (revealedCells.length < 9) {
          setMessage(`❌ Incorrect ! Une case a été révélée.`);
          const newRevealed = await handleRevealCell();
          
          if (newRevealed) {
            await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
              revealedCells: newRevealed,
              audioSegments,
              attempts: newAttempts,
              completed: false
            });
          }
        } else {
          setMessage(`❌ Incorrect ! Toutes les cases sont révélées.`);
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            revealedCells,
            audioSegments,
            attempts: newAttempts,
            completed: false
          });
        }
      }
    }

    setGuess('');
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p>Chargement...</p>
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

  if (!gameData) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p>Initialisation...</p>
      </div>
    );
  }

  const currentPoints = getPoints(gameData?.type === 'audio' ? audioSegments : revealedCells.length);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-[#63006A]">
          {gameData.type === 'audio' ? '🎵 Devine la musique' : '🔍 Devine l\'image'}
        </h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {gameData.type === 'audio' ? 'Segments révélés' : 'Cases révélées'}
          </p>
          <p className="text-2xl font-bold text-[#F9AC30]">
            {gameData.type === 'audio' ? audioSegments : revealedCells.length} / 9
          </p>
        </div>
      </div>

      {completed && (
        <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
          <p className="text-green-800 font-bold text-lg mb-2">
            ✅ Bravo ! Vous avez trouvé !
          </p>
          <Triceracoin 
            amount={getPoints((gameData.type === 'audio' ? audioSegments : revealedCells.length) - 1)} 
            size="lg" 
            textColor="text-green-800" 
          />
          <p className="text-sm text-gray-600 mt-2">
            Résolu en {attempts} tentative{attempts > 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Comment jouer :</strong> Devinez ce qui est sur l'image. 
          {!completed && (
            <> Points actuels : <strong className="text-[#F9AC30]">{currentPoints}</strong> Triceracoins</>
          )}
        </p>
      </div>

      {/* Grille 3x3 avec image */}
      {gameData.type === 'image' && (
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-1 max-w-md mx-auto border-4 border-[#63006A] rounded-lg overflow-hidden">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIndex) => {
              const isRevealed = revealedCells.includes(cellIndex) || completed;
              const row = Math.floor(cellIndex / 3);
              const col = cellIndex % 3;
              
              return (
                <div
                  key={cellIndex}
                  className="relative aspect-square overflow-hidden bg-gray-200"
                  style={{
                    backgroundImage: `url(${gameData.imageUrl})`,
                    backgroundSize: '300%',
                    backgroundPosition: `${col * 50}% ${row * 50}%`,
                  }}
                >
                  {!isRevealed && (
                    <div 
                      className="absolute inset-0 backdrop-blur-xl bg-white/30 flex items-center justify-center"
                    >
                      <span className="text-4xl text-gray-400">?</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lecteur audio pour les sons */}
      {gameData.type === 'audio' && (
        <div className="mb-6">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-[#63006A]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#63006A]">
                🎵 Extrait révélé : {audioSegments}/9
              </p>
              <p className="text-sm text-gray-600">
                ~{Math.round((audioSegments / 9) * 100)}% de la musique
              </p>
            </div>
            
            <AudioPlayer
              audioUrl={gameData.audioUrl}
              segments={audioSegments}
              completed={completed}
              audioRef={audioRef}
            />
            
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#F9AC30] h-2 rounded-full transition-all duration-500"
                style={{ width: `${(audioSegments / 9) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de réponse */}
      {!completed && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Votre réponse..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F9AC30] text-lg"
              autoFocus
              disabled={completed}
            />
            <button
              type="submit"
              disabled={!guess.trim() || completed}
              className="px-6 py-3 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider
            </button>
          </div>
        </form>
      )}

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-center font-bold ${
          message.includes('✅') || message.includes('🎉')
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Tableau des points */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-bold text-sm text-gray-700 mb-2">
          Barème des {gameData.type === 'audio' ? 'Triceracoins' : 'points'} :
        </h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
            const currentLevel = gameData.type === 'audio' ? audioSegments : revealedCells.length;
            return (
              <div 
                key={i} 
                className={`p-2 rounded text-center ${
                  i === currentLevel && !completed
                    ? 'bg-[#F9AC30] text-white font-bold'
                    : 'bg-white'
                }`}
              >
                <div className="font-bold">
                  {gameData.type === 'audio' ? `${i}/9` : `${i} case${i > 1 ? 's' : ''}`}
                </div>
                <div>{getPoints(i)} pts</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressiveGuess;
