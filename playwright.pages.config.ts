import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
 ...base,testMatch:'pages.spec.ts',workers:1,
 use:{...base.use,baseURL:'http://127.0.0.1:4193/piexelCARGO/'},
 webServer:{command:'npm exec -- vite preview --host 127.0.0.1 --port 4193 --strictPort --base=/piexelCARGO/',url:'http://127.0.0.1:4193/piexelCARGO/',reuseExistingServer:false},
});
