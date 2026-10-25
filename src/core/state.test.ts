import { expect, test } from 'vitest';
import { createInitialState } from './state';
import { CONFIG } from './config';
test('technical session has no company, credit or shared mutable state', () => {
  const a = createInitialState(); const b = createInitialState();
  expect(a.company).toBeNull(); expect(a.time).toBe(CONFIG.startTime);
  a.events.length = 0; expect(b.events).toHaveLength(1);
  expect(Number.isSafeInteger(a.time)).toBe(true);
});
