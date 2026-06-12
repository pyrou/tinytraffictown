import {
  Config,
  CONFIG_DEFAULTS,
  CONFIG_NUM_KEYS,
  isConfigCustom,
  resetAllConfig,
  resetConfigValue,
  setConfigValue,
} from "../Config";
import type { ConfigNumKey } from "../Config";
import type { Game } from "../Game";
import { getLang, t } from "../i18n";
import type { StringKey } from "../i18n";

// Élément traduisible : ré-appliqué à chaque changement de langue.
interface TrEntry {
  el: HTMLElement;
  text?: StringKey;
  textArgs?: Record<string, string | number>;
  html?: StringKey;
  title?: StringKey;
  titleArgs?: Record<string, string | number>;
}

// Sections de la sidebar de config (mêmes regroupements que Config.ts).
const CFG_SECTIONS: [StringKey, ConfigNumKey[]][] = [
  ["cfgSecGrid", ["GRID", "TILE_W", "TILE_H", "Z_STEP", "MAX_LEVEL", "RENDER_SCALE"]],
  [
    "cfgSecEco",
    [
      "START_CREDITS",
      "COST_ROAD",
      "SPEEDWAY_UNLOCK_SCORE",
      "SPEEDWAY_COST_FACTOR",
      "COST_RAMP",
      "COST_PER_LEVEL",
      "DELIVERY_CREDITS",
      "DELIVERY_SCORE",
    ],
  ],
  [
    "cfgSecOrders",
    [
      "ORDER_INTERVAL",
      "ORDER_MIN_FACTOR",
      "DIFFICULTY_RAMP_TIME",
      "DANGER_THRESHOLD",
      "DANGER_FILL_TIME",
      "DANGER_DECAY_TIME",
      "MAX_ORDER_PIPS",
    ],
  ],
  [
    "cfgSecCars",
    [
      "CAR_SPEED",
      "SPEEDWAY_SPEED_FACTOR",
      "CARS_PER_HOUSE",
      "DISPATCH_INTERVAL",
      "LANE_OFFSET",
      "YIELD_STOP_TIME",
      "YIELD_DEADLOCK_TIME",
    ],
  ],
  ["cfgSecBikes", ["BIKE_SPEED_FACTOR", "BIKE_INTERVAL", "BIKE_MAX"]],
  [
    "cfgSecSpawn",
    [
      "SPAWN_INTERVAL_START",
      "SPAWN_INTERVAL_MIN",
      "SPAWN_ACCEL_TIME",
      "UNLOCK_EVERY",
      "HOUSE_SURPLUS",
    ],
  ],
  ["cfgSecAnim", ["BIZ_FALL_HEIGHT", "BIZ_FALL_SPEED", "IMPACT_RING_TIME", "IMPACT_RING_RADIUS"]],
  ["cfgSecHoods", ["HOOD_JOIN_CHANCE", "HOOD_JOIN_DIST", "HOOD_NEW_DIST", "ROAD_SPOT_CHANCE"]],
  ["cfgSecRiver", ["RIVER_BRIDGE_LEVEL", "RIVER_MAX_OFFSET", "RIVER_WANDER", "WATER_ANIM_FPS"]],
  ["cfgSecTrees", ["TREE_DENSITY"]],
  ["cfgSecMisc", ["AUTOSAVE_INTERVAL", "DEBUG_CREDITS"]],
];

// Filet de sécurité : toute nouvelle clé numérique non listée atterrit dans
// « Divers » plutôt que de disparaître de la sidebar.
{
  const listed = new Set(CFG_SECTIONS.flatMap(([, keys]) => keys));
  CFG_SECTIONS[CFG_SECTIONS.length - 1][1].push(
    ...CONFIG_NUM_KEYS.filter((k) => !listed.has(k)),
  );
}

// Paramètres qui ne peuvent pas prendre effet en cours de partie.
const CFG_NOTES: Partial<Record<ConfigNumKey, StringKey>> = {
  // Figés au chargement du module Renderer.
  TILE_W: "cfgNoteReload",
  TILE_H: "cfgNoteReload",
  Z_STEP: "cfgNoteReload",
  // Lus à la génération du monde / à l'initialisation de la partie.
  GRID: "cfgNoteNewGame",
  START_CREDITS: "cfgNoteNewGame",
  RIVER_MAX_OFFSET: "cfgNoteNewGame",
  RIVER_WANDER: "cfgNoteNewGame",
  TREE_DENSITY: "cfgNoteNewGame",
};

export class UI {
  private game: Game;
  private registry: TrEntry[] = [];
  private elCredits!: HTMLElement;
  private elScore!: HTMLElement;
  private elBest!: HTMLElement;
  private btnPause!: HTMLButtonElement;
  private btnSpeed!: HTMLButtonElement;
  private btnLang!: HTMLButtonElement;
  private toolButtons = new Map<string, HTMLButtonElement>();
  private optionsMenu!: HTMLElement;
  private optionsBtn!: HTMLButtonElement;
  private btnOptLang!: HTMLButtonElement;
  private btnOptMusic!: HTMLButtonElement;
  private btnOptAudio!: HTMLButtonElement;
  private elLevel!: HTMLElement;
  private btnDir!: HTMLButtonElement;
  private elStatus!: HTMLElement;
  private helpPanel!: HTMLElement;
  private debugPanel!: HTMLElement;
  private elDebugDistance!: HTMLElement;
  private elDebugPackages!: HTMLElement;
  private elDebugDuration!: HTMLElement;
  private debugColor = 0;
  private moneyEntry!: TrEntry;
  private speedwayLockedEntry!: TrEntry;
  private cfgRows: {
    key: ConfigNumKey;
    row: HTMLElement;
    input: HTMLInputElement;
    rst: HTMLButtonElement;
  }[] = [];
  private overlay!: HTMLElement;
  private onboard!: HTMLElement;
  private elFinalScore!: HTMLElement;
  private elFinalBest!: HTMLElement;
  private elFinalDistance!: HTMLElement;
  private elFinalPackages!: HTMLElement;
  private elFinalDuration!: HTMLElement;
  private btnShareX!: HTMLAnchorElement;
  private btnShareBsky!: HTMLAnchorElement;
  private confirmModal!: HTMLElement;
  private speedwayModal!: HTMLElement;

  constructor(root: HTMLElement, game: Game) {
    this.game = game;
    this.build(root);
    this.applyTexts();
  }

  private reg(entry: TrEntry): HTMLElement {
    this.registry.push(entry);
    return entry.el;
  }

  // Bouton avec libellé/infobulle traduits (null = non traduit, géré ailleurs).
  private btn(
    text: StringKey | null,
    title: StringKey | null,
    onClick: () => void,
  ): HTMLButtonElement {
    const b = document.createElement("button");
    b.addEventListener("click", (e) => {
      onClick();
      (e.currentTarget as HTMLButtonElement).blur();
    });
    if (text || title) this.reg({ el: b, text: text ?? undefined, title: title ?? undefined });
    return b;
  }

  // Lien externe stylé comme un bouton de panneau (ouvre un nouvel onglet).
  private linkBtn(text: StringKey, title: StringKey, href: string): HTMLAnchorElement {
    const a = document.createElement("a");
    a.className = "btn-link";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    this.reg({ el: a, text, title });
    return a;
  }

  private stat(): HTMLElement {
    const s = document.createElement("span");
    s.className = "stat";
    return s;
  }

  private formatDistance(cells: number): string {
    return `${(cells * 0.05).toFixed(1)} km`;
  }

  private formatDuration(seconds: number): string {
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // Évite de remplacer les nœuds texte à chaque frame, ce qui peut annuler
  // certains clics sur Safari quand le pointeur est posé sur le libellé.
  private setText(el: HTMLElement, text: string): void {
    if (el.textContent !== text) el.textContent = text;
  }

  private build(root: HTMLElement): void {
    // --- barre du haut ---
    const top = document.createElement("div");
    top.id = "topbar";
    top.className = "panel";

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "TINY TRAFFIC TOWN";
    title.style.cursor = "pointer";
    title.addEventListener("click", () => this.showOnboarding());
    top.appendChild(title);

    this.elCredits = this.stat();
    this.elScore = this.stat();
    this.elBest = this.stat();
    top.append(this.elCredits, this.elScore, this.elBest);

    const spacer = document.createElement("span");
    spacer.className = "spacer";
    top.appendChild(spacer);

    this.btnPause = this.btn(null, "pauseTip", () => this.game.togglePause());
    this.btnSpeed = this.btn(null, "speedTip", () =>
      this.game.setSpeed(this.game.speed === 1 ? 2 : this.game.speed === 2 ? 4 : 1),
    );
    this.btnLang = this.btn(null, "langTip", () => this.game.toggleLang());

    this.optionsBtn = this.btn("optionsBtn", "optionsBtnTip", () => this.toggleOptionsMenu());
    this.optionsMenu = document.createElement("div");
    this.optionsMenu.id = "options-menu";
    this.optionsMenu.className = "panel hidden";
    this.buildOptionsMenu();

    top.append(
      this.btnPause,
      this.btnSpeed,
      this.btn(null, "rotLeftTip", () => this.game.rotate(-1)),
      this.btn(null, "rotRightTip", () => this.game.rotate(1)),
      this.optionsBtn,
      this.btn("shareBtn", "shareTip", () => this.game.shareMap()),
      this.btn("newGame", "newGameTip", () => this.showConfirmNewGame()),
    );
    // libellés fixes non traduits
    const rotBtns = top.querySelectorAll("button");
    rotBtns[2].textContent = "⟲";
    rotBtns[3].textContent = "⟳";
    root.appendChild(top);
    root.appendChild(this.optionsMenu);

    // --- menu de debug ---
    this.debugPanel = document.createElement("div");
    this.debugPanel.id = "debug";
    this.debugPanel.className = "panel hidden";
    const debugHeader = document.createElement("div");
    debugHeader.style.display = "flex";
    debugHeader.style.justifyContent = "space-between";
    debugHeader.style.alignItems = "center";
    debugHeader.style.marginBottom = "6px";
    const dTitle = document.createElement("div");
    dTitle.className = "debug-title";
    dTitle.textContent = "DEBUG";
    const debugClose = this.btn(null, "closeDebugTip", () =>
      this.debugPanel.classList.add("hidden"),
    );
    debugClose.className = "close";
    debugClose.textContent = "×";
    debugClose.style.position = "relative";
    debugClose.style.top = "auto";
    debugClose.style.right = "auto";
    debugClose.style.margin = "0";
    debugClose.style.width = "18px";
    debugClose.style.height = "17px";
    debugClose.style.minWidth = "18px";
    debugClose.style.padding = "0";
    debugClose.style.lineHeight = "11px";
    debugClose.style.fontSize = "12px";
    debugHeader.append(dTitle, debugClose);
    this.debugPanel.appendChild(debugHeader);

    const swatches = document.createElement("div");
    swatches.className = "swatches";
    const swatchEls: HTMLButtonElement[] = [];
    Config.COLORS.forEach((col, c) => {
      const s = document.createElement("button");
      s.className = "swatch" + (c === this.debugColor ? " sel" : "");
      s.style.background = col;
      this.reg({ el: s, title: "colorTip", titleArgs: { n: c + 1 } });
      s.addEventListener("click", () => {
        this.debugColor = c;
        swatchEls.forEach((e, i) => e.classList.toggle("sel", i === c));
      });
      swatchEls.push(s);
      swatches.appendChild(s);
    });
    this.debugPanel.appendChild(swatches);

    // Boutons de debug en 2 lignes (3 boutons par ligne)
    const debugButtons = document.createElement("div");
    debugButtons.className = "debug-buttons";

    const line1 = document.createElement("div");
    line1.className = "debug-line";
    line1.append(
      this.btn("debugHouse", "debugHouseTip", () =>
        this.game.debugSpawnBuilding("house", this.debugColor),
      ),
      this.btn("debugBiz", "debugBizTip", () =>
        this.game.debugSpawnBuilding("biz", this.debugColor),
      ),
      this.btn("debugBike", "debugBikeTip", () => this.game.debugSpawnBike()),
    );

    const line2 = document.createElement("div");
    line2.className = "debug-line";
    const bMoney = this.btn(null, null, () => this.game.debugAddCredits());
    // Entrée conservée : ses args sont rafraîchis quand DEBUG_CREDITS change.
    this.moneyEntry = {
      el: bMoney,
      text: "debugMoney",
      textArgs: { n: Config.DEBUG_CREDITS },
      title: "debugMoneyTip",
      titleArgs: { n: Config.DEBUG_CREDITS },
    };
    this.registry.push(this.moneyEntry);
    line2.append(
      this.btn("debugPurge", "debugPurgeTip", () => this.game.debugClearOrders()),
      this.btn("debugTraffic", "debugTrafficTip", () => this.game.debugClearTraffic()),
      bMoney,
    );

    debugButtons.append(line1, line2);
    this.debugPanel.appendChild(debugButtons);
    this.buildDebugStats();
    this.buildConfigSection();
    root.appendChild(this.debugPanel);

    // --- barre d'outils ---
    const bar = document.createElement("div");
    bar.id = "toolbar";
    bar.className = "panel";

    const addTool = (key: string, text: StringKey, tip: StringKey) => {
      const b = this.btn(text, tip, () => this.game.input.setTool(key as never));
      this.toolButtons.set(key, b);
      bar.appendChild(b);
    };
    addTool("road", "toolRoad", "toolRoadTip");
    addTool("speedway", "toolSpeedway", "toolSpeedwayTip");
    addTool("ramp", "toolRamp", "toolRampTip");
    addTool("bulldoze", "toolBulldoze", "toolBulldozeTip");

    const sep1 = document.createElement("span");
    sep1.className = "sep";
    bar.appendChild(sep1);

    const minus = this.btn(null, "levelDownTip", () =>
      this.game.input.setLevel(this.game.input.level - 1),
    );
    minus.textContent = "−";
    bar.appendChild(minus);
    this.elLevel = document.createElement("span");
    this.elLevel.style.minWidth = "52px";
    this.elLevel.style.textAlign = "center";
    bar.appendChild(this.elLevel);
    const plus = this.btn(null, "levelUpTip", () =>
      this.game.input.setLevel(this.game.input.level + 1),
    );
    plus.textContent = "+";
    bar.appendChild(plus);

    const sep2 = document.createElement("span");
    sep2.className = "sep";
    bar.appendChild(sep2);

    this.btnDir = this.btn(null, "rampDirTip", () => this.game.input.cycleRampDir());
    bar.appendChild(this.btnDir);
    root.appendChild(bar);

    // --- statut ---
    this.elStatus = document.createElement("div");
    this.elStatus.id = "status";
    this.elStatus.className = "panel";
    root.appendChild(this.elStatus);

    // --- aide ---
    this.helpPanel = document.createElement("div");
    this.helpPanel.id = "help";
    this.helpPanel.className = "panel";
    const helpClose = this.btn(null, "closeHelpTip", () => this.hideHelp());
    helpClose.className = "close";
    helpClose.textContent = "×";
    const helpBody = document.createElement("div");
    this.reg({ el: helpBody, html: "help" });
    this.helpPanel.append(helpClose, helpBody);
    root.appendChild(this.helpPanel);

    // --- écran de fin ---
    this.overlay = document.createElement("div");
    this.overlay.id = "overlay";
    this.overlay.className = "hidden";
    const panel = document.createElement("div");
    panel.className = "panel";
    const h1 = document.createElement("h1");
    this.reg({ el: h1, text: "overTitle" });
    const p1 = document.createElement("p");
    this.reg({ el: p1, text: "overText" });
    this.elFinalScore = document.createElement("p");
    this.elFinalBest = document.createElement("p");
    const finalStats = document.createElement("div");
    finalStats.className = "over-stats";
    this.elFinalDistance = document.createElement("p");
    this.elFinalPackages = document.createElement("p");
    this.elFinalDuration = document.createElement("p");
    finalStats.append(this.elFinalDistance, this.elFinalPackages, this.elFinalDuration);
    const replay = this.btn("replay", "replayTip", () => this.game.newGame());
    const overActions = document.createElement("div");
    overActions.className = "actions";
    const overStar = this.linkBtn("starGithub", "starGithubTip", Config.GITHUB_URL);
    // Liens de partage social : la cible (href) est fixée dans showGameOver,
    // une fois le score final connu.
    this.btnShareX = this.linkBtn("shareX", "shareXTip", "#");
    this.btnShareBsky = this.linkBtn("shareBluesky", "shareBlueskyTip", "#");
    overActions.append(replay, overStar, this.btnShareX, this.btnShareBsky);
    panel.append(h1, p1, this.elFinalScore, this.elFinalBest, finalStats, overActions);
    this.overlay.appendChild(panel);
    root.appendChild(this.overlay);

    // --- écran d'accueil ---
    this.onboard = document.createElement("div");
    this.onboard.id = "onboard";
    const oPanel = document.createElement("div");
    oPanel.className = "panel";
    const oClose = this.btn(null, "closeOnboardingTip", () => this.hideOnboarding());
    oClose.className = "close";
    oClose.textContent = "×";
    const oTitle = document.createElement("h1");
    this.reg({ el: oTitle, text: "onboardTitle" });
    const oText = document.createElement("p");
    this.reg({ el: oText, text: "onboardText" });
    const oDevice = document.createElement("p");
    oDevice.className = "device-note";
    this.reg({ el: oDevice, text: "onboardDevice" });
    const oActions = document.createElement("div");
    oActions.className = "actions";
    const oStar = this.linkBtn("starGithub", "starGithubTip", Config.GITHUB_URL);
    const oBadge = document.createElement("img");
    oBadge.className = "star-badge";
    oBadge.src = `https://img.shields.io/github/stars/${Config.GITHUB_URL.replace("https://github.com/", "")}?style=social`;
    oBadge.alt = "GitHub stars";
    const oStart = this.btn("startPlaying", "startPlayingTip", () => this.hideOnboarding());
    oActions.append(oStar, oBadge, oStart);
    oPanel.append(oClose, oTitle, oText, oDevice, oActions);
    this.onboard.appendChild(oPanel);
    root.appendChild(this.onboard);

    // --- modal de confirmation pour "New Game" ---
    this.confirmModal = document.createElement("div");
    this.confirmModal.id = "confirm-modal";
    this.confirmModal.className = "hidden";
    const cPanel = document.createElement("div");
    cPanel.className = "panel";
    const cTitle = document.createElement("h1");
    this.reg({ el: cTitle, text: "confirmNewGameTitle" });
    const cText = document.createElement("p");
    this.reg({ el: cText, text: "confirmNewGameText" });
    const cActions = document.createElement("div");
    cActions.className = "actions";
    const cCancel = this.btn("cancel", null, () => this.hideConfirmNewGame());
    const cConfirm = this.btn("newGameConfirm", null, () => {
      this.hideConfirmNewGame();
      this.game.newGame();
    });
    cActions.append(cCancel, cConfirm);
    cPanel.append(cTitle, cText, cActions);
    this.confirmModal.appendChild(cPanel);
    root.appendChild(this.confirmModal);

    // --- modal d'autoroute verrouillée ---
    this.speedwayModal = document.createElement("div");
    this.speedwayModal.id = "speedway-modal";
    this.speedwayModal.className = "hidden";
    const sPanel = document.createElement("div");
    sPanel.className = "panel";
    const sTitle = document.createElement("h1");
    this.reg({ el: sTitle, text: "speedwayLockedTitle" });
    const sText = document.createElement("p");
    this.speedwayLockedEntry = {
      el: sText,
      text: "speedwayLockedText",
      textArgs: { n: Config.SPEEDWAY_UNLOCK_SCORE },
    };
    this.registry.push(this.speedwayLockedEntry);
    const sActions = document.createElement("div");
    sActions.className = "actions";
    sActions.appendChild(this.btn("ok", null, () => this.hideSpeedwayLocked()));
    sPanel.append(sTitle, sText, sActions);
    this.speedwayModal.appendChild(sPanel);
    root.appendChild(this.speedwayModal);
  }

  private buildDebugStats(): void {
    const box = document.createElement("div");
    box.className = "debug-stats";
    const title = document.createElement("div");
    title.className = "debug-title";
    this.reg({ el: title, text: "debugStatsTitle" });
    this.elDebugDistance = document.createElement("div");
    this.elDebugPackages = document.createElement("div");
    this.elDebugDuration = document.createElement("div");
    box.append(title, this.elDebugDistance, this.elDebugPackages, this.elDebugDuration);
    this.debugPanel.appendChild(box);
  }

  // Section « CONFIG » de la sidebar debug : édition de toutes les constantes
  // numériques de Config.ts, persistées dans localStorage (ttt_cfg).
  private buildConfigSection(): void {
    const head = document.createElement("div");
    head.className = "cfg-head";
    const title = document.createElement("span");
    title.className = "debug-title";
    this.reg({ el: title, text: "cfgTitle" });
    const resetAll = this.btn("cfgResetAll", "cfgResetAllTip", () => {
      resetAllConfig();
      this.onConfigEdited();
    });
    resetAll.className = "rst-all";
    head.append(title, resetAll);
    this.debugPanel.appendChild(head);

    const list = document.createElement("div");
    list.className = "cfg-list";
    for (const [secKey, keys] of CFG_SECTIONS) {
      const sec = document.createElement("div");
      sec.className = "cfg-sec";
      this.reg({ el: sec, text: secKey });
      list.appendChild(sec);
      for (const key of keys) list.appendChild(this.cfgRow(key));
    }
    this.debugPanel.appendChild(list);
  }

  private cfgRow(key: ConfigNumKey): HTMLElement {
    const row = document.createElement("div");
    row.className = "cfg-row";
    const name = document.createElement("span");
    name.className = "cfg-name";
    name.textContent = key;
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.addEventListener("change", () => {
      const v = Number(input.value);
      if (input.value !== "" && Number.isFinite(v)) setConfigValue(key, v);
      this.onConfigEdited();
    });
    const rst = document.createElement("button");
    rst.className = "rst";
    rst.textContent = "RST";
    rst.addEventListener("click", () => {
      resetConfigValue(key);
      this.onConfigEdited();
    });
    row.append(name, input, rst);
    this.cfgRows.push({ key, row, input, rst });
    return row;
  }

  // Après toute édition : effets immédiats côté jeu, puis ré-application des
  // libellés (lignes en gras, valeurs normalisées, boutons dépendants).
  private onConfigEdited(): void {
    this.game.onConfigChanged();
    this.applyTexts();
  }

  private refreshCfgRows(): void {
    for (const r of this.cfgRows) {
      const custom = isConfigCustom(r.key);
      r.row.classList.toggle("custom", custom);
      const note = CFG_NOTES[r.key];
      r.row.title = t(`cfg_${r.key}`) + (note ? `\n${t(note)}` : "");
      r.rst.title = t("cfgRstTip", { v: CONFIG_DEFAULTS[r.key] });
      r.rst.disabled = !custom;
      if (document.activeElement !== r.input) r.input.value = String(Config[r.key]);
    }
  }

  private buildOptionsMenu(): void {
    this.optionsMenu.innerHTML = "";

    // Entrée statique : libellé traduit fixe, fermée au clic.
    const staticBtn = (text: StringKey, onClick: () => void) => {
      const item = document.createElement("button");
      item.className = "menu-item";
      this.reg({ el: item, text });
      item.addEventListener("click", () => {
        onClick();
        this.hideOptionsMenu();
      });
      return item;
    };

    // Entrée à état : le libellé (rafraîchi par refreshOptionsLabels) affiche
    // la valeur courante. On reste dans le menu pour enchaîner les réglages.
    const stateBtn = (onClick: () => void) => {
      const item = document.createElement("button");
      item.className = "menu-item";
      item.addEventListener("click", () => {
        onClick();
        this.refreshOptionsLabels();
      });
      return item;
    };

    this.optionsMenu.appendChild(staticBtn("optionsHelp", () => this.showHelp()));
    this.optionsMenu.appendChild(
      staticBtn("optionsDebug", () => this.debugPanel.classList.toggle("hidden")),
    );

    this.btnOptLang = stateBtn(() => this.game.toggleLang());
    this.btnOptMusic = stateBtn(() => this.game.toggleMusic());
    this.btnOptAudio = stateBtn(() => this.game.toggleSfx());
    this.optionsMenu.append(this.btnOptLang, this.btnOptMusic, this.btnOptAudio);

    this.refreshOptionsLabels();
  }

  // Met à jour les libellés des entrées à état (langue / musique / effets).
  private refreshOptionsLabels(): void {
    const onOff = (b: boolean) => t(b ? "optionsOn" : "optionsOff");
    this.setText(this.btnOptLang, t("optionsLanguage", { v: getLang().toUpperCase() }));
    this.setText(
      this.btnOptMusic,
      t("optionsMusic", { v: onOff(this.game.audio.isMusicEnabled()) }),
    );
    this.setText(this.btnOptAudio, t("optionsAudio", { v: onOff(this.game.audio.isSfxEnabled()) }));
  }

  private toggleOptionsMenu(): void {
    this.optionsMenu.classList.toggle("hidden");
  }

  private hideOptionsMenu(): void {
    this.optionsMenu.classList.add("hidden");
  }

  private hideOnboarding(): void {
    this.onboard.classList.add("hidden");
  }

  showOnboarding(): void {
    this.onboard.classList.remove("hidden");
  }

  private showConfirmNewGame(): void {
    this.confirmModal.classList.remove("hidden");
  }

  private hideConfirmNewGame(): void {
    this.confirmModal.classList.add("hidden");
  }

  showSpeedwayLocked(): void {
    this.speedwayModal.classList.remove("hidden");
  }

  private hideSpeedwayLocked(): void {
    this.speedwayModal.classList.add("hidden");
  }

  private hideHelp(): void {
    this.helpPanel.classList.add("hidden");
  }

  private showHelp(): void {
    this.helpPanel.classList.remove("hidden");
  }

  // Ré-applique tous les textes traduits (appelé au changement de langue).
  applyTexts(): void {
    // DEBUG_CREDITS est éditable : on rafraîchit les args avant application.
    this.moneyEntry.textArgs = { n: Config.DEBUG_CREDITS };
    this.moneyEntry.titleArgs = { n: Config.DEBUG_CREDITS };
    this.speedwayLockedEntry.textArgs = { n: Config.SPEEDWAY_UNLOCK_SCORE };
    for (const e of this.registry) {
      if (e.text) this.setText(e.el, t(e.text, e.textArgs));
      if (e.html) e.el.innerHTML = t(e.html);
      if (e.title) e.el.title = t(e.title, e.titleArgs);
    }
    this.setText(this.btnLang, getLang() === "fr" ? "EN" : "FR");
    document.documentElement.lang = getLang();
    this.refreshOptionsLabels();
    this.refreshTools();
    this.refreshCfgRows();
  }

  refreshTools(): void {
    for (const [key, b] of this.toolButtons) {
      b.classList.toggle("active", this.game.input.tool === key);
    }
    const speedway = this.toolButtons.get("speedway");
    if (speedway) {
      const locked = !this.game.isSpeedwayUnlocked();
      speedway.classList.toggle("locked", locked);
      speedway.title = locked
        ? t("toolSpeedwayLockedTip", { n: Config.SPEEDWAY_UNLOCK_SCORE })
        : t("toolSpeedwayTip");
    }
    this.setText(this.elLevel, t("level", { n: this.game.input.level }));

    // Flèches isométriques basées sur la direction et la rotation de la caméra
    // À rot=0 : Est→↘️, Sud→↙️, Ouest→↖️, Nord→↗️
    const isoArrows = ["↘️", "↗️", "↖️", "↙️"];
    const isoArraysSud = ["↙️", "↘️", "↗️", "↖️"];
    const isoArraysNord = ["↗️", "↖️", "↙️", "↘️"];

    let visibleArrow: string;
    if (this.game.input.rampDir === 1) {
      // Sud : utiliser un array décalé, indexé par rot
      visibleArrow = isoArraysSud[this.game.renderer.rot];
    } else if (this.game.input.rampDir === 3) {
      // Nord : utiliser un array décalé, indexé par rot
      visibleArrow = isoArraysNord[this.game.renderer.rot];
    } else {
      // Est/Ouest : rotation horaire
      const visualArrowIdx = (this.game.input.rampDir + this.game.renderer.rot) % 4;
      visibleArrow = isoArrows[visualArrowIdx];
    }

    this.setText(
      this.btnDir,
      t("rampDir", {
        d: t(`dir${this.game.input.rampDir}` as StringKey),
        a: visibleArrow,
      }),
    );
  }

  update(): void {
    const sim = this.game.sim;
    this.setText(this.elCredits, `¤ ${sim.credits}`);
    this.setText(this.elScore, t("statScore", { n: sim.score }));
    this.setText(this.elBest, t("statBest", { n: this.game.best }));
    this.setText(
      this.elDebugDistance,
      t("statDistance", { v: this.formatDistance(sim.carDistanceCells) }),
    );
    this.setText(this.elDebugPackages, t("statPackages", { n: sim.packagesPicked }));
    this.setText(
      this.elDebugDuration,
      t("statDuration", { v: this.formatDuration(sim.elapsed) }),
    );
    this.setText(this.btnPause, this.game.paused ? t("resume") : t("pause"));
    this.setText(this.btnSpeed, `x${this.game.speed}`);
    this.setText(this.elStatus, this.game.message || t("ready"));
    this.refreshTools();
  }

  showGameOver(score: number, best: number): void {
    const sim = this.game.sim;
    this.setText(this.elFinalScore, t("overScore", { n: score }));
    this.setText(this.elFinalBest, t("overBest", { n: best }));
    this.setText(
      this.elFinalDistance,
      t("statDistance", { v: this.formatDistance(sim.carDistanceCells) }),
    );
    this.setText(this.elFinalPackages, t("statPackages", { n: sim.packagesPicked }));
    this.setText(
      this.elFinalDuration,
      t("statDuration", { v: this.formatDuration(sim.elapsed) }),
    );
    const msg = encodeURIComponent(t("shareScore", { n: score, url: Config.GAME_URL }));
    this.btnShareX.href = `https://x.com/intent/post?text=${msg}`;
    this.btnShareBsky.href = `https://bsky.app/intent/compose?text=${msg}`;
    this.overlay.classList.remove("hidden");
  }

  hideGameOver(): void {
    this.overlay.classList.add("hidden");
  }
}
