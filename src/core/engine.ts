import { CONFIG } from "./config";
import type { GameCommand, GameState } from "../domain/models";
/** Pure reducer. Monotonic command sequence is persisted, so replay cannot double-apply time. */
export function updateWorld(state: GameState, command: GameCommand): GameState {
  if (
    !Number.isSafeInteger(command.sequence) ||
    command.sequence !== state.commandSequence + 1 ||
    !Number.isSafeInteger(command.elapsedRealMs) ||
    command.elapsedRealMs <= 0
  )
    return state;
  const time = state.time + command.elapsedRealMs * CONFIG.gameMsPerRealMs;
  if (!Number.isSafeInteger(time))
    throw new Error("Przekroczono zakres zegara gry.");
  return { ...state, time, commandSequence: command.sequence };
}
/** Mulberry32: state and result are explicit, no global random source. Zero is a valid seed. */
export function nextRandom(seed: number): { state: number; value: number } {
  const state = (seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return { state, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}
const DAYS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];
export function formatGameTime(time: number) {
  const day = Math.floor(time / CONFIG.dayMs);
  const minutes = Math.floor((time % CONFIG.dayMs) / 60_000);
  return {
    day: DAYS[day % 7],
    dayNumber: day + 1,
    hour: `${Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`,
  };
}
