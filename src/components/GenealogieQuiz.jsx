import React, { useState, useEffect, useRef } from 'react';
import { subscribeToGame, subscribeToTeamGameProgress, saveTeamGameProgress, addPoints } from '../services/gameService';
import Triceracoin from './Triceracoin';

// Normalise une réponse pour la comparaison (minuscules, sans accents, sans espaces superflus)
const normalize = (str) =>
  str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const GenealogieQuiz = ({ gameId, teamId }) => {
  const [questions, setQuestions] = useState([]);
  const [answeredIds, setAnsweredIds] = useState([]);
  const [inputs, setInputs] = useState({});
  const [feedbacks, setFeedbacks] = useState({}); // { qId: 'correct' | 'wrong' }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completed, setCompleted] = useState(false);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    let unsubGame, unsubProgress;

    try {
      unsubGame = subscribeToGame(gameId, (gameData) => {
        if (!gameData) {
          setError('Quiz non trouvé.');
          setLoading(false);
          return;
        }
        const qs = gameData.state?.questions;
        if (!qs || qs.length === 0) {
          setError('Aucune question trouvée.');
          setLoading(false);
          return;
        }
        setQuestions(Array.isArray(qs) ? qs : Object.values(qs));
        setLoading(false);
      });

      unsubProgress = subscribeToTeamGameProgress(teamId, gameId, (progressData) => {
        if (progressData?.progress) {
          isRestoringRef.current = true;
          setAnsweredIds(progressData.progress.answeredIds || []);
          setTotalPoints(progressData.progress.totalPoints || 0);
          setCompleted(progressData.progress.completed || false);
          setTimeout(() => { isRestoringRef.current = false; }, 100);
        }
      });

      return () => {
        if (unsubGame) unsubGame();
        if (unsubProgress) unsubProgress();
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [gameId, teamId]);

  const handleInputChange = (qId, value) => {
    setInputs(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (question) => {
    const userAnswer = inputs[question.id] || '';
    if (!userAnswer.trim()) return;

    if (normalize(userAnswer) === normalize(question.answer)) {
      // Bonne réponse
      const newAnsweredIds = [...answeredIds, question.id];
      const newTotalPoints = totalPoints + question.points;
      const allDone = newAnsweredIds.length === questions.length;

      setAnsweredIds(newAnsweredIds);
      setTotalPoints(newTotalPoints);
      setCompleted(allDone);
      setFeedbacks(prev => ({ ...prev, [question.id]: 'correct' }));
      setInputs(prev => ({ ...prev, [question.id]: '' }));

      await addPoints(teamId, question.points);
      await saveTeamGameProgress(teamId, gameId, 'quiz', {
        answeredIds: newAnsweredIds,
        totalPoints: newTotalPoints,
        completed: allDone,
      });
    } else {
      // Mauvaise réponse
      setFeedbacks(prev => ({ ...prev, [question.id]: 'wrong' }));
      setTimeout(() => {
        setFeedbacks(prev => ({ ...prev, [question.id]: null }));
      }, 1500);
    }
  };

  const handleKeyDown = (e, question) => {
    if (e.key === 'Enter') handleSubmit(question);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30] mx-auto mb-4"></div>
        <p>Chargement du quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <p className="text-red-600 font-bold">❌ {error}</p>
      </div>
    );
  }

  const answeredCount = answeredIds.length;
  const totalPossible = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold text-[#63006A]">🌳 Quiz Généalogie</h3>
        <div className="text-right">
          <Triceracoin amount={totalPoints} size="lg" textColor="text-[#F9AC30]" />
        </div>
      </div>

      {/* Progression */}
      <div className="mb-5">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{answeredCount} / {questions.length} questions répondues</span>
          <span>{totalPoints} / {totalPossible} pts</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#F9AC30] h-2 rounded-full transition-all duration-500"
            style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {completed && (
        <div className="mb-5 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
          <p className="text-green-800 font-bold text-lg">🎉 Quiz terminé ! Bravo !</p>
        </div>
      )}

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          💡 Consultez l'arbre généalogique pour trouver les réponses. Vous pouvez tenter autant de fois que vous voulez !
        </p>
      </div>

      {/* Liste des questions */}
      <div className="space-y-3">
        {questions.map((q, index) => {
          const isAnswered = answeredIds.includes(q.id);
          const feedback = feedbacks[q.id];

          return (
            <div
              key={q.id}
              className={`rounded-lg border-2 p-4 transition-all ${
                isAnswered
                  ? 'border-green-300 bg-green-50'
                  : feedback === 'wrong'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-xs font-bold bg-[#F9AC30] text-white px-2 py-0.5 rounded-full">
                      {q.points} pts
                    </span>
                    {isAnswered && (
                      <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                        ✓ Correct !
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 font-medium">{q.question}</p>
                </div>
              </div>

              {!isAnswered && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={inputs[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, q)}
                    placeholder="Votre réponse..."
                    className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none text-sm transition-colors ${
                      feedback === 'wrong'
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#F9AC30]'
                    }`}
                  />
                  <button
                    onClick={() => handleSubmit(q)}
                    disabled={!inputs[q.id]?.trim()}
                    className="px-4 py-2 bg-[#63006A] text-white rounded-lg font-bold text-sm hover:bg-[#7a008a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ✓
                  </button>
                </div>
              )}

              {feedback === 'wrong' && (
                <p className="mt-1 text-red-600 text-xs font-medium">❌ Ce n'est pas ça, réessayez !</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenealogieQuiz;
