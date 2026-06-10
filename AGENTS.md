# Tiny Traffic Town — AGENTS.md

Jeu de gestion de trafic isométrique rétro (esthétique fin 90s / début 2000s, inspiration
Roller Coaster Tycoon 2 + Mini Motorways). TypeScript + Vite + Canvas 2D, 100 % navigateur,
sans backend, sans dépendance runtime. Aucun asset externe : tout est dessiné procéduralement.

## Commandes

```bash
npm run dev      # serveur de développement Vite
npm run build    # tsc --noEmit (strict) puis vite build — DOIT passer sans erreur
npm run preview  # sert le build de production
```

Pas de framework de test. La validation se fait via `npm run build` + test manuel en
preview (l'instance du jeu est exposée sur `window.game` pour le débogage console).

## Architecture (séparation stricte)

```
src/
  Config.ts            TOUTES les constantes de gameplay/rendu. Jamais de nombre
                       magique de gameplay ailleurs.
  Game.ts              Orchestrateur : boucle rAF, pause/vitesse, autosave, game over.
  i18n.ts              Chaînes FR/EN (module pur, sans DOM — utilisable par sim/).
                       TOUT texte visible passe par t("clé") ; jamais de littéral.
  main.ts              Point d'entrée. Expose window.game (debug).
  core/types.ts        Dir (0=+x, 1=+y, 2=-x, 3=-y), DX/DY, opp(), RoadPiece, Building.
  core/Grid.ts         Grille 3D, règles de placement (croisements, blocs 2x2).
  core/Pathfinder.ts   A* multi-départs/multi-arrivées sur le graphe routier 3D.
  sim/Simulation.ts    Toute la logique de jeu : économie, commandes, danger,
                       circulation, vélos, apparition de bâtiments, sérialisation.
  render/Renderer.ts   Rendu Canvas 2D isométrique. Ne modifie JAMAIS l'état du jeu.
  input/Input.ts       Souris/clavier, état des outils de construction.
  ui/UI.ts             HUD DOM style Win9x, menu debug, écran de fin.
  storage/Storage.ts   localStorage (record, options, partie en cours).
```

Dépendances autorisées : `render/`, `input/`, `ui/` dépendent de `sim/` et `core/`,
jamais l'inverse. `Simulation` ne connaît ni le DOM ni le canvas (communication par
le callback `onMessage`). `Game` est le seul à relier les modules.

## Règles de gameplay

### Économie
- Crédits de départ : 300 (`START_CREDITS`).
- Les routes coûtent des crédits ; la démolition **rembourse à 100 %** le prix payé
  (stocké sur chaque `RoadPiece.cost`).
- Subvention de `PAYOUT_AMOUNT` (260 ¤) toutes les `PAYOUT_INTERVAL` (90 s).
- Chaque livraison : +14 ¤ (`DELIVERY_CREDITS`) et +10 points (`DELIVERY_SCORE`).

### Commandes & game over
- Chaque entreprise génère des commandes (intervalle de base 10 s, qui se resserre
  jusqu'à ×0,45 sur 600 s de partie).
- Au-delà de `DANGER_THRESHOLD` (5) commandes en attente, une barre de danger se
  remplit en `DANGER_FILL_TIME` (30 s) ; elle décroît sinon. À 100 % : **game over**.
- Les voitures partent des maisons de la même couleur que l'entreprise
  (2 voitures max par maison, `CARS_PER_HOUSE`), livrent, puis rentrent.

### Apparition des bâtiments
- Équilibrage **par couleur** : on complète la couleur la moins représentée.
- Une entreprise n'apparaît que si sa couleur a au moins `HOUSE_SURPLUS` (2) maisons
  d'avance → il y a TOUJOURS plus de maisons que d'entreprises ; une nouvelle couleur
  reçoit 2 maisons avant sa première entreprise. Ne jamais casser cet invariant.
- Une nouvelle couleur est débloquée tous les `UNLOCK_EVERY` (5) spawns (6 couleurs max).

### Routes en hauteur (style RCT)
- Niveaux 0 à `MAX_LEVEL` (4). Une rampe occupe [niveau, niveau+1] et ne se connecte
  que dans son axe (`Grid.edgeHeight` renvoie null sur les côtés).
- **Croisement** : écart vertical ≥ 2 entre deux segments d'une même cellule
  (route au sol + pont niveau 2 = OK ; niveau 1 = refusé).
- **Blocs 2x2 interdits** : impossible de compléter un carré 2x2 de routes plates au
  même niveau (`Grid.makes2x2Square`). Les rampes sont exemptées.
- Deux segments se connectent si leurs `edgeHeight` coïncident sur le bord partagé.

### Code de la route (circulation)
- **Conduite à droite** : décalage visuel `LANE_OFFSET` ; à droite de la direction
  `d` = direction `(d+1)%4`.
- **Réservations** (`cellClaims`) : une cellule-voie (cellule + hauteur + sens) ne
  contient qu'un véhicule → pas de dépassement, files d'attente naturelles. Les sens
  opposés se croisent librement (voies distinctes). La clé inclut z : les ponts sont
  indépendants du sol.
- **Intersection** = segment plat relié à ≥ 3 voisins (jamais une rampe). Elle est
  **exclusive** (un seul véhicule à l'intérieur, clé "X").
- **Cédez-le-passage** : arrêt obligatoire de `YIELD_STOP_TIME` (0,5 s) avant
  d'entrer dans une intersection, même sans trafic. Puis priorité à droite : on ne
  s'engage pas si un véhicule arrive par la droite.
- **Anti-interblocage** : bloqué plus de `YIELD_DEADLOCK_TIME` (2,5 s), un véhicule
  ignore la priorité à droite (l'exclusivité de l'intersection sérialise).
- Arrêts et redémarrages **nets** : un véhicule est `moving` ou pas, aucune gestion
  de vitesse/accélération. Il s'arrête toujours au centre d'une case.
- **Vélos** : trafic parasite de maison à maison (couleurs ignorées), 75 % de la
  vitesse (`BIKE_SPEED_FACTOR`), mêmes règles de circulation, pas de trajet retour,
  ne consomment pas les places de voitures. Spawn auto toutes les `BIKE_INTERVAL` s,
  plafond `BIKE_MAX`.
- Si une route est démolie sous un trajet, le véhicule est détruit proprement via
  `destroyCar` (libère ses réservations, rend la commande et la place de voiture).

### Persistance (localStorage)
- `ttt_best` : record. `ttt_opts` : rotation caméra + vitesse. `ttt_save` : partie en
  cours (routes, bâtiments, économie — PAS les véhicules ; `assigned`/`activeCars`
  sont remis à 0 à la restauration).
- Autosave toutes les 5 s + `beforeunload`/`visibilitychange`. Effacée au game over.
- Toute évolution du format de sauvegarde doit rester tolérante aux anciennes données
  (`fromSave` est entouré de try/catch et retombe sur une partie neuve).

## Rendu isométrique

- Canvas basse résolution (fenêtre ÷ `RENDER_SCALE`) upscalé en CSS `pixelated`.
- Projection : `sx = (rx-ry)·TILE_W/2`, `sy = (rx+ry)·TILE_H/2 − z·Z_STEP`, où
  (rx,ry) sont les coordonnées après rotation caméra (`rotPoint`). La rotation des
  directions est `rd = (d + 3·rot) % 4`.
- **Painter's algorithm** : clé de tri `(rx+ry)·16 + niveau·2 + biais` (sol −1,
  routes +0.1, bâtiments +0.5, véhicules +0.9). Pour les véhicules, la profondeur
  utilise `Math.ceil(rx+ry)` (la cellule la plus profonde touchée) sinon ils
  passent sous la tuile qu'ils entrent.
- Bâtiments : boîtes isométriques via `isoBox` (face gauche ombrée, face droite
  éclairée), toit pyramidal pour les maisons, toit plat + enseigne pour les
  entreprises. Couleurs : `COLORS` / `COLORS_DARK` indexées par couleur de quartier.
- Le picking (`screenToCell`) se fait sur le plan z=0.

## Conventions de code

- **TypeScript strict** (noUnusedLocals/Parameters). `npm run build` doit passer.
- Commentaires **en français**, noms de code en anglais. Textes UI **bilingues
  FR/EN** via `i18n.ts` (clé typée `StringKey`, placeholders `{x}`) ; les éléments
  statiques de l'UI s'enregistrent dans le registre de `UI.applyTexts()`. La langue
  est persistée dans les options (`ttt_opts.lang`), défaut selon `navigator.language`.
- Toute constante de gameplay va dans `Config.ts` avec un commentaire d'unité.
- Pas de dépendance npm runtime — uniquement Canvas 2D et DOM natifs.
- Le Renderer lit l'état, ne le modifie jamais. La Simulation reste headless
  (testable via console : `window.game.sim`).
- Préférer les petites méthodes privées nommées par règle métier
  (`carFromRight`, `makes2x2Square`…) aux gros blocs conditionnels.
- Style visuel : pixel-art procédural chunky, palette sobre, UI Win9x (`.panel`,
  boutons biseautés). Ne pas introduire d'assets externes ni de polices web.

## Pièges connus

- `Dir` : 0=+x, 1=+y, 2=-x, 3=-y. La droite de `d` est `(d+1)%4`. Ne pas mélanger
  directions grille et directions écran (passer par `rotDir` côté rendu).
- Les clés de réservation et `pieceAtZ` utilisent z = niveau (+0,5 pour une rampe).
- `validateCars()` doit être appelé après toute destruction de route.
- Le serveur de preview tourne souvent pendant le développement : la partie du
  joueur est vivante, ne pas écraser son état via `window.game` sans prévenir.
