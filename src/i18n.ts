// Internationalisation FR/EN. Module pur (aucune dépendance DOM) : la
// simulation peut l'utiliser sans violer la séparation sim/ui.

export type Lang = "fr" | "en";

const fr = {
  // Barre du haut
  pause: "⏸ Pause",
  resume: "▶ Reprendre",
  pauseTip: "Pause (Espace)",
  speedTip: "Vitesse (1/2/4)",
  rotLeftTip: "Rotation caméra antihoraire",
  rotRightTip: "Rotation caméra horaire (R)",
  debugTip: "Menu de debug",
  langTip: "Switch to English",
  newGame: "Nouvelle partie",
  newGameTip: "Recommencer à zéro",
  shareBtn: "Partager",
  shareTip: "Copier un lien de partage de la carte",
  helpBtn: "Aide",
  helpBtnTip: "Afficher le panneau d'aide",
  optionsBtn: "⚙ Options",
  optionsBtnTip: "Paramètres du jeu",
  optionsHelp: "Aide",
  optionsDebug: "Debug",
  optionsLanguage: "Langue : {v}",
  optionsMusic: "Musique : {v}",
  optionsAudio: "Effets sonores : {v}",
  optionsOn: "ON",
  optionsOff: "OFF",
  statScore: "Score {n}",
  statBest: "Record {n}",
  statPayout: "Subvention +{a} dans {s}s",
  statDistance: "Distance : {v}",
  statPackages: "Colis récupérés : {n}",
  statDuration: "Durée : {v}",

  // Barre d'outils
  toolRoad: "🛣 Route",
  toolRoadTip: "Construire une route (A)",
  toolRamp: "⛰ Rampe",
  toolRampTip: "Construire une rampe (Z)",
  toolBulldoze: "🚜 Démolir",
  toolBulldozeTip: "Démolir et rembourser (X)",
  levelDownTip: "Niveau plus bas (Q / molette)",
  levelUpTip: "Niveau plus haut (E / molette)",
  level: "Niv. {n}",
  rampDir: "Rampe : {d} {a}",
  rampDirTip: "Direction de la rampe (T)",
  dir0: "Est",
  dir1: "Sud",
  dir2: "Ouest",
  dir3: "Nord",
  ready: "Prêt.",

  // Aide
  help:
    "<b>Connectez maisons et entreprises de même couleur.</b><br>" +
    "Clic gauche : construire / démolir<br>" +
    "Clic droit : déplacer la caméra<br>" +
    "Mobile : deux doigts pour déplacer la caméra<br>" +
    "Molette / Q / E : niveau de hauteur<br>" +
    "R : rotation &nbsp;·&nbsp; T : sens de rampe<br>" +
    "Espace : pause &nbsp;·&nbsp; 1 / 2 / 4 : vitesse<br>" +
    "Double-clic (route) : axe prioritaire d'un croisement en X<br>" +
    "Croisement : écart de 2 niveaux requis.<br>" +
    "Rivière : pont au niveau 1 minimum.",
  closeHelpTip: "Masquer le panneau d'aide",

  // Menu de debug
  debugHouse: "🏠 House",
  debugHouseTip: "Ajoute une maison de la couleur choisie",
  debugBiz: "🏢 Business",
  debugBizTip: "Ajoute une entreprise de la couleur choisie",
  debugBike: "🚲 Bike",
  debugBikeTip: "Fait partir un vélo entre deux maisons",
  debugMoney: "💰 Money",
  debugMoneyTip: "Ajoute {n} ¤ de crédits",
  debugPurge: "📦 Clean",
  debugPurgeTip: "Vide toutes les commandes en attente et le danger",
  debugTraffic: "🚘 Clean",
  debugTrafficTip: "Détruit tous les véhicules en circulation",
  debugStatsTitle: "STATS",
  colorTip: "Couleur {n}",

  // Sidebar debug : personnalisation de la Config
  cfgTitle: "CONFIG",
  cfgResetAll: "RESET ALL",
  cfgResetAllTip: "Rétablir tous les paramètres par défaut",
  cfgRstTip: "Revenir à la valeur par défaut : {v}",
  cfgNoteNewGame: "⚠ Prend effet à la prochaine nouvelle partie.",
  cfgNoteReload: "⚠ Nécessite un rechargement de la page.",
  cfgSecGrid: "Grille & rendu",
  cfgSecEco: "Économie",
  cfgSecOrders: "Commandes & danger",
  cfgSecCars: "Voitures & circulation",
  cfgSecBikes: "Vélos",
  cfgSecSpawn: "Apparition des bâtiments",
  cfgSecAnim: "Animations",
  cfgSecHoods: "Quartiers",
  cfgSecRiver: "Rivière",
  cfgSecTrees: "Arbres",
  cfgSecMisc: "Divers",
  cfg_GRID: "Taille de la carte (GRID × GRID cases).",
  cfg_TILE_W: "Largeur d'un losange isométrique en pixels (basse résolution).",
  cfg_TILE_H: "Hauteur d'un losange isométrique en pixels.",
  cfg_Z_STEP: "Décalage vertical en pixels par niveau de hauteur.",
  cfg_MAX_LEVEL: "Niveau de hauteur maximum des routes.",
  cfg_RENDER_SCALE: "Facteur d'upscale pixelisé du canvas (plus grand = pixels plus gros).",
  cfg_EARTH_DEPTH: "Hauteur en pixels des faces de terre des blocs de bord.",
  cfg_WATERFALL_BLOCKS: "Longueur du fondu des cascades, en blocs de terre.",
  cfg_START_CREDITS: "Crédits au début d'une partie.",
  cfg_COST_ROAD: "Coût d'une route au sol.",
  cfg_COST_RAMP: "Coût de base d'une rampe.",
  cfg_COST_PER_LEVEL: "Surcoût par niveau d'élévation.",
  cfg_PAYOUT_INTERVAL: "Secondes entre deux subventions municipales.",
  cfg_PAYOUT_AMOUNT: "Montant de la subvention municipale (¤).",
  cfg_DELIVERY_CREDITS: "Crédits gagnés par livraison.",
  cfg_DELIVERY_SCORE: "Points de score par livraison.",
  cfg_ORDER_INTERVAL: "Secondes entre deux commandes d'une entreprise (base).",
  cfg_ORDER_MIN_FACTOR: "Facteur minimum de l'intervalle de commandes (difficulté max).",
  cfg_DIFFICULTY_RAMP_TIME: "Temps (s) pour atteindre la difficulté maximale.",
  cfg_DANGER_THRESHOLD: "Commandes en attente avant que la jauge de danger ne monte.",
  cfg_DANGER_FILL_TIME: "Secondes pour que la jauge de danger atteigne 100 %.",
  cfg_DANGER_DECAY_TIME: "Secondes pour que la jauge redescende de 100 % à 0.",
  cfg_MAX_ORDER_PIPS: "Nombre maximum de pastilles de commandes affichées.",
  cfg_CAR_SPEED: "Vitesse des voitures (cases par seconde).",
  cfg_CARS_PER_HOUSE: "Nombre maximum de voitures par maison.",
  cfg_DISPATCH_INTERVAL: "Fréquence (s) d'affectation des livraisons.",
  cfg_LANE_OFFSET: "Décalage latéral des véhicules (conduite à droite), en cases.",
  cfg_YIELD_STOP_TIME: "Arrêt obligatoire (s) au cédez-le-passage avant une intersection.",
  cfg_YIELD_DEADLOCK_TIME:
    "Délai (s) de blocage avant d'ignorer la priorité à droite (anti-interblocage).",
  cfg_BIKE_SPEED_FACTOR: "Vitesse des vélos, en fraction de celle des voitures.",
  cfg_BIKE_INTERVAL: "Secondes entre deux départs de vélo.",
  cfg_BIKE_MAX: "Nombre maximum de vélos simultanés.",
  cfg_SPAWN_INTERVAL_START: "Intervalle initial (s) entre deux apparitions de bâtiments.",
  cfg_SPAWN_INTERVAL_MIN: "Intervalle minimum (s) entre deux apparitions de bâtiments.",
  cfg_SPAWN_ACCEL_TIME: "Temps (s) pour atteindre l'intervalle d'apparition minimum.",
  cfg_UNLOCK_EVERY: "Nombre d'apparitions avant de débloquer une nouvelle couleur.",
  cfg_HOUSE_SURPLUS: "Maisons d'avance requises (par couleur) avant une entreprise.",
  cfg_BIZ_FALL_HEIGHT: "Hauteur de départ de la chute d'une entreprise (en niveaux).",
  cfg_BIZ_FALL_SPEED: "Vitesse de chute des entreprises (niveaux par seconde).",
  cfg_IMPACT_RING_TIME: "Durée (s) de l'onde de choc au sol.",
  cfg_IMPACT_RING_RADIUS: "Rayon final de l'onde de choc (cases).",
  cfg_HOOD_JOIN_CHANCE: "Probabilité qu'une maison rejoigne un quartier existant.",
  cfg_HOOD_JOIN_DIST: "Distance Manhattan max (blocs) à une maison de même couleur.",
  cfg_HOOD_NEW_DIST: "Distance Manhattan min stricte pour fonder un nouveau quartier.",
  cfg_ROAD_SPOT_CHANCE:
    "Probabilité de privilégier un spawn collé à une route plate niveau 0.",
  cfg_RIVER_BRIDGE_LEVEL: "Niveau minimum d'une route au-dessus de l'eau (pont).",
  cfg_RIVER_MAX_OFFSET: "Écart max (cases) du lit de la rivière par rapport au centre.",
  cfg_RIVER_WANDER: "Probabilité que la rivière fasse un coude à chaque rangée.",
  cfg_WATER_ANIM_FPS: "Images par seconde de l'animation des reflets d'eau.",
  cfg_TREE_DENSITY: "Probabilité d'arbre par case d'herbe à la génération.",
  cfg_AUTOSAVE_INTERVAL: "Secondes entre deux sauvegardes automatiques.",
  cfg_DEBUG_CREDITS: "Crédits ajoutés par le bouton 💰 du menu debug.",

  // Écran de fin
  overTitle: "GAME OVER",
  overText: "Une entreprise a croulé sous les commandes.",
  overScore: "Score final : {n}",
  overBest: "Meilleur score : {n}",
  replay: "Rejouer",
  replayTip: "Nouvelle partie",
  starGithub: "⭐ Star sur GitHub",
  starGithubTip: "Ouvrir le dépôt sur GitHub",
  shareX: "Partager sur X",
  shareXTip: "Publier votre score sur X",
  shareBluesky: "Partager sur Bluesky",
  shareBlueskyTip: "Publier votre score sur Bluesky",
  shareScore:
    "Battez mon score de {n} sur TinyTrafficTown, un petit jeu codé en une heure par #Claude #Fable 5. {url}",

  // Écran d'accueil
  onboardTitle: "TINY TRAFFIC TOWN",
  onboardText:
    "Construisez des routes pour relier les maisons aux entreprises de même " +
    "couleur. Livrez les commandes avant que la jauge de danger ne déborde !",
  onboardDevice: "Le jeu est plus confortable sur un écran d'ordinateur ou une tablette.",
  closeOnboardingTip: "Masquer cette fenêtre d'aide",
  closeDebugTip: "Fermer le menu de debug",
  startPlaying: "▶ Jouer",
  startPlayingTip: "Fermer cette fenêtre et commencer à jouer",

  // Modal de confirmation
  confirmNewGameTitle: "Nouvelle partie ?",
  confirmNewGameText: "Vous allez perdre votre progression actuelle.",
  cancel: "Annuler",
  newGameConfirm: "Nouvelle partie",

  // Messages de jeu
  msgWelcome: "Bienvenue ! Reliez les maisons aux entreprises de même couleur.",
  msgRestored: "Partie précédente restaurée.",
  msgNewGame: "Nouvelle partie !",
  msgPayout: "Subvention municipale : +{a} ¤",
  msgNewColor: "Un nouveau quartier coloré arrive en ville !",
  msgNewHouse: "Nouvelle maison construite",
  msgNewBiz: "Nouvelle entreprise ouverte",
  msgBuilt: "Construit (-{c} ¤)",
  msgDemolished: "Démoli (+{c} ¤ remboursés)",
  msgNoFunds: "Crédits insuffisants ({c} ¤ requis)",
  msgCantBuild: "Impossible de construire ici (écart vertical de 2 requis)",
  msgNo2x2: "Blocs de routes 2x2 interdits",
  msgNoWater: "Impossible de construire sur l'eau (pont au niveau 1 minimum)",
  msgNothingHere: "Rien à démolir ici",
  msgTreeCut: "Arbre abattu",
  msgAxisSwitched: "Axe prioritaire du croisement basculé",
  msgShareCopied: "Lien de la carte copié dans le presse-papiers !",
  msgMapLoaded: "Carte partagée chargée !",
  msgMapInvalid: "Lien de carte invalide",
  msgMapVersion: "Carte créée avec une version plus récente du jeu",

  // Messages de debug
  dbgHouseAdded: "[debug] Maison ajoutée",
  dbgBizAdded: "[debug] Entreprise ajoutée",
  dbgNoSpot: "[debug] Aucun emplacement libre trouvé",
  dbgBike: "[debug] Un vélo se balade !",
  dbgNoBikeRoute: "[debug] Pas de trajet possible entre deux maisons",
  dbgMoney: "[debug] +{n} ¤",
  dbgPurged: "[debug] Commandes en attente purgées",
  dbgTrafficCleared: "[debug] Trafic vidé ({n} véhicules)",
};

export type StringKey = keyof typeof fr;

const en: Record<StringKey, string> = {
  pause: "⏸ Pause",
  resume: "▶ Resume",
  pauseTip: "Pause (Space)",
  speedTip: "Speed (1/2/4)",
  rotLeftTip: "Rotate camera counter-clockwise",
  rotRightTip: "Rotate camera clockwise (R)",
  debugTip: "Debug menu",
  langTip: "Passer en français",
  newGame: "New game",
  newGameTip: "Start over",
  shareBtn: "Share",
  shareTip: "Copy a shareable link to this map",
  helpBtn: "Help",
  helpBtnTip: "Show the help panel",
  optionsBtn: "⚙ Options",
  optionsBtnTip: "Game settings",
  optionsHelp: "Help",
  optionsDebug: "Debug",
  optionsLanguage: "Language: {v}",
  optionsMusic: "Music: {v}",
  optionsAudio: "Audio effects: {v}",
  optionsOn: "ON",
  optionsOff: "OFF",
  statScore: "Score {n}",
  statBest: "Best {n}",
  statPayout: "Grant +{a} in {s}s",
  statDistance: "Distance: {v}",
  statPackages: "Packages picked up: {n}",
  statDuration: "Duration: {v}",

  toolRoad: "🛣 Road",
  toolRoadTip: "Build a road (A)",
  toolRamp: "⛰ Ramp",
  toolRampTip: "Build a ramp (Z)",
  toolBulldoze: "🚜 Demolish",
  toolBulldozeTip: "Demolish and refund (X)",
  levelDownTip: "Lower level (Q / wheel)",
  levelUpTip: "Higher level (E / wheel)",
  level: "Lvl {n}",
  rampDir: "Ramp: {d} {a}",
  rampDirTip: "Ramp direction (T)",
  dir0: "East",
  dir1: "South",
  dir2: "West",
  dir3: "North",
  ready: "Ready.",

  help:
    "<b>Connect houses to businesses of the same color.</b><br>" +
    "Left click: build / demolish<br>" +
    "Right click: pan the camera<br>" +
    "Mobile: two fingers to pan the camera<br>" +
    "Wheel / Q / E: height level<br>" +
    "R: rotate &nbsp;·&nbsp; T: ramp direction<br>" +
    "Space: pause &nbsp;·&nbsp; 1 / 2 / 4: speed<br>" +
    "Double-click (road): priority axis of a 4-way junction<br>" +
    "Crossing: 2-level gap required.<br>" +
    "River: bridge at level 1 minimum.",
  closeHelpTip: "Hide the help panel",

  debugHouse: "🏠 House",
  debugHouseTip: "Add a house of the chosen color",
  debugBiz: "🏢 Business",
  debugBizTip: "Add a business of the chosen color",
  debugBike: "🚲 Bike",
  debugBikeTip: "Send a bike between two houses",
  debugMoney: "💰 Money",
  debugMoneyTip: "Add {n} ¤ credits",
  debugPurge: "📦 Clean",
  debugPurgeTip: "Clear all pending orders and danger",
  debugTraffic: "🚘 Clean",
  debugTrafficTip: "Destroy all vehicles on the road",
  debugStatsTitle: "STATS",
  colorTip: "Color {n}",

  cfgTitle: "CONFIG",
  cfgResetAll: "RESET ALL",
  cfgResetAllTip: "Restore all parameters to their defaults",
  cfgRstTip: "Reset to default value: {v}",
  cfgNoteNewGame: "⚠ Takes effect on the next new game.",
  cfgNoteReload: "⚠ Requires a page reload.",
  cfgSecGrid: "Grid & rendering",
  cfgSecEco: "Economy",
  cfgSecOrders: "Orders & danger",
  cfgSecCars: "Cars & traffic",
  cfgSecBikes: "Bikes",
  cfgSecSpawn: "Building spawns",
  cfgSecAnim: "Animations",
  cfgSecHoods: "Districts",
  cfgSecRiver: "River",
  cfgSecTrees: "Trees",
  cfgSecMisc: "Misc",
  cfg_GRID: "Map size (GRID × GRID cells).",
  cfg_TILE_W: "Width of an isometric diamond in pixels (low resolution).",
  cfg_TILE_H: "Height of an isometric diamond in pixels.",
  cfg_Z_STEP: "Vertical offset in pixels per height level.",
  cfg_MAX_LEVEL: "Maximum road height level.",
  cfg_RENDER_SCALE: "Pixelated canvas upscale factor (bigger = chunkier pixels).",
  cfg_EARTH_DEPTH: "Height in pixels of the earth faces on edge blocks.",
  cfg_WATERFALL_BLOCKS: "Waterfall fade-out length, in earth blocks.",
  cfg_START_CREDITS: "Credits at the start of a game.",
  cfg_COST_ROAD: "Cost of a ground road.",
  cfg_COST_RAMP: "Base cost of a ramp.",
  cfg_COST_PER_LEVEL: "Extra cost per elevation level.",
  cfg_PAYOUT_INTERVAL: "Seconds between two city grants.",
  cfg_PAYOUT_AMOUNT: "City grant amount (¤).",
  cfg_DELIVERY_CREDITS: "Credits earned per delivery.",
  cfg_DELIVERY_SCORE: "Score points per delivery.",
  cfg_ORDER_INTERVAL: "Seconds between two orders of a business (base).",
  cfg_ORDER_MIN_FACTOR: "Minimum order interval factor (max difficulty).",
  cfg_DIFFICULTY_RAMP_TIME: "Time (s) to reach maximum difficulty.",
  cfg_DANGER_THRESHOLD: "Pending orders before the danger gauge rises.",
  cfg_DANGER_FILL_TIME: "Seconds for the danger gauge to reach 100%.",
  cfg_DANGER_DECAY_TIME: "Seconds for the gauge to drop from 100% to 0.",
  cfg_MAX_ORDER_PIPS: "Maximum number of order pips displayed.",
  cfg_CAR_SPEED: "Car speed (cells per second).",
  cfg_CARS_PER_HOUSE: "Maximum number of cars per house.",
  cfg_DISPATCH_INTERVAL: "Delivery assignment frequency (s).",
  cfg_LANE_OFFSET: "Lateral vehicle offset (right-hand traffic), in cells.",
  cfg_YIELD_STOP_TIME: "Mandatory stop (s) at the yield before an intersection.",
  cfg_YIELD_DEADLOCK_TIME:
    "Blocked time (s) before ignoring right-of-way (anti-deadlock).",
  cfg_BIKE_SPEED_FACTOR: "Bike speed, as a fraction of car speed.",
  cfg_BIKE_INTERVAL: "Seconds between two bike departures.",
  cfg_BIKE_MAX: "Maximum simultaneous bikes.",
  cfg_SPAWN_INTERVAL_START: "Initial interval (s) between two building spawns.",
  cfg_SPAWN_INTERVAL_MIN: "Minimum interval (s) between two building spawns.",
  cfg_SPAWN_ACCEL_TIME: "Time (s) to reach the minimum spawn interval.",
  cfg_UNLOCK_EVERY: "Spawns required before unlocking a new color.",
  cfg_HOUSE_SURPLUS: "Surplus houses required (per color) before a business.",
  cfg_BIZ_FALL_HEIGHT: "Starting height of a business's fall (in levels).",
  cfg_BIZ_FALL_SPEED: "Business fall speed (levels per second).",
  cfg_IMPACT_RING_TIME: "Duration (s) of the ground shockwave.",
  cfg_IMPACT_RING_RADIUS: "Final radius of the shockwave (cells).",
  cfg_HOOD_JOIN_CHANCE: "Probability that a house joins an existing district.",
  cfg_HOOD_JOIN_DIST: "Max Manhattan distance (blocks) to a same-color house.",
  cfg_HOOD_NEW_DIST: "Strict min Manhattan distance to found a new district.",
  cfg_ROAD_SPOT_CHANCE: "Probability to favor a spawn next to a flat level-0 road.",
  cfg_RIVER_BRIDGE_LEVEL: "Minimum road level above water (bridge).",
  cfg_RIVER_MAX_OFFSET: "Max offset (cells) of the riverbed from the map center.",
  cfg_RIVER_WANDER: "Probability that the river bends at each row.",
  cfg_WATER_ANIM_FPS: "Frames per second of the water reflection animation.",
  cfg_TREE_DENSITY: "Tree probability per grass cell at generation.",
  cfg_AUTOSAVE_INTERVAL: "Seconds between two autosaves.",
  cfg_DEBUG_CREDITS: "Credits added by the 💰 button of the debug menu.",

  overTitle: "GAME OVER",
  overText: "A business collapsed under its orders.",
  overScore: "Final score: {n}",
  overBest: "Best score: {n}",
  replay: "Play again",
  replayTip: "New game",
  starGithub: "⭐ Star on GitHub",
  starGithubTip: "Open the repository on GitHub",
  shareX: "Share on X",
  shareXTip: "Post your score on X",
  shareBluesky: "Share on Bluesky",
  shareBlueskyTip: "Post your score on Bluesky",
  shareScore:
    "Beat my {n} score on TinyTrafficTown, a little game done in one hour by #Claude #Fable 5. {url}",

  onboardTitle: "TINY TRAFFIC TOWN",
  onboardText:
    "Build roads to connect houses to businesses of the same color. " +
    "Deliver orders before the danger gauge fills up!",
  onboardDevice: "The game is more comfortable on a computer screen or tablet.",
  closeOnboardingTip: "Hide this help window",
  closeDebugTip: "Close the debug menu",
  startPlaying: "▶ Play",
  startPlayingTip: "Close this window and start playing",

  // Confirmation modal
  confirmNewGameTitle: "New game?",
  confirmNewGameText: "You will lose your current progress.",
  cancel: "Cancel",
  newGameConfirm: "New game",

  msgWelcome: "Welcome! Connect houses to businesses of the same color.",
  msgRestored: "Previous game restored.",
  msgNewGame: "New game!",
  msgPayout: "City grant: +{a} ¤",
  msgNewColor: "A new colored district has come to town!",
  msgNewHouse: "A new house was built",
  msgNewBiz: "A new business opened",
  msgBuilt: "Built (-{c} ¤)",
  msgDemolished: "Demolished (+{c} ¤ refunded)",
  msgNoFunds: "Not enough credits ({c} ¤ needed)",
  msgCantBuild: "Can't build here (vertical gap of 2 required)",
  msgNo2x2: "2x2 road blocks are forbidden",
  msgNoWater: "Can't build on water (bridge at level 1 minimum)",
  msgNothingHere: "Nothing to demolish here",
  msgTreeCut: "Tree cut down",
  msgAxisSwitched: "Junction priority axis switched",
  msgShareCopied: "Map link copied to clipboard!",
  msgMapLoaded: "Shared map loaded!",
  msgMapInvalid: "Invalid map link",
  msgMapVersion: "Map made with a newer version of the game",

  dbgHouseAdded: "[debug] House added",
  dbgBizAdded: "[debug] Business added",
  dbgNoSpot: "[debug] No free spot found",
  dbgBike: "[debug] A bike is out for a ride!",
  dbgNoBikeRoute: "[debug] No route between two houses",
  dbgMoney: "[debug] +{n} ¤",
  dbgPurged: "[debug] Pending orders cleared",
  dbgTrafficCleared: "[debug] Traffic cleared ({n} vehicles)",
};

const STRINGS: Record<Lang, Record<StringKey, string>> = { fr, en };

let lang: Lang = "fr";

export function setLang(l: Lang): void {
  lang = l;
}

export function getLang(): Lang {
  return lang;
}

export function t(key: StringKey, params?: Record<string, string | number>): string {
  let s = STRINGS[lang][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  }
  return s;
}
