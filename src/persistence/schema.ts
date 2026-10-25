import { CONFIG } from '../core/config';
import type { GameState, SaveEnvelope } from '../domain/models';
export const MAX_SAVE_BYTES = 2 * 1024 * 1024;
const record = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const integer = (x: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= min && x <= max;
function invalid(): never { throw new Error('Nieprawidłowy zapis: uszkodzone lub niezgodne dane.'); }
/** Future migrations are registered here, one source version at a time. No fictitious migrations. */
const migrations: Readonly<Record<number, (input: Record<string, unknown>) => unknown>> = {};
export function validateSave(input: unknown): SaveEnvelope {
  if (!record(input)) return invalid();
  if (input.schemaVersion !== CONFIG.schemaVersion) {
    if (integer(input.schemaVersion) && migrations[input.schemaVersion]) return validateSave(migrations[input.schemaVersion](input));
    throw new Error('Nieobsługiwana wersja zapisu. Ta aplikacja obsługuje schemat 1.');
  }
  if (typeof input.saveId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.saveId) ||
      typeof input.savedAt !== 'string' || input.savedAt.length > 40 || !Number.isFinite(Date.parse(input.savedAt))) return invalid();
  const s = input.state;
  if (!record(s) || !integer(s.time, CONFIG.startTime) || !integer(s.rngState, 0, 0xffffffff) ||
      !integer(s.commandSequence) || s.company !== null || !Array.isArray(s.events) || s.events.length !== 1) return invalid();
  const e = s.events[0];
  if (!record(e) || e.id !== 'session-started' || e.type !== 'session-started' || e.at !== CONFIG.startTime) return invalid();
  // Reconstruct only supported fields; untrusted imported objects never enter the store directly.
  return { schemaVersion: 1, saveId: input.saveId, savedAt: input.savedAt,
    state: { time: s.time, rngState: s.rngState, company: null, commandSequence: s.commandSequence,
      events: [{ id: e.id, type: e.type, at: e.at }] } };
}
export function parseSave(text: string): SaveEnvelope {
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) throw new Error('Plik zapisu jest zbyt duży (maksymalnie 2 MB).');
  let input: unknown;
  try { input = JSON.parse(text); } catch { throw new Error('Nieprawidłowy zapis: plik nie zawiera poprawnego JSON.'); }
  return validateSave(input);
}
export function makeSave(saveId: string, state: GameState): SaveEnvelope {
  return validateSave({ schemaVersion: CONFIG.schemaVersion, saveId, savedAt: new Date().toISOString(), state });
}
