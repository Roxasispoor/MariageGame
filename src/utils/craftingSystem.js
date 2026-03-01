// Jeu de combinaison d'éléments (style Infinite Craft)
// Version avec recettes prédéfinies

export const startingElements = [
  { id: 'feu', name: 'FEU', emoji: '🔥', discovered: true, level: 0 },
  { id: 'eau', name: 'EAU', emoji: '💧', discovered: true, level: 0 },
  { id: 'terre', name: 'TERRE', emoji: '🌍', discovered: true, level: 0 },
  { id: 'air', name: 'AIR', emoji: '💨', discovered: true, level: 0 },
];

// Recettes de combinaisons prédéfinies avec niveaux
export const recipes = {
  // === NIVEAU 1 - Combinaisons de base ===
  'feu+eau': { id: 'vapeur', name: 'VAPEUR', emoji: '💨', level: 1 },
  'eau+feu': { id: 'vapeur', name: 'VAPEUR', emoji: '💨', level: 1 },
  
  'feu+terre': { id: 'lave', name: 'LAVE', emoji: '🌋', level: 1 },
  'terre+feu': { id: 'lave', name: 'LAVE', emoji: '🌋', level: 1 },
  
  'feu+air': { id: 'fumee', name: 'FUMÉE', emoji: '🌫️', level: 1 },
  'air+feu': { id: 'fumee', name: 'FUMÉE', emoji: '🌫️', level: 1 },
  
  'eau+terre': { id: 'boue', name: 'BOUE', emoji: '🟫', level: 1 },
  'terre+eau': { id: 'boue', name: 'BOUE', emoji: '🟫', level: 1 },
  
  'eau+air': { id: 'pluie', name: 'PLUIE', emoji: '🌧️', level: 1 },
  'air+eau': { id: 'pluie', name: 'PLUIE', emoji: '🌧️', level: 1 },
  
  'terre+air': { id: 'poussiere', name: 'POUSSIÈRE', emoji: '🌪️', level: 1 },
  'air+terre': { id: 'poussiere', name: 'POUSSIÈRE', emoji: '🌪️', level: 1 },
  
  'feu+feu': { id: 'energie', name: 'ÉNERGIE', emoji: '⚡', level: 1 },
  'eau+eau': { id: 'lac', name: 'LAC', emoji: '🏞️', level: 1 },
  'air+air': { id: 'vent', name: 'VENT', emoji: '🌬️', level: 1 },
  'terre+terre': { id: 'roche', name: 'ROCHE', emoji: '🪨', level: 1 },
  
  // === NIVEAU 2 - Éléments naturels ===
  'lave+eau': { id: 'pierre', name: 'PIERRE', emoji: '🪨', level: 2 },
  'eau+lave': { id: 'pierre', name: 'PIERRE', emoji: '🪨', level: 2 },
  
  'pluie+terre': { id: 'plante', name: 'PLANTE', emoji: '🌱', level: 2 },
  'terre+pluie': { id: 'plante', name: 'PLANTE', emoji: '🌱', level: 2 },
  
  'pierre+pierre': { id: 'montagne', name: 'MONTAGNE', emoji: '⛰️', level: 2 },
  'roche+roche': { id: 'montagne', name: 'MONTAGNE', emoji: '⛰️', level: 2 },
  
  'lac+lac': { id: 'ocean', name: 'OCÉAN', emoji: '🌊', level: 2 },
  'vent+vent': { id: 'tornade', name: 'TORNADE', emoji: '🌪️', level: 2 },
  
  'energie+air': { id: 'lumiere', name: 'LUMIÈRE', emoji: '💡', level: 2 },
  'air+energie': { id: 'lumiere', name: 'LUMIÈRE', emoji: '💡', level: 2 },
  
  'boue+feu': { id: 'brique', name: 'BRIQUE', emoji: '🧱', level: 2 },
  'feu+boue': { id: 'brique', name: 'BRIQUE', emoji: '🧱', level: 2 },
  
  // === NIVEAU 3 - Vie et plantes ===
  'plante+terre': { id: 'arbre', name: 'ARBRE', emoji: '🌳', level: 3 },
  'terre+plante': { id: 'arbre', name: 'ARBRE', emoji: '🌳', level: 3 },
  
  'plante+lumiere': { id: 'fleur', name: 'FLEUR', emoji: '🌸', level: 3 },
  'lumiere+plante': { id: 'fleur', name: 'FLEUR', emoji: '🌸', level: 3 },
  
  'arbre+arbre': { id: 'foret', name: 'FORÊT', emoji: '🌲', level: 3 },
  
  'plante+eau': { id: 'vie', name: 'VIE', emoji: '✨', level: 3 },
  'eau+plante': { id: 'vie', name: 'VIE', emoji: '✨', level: 3 },
  
  'arbre+feu': { id: 'bois', name: 'BOIS', emoji: '🪵', level: 3 },
  'feu+arbre': { id: 'bois', name: 'BOIS', emoji: '🪵', level: 3 },
  
  'fleur+fleur': { id: 'bouquet', name: 'BOUQUET', emoji: '💐', level: 3 },
  
  // === NIVEAU 4 - Animaux et humains ===
  'vie+eau': { id: 'poisson', name: 'POISSON', emoji: '🐟', level: 4 },
  'eau+vie': { id: 'poisson', name: 'POISSON', emoji: '🐟', level: 4 },
  
  'vie+terre': { id: 'animal', name: 'ANIMAL', emoji: '🐾', level: 4 },
  'terre+vie': { id: 'animal', name: 'ANIMAL', emoji: '🐾', level: 4 },
  
  'vie+air': { id: 'oiseau', name: 'OISEAU', emoji: '🐦', level: 4 },
  'air+vie': { id: 'oiseau', name: 'OISEAU', emoji: '🐦', level: 4 },
  
  'vie+lumiere': { id: 'humain', name: 'HUMAIN', emoji: '🧍', level: 4 },
  'lumiere+vie': { id: 'humain', name: 'HUMAIN', emoji: '🧍', level: 4 },
  
  'animal+bois': { id: 'chat', name: 'CHAT', emoji: '🐱', level: 4 },
  'animal+humain': { id: 'chien', name: 'CHIEN', emoji: '🐶', level: 4 },
  
  // === NIVEAU 5 - Nourriture ===
  'plante+terre': { id: 'ble', name: 'BLÉ', emoji: '🌾', level: 5 },
  'ble+feu': { id: 'pain', name: 'PAIN', emoji: '🍞', level: 5 },
  'feu+ble': { id: 'pain', name: 'PAIN', emoji: '🍞', level: 5 },
  
  'plante+eau': { id: 'fruit', name: 'FRUIT', emoji: '🍎', level: 5 },
  'eau+plante': { id: 'fruit', name: 'FRUIT', emoji: '🍎', level: 5 },
  
  'animal+feu': { id: 'viande', name: 'VIANDE', emoji: '🍖', level: 5 },
  'feu+animal': { id: 'viande', name: 'VIANDE', emoji: '🍖', level: 5 },
  
  'eau+fruit': { id: 'jus', name: 'JUS', emoji: '🧃', level: 5 },
  'fruit+eau': { id: 'jus', name: 'JUS', emoji: '🧃', level: 5 },
  
  'pain+feu': { id: 'gateau', name: 'GÂTEAU', emoji: '🎂', level: 5 },
  'feu+pain': { id: 'gateau', name: 'GÂTEAU', emoji: '🎂', level: 5 },
  
  'fruit+feu': { id: 'confiture', name: 'CONFITURE', emoji: '🍯', level: 5 },
  'jus+energie': { id: 'vin', name: 'VIN', emoji: '🍷', level: 5 },
  'vin+air': { id: 'champagne', name: 'CHAMPAGNE', emoji: '🍾', level: 5 },
  
  // === NIVEAU 6 - Constructions ===
  'brique+brique': { id: 'mur', name: 'MUR', emoji: '🧱', level: 6 },
  'pierre+pierre': { id: 'mur', name: 'MUR', emoji: '🧱', level: 6 },
  
  'mur+mur': { id: 'maison', name: 'MAISON', emoji: '🏠', level: 6 },
  'bois+bois': { id: 'maison', name: 'MAISON', emoji: '🏠', level: 6 },
  
  'maison+maison': { id: 'ville', name: 'VILLE', emoji: '🏙️', level: 6 },
  
  'maison+lumiere': { id: 'eglise', name: 'ÉGLISE', emoji: '⛪', level: 6 },
  'lumiere+maison': { id: 'eglise', name: 'ÉGLISE', emoji: '⛪', level: 6 },
  
  // === NIVEAU 7 - Émotions ===
  'humain+humain': { id: 'amour', name: 'AMOUR', emoji: '❤️', level: 7 },
  
  'amour+lumiere': { id: 'joie', name: 'JOIE', emoji: '😊', level: 7 },
  'lumiere+amour': { id: 'joie', name: 'JOIE', emoji: '😊', level: 7 },
  
  'humain+energie': { id: 'musique', name: 'MUSIQUE', emoji: '🎵', level: 7 },
  'energie+humain': { id: 'musique', name: 'MUSIQUE', emoji: '🎵', level: 7 },
  
  'musique+joie': { id: 'danse', name: 'DANSE', emoji: '💃', level: 7 },
  'joie+musique': { id: 'danse', name: 'DANSE', emoji: '💃', level: 7 },
  
  'humain+humain': { id: 'famille', name: 'FAMILLE', emoji: '👨‍👩‍👧', level: 7 },
  
  // === NIVEAU 8 - Mariage (Objectif final) ===
  'pierre+lumiere': { id: 'diamant', name: 'DIAMANT', emoji: '💎', level: 8 },
  'lumiere+pierre': { id: 'diamant', name: 'DIAMANT', emoji: '💎', level: 8 },
  
  'diamant+amour': { id: 'alliance', name: 'ALLIANCE', emoji: '💍', level: 8 },
  'amour+diamant': { id: 'alliance', name: 'ALLIANCE', emoji: '💍', level: 8 },
  
  'humain+amour': { id: 'couple', name: 'COUPLE', emoji: '💑', level: 8 },
  'amour+humain': { id: 'couple', name: 'COUPLE', emoji: '💑', level: 8 },
  
  'bouquet+humain': { id: 'mariee', name: 'MARIÉE', emoji: '👰', level: 8 },
  'humain+bouquet': { id: 'mariee', name: 'MARIÉE', emoji: '👰', level: 8 },
  
  'alliance+eglise': { id: 'ceremonie', name: 'CÉRÉMONIE', emoji: '💒', level: 8 },
  'eglise+alliance': { id: 'ceremonie', name: 'CÉRÉMONIE', emoji: '💒', level: 8 },
  
  'couple+alliance': { id: 'mariage', name: 'MARIAGE', emoji: '💒', level: 8 },
  'alliance+couple': { id: 'mariage', name: 'MARIAGE', emoji: '💒', level: 8 },
  
  'ceremonie+couple': { id: 'mariage', name: 'MARIAGE', emoji: '💒', level: 8 },
  'couple+ceremonie': { id: 'mariage', name: 'MARIAGE', emoji: '💒', level: 8 },
  
  'mariage+danse': { id: 'fete', name: 'FÊTE', emoji: '🎉', level: 8 },
  'danse+mariage': { id: 'fete', name: 'FÊTE', emoji: '🎉', level: 8 },
  
  'mariage+gateau': { id: 'piece-montee', name: 'PIÈCE MONTÉE', emoji: '🎂', level: 8 },
  'gateau+mariage': { id: 'piece-montee', name: 'PIÈCE MONTÉE', emoji: '🎂', level: 8 },
  
  'fete+champagne': { id: 'reception', name: 'RÉCEPTION', emoji: '🎊', level: 8 },
  'champagne+fete': { id: 'reception', name: 'RÉCEPTION', emoji: '🎊', level: 8 },
  
  // === RECETTES SUPPLÉMENTAIRES ===
  
  // Niveau 1 - Plus de combinaisons de base
  'feu+energie': { id: 'explosion', name: 'EXPLOSION', emoji: '💥', level: 1 },
  'energie+feu': { id: 'explosion', name: 'EXPLOSION', emoji: '💥', level: 1 },
  
  'eau+vent': { id: 'vague', name: 'VAGUE', emoji: '🌊', level: 1 },
  'vent+eau': { id: 'vague', name: 'VAGUE', emoji: '🌊', level: 1 },
  
  'terre+roche': { id: 'sable', name: 'SABLE', emoji: '🏖️', level: 1 },
  'roche+terre': { id: 'sable', name: 'SABLE', emoji: '🏖️', level: 1 },
  
  // Niveau 2 - Nature étendue
  'sable+eau': { id: 'plage', name: 'PLAGE', emoji: '🏖️', level: 2 },
  'eau+sable': { id: 'plage', name: 'PLAGE', emoji: '🏖️', level: 2 },
  
  'pierre+feu': { id: 'metal', name: 'MÉTAL', emoji: '⚙️', level: 2 },
  'feu+pierre': { id: 'metal', name: 'MÉTAL', emoji: '⚙️', level: 2 },
  
  'lac+montagne': { id: 'cascade', name: 'CASCADE', emoji: '💦', level: 2 },
  'montagne+lac': { id: 'cascade', name: 'CASCADE', emoji: '💦', level: 2 },
  
  'vent+sable': { id: 'desert', name: 'DÉSERT', emoji: '🏜️', level: 2 },
  'sable+vent': { id: 'desert', name: 'DÉSERT', emoji: '🏜️', level: 2 },
  
  'ocean+lumiere': { id: 'aurore', name: 'AURORE', emoji: '🌅', level: 2 },
  'lumiere+ocean': { id: 'aurore', name: 'AURORE', emoji: '🌅', level: 2 },
  
  // Niveau 3 - Plus de vie
  'arbre+lumiere': { id: 'fruit', name: 'FRUIT', emoji: '🍎', level: 3 },
  
  'plante+plante': { id: 'jardin', name: 'JARDIN', emoji: '🏡', level: 3 },
  
  'fleur+vent': { id: 'pollen', name: 'POLLEN', emoji: '🌼', level: 3 },
  'vent+fleur': { id: 'pollen', name: 'POLLEN', emoji: '🌼', level: 3 },
  
  'arbre+metal': { id: 'outil', name: 'OUTIL', emoji: '🔨', level: 3 },
  'metal+arbre': { id: 'outil', name: 'OUTIL', emoji: '🔨', level: 3 },
  
  'vie+ocean': { id: 'algue', name: 'ALGUE', emoji: '🌿', level: 3 },
  'ocean+vie': { id: 'algue', name: 'ALGUE', emoji: '🌿', level: 3 },
  
  // Niveau 4 - Animaux étendus
  'poisson+poisson': { id: 'banc', name: 'BANC DE POISSONS', emoji: '🐠', level: 4 },
  
  'oiseau+arbre': { id: 'nid', name: 'NID', emoji: '🪺', level: 4 },
  'arbre+oiseau': { id: 'nid', name: 'NID', emoji: '🪺', level: 4 },
  
  'humain+ocean': { id: 'navigateur', name: 'NAVIGATEUR', emoji: '⛵', level: 4 },
  'ocean+humain': { id: 'navigateur', name: 'NAVIGATEUR', emoji: '⛵', level: 4 },
  
  'humain+montagne': { id: 'alpiniste', name: 'ALPINISTE', emoji: '🧗', level: 4 },
  'montagne+humain': { id: 'alpiniste', name: 'ALPINISTE', emoji: '🧗', level: 4 },
  
  'humain+arbre': { id: 'bucheron', name: 'BÛCHERON', emoji: '🪓', level: 4 },
  'arbre+humain': { id: 'bucheron', name: 'BÛCHERON', emoji: '🪓', level: 4 },
  
  'humain+terre': { id: 'fermier', name: 'FERMIER', emoji: '👨‍🌾', level: 4 },
  'terre+humain': { id: 'fermier', name: 'FERMIER', emoji: '👨‍🌾', level: 4 },
  
  'animal+humain': { id: 'eleveur', name: 'ÉLEVEUR', emoji: '👨‍🌾', level: 4 },
  'humain+animal': { id: 'eleveur', name: 'ÉLEVEUR', emoji: '👨‍🌾', level: 4 },
  
  // Niveau 5 - Nourriture étendue
  'fruit+fruit': { id: 'salade', name: 'SALADE DE FRUITS', emoji: '🥗', level: 5 },
  
  'pain+animal': { id: 'sandwich', name: 'SANDWICH', emoji: '🥪', level: 5 },
  'animal+pain': { id: 'sandwich', name: 'SANDWICH', emoji: '🥪', level: 5 },
  
  'eau+feu': { id: 'bouillon', name: 'BOUILLON', emoji: '🍲', level: 5 },
  
  'fruit+glace': { id: 'sorbet', name: 'SORBET', emoji: '🍧', level: 5 },
  
  'ble+eau': { id: 'farine', name: 'FARINE', emoji: '🌾', level: 5 },
  'eau+ble': { id: 'farine', name: 'FARINE', emoji: '🌾', level: 5 },
  
  'farine+eau': { id: 'pate', name: 'PÂTE', emoji: '🥖', level: 5 },
  'eau+farine': { id: 'pate', name: 'PÂTE', emoji: '🥖', level: 5 },
  
  'pate+feu': { id: 'biscuit', name: 'BISCUIT', emoji: '🍪', level: 5 },
  'feu+pate': { id: 'biscuit', name: 'BISCUIT', emoji: '🍪', level: 5 },
  
  'fruit+sucre': { id: 'tarte', name: 'TARTE', emoji: '🥧', level: 5 },
  'sucre+fruit': { id: 'tarte', name: 'TARTE', emoji: '🥧', level: 5 },
  
  'lait+feu': { id: 'fromage', name: 'FROMAGE', emoji: '🧀', level: 5 },
  'feu+lait': { id: 'fromage', name: 'FROMAGE', emoji: '🧀', level: 5 },
  
  // Niveau 6 - Construction étendue
  'metal+metal': { id: 'machine', name: 'MACHINE', emoji: '⚙️', level: 6 },
  
  'bois+metal': { id: 'meuble', name: 'MEUBLE', emoji: '🪑', level: 6 },
  'metal+bois': { id: 'meuble', name: 'MEUBLE', emoji: '🪑', level: 6 },
  
  'maison+jardin': { id: 'villa', name: 'VILLA', emoji: '🏡', level: 6 },
  'jardin+maison': { id: 'villa', name: 'VILLA', emoji: '🏡', level: 6 },
  
  'ville+lumiere': { id: 'nuit-urbaine', name: 'NUIT URBAINE', emoji: '🌃', level: 6 },
  'lumiere+ville': { id: 'nuit-urbaine', name: 'NUIT URBAINE', emoji: '🌃', level: 6 },
  
  'maison+metal': { id: 'coffre', name: 'COFFRE', emoji: '🔒', level: 6 },
  'metal+maison': { id: 'coffre', name: 'COFFRE', emoji: '🔒', level: 6 },
  
  'eglise+humain': { id: 'pretre', name: 'PRÊTRE', emoji: '⛪', level: 6 },
  'humain+eglise': { id: 'pretre', name: 'PRÊTRE', emoji: '⛪', level: 6 },
  
  // Niveau 7 - Émotions étendues
  'humain+musique': { id: 'chanteur', name: 'CHANTEUR', emoji: '🎤', level: 7 },
  'musique+humain': { id: 'chanteur', name: 'CHANTEUR', emoji: '🎤', level: 7 },
  
  'joie+joie': { id: 'euphorie', name: 'EUPHORIE', emoji: '🤩', level: 7 },
  
  'amour+fleur': { id: 'romantisme', name: 'ROMANTISME', emoji: '🌹', level: 7 },
  'fleur+amour': { id: 'romantisme', name: 'ROMANTISME', emoji: '🌹', level: 7 },
  
  'danse+danse': { id: 'bal', name: 'BAL', emoji: '💃', level: 7 },
  
  'famille+maison': { id: 'foyer', name: 'FOYER', emoji: '🏠', level: 7 },
  'maison+famille': { id: 'foyer', name: 'FOYER', emoji: '🏠', level: 7 },
  
  'humain+animal': { id: 'amitie', name: 'AMITIÉ', emoji: '🤝', level: 7 },
  
  'musique+emotion': { id: 'art', name: 'ART', emoji: '🎨', level: 7 },
  'emotion+musique': { id: 'art', name: 'ART', emoji: '🎨', level: 7 },
  
  // Niveau 8 - Mariage étendu
  'couple+maison': { id: 'nid-amour', name: 'NID D\'AMOUR', emoji: '🏡', level: 8 },
  'maison+couple': { id: 'nid-amour', name: 'NID D\'AMOUR', emoji: '🏡', level: 8 },
  
  'alliance+lumiere': { id: 'eclat', name: 'ÉCLAT', emoji: '✨', level: 8 },
  'lumiere+alliance': { id: 'eclat', name: 'ÉCLAT', emoji: '✨', level: 8 },
  
  'couple+voyage': { id: 'lune-de-miel', name: 'LUNE DE MIEL', emoji: '🌙', level: 8 },
  'voyage+couple': { id: 'lune-de-miel', name: 'LUNE DE MIEL', emoji: '🌙', level: 8 },
  
  'mariee+fleur': { id: 'voile', name: 'VOILE', emoji: '👰', level: 8 },
  'fleur+mariee': { id: 'voile', name: 'VOILE', emoji: '👰', level: 8 },
  
  'mariage+famille': { id: 'lignee', name: 'LIGNÉE', emoji: '👨‍👩‍👧‍👦', level: 8 },
  'famille+mariage': { id: 'lignee', name: 'LIGNÉE', emoji: '👨‍👩‍👧‍👦', level: 8 },
  
  'reception+musique': { id: 'soiree', name: 'SOIRÉE', emoji: '🎊', level: 8 },
  'musique+reception': { id: 'soiree', name: 'SOIRÉE', emoji: '🎊', level: 8 },
  
  'mariage+photo': { id: 'souvenir', name: 'SOUVENIR', emoji: '📸', level: 8 },
  'photo+mariage': { id: 'souvenir', name: 'SOUVENIR', emoji: '📸', level: 8 },
  
  'couple+temps': { id: 'eternite', name: 'ÉTERNITÉ', emoji: '♾️', level: 8 },
  'temps+couple': { id: 'eternite', name: 'ÉTERNITÉ', emoji: '♾️', level: 8 },
};

// Fonction pour trouver une combinaison
export const combineElements = (element1Id, element2Id) => {
  const key1 = `${element1Id}+${element2Id}`;
  const key2 = `${element2Id}+${element1Id}`;
  
  const result = recipes[key1] || recipes[key2];
  
  if (result) {
    return {
      success: true,
      result: result
    };
  }
  
  return {
    success: false,
    result: null
  };
};

// Compter les éléments par niveau
export const getProgressByLevel = (discoveredElements) => {
  const progress = {};
  
  // Compter les recettes totales par niveau (éléments uniques)
  const totalByLevel = {};
  const uniqueElements = new Set();
  
  // Ajouter les éléments de départ
  startingElements.forEach(elem => {
    uniqueElements.add(`${elem.level}-${elem.id}`);
  });
  
  // Ajouter tous les résultats de recettes
  Object.values(recipes).forEach(recipe => {
    uniqueElements.add(`${recipe.level}-${recipe.id}`);
  });
  
  // Grouper par niveau
  uniqueElements.forEach(elem => {
    const [level] = elem.split('-');
    if (!totalByLevel[level]) {
      totalByLevel[level] = 0;
    }
    totalByLevel[level]++;
  });
  
  // Compter les découvertes par niveau
  const discoveredByLevel = {};
  discoveredElements.forEach(elem => {
    const level = elem.level || 0;
    discoveredByLevel[level] = (discoveredByLevel[level] || 0) + 1;
  });
  
  // Créer l'objet de progression
  for (let level = 0; level <= 8; level++) {
    progress[level] = {
      discovered: discoveredByLevel[level] || 0,
      total: totalByLevel[level] || 0
    };
  }
  
  return progress;
};

// Compter combien de recettes utilisent chaque élément
export const countRecipesForElement = (elementId) => {
  let count = 0;
  Object.keys(recipes).forEach(key => {
    const [elem1, elem2] = key.split('+');
    if (elem1 === elementId || elem2 === elementId) {
      count++;
    }
  });
  // Diviser par 2 car chaque recette est en double (A+B et B+A)
  return Math.ceil(count / 2);
};

// Compter combien de nouvelles recettes on peut faire avec cet élément
export const countAvailableRecipes = (elementId, discoveredElements) => {
  const discoveredIds = new Set(discoveredElements.map(e => e.id));
  let count = 0;
  
  Object.entries(recipes).forEach(([key, result]) => {
    const [elem1, elem2] = key.split('+');
    
    // Si un des éléments est celui qu'on cherche
    if (elem1 === elementId || elem2 === elementId) {
      const otherElement = elem1 === elementId ? elem2 : elem1;
      
      // Si l'autre élément est découvert ET le résultat n'est pas encore découvert
      if (discoveredIds.has(otherElement) && !discoveredIds.has(result.id)) {
        count++;
      }
    }
  });
  
  // Diviser par 2 car chaque recette est en double (A+B et B+A)
  return Math.ceil(count / 2);
};

// Choisir un élément aléatoire qui a des recettes disponibles
export const pickRandomHint = (discoveredElements) => {
  const elementsWithRecipes = discoveredElements.filter(elem => 
    countAvailableRecipes(elem.id, discoveredElements) > 0
  );
  
  if (elementsWithRecipes.length === 0) return null;
  
  // Choisir un élément aléatoire
  const randomIndex = Math.floor(Math.random() * elementsWithRecipes.length);
  return elementsWithRecipes[randomIndex].id;
};

