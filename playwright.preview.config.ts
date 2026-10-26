import { defineConfig } from '@playwright/test';
import base from './playwright.config';
/** Isolated port avoids accidentally testing another worktree's Vite instance. */
export default defineConfig({
 ...base, testMatch:'preview.spec.ts', workers:1,
 use:{...base.use,baseURL:'http://127.0.0.1:5191'},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5191 --strictPort',url:'http://127.0.0.1:5191',reuseExistingServer:false},
});
