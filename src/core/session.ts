import type { GameState } from "../domain/models";
import { updateWorld } from "./engine";
import { createInitialState } from "./state";
/** One source of truth. Returned snapshots are immutable by contract. */
export class GameSession {
  private state: GameState;
  private listeners = new Set<() => void>();
  constructor(state = createInitialState()) {
    this.state = structuredClone(state);
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  advance = (elapsedRealMs: number) => {
    const next = updateWorld(this.state, {
      type: "advance",
      sequence: this.state.commandSequence + 1,
      elapsedRealMs,
    });
    if (next !== this.state) {
      this.state = next;
      this.emit();
    }
  };
  restore = (state: GameState) => {
    this.state = structuredClone(state);
    this.emit();
  };
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}
/** A monotonic clock catches up throttled timers in the SAME session only. */
export class SessionClock {
  private last: number | null = null;
  private carry = 0;
  constructor(private advance: (elapsedRealMs: number) => void) {}
  start(now: number) {
    if (this.last === null) this.last = now;
  }
  stop() {
    this.last = null;
    this.carry = 0;
  }
  sample(now: number) {
    if (this.last === null || !Number.isFinite(now) || now <= this.last) return;
    this.carry += now - this.last;
    this.last = now;
    const elapsed = Math.floor(this.carry);
    this.carry -= elapsed;
    if (elapsed > 0) this.advance(elapsed);
  }
}
