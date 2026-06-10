import { Config } from "../Config";
import { Grid } from "../core/Grid";
import { findPath, nodeKey } from "../core/Pathfinder";
import type { PathNode } from "../core/Pathfinder";
import type { Building, Dir } from "../core/types";
import { DX, DY, opp } from "../core/types";
import { t } from "../i18n";
import type { MapData } from "../storage/MapCode";

export interface Waypoint {
  x: number;
  y: number;
  z: number; // hauteur (rampe = level + 0.5)
  road: boolean; // false pour les cases bâtiment (départ / arrivée)
}

export interface Car {
  kind: "car" | "bike";
  color: number;
  homeId: number;
  bizId: number; // destination (entreprise pour les voitures, maison pour les vélos)
  path: Waypoint[];
  seg: number; // index du segment courant
  t: number; // progression 0..1 sur le segment
  phase: "go" | "return";
  // --- circulation ---
  moving: boolean; // false = à l'arrêt net au centre d'une case
  stopServed: boolean; // arrêt obligatoire effectué avant l'intersection
  stopTimer: number; // décompte de l'arrêt au cédez-le-passage
  waitTime: number; // temps bloqué à ce nœud (anti-interblocage)
  claims: string[]; // cellules/voies réservées
}

export interface SaveData {
  pieces: { x: number; y: number; l: number; r: number | null; c: number }[];
  buildings: Building[];
  credits: number;
  score: number;
  elapsed: number;
  payoutTimer: number;
  spawnTimer: number;
  spawnCount: number;
  unlockedColors: number;
  nextId: number;
  river?: { x: number; y: number }[]; // absent dans les anciennes sauvegardes
  trees?: { x: number; y: number }[]; // absent dans les anciennes sauvegardes
}

export class Simulation {
  grid = new Grid();
  buildings: Building[] = [];
  cars: Car[] = [];

  credits = Config.START_CREDITS;
  score = 0;
  elapsed = 0;
  payoutTimer = Config.PAYOUT_INTERVAL;
  spawnTimer = Config.SPAWN_INTERVAL_START;
  dispatchTimer = 0;
  bikeTimer = Config.BIKE_INTERVAL;
  spawnCount = 0;
  unlockedColors = 2;
  gameOver = false;
  nextId = 1;

  onMessage: ((msg: string) => void) | null = null;

  constructor(fresh = true) {
    if (fresh) this.initStart();
  }

  private initStart(): void {
    const c = Math.floor(this.grid.size / 2);
    this.generateRiver();
    this.generateTrees();
    this.addBuilding("house", 0, c - 5, c - 3);
    this.addBuilding("house", 1, c + 3, c - 4);
    this.addBuilding("biz", 0, c - 6, c + 3);
    this.addBuilding("biz", 1, c + 4, c + 2);
  }

  // Creuse une rivière qui serpente du nord au sud au milieu de la carte.
  // Le lit reste à RIVER_MAX_OFFSET cases du centre (les bâtiments de départ
  // sont plus loin) ; chaque coude ajoute une case intermédiaire pour garder
  // un lit continu (connexité à 4 voisins).
  private generateRiver(): void {
    const c = Math.floor(this.grid.size / 2);
    let x = c - 1 + Math.floor(Math.random() * 3);
    for (let y = 0; y < this.grid.size; y++) {
      this.grid.cell(x, y).river = true;
      if (Math.random() < Config.RIVER_WANDER) {
        const step = Math.random() < 0.5 ? -1 : 1;
        const nx = Math.min(
          c + Config.RIVER_MAX_OFFSET,
          Math.max(c - Config.RIVER_MAX_OFFSET, x + step),
        );
        if (nx !== x) {
          x = nx;
          this.grid.cell(x, y).river = true; // coude
        }
      }
    }
  }

  // Plante des arbres aléatoires sur l'herbe (jamais sur l'eau). Ils ne
  // repoussent jamais : toute construction par-dessus les supprime pour
  // toujours, même si la route est démolie ensuite.
  private generateTrees(): void {
    for (let x = 0; x < this.grid.size; x++) {
      for (let y = 0; y < this.grid.size; y++) {
        const c = this.grid.cell(x, y);
        if (!c.river && Math.random() < Config.TREE_DENSITY) c.tree = true;
      }
    }
  }

  private addBuilding(type: "house" | "biz", color: number, x: number, y: number): Building {
    const b: Building = {
      id: this.nextId++,
      type,
      color,
      x,
      y,
      orders: 0,
      assigned: 0,
      danger: 0,
      orderTimer: Config.ORDER_INTERVAL * (0.6 + Math.random() * 0.8),
      activeCars: 0,
    };
    this.grid.cell(x, y).tree = false; // le bâtiment écrase l'arbre
    this.grid.cell(x, y).building = b;
    this.buildings.push(b);
    return b;
  }

  // ------------------------------------------------------------------
  // Construction / destruction
  // ------------------------------------------------------------------

  pieceCost(level: number, ramp: Dir | null): number {
    const base = ramp !== null ? Config.COST_RAMP : Config.COST_ROAD;
    return base + level * Config.COST_PER_LEVEL;
  }

  tryPlace(x: number, y: number, level: number, ramp: Dir | null): { ok: boolean; msg: string } {
    if (this.gameOver) return { ok: false, msg: "" };
    if (!this.grid.canPlace(x, y, level, ramp)) {
      if (
        this.grid.inBounds(x, y) &&
        this.grid.cell(x, y).river &&
        level < Config.RIVER_BRIDGE_LEVEL
      ) {
        return { ok: false, msg: t("msgNoWater") };
      }
      if (ramp === null && this.grid.makes2x2Square(x, y, level)) {
        return { ok: false, msg: t("msgNo2x2") };
      }
      return { ok: false, msg: t("msgCantBuild") };
    }
    const cost = this.pieceCost(level, ramp);
    if (this.credits < cost) {
      return { ok: false, msg: t("msgNoFunds", { c: cost }) };
    }
    this.credits -= cost;
    this.grid.cell(x, y).tree = false; // la route rase l'arbre, définitivement
    this.grid.addPiece(x, y, { level, ramp, cost });
    return { ok: true, msg: t("msgBuilt", { c: cost }) };
  }

  tryRemove(x: number, y: number): { ok: boolean; msg: string } {
    if (this.gameOver) return { ok: false, msg: "" };
    if (!this.grid.inBounds(x, y)) return { ok: false, msg: "" };
    const p = this.grid.removeTopPiece(x, y);
    if (!p) {
      // Pas de route : on peut abattre un arbre (gratuit, sans remboursement).
      const c = this.grid.cell(x, y);
      if (c.tree) {
        c.tree = false;
        return { ok: true, msg: t("msgTreeCut") };
      }
      return { ok: false, msg: t("msgNothingHere") };
    }
    this.credits += p.cost;
    this.validateCars();
    return { ok: true, msg: t("msgDemolished", { c: p.cost }) };
  }

  // ------------------------------------------------------------------
  // Boucle de simulation
  // ------------------------------------------------------------------

  update(dt: number): void {
    if (this.gameOver) return;
    this.elapsed += dt;

    // Subvention périodique
    this.payoutTimer -= dt;
    if (this.payoutTimer <= 0) {
      this.payoutTimer += Config.PAYOUT_INTERVAL;
      this.credits += Config.PAYOUT_AMOUNT;
      this.onMessage?.(t("msgPayout", { a: Config.PAYOUT_AMOUNT }));
    }

    // Nouveaux bâtiments
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnBuilding();
      const t = Math.min(1, this.elapsed / Config.SPAWN_ACCEL_TIME);
      this.spawnTimer =
        Config.SPAWN_INTERVAL_START + (Config.SPAWN_INTERVAL_MIN - Config.SPAWN_INTERVAL_START) * t;
    }

    // Commandes et danger
    const diff = Math.max(
      Config.ORDER_MIN_FACTOR,
      1 - (this.elapsed / Config.DIFFICULTY_RAMP_TIME) * (1 - Config.ORDER_MIN_FACTOR),
    );
    for (const b of this.buildings) {
      if (b.type !== "biz") continue;
      b.orderTimer -= dt;
      if (b.orderTimer <= 0) {
        b.orders++;
        b.orderTimer = Config.ORDER_INTERVAL * diff * (0.8 + Math.random() * 0.4);
      }
      if (b.orders > Config.DANGER_THRESHOLD) {
        b.danger = Math.min(1, b.danger + dt / Config.DANGER_FILL_TIME);
      } else {
        b.danger = Math.max(0, b.danger - dt / Config.DANGER_DECAY_TIME);
      }
      if (b.danger >= 1) {
        this.gameOver = true;
      }
    }

    // Affectation des livraisons
    this.dispatchTimer -= dt;
    if (this.dispatchTimer <= 0) {
      this.dispatchTimer = Config.DISPATCH_INTERVAL;
      this.dispatch();
    }

    // Balades à vélo entre maisons
    this.bikeTimer -= dt;
    if (this.bikeTimer <= 0) {
      this.bikeTimer = Config.BIKE_INTERVAL;
      this.spawnBike();
    }

    this.moveCars(dt);
  }

  // ------------------------------------------------------------------
  // Livraisons
  // ------------------------------------------------------------------

  // Nœuds routiers plats au niveau 0 adjacents à un bâtiment.
  private accessNodes(b: Building): PathNode[] {
    const out: PathNode[] = [];
    for (let d = 0; d < 4; d++) {
      const nx = b.x + DX[d];
      const ny = b.y + DY[d];
      if (!this.grid.inBounds(nx, ny)) continue;
      const pieces = this.grid.cell(nx, ny).pieces;
      for (let pi = 0; pi < pieces.length; pi++) {
        if (pieces[pi].level === 0 && pieces[pi].ramp === null) out.push({ x: nx, y: ny, pi });
      }
    }
    return out;
  }

  private computeRoute(from: Building, to: Building): Waypoint[] | null {
    const starts = this.accessNodes(from);
    const goalNodes = this.accessNodes(to);
    const goals = new Set(goalNodes.map((n) => nodeKey(this.grid, n.x, n.y, n.pi)));
    const nodes = findPath(this.grid, starts, goals, to.x, to.y);
    if (!nodes) return null;
    const wps: Waypoint[] = [{ x: from.x, y: from.y, z: 0, road: false }];
    for (const n of nodes) {
      const p = this.grid.cell(n.x, n.y).pieces[n.pi];
      const z = p.ramp !== null ? p.level + 0.5 : p.level;
      wps.push({ x: n.x, y: n.y, z, road: true });
    }
    wps.push({ x: to.x, y: to.y, z: 0, road: false });
    return wps;
  }

  private dispatch(): void {
    const bizs = this.buildings
      .filter((b) => b.type === "biz" && b.orders > b.assigned)
      .sort((a, b) => b.danger - a.danger || b.orders - a.orders);

    for (const biz of bizs) {
      const houses = this.buildings
        .filter(
          (h) => h.type === "house" && h.color === biz.color && h.activeCars < Config.CARS_PER_HOUSE,
        )
        .sort(
          (a, b) =>
            Math.abs(a.x - biz.x) + Math.abs(a.y - biz.y) - (Math.abs(b.x - biz.x) + Math.abs(b.y - biz.y)),
        );
      for (const house of houses) {
        const path = this.computeRoute(house, biz);
        if (!path) continue;
        this.cars.push({
          kind: "car",
          color: biz.color,
          homeId: house.id,
          bizId: biz.id,
          path,
          seg: 0,
          t: 0,
          phase: "go",
          moving: false,
          stopServed: false,
          stopTimer: Config.YIELD_STOP_TIME,
          waitTime: 0,
          claims: [],
        });
        house.activeCars++;
        biz.assigned++;
        break; // une voiture par entreprise et par cycle
      }
    }
  }

  // ------------------------------------------------------------------
  // Circulation : conduite à droite, files, cédez-le-passage
  // ------------------------------------------------------------------

  // Réservations : une cellule-voie (cellule + sens de circulation) ne peut
  // contenir qu'une voiture ; une intersection est exclusive (clé "X").
  private cellClaims = new Map<string, Car>();

  private laneKey(w: Waypoint, d: Dir): string {
    return `${w.x},${w.y},${w.z},${d}`;
  }

  private exclKey(w: Waypoint): string {
    return `${w.x},${w.y},${w.z},X`;
  }

  // Une intersection (T ou X) : segment plat relié à 3 voisins ou plus.
  // Les rampes (2 connexions max) ne sont jamais des intersections.
  isIntersection(x: number, y: number, z: number): boolean {
    const p = this.grid.pieceAtZ(x, y, z);
    if (!p || p.ramp !== null) return false;
    let n = 0;
    for (let d = 0 as Dir; d < 4; d = ((d + 1) as Dir)) {
      const eh = Grid.edgeHeight(p, d);
      if (eh === null) continue;
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (!this.grid.inBounds(nx, ny)) continue;
      for (const q of this.grid.cell(nx, ny).pieces) {
        if (Grid.edgeHeight(q, opp(d)) === eh) {
          n++;
          break;
        }
      }
    }
    return n >= 3;
  }

  private static dirBetween(a: Waypoint, b: Waypoint): Dir {
    if (b.x > a.x) return 0;
    if (b.y > a.y) return 1;
    if (b.x < a.x) return 2;
    return 3;
  }

  // Une voiture arrive-t-elle par la droite à l'intersection b (entrée en d) ?
  private carFromRight(b: Waypoint, d: Dir, self: Car): boolean {
    const rd = ((d + 1) % 4) as Dir;
    const cx = b.x + DX[rd];
    const cy = b.y + DY[rd];
    for (const o of this.cars) {
      if (o === self || o.seg + 1 >= o.path.length) continue;
      const oa = o.path[o.seg];
      const ob = o.path[o.seg + 1];
      if (!ob.road) continue;
      if (oa.x === cx && oa.y === cy && ob.x === b.x && ob.y === b.y && Math.abs(ob.z - b.z) < 0.75) {
        return true;
      }
    }
    return false;
  }

  private releaseClaims(car: Car, keep: string | null = null): void {
    for (const k of car.claims) {
      if (k !== keep && this.cellClaims.get(k) === car) this.cellClaims.delete(k);
    }
    car.claims = keep !== null && car.claims.includes(keep) ? [keep] : [];
  }

  private destroyCar(car: Car): void {
    this.releaseClaims(car);
    if (car.kind === "car") {
      if (car.phase === "go") {
        const biz = this.findBuilding(car.bizId);
        if (biz) biz.assigned = Math.max(0, biz.assigned - 1);
      }
      const home = this.findBuilding(car.homeId);
      if (home) home.activeCars = Math.max(0, home.activeCars - 1);
    }
    const i = this.cars.indexOf(car);
    if (i >= 0) this.cars.splice(i, 1);
  }

  // Un vélo part d'une maison vers une autre maison, peu importe la couleur.
  spawnBike(): boolean {
    if (this.cars.filter((c) => c.kind === "bike").length >= Config.BIKE_MAX) return false;
    const houses = this.buildings.filter((b) => b.type === "house");
    if (houses.length < 2) return false;
    for (let tries = 0; tries < 6; tries++) {
      const from = houses[Math.floor(Math.random() * houses.length)];
      const to = houses[Math.floor(Math.random() * houses.length)];
      if (from === to) continue;
      const path = this.computeRoute(from, to);
      if (!path) continue;
      this.cars.push({
        kind: "bike",
        color: Math.floor(Math.random() * Config.COLORS.length),
        homeId: from.id,
        bizId: to.id,
        path,
        seg: 0,
        t: 0,
        phase: "go",
        moving: false,
        stopServed: false,
        stopTimer: Config.YIELD_STOP_TIME,
        waitTime: 0,
        claims: [],
      });
      return true;
    }
    return false;
  }

  private moveCars(dt: number): void {
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];

      // À l'arrêt au centre d'une case : tente de démarrer le segment suivant.
      if (!car.moving) {
        const a = car.path[car.seg];
        const b = car.path[car.seg + 1];
        if (!b) continue;
        if (!b.road) {
          // Entrée dans un bâtiment : toujours libre.
          car.moving = true;
        } else {
          const d = Simulation.dirBetween(a, b);
          const inter = this.isIntersection(b.x, b.y, b.z);
          // Arrêt obligatoire au cédez-le-passage, même sans trafic.
          if (inter && !car.stopServed) {
            car.stopTimer -= dt;
            if (car.stopTimer <= 0) car.stopServed = true;
            continue;
          }
          const key = inter ? this.exclKey(b) : this.laneKey(b, d);
          const owner = this.cellClaims.get(key);
          let blocked = owner !== undefined && owner !== car;
          // Priorité à droite (levée après un long blocage pour éviter
          // l'interblocage à 4 voitures).
          if (!blocked && inter && car.waitTime < Config.YIELD_DEADLOCK_TIME) {
            blocked = this.carFromRight(b, d, car);
          }
          if (blocked) {
            car.waitTime += dt;
            continue;
          }
          this.cellClaims.set(key, car);
          car.claims.push(key);
          car.waitTime = 0;
          car.moving = true;
        }
      }

      // Avance d'un cran ; redémarrage et arrêt nets, sans gestion de vitesse.
      const speed =
        Config.CAR_SPEED * (car.kind === "bike" ? Config.BIKE_SPEED_FACTOR : 1);
      car.t += dt * speed;
      if (car.t < 1) continue;
      car.t = 0;
      car.seg++;
      car.moving = false;
      car.stopServed = false;
      car.stopTimer = Config.YIELD_STOP_TIME;

      const arrived = car.path[car.seg];
      // Libère tout sauf la case que l'on vient d'atteindre.
      const keep =
        arrived.road && car.claims.length > 0 ? car.claims[car.claims.length - 1] : null;
      this.releaseClaims(car, keep);

      if (car.seg >= car.path.length - 1) {
        if (car.kind === "bike") {
          // Le vélo est arrivé chez l'autre maison : il disparaît.
          this.releaseClaims(car);
          this.cars.splice(i, 1);
        } else if (car.phase === "go") {
          // Livraison
          const biz = this.findBuilding(car.bizId);
          if (biz) {
            biz.orders = Math.max(0, biz.orders - 1);
            biz.assigned = Math.max(0, biz.assigned - 1);
          }
          this.credits += Config.DELIVERY_CREDITS;
          this.score += Config.DELIVERY_SCORE;
          car.phase = "return";
          car.path = [...car.path].reverse();
          car.seg = 0;
        } else {
          // Retour à la maison
          const home = this.findBuilding(car.homeId);
          if (home) home.activeCars = Math.max(0, home.activeCars - 1);
          this.releaseClaims(car);
          this.cars.splice(i, 1);
        }
      }
    }
  }

  findBuilding(id: number): Building | null {
    return this.buildings.find((b) => b.id === id) ?? null;
  }

  // Position interpolée d'une voiture (coordonnées grille continues + hauteur),
  // décalée latéralement pour rouler à droite.
  carPos(car: Car): { x: number; y: number; z: number } {
    const a = car.path[Math.min(car.seg, car.path.length - 1)];
    const b = car.path[Math.min(car.seg + 1, car.path.length - 1)];
    const t = car.t;
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    return {
      x: a.x + (b.x - a.x) * t - dy * Config.LANE_OFFSET,
      y: a.y + (b.y - a.y) * t + dx * Config.LANE_OFFSET,
      z: a.z + (b.z - a.z) * t,
    };
  }

  // Après démolition : annule les voitures dont le chemin n'existe plus.
  private validateCars(): void {
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      let valid = true;
      for (let s = car.seg; s < car.path.length; s++) {
        const w = car.path[s];
        if (w.road && !this.grid.pieceAtZ(w.x, w.y, w.z)) {
          valid = false;
          break;
        }
      }
      if (valid) continue;
      this.destroyCar(car);
    }
  }

  // ------------------------------------------------------------------
  // Apparition de bâtiments
  // ------------------------------------------------------------------

  private spawnBuilding(): void {
    // Équilibrage par couleur : on complète d'abord la couleur la moins
    // représentée, et une entreprise n'apparaît que si sa couleur garde
    // strictement plus de maisons que d'entreprises après coup.
    const houses = new Array(Config.COLORS.length).fill(0);
    const bizs = new Array(Config.COLORS.length).fill(0);
    for (const b of this.buildings) {
      if (b.type === "house") houses[b.color]++;
      else bizs[b.color]++;
    }
    let color = 0;
    let minTotal = Infinity;
    for (let c = 0; c < this.unlockedColors; c++) {
      const total = houses[c] + bizs[c];
      if (total < minTotal) {
        minTotal = total;
        color = c;
      }
    }
    const type: "house" | "biz" =
      houses[color] >= bizs[color] + Config.HOUSE_SURPLUS ? "biz" : "house";

    const spot = type === "house" ? this.findHouseSpot(color) : this.findSpot();
    if (!spot) return;
    this.addBuilding(type, color, spot.x, spot.y);
    this.spawnCount++;
    if (
      this.spawnCount % Config.UNLOCK_EVERY === 0 &&
      this.unlockedColors < Config.COLORS.length
    ) {
      this.unlockedColors++;
      this.onMessage?.(t("msgNewColor"));
    }
    this.onMessage?.(t(type === "house" ? "msgNewHouse" : "msgNewBiz"));
  }

  // Tous les emplacements constructibles : loin du bord, hors eau/routes,
  // et à au moins 3 blocs (Manhattan) de tout bâtiment existant.
  private freeSpots(): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = [];
    for (let x = 1; x <= this.grid.size - 2; x++) {
      for (let y = 1; y <= this.grid.size - 2; y++) {
        const c = this.grid.cell(x, y);
        if (c.building || c.pieces.length > 0 || c.river) continue;
        const tooClose = this.buildings.some(
          (b) => Math.abs(b.x - x) + Math.abs(b.y - y) < 3,
        );
        if (tooClose) continue;
        out.push({ x, y });
      }
    }
    return out;
  }

  // Une case est "collée à une route" si un voisin direct porte une route
  // plate au niveau 0 — celle qui peut desservir un bâtiment (accessNodes).
  private nearRoad(x: number, y: number): boolean {
    for (let d = 0 as Dir; d < 4; d = ((d + 1) as Dir)) {
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (!this.grid.inBounds(nx, ny)) continue;
      if (this.grid.cell(nx, ny).pieces.some((p) => p.level === 0 && p.ramp === null)) {
        return true;
      }
    }
    return false;
  }

  // Choisit un emplacement parmi les candidats, avec ROAD_SPOT_CHANCE de
  // privilégier les cases collées à une route plate niveau 0 (le bâtiment
  // est alors desservi immédiatement). Bonus doux : sans candidat au bord
  // d'une route, on retombe sur un choix libre plutôt que d'annuler.
  private pickSpot(spots: { x: number; y: number }[]): { x: number; y: number } | null {
    if (!spots.length) return null;
    if (Math.random() < Config.ROAD_SPOT_CHANCE) {
      const served = spots.filter((s) => this.nearRoad(s.x, s.y));
      if (served.length) return served[Math.floor(Math.random() * served.length)];
    }
    return spots[Math.floor(Math.random() * spots.length)];
  }

  // Cherche un emplacement libre, loin du bord et des autres bâtiments.
  private findSpot(): { x: number; y: number } | null {
    return this.pickSpot(this.freeSpots());
  }

  // Placement "par quartiers" des maisons : 3 chances sur 4 de rejoindre un
  // quartier existant (à HOOD_JOIN_DIST blocs max d'une maison de même
  // couleur), 1 sur 4 d'en fonder un nouveau (à plus de HOOD_NEW_DIST blocs
  // de toute maison de cette couleur). Si le cas tiré est impossible, on ne
  // spawn pas. La première maison d'une couleur fonde son quartier librement.
  private findHouseSpot(color: number): { x: number; y: number } | null {
    const homes = this.buildings.filter((b) => b.type === "house" && b.color === color);
    const spots = this.freeSpots();
    if (homes.length === 0) return this.pickSpot(spots);
    const minDist = (s: { x: number; y: number }) =>
      Math.min(...homes.map((h) => Math.abs(h.x - s.x) + Math.abs(h.y - s.y)));
    const join = Math.random() < Config.HOOD_JOIN_CHANCE;
    const valid = spots.filter((s) =>
      join ? minDist(s) <= Config.HOOD_JOIN_DIST : minDist(s) > Config.HOOD_NEW_DIST,
    );
    return this.pickSpot(valid);
  }

  // ------------------------------------------------------------------
  // Menu de debug
  // ------------------------------------------------------------------

  debugAddCredits(amount: number): void {
    this.credits += amount;
  }

  // Vide toutes les commandes en attente et remet le danger à zéro.
  // Les livraisons déjà en route restent valides (assigned décrémente
  // avec un garde-fou Math.max à l'arrivée).
  debugClearOrders(): void {
    for (const b of this.buildings) {
      if (b.type !== "biz") continue;
      b.orders = 0;
      b.danger = 0;
    }
  }

  // Détruit tous les véhicules via destroyCar : réservations libérées,
  // commandes rendues aux entreprises, places de voitures restituées.
  debugClearTraffic(): number {
    const n = this.cars.length;
    for (let i = this.cars.length - 1; i >= 0; i--) {
      this.destroyCar(this.cars[i]);
    }
    return n;
  }

  debugSpawnBuilding(type: "house" | "biz", color: number): boolean {
    const spot = type === "house" ? this.findHouseSpot(color) : this.findSpot();
    if (!spot) return false;
    this.addBuilding(type, color, spot.x, spot.y);
    if (color >= this.unlockedColors) this.unlockedColors = color + 1;
    return true;
  }

  // ------------------------------------------------------------------
  // Sauvegarde
  // ------------------------------------------------------------------

  serialize(): SaveData {
    const pieces: SaveData["pieces"] = [];
    const river: { x: number; y: number }[] = [];
    const trees: { x: number; y: number }[] = [];
    for (let x = 0; x < this.grid.size; x++) {
      for (let y = 0; y < this.grid.size; y++) {
        for (const p of this.grid.cell(x, y).pieces) {
          pieces.push({ x, y, l: p.level, r: p.ramp, c: p.cost });
        }
        if (this.grid.cell(x, y).river) river.push({ x, y });
        if (this.grid.cell(x, y).tree) trees.push({ x, y });
      }
    }
    return {
      pieces,
      river,
      trees,
      buildings: this.buildings.map((b) => ({ ...b, assigned: 0, activeCars: 0 })),
      credits: this.credits,
      score: this.score,
      elapsed: this.elapsed,
      payoutTimer: this.payoutTimer,
      spawnTimer: this.spawnTimer,
      spawnCount: this.spawnCount,
      unlockedColors: this.unlockedColors,
      nextId: this.nextId,
    };
  }

  // ------------------------------------------------------------------
  // Partage de carte (URL) : géographie seule, sans économie ni véhicules
  // ------------------------------------------------------------------

  toMapData(): MapData {
    const size = this.grid.size;
    const m: MapData = { size, river: [], trees: [], pieces: [], buildings: [] };
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const idx = x * size + y;
        const c = this.grid.cell(x, y);
        if (c.river) m.river.push(idx);
        if (c.tree) m.trees.push(idx);
        for (const p of c.pieces) m.pieces.push({ cell: idx, level: p.level, ramp: p.ramp });
      }
    }
    for (const b of this.buildings) {
      m.buildings.push({ cell: b.x * size + b.y, type: b.type, color: b.color });
    }
    return m;
  }

  // Repart d'une économie neuve : crédits/score/timers par défaut, coûts des
  // routes recalculés (le remboursement reste cohérent), couleurs débloquées
  // déduites des bâtiments présents.
  static fromMapData(m: MapData): Simulation {
    const s = new Simulation(false);
    const size = s.grid.size;
    for (const idx of m.river) s.grid.cell(Math.floor(idx / size), idx % size).river = true;
    for (const idx of m.trees) s.grid.cell(Math.floor(idx / size), idx % size).tree = true;
    for (const p of m.pieces) {
      s.grid.addPiece(Math.floor(p.cell / size), p.cell % size, {
        level: p.level,
        ramp: p.ramp,
        cost: s.pieceCost(p.level, p.ramp),
      });
    }
    for (const b of m.buildings) {
      s.addBuilding(b.type, b.color, Math.floor(b.cell / size), b.cell % size);
      s.unlockedColors = Math.max(s.unlockedColors, b.color + 1);
    }
    return s;
  }

  static fromSave(d: SaveData): Simulation {
    const s = new Simulation(false);
    try {
      // Anciennes sauvegardes sans rivière/arbres : carte sans eau ni arbre.
      for (const r of d.river ?? []) {
        s.grid.cell(r.x, r.y).river = true;
      }
      for (const a of d.trees ?? []) {
        s.grid.cell(a.x, a.y).tree = true;
      }
      for (const p of d.pieces) {
        s.grid.addPiece(p.x, p.y, { level: p.l, ramp: p.r as Dir | null, cost: p.c });
      }
      for (const b of d.buildings) {
        const copy: Building = { ...b, assigned: 0, activeCars: 0 };
        s.buildings.push(copy);
        s.grid.cell(copy.x, copy.y).building = copy;
      }
      s.credits = d.credits;
      s.score = d.score;
      s.elapsed = d.elapsed;
      s.payoutTimer = d.payoutTimer;
      s.spawnTimer = d.spawnTimer;
      s.spawnCount = d.spawnCount;
      s.unlockedColors = d.unlockedColors;
      s.nextId = d.nextId;
    } catch {
      return new Simulation(true);
    }
    return s;
  }
}
