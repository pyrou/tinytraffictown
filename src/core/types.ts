// Directions sur la grille : 0 = +x, 1 = +y, 2 = -x, 3 = -y
export type Dir = 0 | 1 | 2 | 3;
export const DX = [1, 0, -1, 0] as const;
export const DY = [0, 1, 0, -1] as const;
export const opp = (d: Dir): Dir => (((d + 2) % 4) as Dir);

// Un segment de route dans une cellule.
// level = niveau de la base ; ramp = direction ascendante (null = plat).
// Une rampe occupe les niveaux [level, level + 1].
export interface RoadPiece {
  level: number;
  ramp: Dir | null;
  cost: number; // prix payé, remboursé à la destruction
}

export type BuildingType = "house" | "biz";

export interface Building {
  id: number;
  type: BuildingType;
  color: number;
  x: number;
  y: number;
  // entreprise
  orders: number;
  assigned: number; // livraisons en cours
  danger: number; // 0..1, game over à 1
  orderTimer: number;
  // maison
  activeCars: number;
}
