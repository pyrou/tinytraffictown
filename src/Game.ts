import { Config } from "./Config";
import type { Dir } from "./core/types";
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
import { UI } from "./ui/UI";

export class Game {
  sim: Simulation;
  renderer: Renderer;
  input: Input;
  ui: UI;

  paused = false;
  speed: 1 | 2 = 1;
  best = 0;
  message = "";

  private msgTimer = 0;
  private autosaveTimer = Config.AUTOSAVE_INTERVAL;
  private lastTime = 0;
  private gameOverShown = false;

  constructor(root: HTMLElement) {
    this.best = loadBest();

    const opts = loadOptions();
    setLang(opts.lang ?? (navigator.language.startsWith("fr") ? "fr" : "en"));

    const canvas = document.createElement("canvas");
    canvas.id = "game";
    root.appendChild(canvas);

    const save = loadGame();
    this.sim = save ? Simulation.fromSave(save) : new Simulation();
    this.sim.onMessage = (m) => this.setMessage(m);

    this.renderer = new Renderer(canvas);
    this.renderer.rot = opts.rotation;
    this.speed = opts.speed as 1 | 2;

    this.input = new Input(canvas, this);
    this.ui = new UI(root, this);

    this.setMessage(save ? t("msgRestored") : t("msgWelcome"));

    window.addEventListener("beforeunload", () => this.autosave());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.autosave();
    });

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(t: number): void {
    const dt = Math.min(0.1, (t - this.lastTime) / 1000);
    this.lastTime = t;

    if (!this.paused && !this.sim.gameOver) {
      this.sim.update(dt * this.speed);
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

  place(x: number, y: number, level: number, ramp: Dir | null): void {
    const r = this.sim.tryPlace(x, y, level, ramp);
    if (r.msg) this.setMessage(r.msg);
  }

  remove(x: number, y: number): void {
    const r = this.sim.tryRemove(x, y);
    if (r.msg) this.setMessage(r.msg);
  }

  // ---- contrôles ----

  togglePause(): void {
    this.paused = !this.paused;
  }

  setSpeed(s: 1 | 2): void {
    this.speed = s;
    this.saveOpts();
  }

  rotate(d: number): void {
    this.renderer.rot = (this.renderer.rot + d + 4) % 4;
    this.saveOpts();
  }

  toggleLang(): void {
    setLang(getLang() === "fr" ? "en" : "fr");
    this.saveOpts();
    this.ui.applyTexts();
  }

  newGame(): void {
    clearGame();
    this.sim = new Simulation();
    this.sim.onMessage = (m) => this.setMessage(m);
    this.gameOverShown = false;
    this.paused = false;
    this.ui.hideGameOver();
    this.setMessage(t("msgNewGame"));
  }

  setMessage(m: string): void {
    this.message = m;
    this.msgTimer = 4;
  }

  // ---- menu de debug ----

  debugSpawnBuilding(type: "house" | "biz", color: number): void {
    const ok = this.sim.debugSpawnBuilding(type, color);
    this.setMessage(t(ok ? (type === "house" ? "dbgHouseAdded" : "dbgBizAdded") : "dbgNoSpot"));
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
    saveOptions({ rotation: this.renderer.rot, speed: this.speed, lang: getLang() });
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
