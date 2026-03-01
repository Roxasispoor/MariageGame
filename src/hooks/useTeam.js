import { useState, useEffect } from 'react';
import { subscribeToTeam } from '../services/gameService';

export const useTeam = (teamId) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('useTeam - teamId:', teamId);

  useEffect(() => {
    if (!teamId) {
      console.log('useTeam - Pas de teamId');
      setLoading(false);
      return;
    }

    console.log('useTeam - Subscription à:', teamId);
    const unsubscribe = subscribeToTeam(teamId, (teamData) => {
      console.log('useTeam - Données reçues:', teamData);
      setTeam(teamData);
      setLoading(false);
    });

    return () => {
      console.log('useTeam - Unsubscribe');
      unsubscribe();
    };
  }, [teamId]);

  return { team, loading };
};
