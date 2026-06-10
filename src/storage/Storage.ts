import type { SaveData } from "../sim/Simulation";

const KEY_BEST = "ttt_best";
const KEY_OPTS = "ttt_opts";
const KEY_SAVE = "ttt_save";
const KEY_ONBOARDED = "ttt_onboarded";

export interface Options {
  rotation: number;
  speed: number;
  lang: "fr" | "en" | null;
}

export function loadBest(): number {
  try {
    return Number(localStorage.getItem(KEY_BEST)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(score: number): void {
  try {
    localStorage.setItem(KEY_BEST, String(score));
  } catch {
    /* stockage indisponible */
  }
}

export function loadOptions(): Options {
  try {
    const raw = localStorage.getItem(KEY_OPTS);
    if (raw) {
      const o = JSON.parse(raw);
      return {
        rotation: o.rotation % 4 || 0,
        speed: o.speed === 2 ? 2 : 1,
        lang: o.lang === "fr" || o.lang === "en" ? o.lang : null,
      };
    }
  } catch {
    /* ignore */
  }
  return { rotation: 0, speed: 1, lang: null };
}

export function saveOptions(o: Options): void {
  try {
    localStorage.setItem(KEY_OPTS, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY_SAVE);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

export function saveGame(d: SaveData): void {
  try {
    localStorage.setItem(KEY_SAVE, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(KEY_SAVE);
  } catch {
    /* ignore */
  }
}

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(KEY_ONBOARDED) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(KEY_ONBOARDED, "1");
  } catch {
    /* ignore */
  }
}
