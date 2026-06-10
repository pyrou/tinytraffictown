// Internationalisation FR/EN. Module pur (aucune dépendance DOM) : la
// simulation peut l'utiliser sans violer la séparation sim/ui.

export type Lang = "fr" | "en";

const fr = {
  // Barre du haut
  pause: "⏸ Pause",
  resume: "▶ Reprendre",
  pauseTip: "Pause (Espace)",
  speedTip: "Vitesse (1/2)",
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
  statScore: "Score {n}",
  statBest: "Record {n}",
  statPayout: "Subvention +{a} dans {s}s",

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
  rampDir: "Rampe : {d}",
  rampDirTip: "Direction de la rampe (T)",
  dir0: "Est →",
  dir1: "Sud ↓",
  dir2: "Ouest ←",
  dir3: "Nord ↑",
  ready: "Prêt.",

  // Aide
  help:
    "<b>Connectez maisons et entreprises de même couleur.</b><br>" +
    "Clic gauche : construire / démolir<br>" +
    "Clic droit : déplacer la caméra<br>" +
    "Mobile : deux doigts pour déplacer la caméra<br>" +
    "Molette / Q / E : niveau de hauteur<br>" +
    "R : rotation &nbsp;·&nbsp; T : sens de rampe<br>" +
    "Espace : pause &nbsp;·&nbsp; 1 / 2 : vitesse<br>" +
    "Double-clic (route) : axe prioritaire d'un croisement en X<br>" +
    "Croisement : écart de 2 niveaux requis.<br>" +
    "Rivière : pont au niveau 1 minimum.",
  closeHelpTip: "Masquer le panneau d'aide",

  // Menu de debug
  debugHouse: "+ Maison",
  debugHouseTip: "Ajoute une maison de la couleur choisie",
  debugBiz: "+ Entreprise",
  debugBizTip: "Ajoute une entreprise de la couleur choisie",
  debugBike: "+ Vélo",
  debugBikeTip: "Fait partir un vélo entre deux maisons",
  debugMoney: "💰 +{n} ¤",
  debugMoneyTip: "Ajoute {n} ¤ de crédits",
  debugPurge: "🧹 Purger commandes",
  debugPurgeTip: "Vide toutes les commandes en attente et le danger",
  debugTraffic: "🚗 Vider le trafic",
  debugTrafficTip: "Détruit tous les véhicules en circulation",
  colorTip: "Couleur {n}",

  // Écran de fin
  overTitle: "FAILLITE !",
  overText: "Une entreprise a croulé sous les commandes…",
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
  startPlaying: "▶ Jouer",
  startPlayingTip: "Fermer cette fenêtre et commencer à jouer",

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
  speedTip: "Speed (1/2)",
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
  statScore: "Score {n}",
  statBest: "Best {n}",
  statPayout: "Grant +{a} in {s}s",

  toolRoad: "🛣 Road",
  toolRoadTip: "Build a road (A)",
  toolRamp: "⛰ Ramp",
  toolRampTip: "Build a ramp (Z)",
  toolBulldoze: "🚜 Demolish",
  toolBulldozeTip: "Demolish and refund (X)",
  levelDownTip: "Lower level (Q / wheel)",
  levelUpTip: "Higher level (E / wheel)",
  level: "Lvl {n}",
  rampDir: "Ramp: {d}",
  rampDirTip: "Ramp direction (T)",
  dir0: "East →",
  dir1: "South ↓",
  dir2: "West ←",
  dir3: "North ↑",
  ready: "Ready.",

  help:
    "<b>Connect houses to businesses of the same color.</b><br>" +
    "Left click: build / demolish<br>" +
    "Right click: pan the camera<br>" +
    "Mobile: two fingers to pan the camera<br>" +
    "Wheel / Q / E: height level<br>" +
    "R: rotate &nbsp;·&nbsp; T: ramp direction<br>" +
    "Space: pause &nbsp;·&nbsp; 1 / 2: speed<br>" +
    "Double-click (road): priority axis of a 4-way junction<br>" +
    "Crossing: 2-level gap required.<br>" +
    "River: bridge at level 1 minimum.",
  closeHelpTip: "Hide the help panel",

  debugHouse: "+ House",
  debugHouseTip: "Add a house of the chosen color",
  debugBiz: "+ Business",
  debugBizTip: "Add a business of the chosen color",
  debugBike: "+ Bike",
  debugBikeTip: "Send a bike between two houses",
  debugMoney: "💰 +{n} ¤",
  debugMoneyTip: "Add {n} ¤ credits",
  debugPurge: "🧹 Clear orders",
  debugPurgeTip: "Clear all pending orders and danger",
  debugTraffic: "🚗 Clear traffic",
  debugTrafficTip: "Destroy all vehicles on the road",
  colorTip: "Color {n}",

  overTitle: "BANKRUPT!",
  overText: "A business collapsed under its orders…",
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
  startPlaying: "▶ Play",
  startPlayingTip: "Close this window and start playing",

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
