import { Config } from "../Config";
import type { Game } from "../Game";
import { getLang, t } from "../i18n";
import type { StringKey } from "../i18n";
import { hasSeenOnboarding, markOnboardingSeen } from "../storage/Storage";

// Élément traduisible : ré-appliqué à chaque changement de langue.
interface TrEntry {
  el: HTMLElement;
  text?: StringKey;
  textArgs?: Record<string, string | number>;
  html?: StringKey;
  title?: StringKey;
  titleArgs?: Record<string, string | number>;
}

export class UI {
  private game: Game;
  private registry: TrEntry[] = [];
  private elCredits!: HTMLElement;
  private elScore!: HTMLElement;
  private elBest!: HTMLElement;
  private elPayout!: HTMLElement;
  private btnPause!: HTMLButtonElement;
  private btnSpeed!: HTMLButtonElement;
  private btnLang!: HTMLButtonElement;
  private toolButtons = new Map<string, HTMLButtonElement>();
  private elLevel!: HTMLElement;
  private btnDir!: HTMLButtonElement;
  private elStatus!: HTMLElement;
  private debugPanel!: HTMLElement;
  private debugColor = 0;
  private overlay!: HTMLElement;
  private onboard!: HTMLElement;
  private elFinalScore!: HTMLElement;
  private elFinalBest!: HTMLElement;

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
    this.elPayout = this.stat();
    top.append(this.elCredits, this.elScore, this.elBest, this.elPayout);

    const spacer = document.createElement("span");
    spacer.className = "spacer";
    top.appendChild(spacer);

    this.btnPause = this.btn(null, "pauseTip", () => this.game.togglePause());
    this.btnSpeed = this.btn(null, "speedTip", () =>
      this.game.setSpeed(this.game.speed === 1 ? 2 : 1),
    );
    this.btnLang = this.btn(null, "langTip", () => this.game.toggleLang());
    top.append(
      this.btnPause,
      this.btnSpeed,
      this.btn(null, "rotLeftTip", () => this.game.rotate(-1)),
      this.btn(null, "rotRightTip", () => this.game.rotate(1)),
      this.btn(null, "debugTip", () => this.debugPanel.classList.toggle("hidden")),
      this.btnLang,
      this.btn("shareBtn", "shareTip", () => this.game.shareMap()),
      this.btn("newGame", "newGameTip", () => this.game.newGame()),
    );
    // libellés fixes non traduits
    const rotBtns = top.querySelectorAll("button");
    rotBtns[2].textContent = "⟲";
    rotBtns[3].textContent = "⟳";
    rotBtns[4].textContent = "🐞";
    root.appendChild(top);

    // --- menu de debug ---
    this.debugPanel = document.createElement("div");
    this.debugPanel.id = "debug";
    this.debugPanel.className = "panel hidden";
    const dTitle = document.createElement("div");
    dTitle.className = "debug-title";
    dTitle.textContent = "DEBUG";
    this.debugPanel.appendChild(dTitle);

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

    this.debugPanel.appendChild(
      this.btn("debugHouse", "debugHouseTip", () =>
        this.game.debugSpawnBuilding("house", this.debugColor),
      ),
    );
    this.debugPanel.appendChild(
      this.btn("debugBiz", "debugBizTip", () =>
        this.game.debugSpawnBuilding("biz", this.debugColor),
      ),
    );
    this.debugPanel.appendChild(this.btn("debugBike", "debugBikeTip", () => this.game.debugSpawnBike()));
    const bMoney = this.btn(null, null, () => this.game.debugAddCredits());
    this.reg({
      el: bMoney,
      text: "debugMoney",
      textArgs: { n: Config.DEBUG_CREDITS },
      title: "debugMoneyTip",
      titleArgs: { n: Config.DEBUG_CREDITS },
    });
    this.debugPanel.appendChild(bMoney);
    this.debugPanel.appendChild(
      this.btn("debugPurge", "debugPurgeTip", () => this.game.debugClearOrders()),
    );
    this.debugPanel.appendChild(
      this.btn("debugTraffic", "debugTrafficTip", () => this.game.debugClearTraffic()),
    );
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
    const help = document.createElement("div");
    help.id = "help";
    help.className = "panel";
    this.reg({ el: help, html: "help" });
    root.appendChild(help);

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
    const replay = this.btn("replay", "replayTip", () => this.game.newGame());
    const overStar = this.linkBtn("starGithub", "starGithubTip", Config.GITHUB_URL);
    panel.append(h1, p1, this.elFinalScore, this.elFinalBest, replay, overStar);
    this.overlay.appendChild(panel);
    root.appendChild(this.overlay);

    // --- écran d'accueil ---
    this.onboard = document.createElement("div");
    this.onboard.id = "onboard";
    if (hasSeenOnboarding()) this.onboard.classList.add("hidden");
    const oPanel = document.createElement("div");
    oPanel.className = "panel";
    const oTitle = document.createElement("h1");
    this.reg({ el: oTitle, text: "onboardTitle" });
    const oText = document.createElement("p");
    this.reg({ el: oText, text: "onboardText" });
    const oActions = document.createElement("div");
    oActions.className = "actions";
    const oStar = this.linkBtn("starGithub", "starGithubTip", Config.GITHUB_URL);
    const oBadge = document.createElement("img");
    oBadge.className = "star-badge";
    oBadge.src = `https://img.shields.io/github/stars/${Config.GITHUB_URL.replace("https://github.com/", "")}?style=social`;
    oBadge.alt = "GitHub stars";
    const oStart = this.btn("startPlaying", "startPlayingTip", () => this.hideOnboarding());
    oActions.append(oStar, oBadge, oStart);
    oPanel.append(oTitle, oText, oActions);
    this.onboard.appendChild(oPanel);
    root.appendChild(this.onboard);
  }

  private hideOnboarding(): void {
    this.onboard.classList.add("hidden");
    markOnboardingSeen();
  }

  private showOnboarding(): void {
    this.onboard.classList.remove("hidden");
  }

  // Ré-applique tous les textes traduits (appelé au changement de langue).
  applyTexts(): void {
    for (const e of this.registry) {
      if (e.text) e.el.textContent = t(e.text, e.textArgs);
      if (e.html) e.el.innerHTML = t(e.html);
      if (e.title) e.el.title = t(e.title, e.titleArgs);
    }
    this.btnLang.textContent = getLang() === "fr" ? "EN" : "FR";
    document.documentElement.lang = getLang();
    this.refreshTools();
  }

  refreshTools(): void {
    for (const [key, b] of this.toolButtons) {
      b.classList.toggle("active", this.game.input.tool === key);
    }
    this.elLevel.textContent = t("level", { n: this.game.input.level });
    this.btnDir.textContent = t("rampDir", {
      d: t(`dir${this.game.input.rampDir}` as StringKey),
    });
  }

  update(): void {
    const sim = this.game.sim;
    this.elCredits.textContent = `¤ ${sim.credits}`;
    this.elScore.textContent = t("statScore", { n: sim.score });
    this.elBest.textContent = t("statBest", { n: this.game.best });
    this.elPayout.textContent = t("statPayout", {
      a: Config.PAYOUT_AMOUNT,
      s: Math.ceil(sim.payoutTimer),
    });
    this.btnPause.textContent = this.game.paused ? t("resume") : t("pause");
    this.btnSpeed.textContent = `x${this.game.speed}`;
    this.elStatus.textContent = this.game.message || t("ready");
  }

  showGameOver(score: number, best: number): void {
    this.elFinalScore.textContent = t("overScore", { n: score });
    this.elFinalBest.textContent = t("overBest", { n: best });
    this.overlay.classList.remove("hidden");
  }

  hideGameOver(): void {
    this.overlay.classList.add("hidden");
  }
}
