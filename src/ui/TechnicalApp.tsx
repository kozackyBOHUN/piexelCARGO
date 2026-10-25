import { useSyncExternalStore } from 'react';
import type { GameSession } from '../core/session';
import { formatGameTime } from '../core/engine';
export function TechnicalApp({ session }: { session: GameSession }) {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const time = formatGameTime(state.time);
  return <main><h1>PixelCargo 0.1</h1><p>Sesja techniczna — Firma nieutworzona.</p><time>{time.day}, {time.hour}</time></main>;
}
