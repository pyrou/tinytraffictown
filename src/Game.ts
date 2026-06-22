import { Config } from "./Config";
import type { BuildingType, Dir, RoadKind, TreeKind } from "./core/types";
import { getLang, setLang, t } from "./i18n";
import { Input } from "./input/Input";
import { Renderer } from "./render/Renderer";
import { Simulation } from "./sim/Simulation";
import {
  clearGame,
  loadBest,
  loadGame,
  loadOptions,
  saveBest,
  saveGame,
  saveOptions,
} from "./storage/Storage";
import { decodeMap, encodeMap } from "./storage/MapCode";
import { UI } from "./ui/UI";
import { AudioManager } from "./audio/AudioManager";

export class Game {
  sim: Simulation;
  renderer: Renderer;
  input: Input;
  ui: UI;
  audio: AudioManager;

  paused = false;
  speed: 1 | 2 | 4 = 1;
  best = 0;
  message = "";

  private msgTimer = 0;
  private autosaveTimer = Config.AUTOSAVE_INTERVAL;
  private lastTime = 0;
  private gameOverShown = false;
  private musicStarted = false;

  constructor(root: HTMLElement) {
    this.best = loadBest();

    const opts = loadOptions();
    setLang(opts.lang ?? (navigator.language.startsWith("fr") ? "fr" : "en"));

    this.audio = new AudioManager();
    this.audio.setMusicEnabled(opts.musicEnabled);
    this.audio.setSfxEnabled(opts.sfxEnabled);

    const canvas = document.createElement("canvas");
    canvas.id = "game";
    root.appendChild(canvas);

    // Une carte partagée dans l'URL (#…) prime sur la sauvegarde locale.
    const shared = this.loadSharedMap();
    const save = shared.sim ? null : loadGame();
    this.sim = shared.sim ?? (save ? Simulation.fromSave(save) : new Simulation());
    this.sim.onMessage = (m) => this.setMessage(m);
    this.sim.onBuildingSpawned = () => this.audio.playBuildingSound();

    this.renderer = new Renderer(canvas);
    this.renderer.rot = opts.rotation;
    this.speed = opts.speed as 1 | 2 | 4;

    this.input = new Input(canvas, this);
    this.ui = new UI(root, this);

    this.setMessage(shared.msg ?? t(save ? "msgRestored" : "msgWelcome"));

    // La lecture audio exige un geste utilisateur : on démarre la musique au
    // tout premier clic/toucher n'importe où (bouton « Jouer » de l'onboarding
    // inclus, qui recouvre le canvas), une seule fois.
    const kick = () => this.startMusic();
    document.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("beforeunload", () => this.autosave());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.autosave();
    });

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private startMusic(): void {
    if (!this.musicStarted) {
      this.musicStarted = true;
      this.audio.playBackgroundMusic();
    }
  }

  private loop(t: number): void {
    const dt = Math.min(0.1, (t - this.lastTime) / 1000);
    this.lastTime = t;

    if (!this.paused && !this.sim.gameOver) {
      this.sim.update(dt * this.speed, dt);
      this.autosaveTimer -= dt;
      if (this.autosaveTimer <= 0) {
        this.autosaveTimer = Config.AUTOSAVE_INTERVAL;
        this.autosave();
      }
    }

    if (this.sim.gameOver && !this.gameOverShown) {
      this.onGameOver();
    }

    if (this.message) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0) this.message = "";
    }

    this.renderer.render(this);
    this.ui.update();
    requestAnimationFrame((tt) => this.loop(tt));
  }

  // ---- actions de construction ----

  place(x: number, y: number, level: number, ramp: Dir | null, kind: RoadKind = "road"): void {
    if (kind === "speedway" && !this.isSpeedwayUnlocked()) {
      this.ui.showSpeedwayLocked();
      return;
    }
    const r = this.sim.tryPlace(x, y, level, ramp, kind);
    if (r.msg) this.setMessage(r.msg);
  }

  isSpeedwayUnlocked(): boolean {
    return this.sim.score >= Config.SPEEDWAY_UNLOCK_SCORE;
  }

  remove(x: number, y: number): void {
    const r = this.sim.tryRemove(x, y, this.ui.isDebugOpen());
    if (r.msg) this.setMessage(r.msg);
  }

  // Double-clic (outil route) sur un croisement en X : bascule l'axe prioritaire.
  toggleMainAxis(x: number, y: number): void {
    if (this.sim.toggleMainAxis(x, y)) this.setMessage(t("msgAxisSwitched"));
  }

  // ---- contrôles ----

  togglePause(): void {
    this.paused = !this.paused;
  }

  setSpeed(s: 1 | 2 | 4): void {
    this.speed = s;
    this.saveOpts();
  }

  rotate(d: number): void {
    this.renderer.rot = (this.renderer.rot + d + 4) % 4;
    this.ui.refreshTools();
    this.saveOpts();
  }

  toggleLang(): void {
    setLang(getLang() === "fr" ? "en" : "fr");
    this.saveOpts();
    this.ui.applyTexts();
  }

  toggleMusic(): void {
    const enabled = !this.audio.isMusicEnabled();
    this.audio.setMusicEnabled(enabled);
    if (enabled) this.audio.playBackgroundMusic();
    else this.audio.stopBackgroundMusic();
    this.saveOpts();
  }

  toggleSfx(): void {
    const enabled = !this.audio.isSfxEnabled();
    this.audio.setSfxEnabled(enabled);
    this.saveOpts();
  }

  // Lit une carte partagée dans le fragment d'URL, puis l'efface aussitôt :
  // un refresh recharge la partie autosauvegardée, pas le snapshot partagé.
  private loadSharedMap(): { sim: Simulation | null; msg: string | null } {
    const code = location.hash.slice(1);
    if (!code) return { sim: null, msg: null };
    history.replaceState(null, "", location.pathname + location.search);
    const m = decodeMap(code);
    if (m === "badVersion") return { sim: null, msg: t("msgMapVersion") };
    if (m === null || m.size !== Config.GRID) return { sim: null, msg: t("msgMapInvalid") };
    return { sim: Simulation.fromMapData(m), msg: t("msgMapLoaded") };
  }

  // Copie dans le presse-papiers un lien contenant la carte courante.
  shareMap(): void {
    const code = encodeMap(this.sim.toMapData());
    const url = `${location.origin}${location.pathname}${location.search}#${code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => this.setMessage(t("msgShareCopied")),
        () => window.prompt(t("shareTip"), url),
      );
    } else {
      window.prompt(t("shareTip"), url);
    }
  }

  newGame(): void {
    clearGame();
    this.sim = new Simulation();
    this.sim.onMessage = (m) => this.setMessage(m);
    this.sim.onBuildingSpawned = () => this.audio.playBuildingSound();
    this.gameOverShown = false;
    this.paused = false;
    this.ui.hideGameOver();
    this.ui.showOnboarding();
    this.setMessage(t("msgNewGame"));
  }

  setMessage(m: string): void {
    this.message = m;
    this.msgTimer = 4;
  }

  // ---- menu de debug ----

  // Appelé après modification d'un paramètre de Config via la sidebar debug :
  // applique les effets immédiats (RENDER_SCALE → taille du canvas). Le reste
  // est lu en continu par la sim/le rendu, ou signalé « nouvelle partie /
  // rechargement requis » dans l'infobulle du paramètre.
  onConfigChanged(): void {
    this.renderer.resize();
  }

  debugPlaceBuilding(type: BuildingType, x: number, y: number): void {
    const ok = this.sim.debugPlaceBuilding(type, this.ui.getDebugColor(), x, y);
    this.setMessage(t(ok ? (type === "house" ? "dbgHouseAdded" : "dbgBizAdded") : "dbgNoSpot"));
  }

  debugPlaceRiver(x: number, y: number): void {
    const ok = this.sim.debugPlaceRiver(x, y);
    this.setMessage(t(ok ? "dbgRiverAdded" : "dbgNoSpot"));
  }

  debugPlaceTree(kind: TreeKind, x: number, y: number): void {
    const ok = this.sim.debugPlaceTree(kind, x, y);
    this.setMessage(t(ok ? "dbgTreeAdded" : "dbgNoSpot"));
  }

  debugSpawnBike(): void {
    const ok = this.sim.spawnBike();
    this.setMessage(t(ok ? "dbgBike" : "dbgNoBikeRoute"));
  }

  debugAddCredits(): void {
    this.sim.debugAddCredits(Config.DEBUG_CREDITS);
    this.setMessage(t("dbgMoney", { n: Config.DEBUG_CREDITS }));
  }

  debugClearOrders(): void {
    this.sim.debugClearOrders();
    this.setMessage(t("dbgPurged"));
  }

  debugClearTraffic(): void {
    const n = this.sim.debugClearTraffic();
    this.setMessage(t("dbgTrafficCleared", { n }));
  }

  // ---- persistance ----

  private autosave(): void {
    if (!this.sim.gameOver) saveGame(this.sim.serialize());
  }

  private saveOpts(): void {
    saveOptions({
      rotation: this.renderer.rot,
      speed: this.speed,
      lang: getLang(),
      musicEnabled: this.audio.isMusicEnabled(),
      sfxEnabled: this.audio.isSfxEnabled(),
    });
  }

  private onGameOver(): void {
    this.gameOverShown = true;
    if (this.sim.score > this.best) {
      this.best = this.sim.score;
      saveBest(this.best);
    }
    clearGame();
    this.ui.showGameOver(this.sim.score, this.best);
  }
}
