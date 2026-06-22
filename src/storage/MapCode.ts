// Encodage/décodage compact d'une carte partageable via l'URL (fragment #).
// Module pur (ni DOM ni état du jeu) : flux de bits big-endian, puis base64url.
// Seule la géographie est partagée : rivière, arbres, routes, bâtiments —
// ni économie, ni score, ni véhicules, ni commandes.
//
// Disposition du flux (en bits) :
//   8   version du format (rejetée au chargement si > MAP_VERSION)
//   8   taille de grille (doit correspondre à celle du jeu)
//   10  nb cases de rivière   puis 10 bits/case (index = x*size + y)
//   10  nb arbres             puis 10 bits/case [+ 1 type (v4+) : 1 = feuillu]
//   12  nb segments de route  puis 16/17/18 bits/segment : 10 case + 3 niveau +
//       3 rampe (4 = plat) [+ 1 axe prioritaire (v2+)] [+ 1 type (v3+) :
//       1 = speedway]
//   10  nb bâtiments          puis 14 bits/bâtiment : 10 case + 3 couleur + 1 type (1 = maison)

import type { BuildingType, Dir, RoadKind, TreeKind } from "../core/types";

// Version courante du format de partage. À incrémenter à chaque évolution ;
// le jeu ouvre toute carte de version <= MAP_VERSION.
export const MAP_VERSION = 4;

export interface MapData {
  size: number;
  river: number[]; // index de cases
  trees: ({ cell: number; kind: TreeKind } | number)[];
  pieces: {
    cell: number;
    level: number;
    ramp: Dir | null;
    mainAxis?: 0 | 1;
    kind?: RoadKind;
  }[];
  buildings: { cell: number; type: BuildingType; color: number }[];
}

class BitWriter {
  private bytes: number[] = [];
  private acc = 0;
  private n = 0;

  write(value: number, bits: number): void {
    for (let i = bits - 1; i >= 0; i--) {
      this.acc = (this.acc << 1) | ((value >> i) & 1);
      if (++this.n === 8) {
        this.bytes.push(this.acc);
        this.acc = 0;
        this.n = 0;
      }
    }
  }

  finish(): Uint8Array {
    if (this.n > 0) this.bytes.push(this.acc << (8 - this.n));
    return Uint8Array.from(this.bytes);
  }
}

class BitReader {
  private i = 0;
  private n = 0;

  constructor(private bytes: Uint8Array) {}

  read(bits: number): number {
    let v = 0;
    for (let k = 0; k < bits; k++) {
      if (this.i >= this.bytes.length) throw new Error("eof");
      v = (v << 1) | ((this.bytes[this.i] >> (7 - this.n)) & 1);
      if (++this.n === 8) {
        this.n = 0;
        this.i++;
      }
    }
    return v;
  }
}

// base64url (sans +, / ni padding =) : sûr dans un fragment d'URL.
function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeMap(m: MapData): string {
  const w = new BitWriter();
  w.write(MAP_VERSION, 8);
  w.write(m.size, 8);
  w.write(m.river.length, 10);
  for (const c of m.river) w.write(c, 10);
  w.write(m.trees.length, 10);
  for (const tree of m.trees) {
    const cell = typeof tree === "number" ? tree : tree.cell;
    const kind = typeof tree === "number" ? "pine" : tree.kind;
    w.write(cell, 10);
    w.write(kind === "leafy" ? 1 : 0, 1);
  }
  w.write(m.pieces.length, 12);
  for (const p of m.pieces) {
    w.write(p.cell, 10);
    w.write(p.level, 3);
    w.write(p.ramp === null ? 4 : p.ramp, 3);
    w.write(p.mainAxis === 1 ? 1 : 0, 1); // axe prioritaire (croisements X)
    w.write(p.kind === "speedway" ? 1 : 0, 1);
  }
  w.write(m.buildings.length, 10);
  for (const b of m.buildings) {
    w.write(b.cell, 10);
    w.write(b.color, 3);
    w.write(b.type === "house" ? 1 : 0, 1);
  }
  return toBase64Url(w.finish());
}

// null = lien illisible ; "badVersion" = format plus récent que le jeu.
export function decodeMap(code: string): MapData | "badVersion" | null {
  try {
    const r = new BitReader(fromBase64Url(code));
    const version = r.read(8);
    if (version > MAP_VERSION) return "badVersion";
    const size = r.read(8);
    const cells = size * size;
    const m: MapData = { size, river: [], trees: [], pieces: [], buildings: [] };
    const readCell = () => {
      const c = r.read(10);
      if (c >= cells) throw new Error("cell");
      return c;
    };
    const nRiver = r.read(10);
    for (let i = 0; i < nRiver; i++) m.river.push(readCell());
    const nTrees = r.read(10);
    for (let i = 0; i < nTrees; i++) {
      const cell = readCell();
      const kind: TreeKind = version >= 4 && r.read(1) === 1 ? "leafy" : "pine";
      m.trees.push({ cell, kind });
    }
    const nPieces = r.read(12);
    for (let i = 0; i < nPieces; i++) {
      const cell = readCell();
      const level = r.read(3);
      const ramp = r.read(3);
      if (ramp > 4) throw new Error("ramp");
      // Le bit d'axe prioritaire n'existe que depuis la v2.
      const mainAxis = version >= 2 && r.read(1) === 1 ? (1 as const) : undefined;
      const kind: RoadKind = version >= 3 && r.read(1) === 1 ? "speedway" : "road";
      m.pieces.push({ cell, level, ramp: ramp === 4 ? null : (ramp as Dir), mainAxis, kind });
    }
    const nBuildings = r.read(10);
    for (let i = 0; i < nBuildings; i++) {
      const cell = readCell();
      const color = r.read(3);
      const type: BuildingType = r.read(1) === 1 ? "house" : "biz";
      m.buildings.push({ cell, type, color });
    }
    return m;
  } catch {
    return null;
  }
}
