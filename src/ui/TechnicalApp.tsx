import { useSyncExternalStore } from 'react';
import type { GameRuntime } from '../core/runtime';
import { formatGameTime } from '../core/engine';
import { SaveControls } from './SaveControls';
export function TechnicalApp({ runtime }: { runtime: GameRuntime }) {
  const state = useSyncExternalStore(runtime.session.subscribe, runtime.session.getSnapshot);
  const status = useSyncExternalStore(runtime.subscribe, runtime.getStatus);
  const time = formatGameTime(state.time);
  return <main><h1>PixelCargo 0.1</h1><p>Sesja techniczna — Firma nieutworzona.</p><time>{time.day}, {time.hour}</time>
    <p data-testid="save-status">{status.message}</p>{status.mode === 'waiting' && <p role="alert">Inna karta może prowadzić tę sesję. Ta karta czeka i nie nalicza czasu ani nie zapisuje.</p>}
    <SaveControls runtime={runtime} active={status.mode === 'active'} /></main>;
}
