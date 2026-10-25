export const CONFIG = Object.freeze({
  startTime: 6 * 60 * 60 * 1000,
  gameMsPerRealMs: 60,
  dayMs: 24 * 60 * 60 * 1000,
  tickMs: 250,
  autosaveMs: 10_000,
  defaultSeed: 0x50495845,
  schemaVersion: 1 as const,
});
