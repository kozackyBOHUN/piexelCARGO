import { createRoot } from 'react-dom/client';
import { GameRuntime } from './core/runtime';
import { TechnicalApp } from './ui/TechnicalApp';
const runtime = new GameRuntime(); runtime.start();
createRoot(document.getElementById('root')!).render(<TechnicalApp runtime={runtime} />);
if (import.meta.hot) import.meta.hot.dispose(() => { void runtime.close(); });
