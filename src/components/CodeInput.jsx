import React, { useState } from 'react';
import { validateCode } from '../services/gameService';
import Triceracoin from './Triceracoin';

const CodeInput = ({ teamId, teamColor }) => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const result = await validateCode(teamId, code);
      setIsSuccess(result.success);
      setMessage(result.message);
      
      if (result.success) {
        // Extraire les points du message
        const pointsMatch = result.message.match(/\+(\d+)/);
        if (pointsMatch) {
          setPoints(parseInt(pointsMatch[1]));
        }
        setCode('');
        // Animation de succès
        setTimeout(() => {
          setMessage('');
          setPoints(0);
        }, 3000);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Erreur lors de la validation du code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE-EPREUVE"
            className="w-full px-4 py-3 text-lg font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F9AC30] uppercase"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full py-3 px-6 bg-[#F9AC30] text-white rounded-lg font-bold hover:bg-[#FFB84D] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Validation...' : '🔓 Valider le code'}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-4 rounded-lg font-bold text-center transition-all ${
            isSuccess
              ? 'bg-green-100 text-green-800 border-2 border-green-400'
              : 'bg-red-100 text-red-800 border-2 border-red-400'
          }`}
        >
          {message}
          {isSuccess && points > 0 && (
            <div className="mt-2 flex justify-center">
              <Triceracoin amount={points} size="lg" textColor="text-green-800" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeInput;
