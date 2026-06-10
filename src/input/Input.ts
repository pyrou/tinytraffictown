import { Config } from "../Config";
import type { Dir } from "../core/types";
import type { Game } from "../Game";

export type Tool = "road" | "ramp" | "bulldoze";

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
    window.addEventListener("keydown", (e) => this.onKey(e));
  }

  setTool(t: Tool): void {
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
    this.painting = true;
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

  private act(x: number, y: number): void {
    if (this.tool === "road") {
      this.game.place(x, y, this.level, null);
    } else if (this.tool === "ramp") {
      this.game.place(x, y, this.level, this.rampDir);
    } else {
      this.game.remove(x, y);
    }
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
      case "a":
        this.setTool("road");
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
