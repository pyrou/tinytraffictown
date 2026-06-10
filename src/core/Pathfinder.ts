import { Grid } from "./Grid";
import type { Dir } from "./types";
import { DX, DY, opp } from "./types";

// Un nœud du graphe routier : une cellule + l'index d'un segment dans la cellule.
export interface PathNode {
  x: number;
  y: number;
  pi: number;
}

export function nodeKey(grid: Grid, x: number, y: number, pi: number): number {
  return (x * grid.size + y) * 4 + pi;
}

class MinHeap {
  private keys: number[] = [];
  private prio: number[] = [];

  get size(): number {
    return this.keys.length;
  }

  push(k: number, p: number): void {
    this.keys.push(k);
    this.prio.push(p);
    let i = this.keys.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (this.prio[par] <= this.prio[i]) break;
      this.swap(i, par);
      i = par;
    }
  }

  pop(): number {
    const top = this.keys[0];
    const lastK = this.keys.pop()!;
    const lastP = this.prio.pop()!;
    if (this.keys.length > 0) {
      this.keys[0] = lastK;
      this.prio[0] = lastP;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < this.prio.length && this.prio[l] < this.prio[m]) m = l;
        if (r < this.prio.length && this.prio[r] < this.prio[m]) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }

  private swap(i: number, j: number): void {
    [this.keys[i], this.keys[j]] = [this.keys[j], this.keys[i]];
    [this.prio[i], this.prio[j]] = [this.prio[j], this.prio[i]];
  }
}

// A* multi-départs / multi-arrivées sur le graphe routier 3D.
// (tx, ty) sert d'heuristique (position de la destination).
export function findPath(
  grid: Grid,
  starts: PathNode[],
  goals: Set<number>,
  tx: number,
  ty: number,
): PathNode[] | null {
  if (starts.length === 0 || goals.size === 0) return null;

  const g = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const closed = new Set<number>();
  const heap = new MinHeap();
  const h = (x: number, y: number) => Math.abs(x - tx) + Math.abs(y - ty);

  for (const s of starts) {
    const k = nodeKey(grid, s.x, s.y, s.pi);
    if (!g.has(k) || g.get(k)! > 0) {
      g.set(k, 0);
      heap.push(k, h(s.x, s.y));
    }
  }

  while (heap.size > 0) {
    const k = heap.pop();
    if (closed.has(k)) continue;
    closed.add(k);

    const pi = k % 4;
    const rest = (k - pi) / 4;
    const y = rest % grid.size;
    const x = (rest - y) / grid.size;

    if (goals.has(k)) {
      // Reconstruction du chemin
      const path: PathNode[] = [];
      let cur: number | undefined = k;
      while (cur !== undefined) {
        const cpi = cur % 4;
        const crest = (cur - cpi) / 4;
        const cy = crest % grid.size;
        const cx = (crest - cy) / grid.size;
        path.push({ x: cx, y: cy, pi: cpi });
        cur = cameFrom.get(cur);
      }
      path.reverse();
      return path;
    }

    const piece = grid.cell(x, y).pieces[pi];
    if (!piece) continue;
    const gk = g.get(k)!;

    for (let d = 0 as Dir; d < 4; d = ((d + 1) as Dir)) {
      const eh = Grid.edgeHeight(piece, d);
      if (eh === null) continue;
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (!grid.inBounds(nx, ny)) continue;
      const npieces = grid.cell(nx, ny).pieces;
      for (let qi = 0; qi < npieces.length; qi++) {
        if (Grid.edgeHeight(npieces[qi], opp(d)) !== eh) continue;
        const nk = nodeKey(grid, nx, ny, qi);
        if (closed.has(nk)) continue;
        const cost = gk + (npieces[qi].ramp !== null ? 1.25 : 1);
        if (!g.has(nk) || cost < g.get(nk)!) {
          g.set(nk, cost);
          cameFrom.set(nk, k);
          heap.push(nk, cost + h(nx, ny));
        }
      }
    }
  }
  return null;
}
