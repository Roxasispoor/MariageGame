import { useState, useEffect } from 'react';
import { subscribeToLeaderboard } from '../services/gameService';

export const useLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((teamsData) => {
      setTeams(teamsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { teams, loading };
};
