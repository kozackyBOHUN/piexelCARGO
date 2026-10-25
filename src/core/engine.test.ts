import { expect, test } from 'vitest';
import { createInitialState } from './state';
import { formatGameTime, nextRandom, updateWorld } from './engine';
import { GameSession, SessionClock } from './session';
test('starts Monday 06:00; 60 real seconds advance 60 game minutes', () => {
  const s = createInitialState(); expect(formatGameTime(s.time)).toMatchObject({ day: 'Poniedziałek', hour: '06:00' });
  const next = updateWorld(s, { type: 'advance', sequence: 1, elapsedRealMs: 60_000 });
  expect(formatGameTime(next.time).hour).toBe('07:00'); expect(s.time).toBe(21_600_000);
});
test('midnight and week rollover derive from same counter', () => {
  const session = new GameSession(); session.advance(18 * 60_000);
  expect(formatGameTime(session.getSnapshot().time)).toMatchObject({ day: 'Wtorek', hour: '00:00', dayNumber: 2 });
  session.advance(6 * 24 * 60_000);
  expect(formatGameTime(session.getSnapshot().time).day).toBe('Poniedziałek');
});
test('background throttling equals frequent samples; duplicate/backward samples do nothing', () => {
  const a = new GameSession(); const b = new GameSession();
  const ca = new SessionClock(a.advance); const cb = new SessionClock(b.advance);
  ca.start(100); cb.start(100); ca.start(200);
  for (let i = 350; i <= 60_100; i += 250) ca.sample(i);
  cb.sample(60_100); cb.sample(60_100); cb.sample(0);
  expect(a.getSnapshot().time).toBe(b.getSnapshot().time);
  expect(formatGameTime(b.getSnapshot().time).hour).toBe('07:00');
});
test('fractional samples retain precision; restarting never counts closed session', () => {
  const s = new GameSession(); const c = new SessionClock(s.advance); c.start(0);
  c.sample(0.4); c.sample(0.8); c.sample(1.2); expect(s.getSnapshot().time).toBe(21_600_060);
  c.stop(); c.start(100_000); c.sample(101_000); expect(s.getSnapshot().time).toBe(21_660_060);
});
test('duplicate, stale, out-of-order and invalid commands are ignored', () => {
  const cmd = { type: 'advance' as const, sequence: 1, elapsedRealMs: 1000 };
  const s = updateWorld(createInitialState(), cmd);
  expect(updateWorld(s, cmd)).toBe(s);
  expect(updateWorld(s, { ...cmd, sequence: 3 })).toBe(s);
  expect(updateWorld(s, { ...cmd, sequence: 2, elapsedRealMs: -1 })).toBe(s);
});
test('seeded RNG is deterministic and can resume from saved state', () => {
  const sequence = (seed: number) => { const out = []; for (let i = 0; i < 100; i++) { const n = nextRandom(seed); seed = n.state; out.push(n.value); } return out; };
  expect(sequence(0)).toEqual(sequence(0)); expect(sequence(1)).not.toEqual(sequence(0));
  const n = nextRandom(10); expect(sequence(n.state)[0]).toBe(nextRandom(n.state).value);
  expect(sequence(0).every(v => v >= 0 && v < 1)).toBe(true);
});
