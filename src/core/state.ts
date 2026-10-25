import { CONFIG } from "./config";
import type { GameState } from "../domain/models";
export function createInitialState(
  seed: number = CONFIG.defaultSeed,
): GameState {
  return {
    time: CONFIG.startTime,
    rngState: seed >>> 0,
    company: null,
    events: [
      { id: "session-started", type: "session-started", at: CONFIG.startTime },
    ],
    commandSequence: 0,
  };
}
