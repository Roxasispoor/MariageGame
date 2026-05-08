import React, { useState, useEffect, useRef } from 'react';
import { subscribeToGame, saveTeamGameProgress, subscribeToTeamGameProgress, addPoints } from '../services/gameService';
import Triceracoin from './Triceracoin';

// ─── Image : 9 niveaux de pixellisation ───────────────────────────────────────
const PIXEL_SIZES  = [16, 24, 36, 48, 64, 96, 128, 192, null]; // null = pleine résolution
const IMAGE_LEVELS = PIXEL_SIZES.length; // 9
const IMAGE_POINTS = [10, 9, 8, 7, 6, 5, 4, 2, 1];

// ─── Audio : 5 niveaux de durée ───────────────────────────────────────────────
// null = chanson complète
const AUDIO_SECONDS = [5, 10, 20, 40, null];
const AUDIO_LEVELS  = AUDIO_SECONDS.length; // 5
const AUDIO_POINTS  = [10, 7, 5, 3, 1];

// ─── Utilitaire canvas ────────────────────────────────────────────────────────
const drawPixelated = (canvas, img, level) => {
  if (!canvas || !img) return;
  const ctx  = canvas.getContext('2d');
  const W    = canvas.width;
  const H    = canvas.height;
  const size = PIXEL_SIZES[level - 1];

  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  if (!size) {
    ctx.drawImage(img, 0, 0, W, H);
    return;
  }

  const tmp  = document.createElement('canvas');
  tmp.width  = size;
  tmp.height = size;
  const tCtx = tmp.getContext('2d');
  tCtx.imageSmoothingEnabled = false;
  tCtx.drawImage(img, 0, 0, size, size);
  ctx.drawImage(tmp, 0, 0, W, H);
};

// ─── Lecteur audio ────────────────────────────────────────────────────────────
const AudioPlayer = ({ audioUrl, segments, completed, audioRef }) => {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Durée max selon le niveau (en secondes, ou durée totale si null)
  const getMaxTime = (dur) => {
    if (completed) return dur;
    const secs = AUDIO_SECONDS[segments - 1];
    return secs === null ? dur : Math.min(secs, dur);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMeta = () => setDuration(audio.duration);
    const onTime = () => {
      const maxTime = getMaxTime(audio.duration);
      setCurrentTime(audio.currentTime);
      if (!completed && audio.currentTime >= maxTime) {
        audio.pause();
        audio.currentTime = maxTime;
      }
    };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
    };
  }, [segments, completed, audioRef]);

  const maxTime = getMaxTime(duration);
  const isFull  = AUDIO_SECONDS[segments - 1] === null;

  return (
    <div>
      <audio ref={audioRef} controls className="w-full">
        <source src={audioUrl} type="audio/mpeg" />
      </audio>
      <div className="mt-2 text-xs text-center text-gray-600">
        {completed || isFull
          ? <span>🎵 Musique complète disponible</span>
          : <span>🔒 Extrait limité à <strong>{maxTime}s</strong> sur {Math.floor(duration)}s</span>
        }
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const ProgressiveGuess = ({ gameId, teamId }) => {
  const [gameData, setGameData]           = useState(null);
  const [pixelLevel, setPixelLevel]       = useState(1);
  const [audioSegments, setAudioSegments] = useState(1);
  const [guess, setGuess]                 = useState('');
  const [message, setMessage]             = useState('');
  const [completed, setCompleted]         = useState(false);
  const [attempts, setAttempts]           = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [imgLoaded, setImgLoaded]         = useState(false);

  const canvasRef = useRef(null);
  const imgRef    = useRef(null);
  const audioRef  = useRef(null);
  const initedRef = useRef(false);

  const getPoints = (type, level) =>
    type === 'audio'
      ? (AUDIO_POINTS[level - 1] ?? 1)
      : (IMAGE_POINTS[level - 1] ?? 1);

  // Redessine le canvas quand le niveau change
  useEffect(() => {
    if (imgLoaded && canvasRef.current && imgRef.current) {
      drawPixelated(canvasRef.current, imgRef.current, completed ? IMAGE_LEVELS : pixelLevel);
    }
  }, [pixelLevel, imgLoaded, completed]);

  // Abonnements Firebase
  useEffect(() => {
    let unsubGame, unsubProgress;
    try {
      unsubGame = subscribeToGame(gameId, (data) => {
        if (!data?.state) {
          setError(data ? 'Configuration invalide' : 'Jeu non trouvé');
          setLoading(false);
          return;
        }
        setGameData(data.state);
        setLoading(false);
      });

      unsubProgress = subscribeToTeamGameProgress(teamId, gameId, async (progressData) => {
        if (progressData?.progress) {
          const level = progressData.progress.pixelLevel
            ?? (progressData.progress.revealedCells?.length || 1);
          setPixelLevel(Math.max(1, level));
          setAudioSegments(progressData.progress.audioSegments || 1);
          setAttempts(progressData.progress.attempts || 0);
          setCompleted(progressData.progress.completed || false);
          initedRef.current = true;
        } else if (!initedRef.current) {
          setPixelLevel(1);
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            pixelLevel: 1, audioSegments: 1, attempts: 0, completed: false,
          });
          initedRef.current = true;
        }
      });

      return () => { unsubGame?.(); unsubProgress?.(); };
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [gameId, teamId]);

  // ─── Validation de la réponse ─────────────────────────────────────────────
  const normalize = (str) =>
    str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim();

  const removeArticles = (str) =>
    str.replace(/\b(le|la|les|l|un|une|des|de|du|d)\b/gi, ' ').replace(/\s+/g, ' ').trim();

  const checkAnswer = (userAnswer, correctAnswers) => {
    const nu  = normalize(userAnswer);
    const nua = removeArticles(nu).trim();

    // Réponse trop courte → rejet immédiat
    if (nua.length < 3) return false;

    for (const accepted of correctAnswers.split(',').map(a => a.trim())) {
      const na  = normalize(accepted);
      const naa = removeArticles(na).trim();

      // 1. Correspondance exacte (avec ou sans articles)
      if (nu === na || nua === naa) return true;

      // 2. La saisie contient la réponse complète (ex: "c'est la tour eiffel" → "tour eiffel")
      if (naa.length >= 3 && nu.includes(naa)) return true;

      // 3. La réponse contient la saisie SEULEMENT si la saisie représente ≥ 60% de la réponse
      //    (ex: "eiffel" pour "tour eiffel" = 6/10 = 60% → ok)
      //    (ex: "eif" pour "tour eiffel"   = 3/10 = 30% → refusé)
      if (naa.length >= 3 && nua.length >= 3 && na.includes(nua) && nua.length >= naa.length * 0.6) return true;

      // 4. Correspondance par mots significatifs (≥ 4 lettres, ratio ≥ 70%)
      const uw = nua.split(' ').filter(w => w.length >= 4);
      const aw = naa.split(' ').filter(w => w.length >= 4);
      if (uw.length > 0 && aw.length > 0) {
        const matches = uw.filter(w => aw.includes(w)).length;
        if (matches > 0 && matches / Math.max(uw.length, aw.length) >= 0.7) return true;
      }
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guess.trim() || completed) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (checkAnswer(guess, gameData.answer)) {
      const level  = gameData.type === 'audio' ? audioSegments : pixelLevel;
      const points = getPoints(gameData.type, level);
      setCompleted(true);
      setMessage(`🎉 Correct ! C'est bien "${gameData.answer.split(',')[0]}" !`);

      await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
        pixelLevel, audioSegments, attempts: newAttempts,
        completed: true, completedAt: new Date().toISOString(),
      });
      await addPoints(teamId, points);
    } else {
      // Mauvaise réponse → révéler un niveau de plus
      if (gameData.type === 'audio') {
        if (audioSegments < AUDIO_LEVELS) {
          const newSeg   = audioSegments + 1;
          const nextSecs = AUDIO_SECONDS[newSeg - 1];
          const label    = nextSecs === null ? 'la chanson entière' : `${nextSecs} secondes`;
          setAudioSegments(newSeg);
          setMessage(`❌ Incorrect ! Vous pouvez maintenant écouter ${label}.`);
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            pixelLevel, audioSegments: newSeg, attempts: newAttempts, completed: false,
          });
        } else {
          setMessage('❌ Incorrect ! Vous avez accès à la chanson entière.');
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            pixelLevel, audioSegments, attempts: newAttempts, completed: false,
          });
        }
      } else {
        if (pixelLevel < IMAGE_LEVELS) {
          const newLevel = pixelLevel + 1;
          setPixelLevel(newLevel);
          setMessage(newLevel === IMAGE_LEVELS
            ? "❌ Incorrect ! L'image est maintenant en pleine résolution."
            : "❌ Incorrect ! L'image devient un peu plus nette…");
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            pixelLevel: newLevel, audioSegments, attempts: newAttempts, completed: false,
          });
        } else {
          setMessage("❌ Incorrect ! L'image est déjà en pleine résolution.");
          await saveTeamGameProgress(teamId, gameId, 'progressive-guess', {
            pixelLevel, audioSegments, attempts: newAttempts, completed: false,
          });
        }
      }
    }

    setGuess('');
    setTimeout(() => setMessage(''), 3000);
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="bg-white rounded-lg shadow-xl p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
      <p>Chargement...</p>
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-lg shadow-xl p-8 text-center">
      <p className="text-red-600 font-bold mb-2">❌ Erreur</p>
      <p className="text-gray-600">{error}</p>
    </div>
  );

  if (!gameData) return (
    <div className="bg-white rounded-lg shadow-xl p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
      <p>Initialisation...</p>
    </div>
  );

  const isAudio      = gameData.type === 'audio';
  const currentLevel = isAudio ? audioSegments : pixelLevel;
  const totalLevels  = isAudio ? AUDIO_LEVELS : IMAGE_LEVELS;
  const currentPts   = getPoints(gameData.type, currentLevel);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-[#63006A]">
          {isAudio ? '🎵 Devine la musique' : "🔍 Devine l'image"}
        </h3>
        <div className="text-right">
          <p className="text-sm text-gray-600">Indice</p>
          <p className="text-2xl font-bold text-[#F9AC30]">{currentLevel} / {totalLevels}</p>
        </div>
      </div>

      {/* Succès */}
      {completed && (
        <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
          <p className="text-green-800 font-bold text-lg mb-2">✅ Bravo ! Vous avez trouvé !</p>
          <Triceracoin amount={getPoints(gameData.type, currentLevel)} size="lg" textColor="text-green-800" />
          <p className="text-sm text-gray-600 mt-2">
            Résolu en {attempts} tentative{attempts > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Info */}
      {!completed && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
          {isAudio
            ? <>🎵 Écoutez l'extrait et devinez la musique. À chaque mauvaise réponse vous débloquez plus de temps, mais vous gagnez moins de points. Points actuels : <strong className="text-[#F9AC30]">{currentPts}</strong></>
            : <>🔍 Devinez ce qui est sur l'image. À chaque mauvaise réponse l'image devient plus nette, mais vous gagnez moins de points. Points actuels : <strong className="text-[#F9AC30]">{currentPts}</strong></>
          }
        </div>
      )}

      {/* Image pixellisée */}
      {!isAudio && (
        <div className="mb-6 flex justify-center">
          <img
            ref={imgRef}
            src={gameData.imageUrl}
            alt=""
            crossOrigin="anonymous"
            className="hidden"
            onLoad={() => setImgLoaded(true)}
          />
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="rounded-lg border-4 border-[#63006A] max-w-full"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      )}

      {/* Lecteur audio */}
      {isAudio && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-[#63006A]">
          <AudioPlayer
            audioUrl={gameData.audioUrl}
            segments={audioSegments}
            completed={completed}
            audioRef={audioRef}
          />
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#F9AC30] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(audioSegments / AUDIO_LEVELS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Formulaire */}
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
            />
            <button
              type="submit"
              disabled={!guess.trim()}
              className="px-6 py-3 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider
            </button>
          </div>
        </form>
      )}

      {/* Feedback */}
      {message && (
        <div className={`p-3 rounded-lg text-center font-bold mb-4 ${
          message.startsWith('🎉') || message.startsWith('✅')
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Barème */}
      <div className="mt-2 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-bold text-sm text-gray-700 mb-2">Barème des points :</h4>
        {isAudio ? (
          <div className="grid grid-cols-5 gap-1 text-xs">
            {AUDIO_SECONDS.map((secs, i) => {
              const lvl = i + 1;
              return (
                <div key={lvl} className={`p-2 rounded text-center ${
                  lvl === currentLevel && !completed
                    ? 'bg-[#F9AC30] text-white font-bold'
                    : lvl < currentLevel ? 'bg-gray-200 text-gray-400' : 'bg-white border border-gray-200'
                }`}>
                  <div className="font-bold">{secs === null ? '🎵' : `${secs}s`}</div>
                  <div>{AUDIO_POINTS[i]} pt{AUDIO_POINTS[i] > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-9 gap-1 text-xs">
            {Array.from({ length: IMAGE_LEVELS }, (_, i) => i + 1).map((lvl) => (
              <div key={lvl} className={`p-1 rounded text-center ${
                lvl === currentLevel && !completed
                  ? 'bg-[#F9AC30] text-white font-bold'
                  : lvl < currentLevel ? 'bg-gray-200 text-gray-400' : 'bg-white border border-gray-200'
              }`}>
                <div className="font-bold">{lvl}</div>
                <div>{IMAGE_POINTS[i]}</div>
              </div>
            ))}
          </div>
        )}
        {!isAudio && (
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>← très pixellisé</span>
            <span>net →</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressiveGuess;
