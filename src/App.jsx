import React, { useState } from 'react';
import TeamView from './pages/TeamView';
import Admin from './pages/Admin';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamNameInput, setTeamNameInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Mot de passe admin - CHANGEZ-LE !
  const ADMIN_PASSWORD = 'mariage2026';

  // Charger l'équipe mémorisée au démarrage
  useState(() => {
    const savedTeamId = localStorage.getItem('weddingGame_teamId');
    const savedTeamName = localStorage.getItem('weddingGame_teamName');
    if (savedTeamId && savedTeamName) {
      setSelectedTeamId(savedTeamId);
      setTeamNameInput(savedTeamName);
    }
  }, []);

  const handleTeamLogin = async () => {
    if (!teamNameInput.trim()) return;
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      console.log('🔍 Tentative de connexion avec:', teamNameInput.trim());
      
      // Import dynamique pour éviter les problèmes de chargement
      const { getTeamByName } = await import('./services/gameService');
      console.log('✅ gameService importé');
      
      const team = await getTeamByName(teamNameInput.trim());
      console.log('📡 Réponse Firebase:', team);
      
      if (team) {
        console.log('✅ Équipe trouvée:', team);
        setSelectedTeamId(team.id);
        // Sauvegarder dans localStorage
        localStorage.setItem('weddingGame_teamId', team.id);
        localStorage.setItem('weddingGame_teamName', team.name);
        setCurrentView('team');
      } else {
        console.log('❌ Équipe non trouvée dans Firebase');
        setLoginError('❌ Équipe non trouvée. Vérifiez le nom.');
      }
    } catch (error) {
      console.error('❌ Erreur de connexion complète:', error);
      console.error('Type d\'erreur:', error.name);
      console.error('Message:', error.message);
      setLoginError(`❌ Erreur de connexion : ${error.message}. Vérifiez que uBlock Origin est désactivé sur ce site.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setCurrentView('admin');
      setAdminPassword('');
    } else {
      alert('❌ Mot de passe incorrect');
      setAdminPassword('');
    }
  };

  const testFirebaseConnection = async () => {
    console.log('🧪 Test de connexion Firebase...');
    try {
      const { getLeaderboard } = await import('./services/gameService');
      const teams = await getLeaderboard();
      console.log('✅ Firebase fonctionne ! Équipes trouvées:', teams);
      alert(`✅ Firebase OK !\n\n${teams.length} équipe(s) trouvée(s):\n${teams.map(t => `- ${t.name}`).join('\n')}`);
    } catch (error) {
      console.error('❌ Firebase ne fonctionne pas:', error);
      alert(`❌ Erreur Firebase:\n${error.message}\n\n⚠️ Vérifiez:\n1. uBlock Origin désactivé sur localhost\n2. Configuration Firebase dans firebase.js\n3. Console (F12) pour plus de détails`);
    }
  };

  const handleLogout = () => {
    // Effacer la mémorisation de l'équipe
    localStorage.removeItem('weddingGame_teamId');
    localStorage.removeItem('weddingGame_teamName');
    setCurrentView('home');
    setSelectedTeamId('');
    setTeamNameInput('');
    setLoginError('');
    setIsAdminAuthenticated(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'admin':
        if (!isAdminAuthenticated) {
          return (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
                  🔐 Accès Administrateur
                </h1>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                    autoFocus
                  />
                  <button
                    onClick={handleAdminLogin}
                    className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all"
                  >
                    Se connecter
                  </button>
                  <p className="text-sm text-gray-600 text-center">
                    Le mot de passe par défaut est défini dans le code
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return <Admin />;
      case 'team':
        return <TeamView teamId={selectedTeamId} />;
      default:
        return (
          <div className="min-h-screen bg-[#63006A] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h1 className="text-4xl font-bold text-center mb-2 text-[#63006A]">
                Mariage Florence - Alban
              </h1>
              <p className="text-center text-gray-600 mb-8">
                Bienvenue ! Connectez-vous à votre équipe
              </p>

              {/* Reconnexion rapide si équipe mémorisée */}
              {selectedTeamId && teamNameInput && (
                <div className="mb-6 p-4 bg-[#F9AC30]/20 border-2 border-[#F9AC30] rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Équipe mémorisée :</p>
                  <p className="font-bold text-lg text-[#63006A] mb-3">{teamNameInput}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentView('team')}
                      className="flex-1 py-2 px-4 bg-[#F9AC30] text-[#63006A] rounded-lg font-bold hover:bg-[#FFB84D] transition-all"
                    >
                      ⚡ Reconnecter
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTeamId('');
                        setTeamNameInput('');
                        localStorage.removeItem('weddingGame_teamId');
                        localStorage.removeItem('weddingGame_teamName');
                      }}
                      className="py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Accès équipe */}
                <div className="border-2 border-[#F9AC30] rounded-lg p-4">
                  <h2 className="font-bold text-lg mb-3 text-[#63006A]">
                    👥 Accès Équipe
                  </h2>
                  <input
                    type="text"
                    placeholder="Nom de votre équipe"
                    value={teamNameInput}
                    onChange={(e) => {
                      setTeamNameInput(e.target.value);
                      setLoginError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleTeamLogin()}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F9AC30] mb-3"
                    disabled={isLoading}
                  />
                  
                  {loginError && (
                    <div className="mb-3 p-2 bg-red-100 text-red-800 rounded text-sm">
                      {loginError}
                    </div>
                  )}
                  
                  <button
                    onClick={handleTeamLogin}
                    disabled={!teamNameInput.trim() || isLoading}
                    className="w-full py-3 px-6 bg-[#F9AC30] text-[#63006A] rounded-lg font-bold hover:bg-[#FFB84D] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Connexion...' : 'Rejoindre mon équipe'}
                  </button>
                </div>

                {/* Accès admin */}
                <div className="border-2 border-[#63006A]/30 rounded-lg p-4">
                  <h2 className="font-bold text-lg mb-3 text-[#63006A]">
                    🎮 Accès Administrateur
                  </h2>
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="w-full py-3 px-6 bg-[#63006A] text-white rounded-lg font-bold hover:bg-[#7a0082] transition-all"
                  >
                    Panel Admin
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center text-sm text-gray-600">
                <p>💡 L'admin crée les équipes</p>
                <p>💡 Les joueurs se connectent avec le nom de leur équipe</p>
                <p>💡 Tous les scores sont en temps réel</p>
              </div>

              {/* Bouton de test Firebase */}
              <div className="mt-6">
                <button
                  onClick={testFirebaseConnection}
                  className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all"
                >
                  🧪 Tester connexion Firebase
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#63006A]">
      {currentView !== 'home' && (
        <button
          onClick={handleLogout}
          className="fixed top-4 left-4 px-4 py-2 bg-[#F9AC30] text-[#63006A] rounded-lg shadow-lg hover:shadow-xl transition-all font-bold z-50"
        >
          ← Déconnexion
        </button>
      )}
      {renderView()}
    </div>
  );
}

export default App;
