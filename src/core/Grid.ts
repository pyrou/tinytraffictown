import { Config } from "../Config";
import type { Building, Dir, RoadKind, RoadPiece, TreeKind } from "./types";
import { DX, DY, opp } from "./types";

export interface Cell {
  pieces: RoadPiece[]; // triées par niveau croissant
  building: Building | null;
  river: boolean; // case d'eau : seul un pont (niveau >= RIVER_BRIDGE_LEVEL) est permis
  tree: TreeKind | boolean; // arbre décoratif : true = ancienne sauvegarde
}

export class Grid {
  readonly size = Config.GRID;
  readonly cells: Cell[];

  constructor() {
    this.cells = Array.from({ length: this.size * this.size }, () => ({
      pieces: [],
      building: null,
      river: false,
      tree: false,
    }));
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  cell(x: number, y: number): Cell {
    return this.cells[x * this.size + y];
  }

  // Hauteur du bord d'un segment dans la direction d (null = pas connectable).
  // Comme dans RCT : une rampe ne se connecte que dans son axe.
  static edgeHeight(p: RoadPiece, d: Dir): number | null {
    if (p.ramp === null) return p.level;
    if (d === p.ramp) return p.level + 1;
    if (d === opp(p.ramp)) return p.level;
    return null;
  }

  // Intervalle de niveaux occupés par un segment.
  static span(level: number, ramp: Dir | null): [number, number] {
    return [level, level + (ramp !== null ? 1 : 0)];
  }

  // Peut-on placer un segment (level, ramp) ici ?
  // Règle de croisement : il faut un écart vertical >= 2 entre segments
  // (une route au sol + une route au niveau 2 peuvent se croiser).
  canPlace(
    x: number,
    y: number,
    level: number,
    ramp: Dir | null,
    kind: RoadKind = "road",
  ): boolean {
    if (!this.inBounds(x, y)) return false;
    if (ramp !== null && kind === "speedway") return false;
    const c = this.cell(x, y);
    if (c.building) return false;
    // Sur l'eau, seul un pont assez haut est permis : la rampe d'accès
    // (qui occupe [0,1]) doit partir de la berge, jamais du lit.
    if (c.river && level < Config.RIVER_BRIDGE_LEVEL) return false;
    const [a, b] = Grid.span(level, ramp);
    if (a < 0 || b > Config.MAX_LEVEL) return false;
    for (const p of c.pieces) {
      const [l, h] = Grid.span(p.level, p.ramp);
      const clear = b + 2 <= l || h + 2 <= a;
      if (!clear) return false;
    }
    if (ramp === null && this.makes2x2Square(x, y, level)) return false;
    if (ramp === null && !this.respectsSpeedwayLinks(x, y, level, kind)) return false;
    return true;
  }

  private connectedArmCount(x: number, y: number, piece: RoadPiece): number {
    let n = 0;
    for (let d = 0 as Dir; d < 4; d = ((d + 1) as Dir)) {
      const eh = Grid.edgeHeight(piece, d);
      if (eh === null) continue;
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (!this.inBounds(nx, ny)) continue;
      for (const q of this.cell(nx, ny).pieces) {
        if (Grid.edgeHeight(q, opp(d)) === eh) {
          n++;
          break;
        }
      }
    }
    return n;
  }

  private wouldConnect(level: number, nx: number, ny: number, d: Dir): boolean {
    for (const q of this.cell(nx, ny).pieces) {
      if (Grid.edgeHeight(q, opp(d)) === level) return true;
    }
    return false;
  }

  // Une speedway reste une voie rapide : jamais plus de deux connexions.
  // On protège aussi les speedways voisines quand une route classique est posée.
  private respectsSpeedwayLinks(
    x: number,
    y: number,
    level: number,
    kind: RoadKind,
  ): boolean {
    let ownLinks = 0;
    for (let d = 0 as Dir; d < 4; d = ((d + 1) as Dir)) {
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (!this.inBounds(nx, ny)) continue;
      if (this.wouldConnect(level, nx, ny, d)) ownLinks++;
      for (const q of this.cell(nx, ny).pieces) {
        if (q.kind !== "speedway" || q.ramp !== null) continue;
        if (Grid.edgeHeight(q, opp(d)) !== level) continue;
        if (this.connectedArmCount(nx, ny, q) + 1 > 2) return false;
      }
    }
    return kind !== "speedway" || ownLinks <= 2;
  }

  private flatAt(x: number, y: number, level: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return this.cell(x, y).pieces.some((p) => p.ramp === null && p.level === level);
  }

  // Les blocs 2x2 de routes plates au même niveau sont interdits (les règles de
  // conduite ne gèrent pas ce cas) ; les rampes restent autorisées.
  makes2x2Square(x: number, y: number, level: number): boolean {
    for (const [ox, oy] of [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ]) {
      let full = true;
      for (let i = 0; i < 2 && full; i++) {
        for (let j = 0; j < 2 && full; j++) {
          const sx = x + ox + i;
          const sy = y + oy + j;
          if (sx === x && sy === y) continue;
          if (!this.flatAt(sx, sy, level)) full = false;
        }
      }
      if (full) return true;
    }
    return false;
  }

  addPiece(x: number, y: number, piece: RoadPiece): void {
    const c = this.cell(x, y);
    c.pieces.push(piece);
    c.pieces.sort((p, q) => p.level - q.level);
  }

  topPiece(x: number, y: number): RoadPiece | null {
    const c = this.cell(x, y);
    return c.pieces.length ? c.pieces[c.pieces.length - 1] : null;
  }

  removeTopPiece(x: number, y: number): RoadPiece | null {
    const c = this.cell(x, y);
    return c.pieces.pop() ?? null;
  }

  // Segment dont le "centre" est à la hauteur z (rampe = level + 0.5).
  pieceAtZ(x: number, y: number, z: number): RoadPiece | null {
    if (!this.inBounds(x, y)) return null;
    for (const p of this.cell(x, y).pieces) {
      const pz = p.ramp !== null ? p.level + 0.5 : p.level;
      if (pz === z) return p;
    }
    return null;
  }
}
