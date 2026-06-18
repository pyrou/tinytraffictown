// Toutes les constantes de gameplay / rendu du jeu.
export const Config = {
  // --- Grille & rendu isométrique ---
  GRID: 28, // taille de la grille (GRID x GRID)
  TILE_W: 32, // largeur d'un losange en pixels (basse résolution)
  TILE_H: 16, // hauteur d'un losange
  Z_STEP: 7, // pixels par niveau de hauteur
  MAX_LEVEL: 4, // hauteur maximum des routes
  RENDER_SCALE: 2, // upscale pixelisé du canvas
  EARTH_DEPTH: 16, // hauteur (px basse résolution) des faces de terre des blocs de bord
  WATERFALL_BLOCKS: 6, // longueur du fondu des cascades, en blocs de terre

  // --- Économie ---
  START_CREDITS: 300,
  COST_ROAD: 10, // route au sol
  SPEEDWAY_UNLOCK_SCORE: 3000, // score requis pour débloquer les autoroutes
  SPEEDWAY_COST_FACTOR: 2, // multiplicateur du coût d'une autoroute
  COST_RAMP: 18, // rampe (base)
  COST_PER_LEVEL: 8, // surcoût par niveau d'élévation
  DELIVERY_CREDITS: 14,
  DELIVERY_SCORE: 10,

  // --- Commandes & danger ---
  ORDER_INTERVAL: 10, // secondes entre commandes (base, par entreprise)
  ORDER_MIN_FACTOR: 0.45, // facteur minimum (difficulté max)
  DIFFICULTY_RAMP_TIME: 600, // temps (s) pour atteindre la difficulté max
  DANGER_THRESHOLD: 5, // commandes en attente avant danger
  DANGER_FILL_TIME: 30, // secondes pour que le danger atteigne 100%
  DANGER_DECAY_TIME: 12, // secondes pour redescendre de 100% à 0
  MAX_ORDER_PIPS: 8, // pastilles de commandes affichées max

  // --- Voitures & circulation ---
  CAR_SPEED: 2.0, // cases par seconde
  SPEEDWAY_SPEED_FACTOR: 2, // multiplicateur de vitesse voiture sur autoroute
  CARS_PER_HOUSE: 2,
  DISPATCH_INTERVAL: 0.4, // fréquence d'affectation des livraisons
  LANE_OFFSET: 0.18, // décalage latéral (conduite à droite), en cases
  YIELD_STOP_TIME: 0.5, // arrêt obligatoire au cédez-le-passage (s)
  YIELD_DEADLOCK_TIME: 2.5, // au-delà, on ignore la priorité à droite (anti-blocage)

  // --- Vélos (trafic parasite de maison à maison) ---
  BIKE_SPEED_FACTOR: 0.75, // fraction de la vitesse des voitures
  BIKE_INTERVAL: 7, // secondes entre deux départs de vélo
  BIKE_MAX: 12, // vélos simultanés maximum

  // --- Apparition des bâtiments ---
  SPAWN_INTERVAL_START: 26,
  SPAWN_INTERVAL_MIN: 13,
  SPAWN_ACCEL_TIME: 480,
  UNLOCK_EVERY: 5, // nouveaux spawns avant de débloquer une couleur
  HOUSE_SURPLUS: 2, // maisons d'avance requises (par couleur) avant une entreprise

  // --- Animation d'apparition des bâtiments ---
  BIZ_FALL_HEIGHT: 16, // hauteur de départ de la chute (en niveaux Z_STEP)
  BIZ_FALL_SPEED: 26, // vitesse de chute constante (niveaux par seconde)
  IMPACT_RING_TIME: 0.7, // durée de l'onde de choc au sol (s)
  IMPACT_RING_RADIUS: 10, // rayon final de l'onde (cases)

  // --- Quartiers (placement des maisons) ---
  HOOD_JOIN_CHANCE: 0.75, // probabilité de rejoindre un quartier existant
  HOOD_JOIN_DIST: 3, // distance Manhattan max (blocs) à une maison de même couleur
  HOOD_NEW_DIST: 10, // distance Manhattan min stricte pour fonder un nouveau quartier
  ROAD_SPOT_CHANCE: 0.5, // probabilité de privilégier un spawn collé à une route plate niveau 0

  // --- Rivière ---
  RIVER_BRIDGE_LEVEL: 1, // niveau minimum d'une route au-dessus de l'eau (pont)
  RIVER_MAX_OFFSET: 2, // écart max (cases) du lit par rapport au centre de la carte
  RIVER_WANDER: 0.45, // probabilité que le lit fasse un coude à chaque rangée
  WATER_ANIM_FPS: 5, // images d'animation par seconde pour les reflets d'eau

  // --- Arbres ---
  TREE_DENSITY: 0.07, // probabilité d'arbre par case d'herbe à la génération

  // --- Divers ---
  AUTOSAVE_INTERVAL: 5,
  DEBUG_CREDITS: 500, // crédits ajoutés par le bouton du menu debug

  // Palette des quartiers / entreprises
  COLORS: ["#d9534f", "#4f7dd9", "#53b86b", "#e0a23e", "#9a5fd0", "#3fb8c4"],
  COLORS_DARK: ["#8e2f2c", "#2c4f95", "#2f7a44", "#9c6a1d", "#643a8e", "#22787f"],

  // --- Liens ---
  GITHUB_URL: "https://github.com/pyrou/tinytraffictown",
  GAME_URL: "https://pyrou.github.io/tinytraffictown/", // page de jeu (partage social)
};

// ---------------------------------------------------------------------------
// Personnalisation de la Config (sidebar debug).
//
// Les overrides sont persistés dans localStorage et appliqués ICI, à
// l'évaluation de ce module : Config.ts est à la base du graphe d'imports,
// donc les constantes dérivées des autres modules (ex. TW2/TH2/Z du Renderer,
// figées au chargement) voient déjà les valeurs personnalisées. C'est pour
// cette raison que la lecture/écriture localStorage vit ici et non dans
// storage/Storage.ts.
// ---------------------------------------------------------------------------

type ConfigShape = typeof Config;

// Clés numériques de la Config (les seules personnalisables via le menu debug).
export type ConfigNumKey = {
  [K in keyof ConfigShape]: ConfigShape[K] extends number ? K : never;
}[keyof ConfigShape];

// Valeurs d'usine, figées avant application des overrides (comparaison/reset).
export const CONFIG_DEFAULTS: Readonly<ConfigShape> = Object.freeze({ ...Config });

export const CONFIG_NUM_KEYS = (Object.keys(Config) as (keyof ConfigShape)[]).filter(
  (k): k is ConfigNumKey => typeof Config[k] === "number",
);

const KEY_CFG = "ttt_cfg";

// Sauvegarde uniquement le diff par rapport aux défauts (clé supprimée si vide).
function persistOverrides(): void {
  try {
    const o: Partial<Record<ConfigNumKey, number>> = {};
    for (const k of CONFIG_NUM_KEYS) if (Config[k] !== CONFIG_DEFAULTS[k]) o[k] = Config[k];
    if (Object.keys(o).length) localStorage.setItem(KEY_CFG, JSON.stringify(o));
    else localStorage.removeItem(KEY_CFG);
  } catch {
    /* stockage indisponible */
  }
}

export function isConfigCustom(k: ConfigNumKey): boolean {
  return Config[k] !== CONFIG_DEFAULTS[k];
}

export function setConfigValue(k: ConfigNumKey, v: number): void {
  Config[k] = v;
  persistOverrides();
}

export function resetConfigValue(k: ConfigNumKey): void {
  Config[k] = CONFIG_DEFAULTS[k];
  persistOverrides();
}

export function resetAllConfig(): void {
  for (const k of CONFIG_NUM_KEYS) Config[k] = CONFIG_DEFAULTS[k];
  persistOverrides();
}

// Application des overrides sauvegardés (tolérant aux données invalides).
(() => {
  try {
    const raw = localStorage.getItem(KEY_CFG);
    if (!raw) return;
    const o = JSON.parse(raw) as Record<string, unknown>;
    for (const k of CONFIG_NUM_KEYS) {
      const v = o[k];
      if (typeof v === "number" && Number.isFinite(v)) Config[k] = v;
    }
  } catch {
    /* données invalides : on garde les défauts */
  }
})();
