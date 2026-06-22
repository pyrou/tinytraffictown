import { Config } from "../Config";
import type { Dir, TreeKind } from "../core/types";
import type { Game } from "../Game";

export type Tool =
  | "road"
  | "speedway"
  | "ramp"
  | "bulldoze"
  | "debugHouse"
  | "debugBiz"
  | "debugRiver"
  | "debugTreePine"
  | "debugTreeLeafy";

export class Input {
  tool: Tool = "road";
  level = 0; // niveau de construction courant
  rampDir: Dir = 0; // direction ascendante de la rampe (espace grille)
  hover: { x: number; y: number } | null = null;

  private game: Game;
  private canvas: HTMLCanvasElement;
  private painting = false;
  private panning = false;
  private lastPan = { x: 0, y: 0 };
  private touchPanning = false;
  private lastTouchPan = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, game: Game) {
    this.canvas = canvas;
    this.game = game;

    canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    canvas.addEventListener("dblclick", (e) => this.onDblClick(e));
    window.addEventListener("mouseup", () => {
      this.painting = false;
      this.panning = false;
    });
    canvas.addEventListener("mouseleave", () => (this.hover = null));
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
    canvas.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
    canvas.addEventListener("touchend", (e) => this.onTouchEnd(e));
    canvas.addEventListener("touchcancel", (e) => this.onTouchEnd(e));
    window.addEventListener("keydown", (e) => this.onKey(e));
  }

  setTool(t: Tool): void {
    if (t === "speedway" && !this.game.isSpeedwayUnlocked()) {
      this.game.ui.showSpeedwayLocked();
      return;
    }
    this.tool = t;
    this.game.ui.refreshTools();
  }

  setLevel(l: number): void {
    this.level = Math.max(0, Math.min(Config.MAX_LEVEL, l));
    this.game.ui.refreshTools();
  }

  cycleRampDir(): void {
    this.rampDir = (((this.rampDir + 1) % 4) as Dir);
    this.game.ui.refreshTools();
  }

  // Coordonnées canvas basse résolution depuis un évènement souris.
  private canvasPos(e: MouseEvent): { px: number; py: number } {
    const r = this.canvas.getBoundingClientRect();
    return {
      px: ((e.clientX - r.left) / r.width) * this.canvas.width,
      py: ((e.clientY - r.top) / r.height) * this.canvas.height,
    };
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 1 || e.button === 2) {
      this.panning = true;
      this.lastPan = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button !== 0) return;
    const { px, py } = this.canvasPos(e);
    const cell = this.game.renderer.screenToCell(px, py);
    this.painting = this.isBrushTool();
    if (cell) this.act(cell.x, cell.y);
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.panning) {
      const dx = (e.clientX - this.lastPan.x) / Config.RENDER_SCALE;
      const dy = (e.clientY - this.lastPan.y) / Config.RENDER_SCALE;
      this.game.renderer.panX += dx;
      this.game.renderer.panY += dy;
      this.lastPan = { x: e.clientX, y: e.clientY };
      return;
    }
    const { px, py } = this.canvasPos(e);
    const cell = this.game.renderer.screenToCell(px, py);
    const changed = !cell || !this.hover || cell.x !== this.hover.x || cell.y !== this.hover.y;
    this.hover = cell;
    if (this.painting && cell && changed) this.act(cell.x, cell.y);
  }

  // Double-clic en mode route : bascule l'axe prioritaire d'un croisement en X.
  private onDblClick(e: MouseEvent): void {
    if (e.button !== 0 || this.tool !== "road") return;
    const { px, py } = this.canvasPos(e);
    const cell = this.game.renderer.screenToCell(px, py);
    if (cell) this.game.toggleMainAxis(cell.x, cell.y);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.setLevel(this.level + (e.deltaY < 0 ? 1 : -1));
  }

  private touchCenter(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length < 2) return;
    e.preventDefault();
    this.painting = false;
    this.panning = false;
    this.touchPanning = true;
    this.hover = null;
    this.lastTouchPan = this.touchCenter(e.touches);
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.touchPanning || e.touches.length < 2) return;
    e.preventDefault();
    const center = this.touchCenter(e.touches);
    const dx = (center.x - this.lastTouchPan.x) / Config.RENDER_SCALE;
    const dy = (center.y - this.lastTouchPan.y) / Config.RENDER_SCALE;
    this.game.renderer.panX += dx;
    this.game.renderer.panY += dy;
    this.lastTouchPan = center;
  }

  private onTouchEnd(e: TouchEvent): void {
    if (e.touches.length >= 2) {
      this.lastTouchPan = this.touchCenter(e.touches);
      return;
    }
    this.touchPanning = false;
  }

  private act(x: number, y: number): void {
    if (this.tool === "road" || this.tool === "speedway") {
      this.game.place(x, y, this.level, null, this.tool === "speedway" ? "speedway" : "road");
    } else if (this.tool === "ramp") {
      this.game.place(x, y, this.level, this.rampDir);
    } else if (this.tool === "debugHouse" || this.tool === "debugBiz") {
      this.game.debugPlaceBuilding(this.tool === "debugHouse" ? "house" : "biz", x, y);
    } else if (this.tool === "debugRiver") {
      this.game.debugPlaceRiver(x, y);
    } else if (this.tool === "debugTreePine" || this.tool === "debugTreeLeafy") {
      const kind: TreeKind = this.tool === "debugTreePine" ? "pine" : "leafy";
      this.game.debugPlaceTree(kind, x, y);
    } else {
      this.game.remove(x, y);
    }
  }

  private isBrushTool(): boolean {
    return this.tool === "road" || this.tool === "speedway" || this.tool === "ramp" || this.tool === "bulldoze";
  }

  private onKey(e: KeyboardEvent): void {
    switch (e.key.toLowerCase()) {
      case " ":
        e.preventDefault();
        this.game.togglePause();
        break;
      case "r":
        this.game.rotate(1);
        break;
      case "t":
        this.cycleRampDir();
        break;
      case "1":
        this.game.setSpeed(1);
        break;
      case "2":
        this.game.setSpeed(2);
        break;
      case "4":
        this.game.setSpeed(4);
        break;
      case "a":
        this.setTool("road");
        break;
      case "s":
        this.setTool("speedway");
        break;
      case "z":
        this.setTool("ramp");
        break;
      case "x":
        this.setTool("bulldoze");
        break;
      case "q":
        this.setLevel(this.level - 1);
        break;
      case "e":
        this.setLevel(this.level + 1);
        break;
      case "arrowup":
        this.game.renderer.panY += 24;
        break;
      case "arrowdown":
        this.game.renderer.panY -= 24;
        break;
      case "arrowleft":
        this.game.renderer.panX += 24;
        break;
      case "arrowright":
        this.game.renderer.panX -= 24;
        break;
    }
  }
}
