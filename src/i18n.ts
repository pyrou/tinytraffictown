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
    "Molette / Q / E : niveau de hauteur<br>" +
    "R : rotation &nbsp;·&nbsp; T : sens de rampe<br>" +
    "Espace : pause &nbsp;·&nbsp; 1 / 2 : vitesse<br>" +
    "Croisement : écart de 2 niveaux requis.<br>" +
    "Rivière : pont au niveau 1 minimum.",

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
    "Wheel / Q / E: height level<br>" +
    "R: rotate &nbsp;·&nbsp; T: ramp direction<br>" +
    "Space: pause &nbsp;·&nbsp; 1 / 2: speed<br>" +
    "Crossing: 2-level gap required.<br>" +
    "River: bridge at level 1 minimum.",

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
