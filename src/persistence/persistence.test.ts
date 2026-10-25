import "fake-indexeddb/auto";
import { afterEach, expect, test } from "vitest";
import { createInitialState } from "../core/state";
import { GameSession } from "../core/session";
import { nextRandom } from "../core/engine";
import { SaveDatabase } from "./database";
import { makeSave, parseSave, validateSave, MAX_SAVE_BYTES } from "./schema";
const databases: SaveDatabase[] = [];
function database() {
  const db = new SaveDatabase(`test-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.close()));
});
test("IndexedDB roundtrip preserves all state and RNG continuation", async () => {
  const session = new GameSession(createInitialState(nextRandom(23).state));
  session.advance(15_000);
  const envelope = makeSave("test-save", session.getSnapshot());
  const db = database();
  await db.write(envelope);
  const restored = await db.load();
  expect(restored).toEqual(envelope);
  expect(nextRandom(restored!.state.rngState)).toEqual(
    nextRandom(envelope.state.rngState),
  );
});
test("save is a snapshot while live clock advances", async () => {
  const s = new GameSession();
  s.advance(1000);
  const envelope = makeSave("snapshot", s.getSnapshot());
  const db = database();
  const saving = db.write(envelope);
  s.advance(2000);
  await saving;
  expect((await db.load())!.state.time).toBe(envelope.state.time);
  expect(s.getSnapshot().time).toBe(envelope.state.time + 120_000);
});
test("repeated saves overwrite one slot and do not duplicate events", async () => {
  const db = database();
  const session = new GameSession();
  for (let i = 0; i < 20; i++) {
    session.advance(1000);
    await db.write(makeSave("same", session.getSnapshot()));
  }
  expect((await db.load())!.state).toEqual(session.getSnapshot());
  expect((await db.load())!.state.events).toHaveLength(1);
});
test("empty database returns null", async () => {
  expect(await database().load()).toBeNull();
});
test("old wall date does not change loaded game time", () => {
  const save = makeSave("old", createInitialState());
  save.savedAt = "2000-01-01T00:00:00.000Z";
  expect(parseSave(JSON.stringify(save)).state).toEqual(save.state);
});
test.each([null, [], {}, { schemaVersion: 99 }, { schemaVersion: 0 }])(
  "rejects malformed or unsupported envelope %j",
  (input) => {
    expect(() => validateSave(input)).toThrow();
  },
);
test.each([
  { time: -1 },
  { time: Infinity },
  { rngState: -1 },
  { rngState: 2 ** 32 },
  { commandSequence: 0.5 },
  { company: {} },
  { events: [] },
  { events: [{ id: "fake", type: "session-started", at: 0 }] },
])("rejects invalid state %j", (patch) => {
  const save = makeSave("bad", createInitialState());
  expect(() =>
    validateSave({ ...save, state: { ...save.state, ...patch } }),
  ).toThrow();
});
test("rejects invalid JSON, oversized file, invalid id and date", () => {
  expect(() => parseSave("{")).toThrow(/JSON/);
  expect(() => parseSave(" ".repeat(MAX_SAVE_BYTES + 1))).toThrow(/duży/);
  const save = makeSave("valid", createInitialState());
  expect(() => validateSave({ ...save, saveId: "" })).toThrow();
  expect(() => validateSave({ ...save, savedAt: "invalid" })).toThrow();
});
test("import strips unknown keys and detaches objects", () => {
  const save = makeSave("valid", createInitialState());
  const clean = validateSave({
    ...save,
    extra: "discard",
    state: { ...save.state, extra: "discard" },
  });
  expect(clean).toEqual(save);
  expect(clean.state).not.toBe(save.state);
});
