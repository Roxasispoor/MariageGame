import React, { useState } from 'react';
import { createTeam, createCode, createGame, setRansomGoal, createCraftConfig } from '../services/gameService';
import { generateCruciverbist } from '../utils/cruciverbistGenerator';
import Leaderboard from '../components/Leaderboard';
import RansomProgress from '../components/RansomProgress';

const Admin = () => {
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#FF69B4');
  const [codeValue, setCodeValue] = useState('');
  const [codePoints, setCodePoints] = useState(10);
  const [codeDescription, setCodeDescription] = useState('');
  const [ransomGoal, setRansomGoalInput] = useState(1000);
  const [ransomMessage, setRansomMessage] = useState('Payez la rançon pour libérer les mariés !');
  const [message, setMessage] = useState('');
  
  // État pour le Sudoku
  const [sudokuName, setSudokuName] = useState('');
  const [sudokuDescription, setSudokuDescription] = useState('');
  
  // État pour les mots fléchés
  const [crosswordName, setCrosswordName] = useState('');
  const [crosswordDescription, setCrosswordDescription] = useState('');
  const [crosswordWords, setCrosswordWords] = useState([
    { word: '', definition: '' }
  ]);
  
  // État pour la chaîne de mots
  const [wordChainStart, setWordChainStart] = useState('');
  const [wordChainEnd, setWordChainEnd] = useState('');
  
  // État pour la configuration craft
  const [craftBasePoints, setCraftBasePoints] = useState(5);
  const [craftBonusElements, setCraftBonusElements] = useState([
    { id: 'mariage', name: 'MARIAGE 💒', bonus: 50 },
    { id: 'alliance', name: 'ALLIANCE 💍', bonus: 30 },
    { id: 'couple', name: 'COUPLE 💑', bonus: 20 },
    { id: 'amour', name: 'AMOUR ❤️', bonus: 15 },
  ]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const teamId = `team_${Date.now()}`;
      await createTeam(teamId, teamName, teamColor);
      setMessage(`✅ Équipe "${teamName}" créée !\n\n👉 Les joueurs peuvent se connecter avec le nom : "${teamName}"`);
      setTeamName('');
      setTimeout(() => setMessage(''), 8000);
    } catch (error) {
      setMessage('❌ Erreur lors de la création de l\'équipe');
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    try {
      const codeId = `code_${Date.now()}`;
      await createCode(codeId, codeValue, codePoints, codeDescription);
      setMessage(`✅ Code "${codeValue}" créé (${codePoints} points)`);
      setCodeValue('');
      setCodeDescription('');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('❌ Erreur lors de la création du code');
    }
  };

  const handleCreateSudoku = async () => {
    try {
      console.log('Admin - Création du Sudoku...');
      // Grille initiale 4x4 avec quelques chiffres
      const initialGrid = [
        [1, 0, 0, 4],
        [0, 0, 1, 0],
        [0, 3, 0, 0],
        [4, 0, 0, 2]
      ];
      
      const gameId = `sudoku_${Date.now()}`;
      console.log('Admin - Game ID:', gameId);
      
      await createGame(gameId, 'sudoku', {
        grid: initialGrid.map(row => [...row]),
        initialGrid: initialGrid,
        name: sudokuName || `Sudoku ${new Date().toLocaleDateString()}`,
        description: sudokuDescription || ''
      });
      
      console.log('Admin - Sudoku créé avec succès !');
      setMessage(`✅ Sudoku "${sudokuName || 'Sans nom'}" créé !\n\nLes équipes le verront dans la liste des Sudokus disponibles.`);
      setSudokuName('');
      setSudokuDescription('');
      setTimeout(() => setMessage(''), 10000);
    } catch (error) {
      console.error('Admin - Erreur complète:', error);
      setMessage(`❌ Erreur lors de la création du sudoku: ${error.message}`);
    }
  };

  const handleSetRansomGoal = async (e) => {
    e.preventDefault();
    try {
      await setRansomGoal(ransomGoal, ransomMessage);
      setMessage(`✅ Objectif de rançon configuré : ${ransomGoal} points`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage('❌ Erreur lors de la configuration');
    }
  };

  const handleAddCrosswordWord = () => {
    setCrosswordWords([...crosswordWords, { word: '', definition: '' }]);
  };

  const handleRemoveCrosswordWord = (index) => {
    setCrosswordWords(crosswordWords.filter((_, i) => i !== index));
  };

  const handleCrosswordWordChange = (index, field, value) => {
    const newWords = [...crosswordWords];
    newWords[index][field] = value;
    setCrosswordWords(newWords);
  };

  const handleCreateCrossword = async () => {
    try {
      console.log('Admin - Création des mots croisés...');
      
      const validWords = crosswordWords.filter(w => w.word.trim() && w.definition.trim());
      
      if (validWords.length < 3) {
        setMessage('❌ Veuillez entrer au moins 3 mots avec leurs définitions');
        return;
      }

      // Générer la grille avec le nouveau générateur
      const result = generateCruciverbist(validWords);
      
      if (!result.success) {
        setMessage(`❌ ${result.error}`);
        return;
      }

      if (result.unusedWords.length > 0) {
        setMessage(`⚠️ Attention : Ces mots n'ont pas pu être placés :\n${result.unusedWords.join(', ')}\n\nLa grille a été créée avec ${result.words.length} mots.`);
      }

      const gameId = `crossword_${Date.now()}`;
      
      // Créer le jeu dans Firebase avec la nouvelle structure
      await createGame(gameId, 'crossword', {
        words: result.words,
        bounds: result.bounds,
        validatedWords: {},
        name: crosswordName || `Mots Croisés ${new Date().toLocaleDateString()}`,
        description: crosswordDescription || ''
      });

      console.log('Admin - Mots croisés créés avec succès !');
      
      const finalMessage = result.unusedWords.length > 0
        ? `✅ Mots croisés "${crosswordName || 'Sans nom'}" créés avec ${result.words.length}/${validWords.length} mots !\n\n⚠️ Mots non placés : ${result.unusedWords.join(', ')}`
        : `✅ Mots croisés "${crosswordName || 'Sans nom'}" créés avec tous les ${result.words.length} mots !`;
      
      setMessage(finalMessage);
      setCrosswordWords([{ word: '', definition: '' }]);
      setCrosswordName('');
      setCrosswordDescription('');
      
      setTimeout(() => setMessage(''), 15000);
    } catch (error) {
      console.error('Admin - Erreur complète:', error);
      setMessage(`❌ Erreur lors de la création : ${error.message}`);
    }
  };

  const handleCreateWordChain = async () => {
    try {
      if (!wordChainStart.trim() || !wordChainEnd.trim()) {
        setMessage('❌ Veuillez entrer un mot de départ et un mot d\'arrivée');
        return;
      }

      const gameId = `wordchain_${Date.now()}`;
      
      await createGame(gameId, 'wordchain', {
        startWord: wordChainStart.toUpperCase().trim(),
        endWord: wordChainEnd.toUpperCase().trim(),
        chain: [wordChainStart.toUpperCase().trim()],
        completed: false
      });

      setMessage(`✅ Chaîne de mots créée !\n\n📋 ID : ${gameId}\n\nDépart : ${wordChainStart.toUpperCase()}\nArrivée : ${wordChainEnd.toUpperCase()}`);
      setWordChainStart('');
      setWordChainEnd('');
      setTimeout(() => setMessage(''), 10000);
    } catch (error) {
      console.error('Admin - Erreur:', error);
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const handleSaveCraftConfig = async () => {
    try {
      await createCraftConfig({
        basePoints: craftBasePoints,
        bonusElements: craftBonusElements
      });
      setMessage(`✅ Configuration de l'Alchimie sauvegardée ! ${craftBasePoints} pts de base + bonus sur ${craftBonusElements.length} éléments.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      setMessage(`❌ Erreur : ${error.message}`);
    }
  };

  const handleAddCraftBonus = () => {
    setCraftBonusElements([...craftBonusElements, { id: '', name: '', bonus: 10 }]);
  };

  const handleRemoveCraftBonus = (index) => {
    setCraftBonusElements(craftBonusElements.filter((_, i) => i !== index));
  };

  const handleCraftBonusChange = (index, field, value) => {
    const newBonuses = [...craftBonusElements];
    newBonuses[index][field] = value;
    setCraftBonusElements(newBonuses);
  };

  const colors = [
    { name: 'Rose', value: '#FF69B4' },
    { name: 'Bleu', value: '#4169E1' },
    { name: 'Vert', value: '#32CD32' },
    { name: 'Orange', value: '#FF8C00' },
    { name: 'Violet', value: '#9370DB' },
    { name: 'Rouge', value: '#DC143C' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎮 Administration du Jeu
        </h1>

        {message && (
          <div className="mb-6 p-4 bg-white/90 backdrop-blur rounded-lg shadow-xl text-center font-bold">
            {message}
          </div>
        )}

        {/* Objectif global - Aperçu */}
        <div className="mb-6">
          <RansomProgress />
        </div>

        {/* Configuration de l'objectif de rançon */}
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            🎯 Configurer l'objectif global
          </h2>
          <form onSubmit={handleSetRansomGoal} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de points requis
                </label>
                <input
                  type="number"
                  value={ransomGoal}
                  onChange={(e) => setRansomGoalInput(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message à afficher
                </label>
                <input
                  type="text"
                  value={ransomMessage}
                  onChange={(e) => setRansomMessage(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Payez la rançon pour libérer les mariés !"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 px-6 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition-all"
            >
              💰 Définir l'objectif
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Créer une équipe */}
          <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Créer une équipe
            </h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'équipe
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setTeamColor(color.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        teamColor === color.value
                          ? 'border-gray-800 scale-105'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      <span className="text-white font-bold text-sm">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
              >
                Créer l'équipe
              </button>
            </form>
          </div>

          {/* Créer un code */}
          <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Créer un code secret
            </h2>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code
                </label>
                <input
                  type="text"
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={codePoints}
                  onChange={(e) => setCodePoints(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={codeDescription}
                  onChange={(e) => setCodeDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Ex: Code trouvé dans le jardin"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all"
              >
                Créer le code
              </button>
            </form>
          </div>
        </div>

        {/* Créer des mini-jeux */}
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Créer un mini-jeu
          </h2>
          
          <div className="space-y-6">
            {/* Sudoku */}
            <div className="border-2 border-purple-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-purple-800">Sudoku 4x4</h3>
              
              <div className="space-y-3 mb-3">
                <input
                  type="text"
                  placeholder="Nom du Sudoku (ex: Sudoku Facile)"
                  value={sudokuName}
                  onChange={(e) => setSudokuName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Description (optionnelle)"
                  value={sudokuDescription}
                  onChange={(e) => setSudokuDescription(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <button
                onClick={handleCreateSudoku}
                className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all"
              >
                🧩 Créer le Sudoku
              </button>
            </div>

            {/* Mots croisés */}
            <div className="border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-blue-800">Mots Croisés</h3>
              
              <div className="space-y-3 mb-3">
                <input
                  type="text"
                  placeholder="Nom de la grille (ex: Mots Croisés Mariage)"
                  value={crosswordName}
                  onChange={(e) => setCrosswordName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description (optionnelle)"
                  value={crosswordDescription}
                  onChange={(e) => setCrosswordDescription(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {crosswordWords.map((wordData, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mot"
                      value={wordData.word}
                      onChange={(e) => handleCrosswordWordChange(index, 'word', e.target.value)}
                      className="w-32 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Définition"
                      value={wordData.definition}
                      onChange={(e) => handleCrosswordWordChange(index, 'definition', e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveCrosswordWord(index)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddCrosswordWord}
                  className="flex-1 py-2 px-4 bg-blue-100 text-blue-800 rounded-lg font-bold hover:bg-blue-200 transition-all"
                >
                  + Ajouter un mot
                </button>
                <button
                  onClick={handleCreateCrossword}
                  disabled={crosswordWords.filter(w => w.word.trim() && w.definition.trim()).length < 3}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  📝 Générer la grille
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                💡 Minimum 3 mots. La grille sera générée automatiquement.
              </p>
            </div>

            {/* Chaîne de mots */}
            <div className="border-2 border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-green-800">Chaîne de Mots</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de départ
                  </label>
                  <input
                    type="text"
                    value={wordChainStart}
                    onChange={(e) => setWordChainStart(e.target.value)}
                    placeholder="Ex: CHAT"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot d'arrivée
                  </label>
                  <input
                    type="text"
                    value={wordChainEnd}
                    onChange={(e) => setWordChainEnd(e.target.value)}
                    placeholder="Ex: VOITURE"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 uppercase"
                  />
                </div>

                <button
                  onClick={handleCreateWordChain}
                  disabled={!wordChainStart.trim() || !wordChainEnd.trim()}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  🔗 Créer la chaîne
                </button>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                💡 Les joueurs doivent relier les mots par associations sémantiques. Jeu personnel (non collaboratif).
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Alchimie */}
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            ⚙️ Configuration Alchimie des Éléments
          </h2>
          
          <p className="text-gray-600 mb-4">
            Chaque découverte rapporte des points de base. Certains éléments spéciaux donnent un bonus supplémentaire !
          </p>

          {/* Points de base */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <label className="block font-bold text-gray-800 mb-2">
              Points de base par découverte :
            </label>
            <input
              type="number"
              value={craftBasePoints}
              onChange={(e) => setCraftBasePoints(parseInt(e.target.value))}
              className="w-32 px-4 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500 text-lg font-bold"
            />
            <p className="text-sm text-gray-600 mt-2">
              💡 Chaque nouvelle découverte donne ce nombre de points
            </p>
          </div>

          {/* Bonus spéciaux */}
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 mb-3">Bonus sur éléments spéciaux :</h3>
            <div className="space-y-2">
              {craftBonusElements.map((bonus, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ID (ex: mariage)"
                    value={bonus.id}
                    onChange={(e) => handleCraftBonusChange(index, 'id', e.target.value)}
                    className="w-40 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Nom (ex: MARIAGE 💒)"
                    value={bonus.name}
                    onChange={(e) => handleCraftBonusChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">+</span>
                    <input
                      type="number"
                      placeholder="Bonus"
                      value={bonus.bonus}
                      onChange={(e) => handleCraftBonusChange(index, 'bonus', parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-sm text-gray-600">pts</span>
                  </div>
                  <button
                    onClick={() => handleRemoveCraftBonus(index)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddCraftBonus}
              className="flex-1 py-2 px-4 bg-purple-100 text-purple-800 rounded-lg font-bold hover:bg-purple-200 transition-all"
            >
              + Ajouter un bonus
            </button>
            <button
              onClick={handleSaveCraftConfig}
              className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all"
            >
              💾 Sauvegarder la configuration
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-3">
            💡 IDs disponibles : mariage, alliance, couple, amour, famille, mariee, bouquet, fete, reception, piece-montee, champagne, ceremonie, diamant
          </p>
        </div>

        {/* Classement */}
        <Leaderboard />
      </div>
    </div>
  );
};

export default Admin;
