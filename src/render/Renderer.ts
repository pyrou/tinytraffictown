import { Config } from "../Config";
import type { Dir, RoadPiece, Building } from "../core/types";
import { DX, DY } from "../core/types";
import type { Game } from "../Game";
import type { Simulation } from "../sim/Simulation";

const TW2 = Config.TILE_W / 2;
const TH2 = Config.TILE_H / 2;
const Z = Config.Z_STEP;

// Coins du losange en pixels écran : N (haut), E (droite), S (bas), W (gauche)
const CORNERS: [number, number][] = [
  [0, -TH2],
  [TW2, 0],
  [0, TH2],
  [-TW2, 0],
];
// Coins (indices N=0,E=1,S=2,W=3) bordant le bord du losange pour chaque
// direction écran : 0=+rx → [E,S], 1=+ry → [S,W], 2=-rx → [W,N], 3=-ry → [N,E]
const EDGE_CORNERS: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 0],
  [0, 1],
];

interface Drawable {
  key: number;
  draw: () => void;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  rot = 0; // rotation caméra : 0..3 (x 90°)
  panX = 0;
  panY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize(): void {
    this.canvas.width = Math.max(320, Math.floor(window.innerWidth / Config.RENDER_SCALE));
    this.canvas.height = Math.max(200, Math.floor(window.innerHeight / Config.RENDER_SCALE));
    this.ctx.imageSmoothingEnabled = false;
  }

  // ---- transformations grille <-> écran ----

  // Rotation des coordonnées grille (continues) selon la caméra.
  rotPoint(x: number, y: number): [number, number] {
    const s = Config.GRID - 1;
    switch (this.rot) {
      case 1:
        return [y, s - x];
      case 2:
        return [s - x, s - y];
      case 3:
        return [s - y, x];
      default:
        return [x, y];
    }
  }

  // Direction grille -> direction écran selon la rotation.
  rotDir(d: Dir): Dir {
    return (((d + 3 * this.rot) % 4) as Dir);
  }

  private originX(): number {
    return Math.floor(this.canvas.width / 2 + this.panX);
  }

  private originY(): number {
    return Math.floor(this.canvas.height / 2 - (Config.GRID - 1) * TH2 + this.panY);
  }

  // Coordonnées grille (continues) -> pixel écran.
  project(x: number, y: number, z: number): [number, number] {
    const [rx, ry] = this.rotPoint(x, y);
    return [
      Math.round((rx - ry) * TW2 + this.originX()),
      Math.round((rx + ry) * TH2 - z * Z + this.originY()),
    ];
  }

  // Pixel écran (coordonnées canvas basse résolution) -> cellule grille (plan z=0).
  screenToCell(px: number, py: number): { x: number; y: number } | null {
    const a = (px - this.originX()) / TW2;
    const b = (py - this.originY()) / TH2;
    const rx = Math.round((a + b) / 2);
    const ry = Math.round((b - a) / 2);
    const s = Config.GRID - 1;
    let x: number, y: number;
    switch (this.rot) {
      case 1:
        x = s - ry;
        y = rx;
        break;
      case 2:
        x = s - rx;
        y = s - ry;
        break;
      case 3:
        x = ry;
        y = s - rx;
        break;
      default:
        x = rx;
        y = ry;
    }
    if (x < 0 || y < 0 || x > s || y > s) return null;
    return { x, y };
  }

  // ---- rendu principal ----

  render(game: Game): void {
    const g = this.ctx;
    const sim = game.sim;
    g.fillStyle = "#23303a";
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const drawables: Drawable[] = [];
    const size = sim.grid.size;
    const waterFrame = Math.floor((performance.now() / 1000) * Config.WATER_ANIM_FPS);
    // Hauteur maximale dépassant sous une tuile de bord (faces de terre +
    // cascade) : sert à élargir le culling vertical de ces seules tuiles.
    const edgeOverhang = Config.EARTH_DEPTH * (Config.WATERFALL_BLOCKS + 1);

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const [rx, ry] = this.rotPoint(x, y);
        const base = (rx + ry) * 16;
        const [cx, cy] = this.project(x, y, 0);
        const cell = sim.grid.cell(x, y);
        // Seuls les deux bords de la carte tournés vers la caméra exposent
        // leurs faces latérales : la colonne rx max (face droite) et la
        // rangée ry max (face gauche). Partout ailleurs, la tuile voisine
        // les masquerait entièrement — on ne les dessine donc jamais.
        const faceR = rx === size - 1;
        const faceL = ry === size - 1;
        // Sortie de rivière sur un bord arrière : la cascade tombe derrière
        // la carte (clé de tri minimale, peinte sous tout le reste). On n'en
        // voit la face intérieure que si le fondu est assez long pour
        // dépasser sous la silhouette de la carte.
        const backR = cell.river && ry === 0;
        const backL = cell.river && rx === 0;
        if (
          cx < -TW2 ||
          cx > this.canvas.width + TW2 ||
          cy < -40 - (faceL || faceR || backL || backR ? edgeOverhang : 0) ||
          cy > this.canvas.height + 60
        ) {
          continue;
        }
        if (backL || backR) {
          const hb = this.cellHash(x, y);
          drawables.push({
            key: base - 1e6,
            draw: () => {
              if (backL) this.drawWaterfall(cx - TW2, cy, cx, cy - TH2, hb, waterFrame, true);
              if (backR) this.drawWaterfall(cx, cy - TH2, cx + TW2, cy, hb, waterFrame, true);
            },
          });
        }
        drawables.push({
          key: base - 1,
          draw: () => this.drawGround(cx, cy, x, y, cell.river, waterFrame, faceL, faceR),
        });
        // Onde de choc d'un atterrissage : anneau blanc qui s'élargit et
        // s'estompe, rendu en teintant le losange de sol case par case.
        for (const im of sim.impacts) {
          const a = this.impactAlpha(im, x, y);
          if (a <= 0) continue;
          drawables.push({
            key: base - 0.5,
            draw: () => {
              g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
              this.diamondPath(cx, cy, 0, [0, 0, 0, 0]);
              g.fill();
            },
          });
        }
        for (const p of cell.pieces) {
          drawables.push({
            key: base + p.level * 2 + 0.1,
            draw: () => this.drawPiece(cx, cy, p, x, y, sim),
          });
        }
        if (cell.building) {
          const b = cell.building;
          // En chute, la clé suit la hauteur : le bâtiment passe devant les ponts.
          drawables.push({
            key: base + (b.fallZ ?? 0) * 2 + 0.5,
            draw: () => this.drawBuilding(cx, cy, b),
          });
        }
        if (cell.tree) {
          drawables.push({ key: base + 0.5, draw: () => this.drawTree(cx, cy, x, y) });
        }
      }
    }

    // Voitures — clé de profondeur arrondie à la cellule la plus profonde
    // touchée, sinon la voiture passe "sous" la tuile qu'elle est en train
    // d'entrer (les tuiles plates ne doivent jamais masquer une voiture).
    for (const car of sim.cars) {
      const pos = sim.carPos(car);
      const [rx, ry] = this.rotPoint(pos.x, pos.y);
      const key = Math.ceil(rx + ry - 1e-6) * 16 + pos.z * 2 + 0.9;
      const [sx, sy] = this.project(pos.x, pos.y, pos.z);
      drawables.push({
        key,
        draw: () =>
          car.kind === "bike" ? this.drawBike(sx, sy, car.color) : this.drawCar(sx, sy, car.color),
      });
    }

    drawables.sort((a, b) => a.key - b.key);
    for (const d of drawables) d.draw();

    this.drawHover(game);
  }

  // ---- sol ----

  // Hachage déterministe d'une cellule (variations de teinte, mouchetis…).
  private cellHash(gx: number, gy: number): number {
    return (gx * 7349 + gy * 4271 + 131) % 97;
  }

  private drawGround(
    cx: number,
    cy: number,
    gx: number,
    gy: number,
    water: boolean,
    waterFrame: number,
    faceL: boolean,
    faceR: boolean,
  ): void {
    const g = this.ctx;
    const h = this.cellHash(gx, gy);
    // Faces latérales du bloc (avant le dessus, qui recouvre la jonction).
    if (faceL) this.drawBlockFace(cx - TW2, cy, cx, cy + TH2, true, h, water, waterFrame);
    if (faceR) this.drawBlockFace(cx, cy + TH2, cx + TW2, cy, false, h, water, waterFrame);
    if (water) {
      const blues = ["#3a6da3", "#3f74ab", "#35659a"];
      const wave = (waterFrame + h) % 6;
      g.fillStyle = blues[h % 3];
      this.diamondPath(cx, cy, 0, [0, 0, 0, 0]);
      g.fill();
      g.strokeStyle = "rgba(10,25,55,0.35)";
      g.lineWidth = 1;
      g.stroke();
      // reflets clairs (tramage rétro)
      g.fillStyle = "rgba(210,235,255,0.55)";
      g.fillRect(cx + ((h + waterFrame) % 13) - 6, cy + (h % 5) - 2, 2, 1);
      if (wave < 4) {
        g.fillRect(cx + ((h + waterFrame * 2) % 19) - 9, cy + (h % 7) - 3, 2, 1);
      }
      return;
    }
    const shades = ["#5f9447", "#669c4d", "#5a8d43"];
    g.fillStyle = shades[h % 3];
    this.diamondPath(cx, cy, 0, [0, 0, 0, 0]);
    g.fill();
    g.strokeStyle = "rgba(0,0,0,0.10)";
    g.lineWidth = 1;
    g.stroke();
    // petit tramage rétro
    g.fillStyle = "rgba(0,40,0,0.18)";
    g.fillRect(cx + ((h % 13) - 6), cy + ((h % 5) - 2), 1, 1);
    g.fillRect(cx + ((h % 19) - 9), cy + ((h % 7) - 3), 1, 1);
  }

  // Parallélogramme d'une face latérale : arête supérieure (x1,y1)->(x2,y2),
  // décalée verticalement de dy0 (haut) à dy1 (bas).
  private facePath(x1: number, y1: number, x2: number, y2: number, dy0: number, dy1: number): void {
    const g = this.ctx;
    g.beginPath();
    g.moveTo(x1, y1 + dy0);
    g.lineTo(x2, y2 + dy0);
    g.lineTo(x2, y2 + dy1);
    g.lineTo(x1, y1 + dy1);
    g.closePath();
  }

  // Face latérale d'un bloc de bord, style "bloc d'herbe" : terre brune
  // mouchetée surmontée d'un liseré d'herbe crénelé. La face gauche (left)
  // est ombrée, la droite éclairée. Sur une case d'eau, la face devient une
  // cascade qui plonge vers le néant.
  private drawBlockFace(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    left: boolean,
    h: number,
    water: boolean,
    waterFrame: number,
  ): void {
    if (water) {
      this.drawWaterfall(x1, y1, x2, y2, h, waterFrame);
      return;
    }
    const g = this.ctx;
    const D = Config.EARTH_DEPTH;
    // terre
    g.fillStyle = left ? "#6b4c2e" : "#84603a";
    this.facePath(x1, y1, x2, y2, 0, D);
    g.fill();
    // mouchetis (cailloux / terre sombre, déterministes par case)
    g.fillStyle = left ? "#573d24" : "#6b4c2e";
    for (let k = 0; k < 3; k++) {
      const t = 0.15 + 0.28 * k + ((h >> k) % 3) * 0.04;
      const px = Math.round(x1 + (x2 - x1) * t);
      const py = Math.round(y1 + (y2 - y1) * t) + 6 + ((h >> (k + 2)) % (D - 9));
      g.fillRect(px, py, 2, 1);
    }
    // liseré d'herbe en haut de la face
    g.fillStyle = left ? "#4c7c38" : "#578a40";
    this.facePath(x1, y1, x2, y2, 0, 3);
    g.fill();
    // crénelage du liseré (pixels d'herbe qui débordent sur la terre)
    for (let k = 0; k < 4; k++) {
      const t = 0.1 + 0.24 * k + ((h >> k) & 1) * 0.06;
      const px = Math.round(x1 + (x2 - x1) * t);
      const py = Math.round(y1 + (y2 - y1) * t) + 3;
      g.fillRect(px, py, 2, 1);
    }
    // arête inférieure sombre (silhouette du bloc sur le vide)
    g.strokeStyle = "rgba(0,0,0,0.35)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x1, y1 + D);
    g.lineTo(x2, y2 + D);
    g.stroke();
  }

  // Cascade au bord de la carte : l'eau tombe dans le vide et s'estompe en
  // fondu sur WATERFALL_BLOCKS blocs (bandes d'opacité décroissante, plus
  // filets d'écume animés qui descendent au rythme de waterFrame).
  // inner : face intérieure d'une cascade de bord arrière, vue de dos à
  // travers le vide sous la carte — teinte plus sombre, sans lèvre d'écume.
  private drawWaterfall(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    h: number,
    waterFrame: number,
    inner = false,
  ): void {
    const g = this.ctx;
    const D = Config.EARTH_DEPTH;
    const N = Config.WATERFALL_BLOCKS;
    const len = N * D;
    const rgb = inner ? "43,82,120" : "63,116,171";
    for (let i = 0; i < N; i++) {
      const a = 0.85 * (1 - i / N);
      g.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
      this.facePath(x1, y1, x2, y2, i * D, (i + 1) * D);
      g.fill();
    }
    // filets d'écume : descendent et s'effacent avec la chute
    for (let k = 0; k < 4; k++) {
      const t = 0.14 + 0.24 * k + ((h >> k) % 3) * 0.03;
      const px = Math.round(x1 + (x2 - x1) * t);
      const py = Math.round(y1 + (y2 - y1) * t);
      const off = (waterFrame * 5 + k * 29 + h * 3) % len;
      const a = (inner ? 0.45 : 0.7) * (1 - off / len);
      g.fillStyle = `rgba(215,238,255,${a.toFixed(3)})`;
      g.fillRect(px, py + off, 1, 6);
    }
    if (inner) return;
    // écume au rebord (lèvre de la chute)
    g.strokeStyle = "rgba(220,242,255,0.8)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x1, y1 + 1);
    g.lineTo(x2, y2 + 1);
    g.stroke();
  }

  // ---- routes ----

  // Trace le losange (avec hauteurs de coins en niveaux additionnels).
  private diamondPath(cx: number, cy: number, level: number, raise: number[]): void {
    const g = this.ctx;
    g.beginPath();
    for (let i = 0; i < 4; i++) {
      const px = cx + CORNERS[i][0];
      const py = cy + CORNERS[i][1] - (level + raise[i]) * Z;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
  }

  private drawPiece(
    cx: number,
    cy: number,
    p: RoadPiece,
    x: number,
    y: number,
    sim: Simulation,
  ): void {
    const g = this.ctx;
    const raise = [0, 0, 0, 0];
    if (p.ramp !== null) {
      const rd = this.rotDir(p.ramp);
      for (const ci of EDGE_CORNERS[rd]) raise[ci] = 1;
    }

    // Piliers de soutien pour les routes surélevées
    if (p.level > 0) {
      g.fillStyle = "#6e6657";
      for (const ci of [1, 2, 3]) {
        const px = cx + CORNERS[ci][0];
        const pyTop = cy + CORNERS[ci][1] - (p.level + raise[ci]) * Z;
        const pyBot = cy + CORNERS[ci][1];
        const inset = ci === 1 ? -2 : ci === 3 ? 1 : -1;
        g.fillRect(px + inset, pyTop, 2, pyBot - pyTop);
      }
    }

    // Épaisseur du tablier (faces sud : coins E,S,W)
    if (p.level > 0 || p.ramp !== null) {
      g.fillStyle = "#3a3e42";
      g.beginPath();
      for (const ci of [1, 2, 3]) {
        const px = cx + CORNERS[ci][0];
        const py = cy + CORNERS[ci][1] - (p.level + raise[ci]) * Z;
        if (ci === 1) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      for (const ci of [3, 2, 1]) {
        const px = cx + CORNERS[ci][0];
        const py = cy + CORNERS[ci][1] - (p.level + raise[ci]) * Z + 3;
        g.lineTo(px, py);
      }
      g.closePath();
      g.fill();
    }

    // Surface de la route
    g.fillStyle = p.level > 0 ? "#62686e" : "#585e64";
    this.diamondPath(cx, cy, p.level, raise);
    g.fill();
    g.strokeStyle = "#33373b";
    g.lineWidth = 1;
    g.stroke();

    // Marquage central
    g.fillStyle = "rgba(235,225,160,0.8)";
    if (p.ramp !== null) {
      const rd = this.rotDir(p.ramp);
      const [c1, c2] = EDGE_CORNERS[rd];
      const hx = (CORNERS[c1][0] + CORNERS[c2][0]) / 2;
      const hy = (CORNERS[c1][1] + CORNERS[c2][1]) / 2 - (p.level + 1) * Z;
      const lx = -hx;
      const ly = (CORNERS[c1][1] + CORNERS[c2][1]) / -2 - p.level * Z;
      g.fillRect(cx + Math.round(hx * 0.4), cy + Math.round((hy + ly) / 2 + (hy - ly) * 0.2), 2, 1);
      g.fillRect(cx + Math.round(lx * 0.4), cy + Math.round((hy + ly) / 2 - (hy - ly) * 0.2), 2, 1);
    } else {
      g.fillRect(cx - 1, cy - p.level * Z, 2, 1);
    }

    // Marquages de circulation (segments plats uniquement)
    if (p.ramp === null) {
      if (sim.isIntersection(x, y, p.level)) {
        // surface de l'intersection légèrement éclaircie
        g.fillStyle = "rgba(255,255,255,0.08)";
        this.diamondPath(cx, cy, p.level, raise);
        g.fill();
        // Repère de l'axe prioritaire : trait vert reliant les deux bords de l'axe.
        const M = sim.mainAxisAt(x, y, p.level);
        const yc = cy - p.level * Z;
        g.strokeStyle = "rgba(120,230,140,0.9)";
        g.lineWidth = 1;
        for (const gd of (M === 0 ? [0, 2] : [1, 3]) as Dir[]) {
          const rd = this.rotDir(gd);
          const [c1, c2] = EDGE_CORNERS[rd];
          const mx = (CORNERS[c1][0] + CORNERS[c2][0]) / 2;
          const my = (CORNERS[c1][1] + CORNERS[c2][1]) / 2;
          g.beginPath();
          g.moveTo(cx, yc);
          g.lineTo(cx + mx, yc + my);
          g.stroke();
        }
      } else {
        // ligne d'arrêt blanche sur les bords menant à une intersection
        for (let d = 0 as Dir; d < 4; d = ((d + 1) as Dir)) {
          if (!sim.isIntersection(x + DX[d], y + DY[d], p.level)) continue;
          const rd = this.rotDir(d);
          const [c1, c2] = EDGE_CORNERS[rd];
          g.strokeStyle = "rgba(245,240,225,0.85)";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(cx + CORNERS[c1][0] * 0.65, cy + CORNERS[c1][1] * 0.65 - p.level * Z);
          g.lineTo(cx + CORNERS[c2][0] * 0.65, cy + CORNERS[c2][1] * 0.65 - p.level * Z);
          g.stroke();
        }
      }
    }
  }

  // ---- bâtiments ----

  private drawBuilding(cx: number, cy: number, b: Building): void {
    if (b.type === "house") {
      this.drawHouse(cx, cy, b);
      return;
    }
    if (b.fallZ) {
      // Entreprise en chute : la tuile d'arrivée entière s'assombrit (ombre
      // "carrée" au sol), corps décalé en hauteur.
      const g = this.ctx;
      g.fillStyle = "rgba(0,0,0,0.22)";
      this.diamondPath(cx, cy, 0, [0, 0, 0, 0]);
      g.fill();
      this.drawBiz(cx, cy - b.fallZ * Z, b, false);
      return;
    }
    this.drawBiz(cx, cy, b);
  }

  // Opacité du voile blanc d'une onde de choc sur la case (x,y) : l'anneau
  // a pour rayon t·IMPACT_RING_RADIUS et s'estompe linéairement.
  private impactAlpha(im: { x: number; y: number; age: number }, x: number, y: number): number {
    const t = im.age / Config.IMPACT_RING_TIME; // 0..1
    const r = t * Config.IMPACT_RING_RADIUS;
    const band = 1 - Math.abs(Math.hypot(x - im.x, y - im.y) - r) / 1.2;
    if (band <= 0) return 0;
    return 0.65 * (1 - t) * band;
  }

  // Boîte isométrique : empreinte en losange (demi-largeur hw, demi-hauteur hh),
  // murs de hauteur H. Deux faces visibles : gauche (W-S) ombrée, droite (S-E)
  // éclairée, plus le dessus si topCol est fourni.
  private isoBox(
    cx: number,
    cy: number,
    hw: number,
    hh: number,
    H: number,
    leftCol: string,
    rightCol: string,
    topCol: string | null,
  ): void {
    const g = this.ctx;
    const yT = cy - H;
    // face gauche (W -> S)
    g.fillStyle = leftCol;
    g.beginPath();
    g.moveTo(cx - hw, yT);
    g.lineTo(cx, yT + hh);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx - hw, cy);
    g.closePath();
    g.fill();
    // face droite (S -> E)
    g.fillStyle = rightCol;
    g.beginPath();
    g.moveTo(cx, yT + hh);
    g.lineTo(cx + hw, yT);
    g.lineTo(cx + hw, cy);
    g.lineTo(cx, cy + hh);
    g.closePath();
    g.fill();
    // dessus
    if (topCol) {
      g.fillStyle = topCol;
      g.beginPath();
      g.moveTo(cx, yT - hh);
      g.lineTo(cx + hw, yT);
      g.lineTo(cx, yT + hh);
      g.lineTo(cx - hw, yT);
      g.closePath();
      g.fill();
    }
    // silhouette
    g.strokeStyle = "#3c382e";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx - hw, yT);
    g.lineTo(cx - hw, cy);
    g.lineTo(cx, cy + hh);
    g.lineTo(cx + hw, cy);
    g.lineTo(cx + hw, yT);
    if (topCol) {
      g.lineTo(cx, yT - hh);
      g.lineTo(cx - hw, yT);
    }
    g.stroke();
    // arête verticale centrale
    g.strokeStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.moveTo(cx, yT + hh);
    g.lineTo(cx, cy + hh);
    g.stroke();
  }

  private drawHouse(cx: number, cy: number, b: Building): void {
    const g = this.ctx;
    const col = Config.COLORS[b.color];
    const dark = Config.COLORS_DARK[b.color];
    const hw = 9;
    const hh = 5;
    const H = 7; // hauteur des murs
    const rh = 5; // hauteur du toit au faîtage
    const yT = cy - H;
    // ombre portée
    g.fillStyle = "rgba(0,0,0,0.22)";
    g.beginPath();
    g.ellipse(cx + 2, cy + 2, hw + 2, hh + 1, 0, 0, Math.PI * 2);
    g.fill();
    // murs
    this.isoBox(cx, cy, hw, hh, H, "#cdbf9e", "#ecdfc2", null);
    // toit pyramidal : sommet au centre, deux pans visibles (gauche ombré, droit
    // coloré), avec un léger débord par rapport aux murs
    const ow = hw + 2;
    const oh = hh + 1;
    const px = cx;
    const py = yT - rh;
    g.fillStyle = dark;
    g.beginPath();
    g.moveTo(cx - ow, yT);
    g.lineTo(cx, yT + oh);
    g.lineTo(px, py);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(cx, yT + oh);
    g.lineTo(cx + ow, yT);
    g.lineTo(px, py);
    g.closePath();
    g.fill();
    g.strokeStyle = "#3c382e";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx - ow, yT);
    g.lineTo(cx, yT + oh);
    g.lineTo(cx + ow, yT);
    g.lineTo(px, py);
    g.closePath();
    g.moveTo(cx, yT + oh);
    g.lineTo(px, py);
    g.stroke();
    // porte (face droite) + fenêtre (face gauche)
    g.fillStyle = "#5a4632";
    g.fillRect(cx + 3, cy - 4, 3, 6);
    g.fillStyle = "#8db8d8";
    g.fillRect(cx - 6, cy - 4, 3, 3);
  }

  private drawBiz(cx: number, cy: number, b: Building, shadow = true): void {
    const g = this.ctx;
    const col = Config.COLORS[b.color];
    const dark = Config.COLORS_DARK[b.color];
    const hw = 11;
    const hh = 6;
    const H = 15;
    const yT = cy - H;
    // ombre portée (omise en chute : elle reste au sol, voir drawBuilding)
    if (shadow) {
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.beginPath();
      g.ellipse(cx + 2, cy + 2, hw + 2, hh + 1, 0, 0, Math.PI * 2);
      g.fill();
    }
    // corps + toit plat
    this.isoBox(cx, cy, hw, hh, H, "#9b968a", "#bdb8ab", "#aaa699");
    // enseigne colorée : bandeau en haut des deux faces
    const band = 4;
    g.fillStyle = dark;
    g.beginPath();
    g.moveTo(cx - hw, yT);
    g.lineTo(cx, yT + hh);
    g.lineTo(cx, yT + hh + band);
    g.lineTo(cx - hw, yT + band);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(cx, yT + hh);
    g.lineTo(cx + hw, yT);
    g.lineTo(cx + hw, yT + band);
    g.lineTo(cx, yT + hh + band);
    g.closePath();
    g.fill();
    // fenêtres suivant la pente des faces
    g.fillStyle = "#46586a";
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 3; i++) {
        const t = 0.22 + i * 0.27;
        const d = band + 3 + r * 5;
        // face droite : de S' vers E'
        g.fillRect(Math.round(cx + hw * t), Math.round(yT + hh * (1 - t)) + d, 2, 3);
        // face gauche : de W' vers S'
        g.fillRect(Math.round(cx - hw + hw * t), Math.round(yT + hh * t) + d, 2, 3);
      }
    }
    // porte (face droite, près du coin S)
    g.fillStyle = "#3a362e";
    g.fillRect(cx + 2, cy - 3, 4, 6);
    // édicule sur le toit
    this.isoBox(cx, yT - 1, 4, 2, 3, "#8a8579", "#a39e91", "#969182");

    // pastilles de commandes en attente
    const pips = Math.min(b.orders, Config.MAX_ORDER_PIPS);
    for (let i = 0; i < pips; i++) {
      g.fillStyle = b.orders > Config.DANGER_THRESHOLD ? "#ff5a4e" : "#fff6d8";
      g.fillRect(cx - 14 + i * 4, yT - 12, 3, 3);
      g.strokeStyle = "#00000088";
      g.strokeRect(cx - 14.5 + i * 4, yT - 12.5, 4, 4);
    }
    // barre de danger
    if (b.danger > 0) {
      g.fillStyle = "#1a1a1a";
      g.fillRect(cx - 12, yT - 17, 24, 3);
      g.fillStyle = "#ff3b2e";
      g.fillRect(cx - 12, yT - 17, Math.round(24 * b.danger), 3);
    }
  }

  // ---- arbres ----

  // Arbre procédural : sapin ou feuillu selon un hachage de la cellule.
  // Hauteur maintenue sous Z_STEP*2 pour passer sous les ponts de niveau 2.
  private drawTree(cx: number, cy: number, gx: number, gy: number): void {
    const g = this.ctx;
    const h = (gx * 9241 + gy * 5407 + 77) % 91;
    // ombre portée
    g.fillStyle = "rgba(0,0,0,0.18)";
    g.beginPath();
    g.ellipse(cx + 1, cy + 1, 5, 2.5, 0, 0, Math.PI * 2);
    g.fill();
    // tronc
    g.fillStyle = "#6b4a2b";
    g.fillRect(cx - 1, cy - 3, 2, 4);
    if (h % 2 === 0) {
      // sapin : trois étages de triangles
      const greens = ["#2f6b33", "#3a7c3c", "#2a5f2e"];
      for (let i = 0; i < 3; i++) {
        const w = 6 - i * 1.5;
        const yb = cy - 3 - i * 3;
        g.fillStyle = greens[(h + i) % 3];
        g.beginPath();
        g.moveTo(cx - w, yb);
        g.lineTo(cx + w, yb);
        g.lineTo(cx, yb - 4);
        g.closePath();
        g.fill();
      }
    } else {
      // feuillu : houppier arrondi en deux teintes
      const r = 4 + (h % 3);
      g.fillStyle = "#4c8c3f";
      g.beginPath();
      g.ellipse(cx, cy - 4 - r, r + 1, r, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#5da04c";
      g.beginPath();
      g.ellipse(cx - 1, cy - 5 - r, r - 2, r - 2, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  // ---- voitures ----

  private drawCar(sx: number, sy: number, color: number): void {
    const g = this.ctx;
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(sx - 3, sy + 1, 7, 2);
    g.fillStyle = Config.COLORS_DARK[color];
    g.fillRect(sx - 4, sy - 3, 8, 5);
    g.fillStyle = Config.COLORS[color];
    g.fillRect(sx - 3, sy - 2, 6, 3);
    g.fillStyle = "#cfe6f2";
    g.fillRect(sx - 1, sy - 2, 2, 1);
  }

  // Vélo : silhouette fine, cycliste coloré
  private drawBike(sx: number, sy: number, color: number): void {
    const g = this.ctx;
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(sx - 2, sy + 1, 4, 1);
    // roues
    g.fillStyle = "#2a2a2a";
    g.fillRect(sx - 2, sy - 1, 2, 2);
    g.fillRect(sx + 1, sy - 1, 2, 2);
    // cycliste
    g.fillStyle = Config.COLORS[color];
    g.fillRect(sx - 1, sy - 3, 2, 3);
    g.fillStyle = "#f0d6b0";
    g.fillRect(sx - 1, sy - 4, 2, 1);
  }

  // ---- surbrillance / aperçu de construction ----

  private drawHover(game: Game): void {
    const hov = game.input.hover;
    if (!hov || game.sim.gameOver) return;
    const g = this.ctx;
    const { x, y } = hov;
    const tool = game.input.tool;
    const level = game.input.level;
    const ramp = tool === "ramp" ? game.input.rampDir : null;

    let ok: boolean;
    let raise = [0, 0, 0, 0];
    let lvl = level;
    if (tool === "bulldoze") {
      ok = game.sim.grid.topPiece(x, y) !== null || game.sim.grid.cell(x, y).tree;
      const top = game.sim.grid.topPiece(x, y);
      lvl = top ? top.level : 0;
      if (top && top.ramp !== null) {
        const rd = this.rotDir(top.ramp);
        for (const ci of EDGE_CORNERS[rd]) raise[ci] = 1;
      }
    } else {
      ok =
        game.sim.grid.canPlace(x, y, level, ramp) &&
        game.sim.credits >= game.sim.pieceCost(level, ramp);
      if (ramp !== null) {
        const rd = this.rotDir(ramp);
        for (const ci of EDGE_CORNERS[rd]) raise[ci] = 1;
      }
    }

    const [cx, cy] = this.project(x, y, 0);
    g.strokeStyle = tool === "bulldoze" ? "#ffb13b" : ok ? "#ffe97f" : "#ff6b6b";
    g.lineWidth = 1;
    this.diamondPath(cx, cy, lvl, raise);
    g.stroke();

    // flèche de direction pour la rampe
    if (tool === "ramp") {
      const rd = this.rotDir(game.input.rampDir);
      const [c1, c2] = EDGE_CORNERS[rd];
      const mx = cx + (CORNERS[c1][0] + CORNERS[c2][0]) / 2;
      const my = cy + (CORNERS[c1][1] + CORNERS[c2][1]) / 2 - (level + 1) * Z;
      g.strokeStyle = "#ffffff";
      g.beginPath();
      g.moveTo(cx, cy - level * Z);
      g.lineTo(mx, my);
      g.stroke();
      g.fillStyle = "#ffffff";
      g.fillRect(mx - 1, my - 1, 3, 3);
    }
  }
}
