import { Game } from "./Game";

const root = document.getElementById("app");
if (!root) throw new Error("Élément #app introuvable");
const game = new Game(root);

// Accès console pour le débogage
(window as unknown as { game: Game }).game = game;
