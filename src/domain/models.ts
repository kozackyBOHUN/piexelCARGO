/** Money is always integer grosze; simulation time is integer game milliseconds. */
export type Money = number;
export type GameTime = number;
export interface Company { id: string; name: string; balance: Money; debt: Money }
export interface Vehicle { id: string; name: string }
export interface Driver { id: string; name: string }
export interface CargoUnit { id: string; quantity: number }
export interface Job { id: string; cargo: CargoUnit[] }
export interface Route { id: string; nodeIds: string[] }
export interface TimelineAction { id: string; start: GameTime; end: GameTime }
export interface LedgerEntry { id: string; eventId: string; amount: Money; at: GameTime }
export interface DomainEvent { id: string; type: 'session-started'; at: GameTime }
export type GameCommand = { type: 'advance'; sequence: number; elapsedRealMs: number };
export interface GameState {
  time: GameTime;
  rngState: number;
  company: Company | null;
  events: DomainEvent[];
  commandSequence: number;
}
export interface SaveEnvelope {
  schemaVersion: 1;
  saveId: string;
  savedAt: string;
  state: GameState;
}
