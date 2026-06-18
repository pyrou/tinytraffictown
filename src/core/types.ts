// Directions sur la grille : 0 = +x, 1 = +y, 2 = -x, 3 = -y
export type Dir = 0 | 1 | 2 | 3;
export const DX = [1, 0, -1, 0] as const;
export const DY = [0, 1, 0, -1] as const;
export const opp = (d: Dir): Dir => (((d + 2) % 4) as Dir);

export type RoadKind = "road" | "speedway";

// Un segment de route dans une cellule.
// level = niveau de la base ; ramp = direction ascendante (null = plat).
// Une rampe occupe les niveaux [level, level + 1].
export interface RoadPiece {
  level: number;
  ramp: Dir | null;
  kind: RoadKind; // speedway uniquement sur les segments plats
  cost: number; // prix payé, remboursé à la destruction
  // Axe prioritaire d'un croisement en X : 0 = E/O, 1 = N/S. Modifiable par
  // double-clic (outil route) ; ignoré pour les T (axe déduit de la géométrie).
  mainAxis?: 0 | 1;
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
  // Animation d'apparition : hauteur de chute restante, en
  // niveaux. Transitoire — retiré à la sérialisation, jamais persisté.
  fallZ?: number;
}
