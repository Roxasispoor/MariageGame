import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import Triceracoin from './Triceracoin';

const Leaderboard = () => {
  const { teams, loading } = useLeaderboard();

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F9AC30]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team, index) => (
        <div
          key={team.id}
          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
            index === 0
              ? 'bg-[#F9AC30] border-2 border-[#F9AC30]'
              : index === 1
              ? 'bg-gray-200 border-2 border-gray-400'
              : index === 2
              ? 'bg-orange-200 border-2 border-orange-400'
              : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold w-8">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
            </span>
            <div>
              <h3 className={`font-bold text-lg ${index === 0 ? 'text-white' : 'text-[#63006A]'}`}>
                {team.name}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <Triceracoin 
              amount={team.score} 
              size="lg" 
              textColor={index === 0 ? 'text-white' : 'text-[#63006A]'}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
