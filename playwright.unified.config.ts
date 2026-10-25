import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:['preview.spec.ts','unified.spec.ts','app.spec.ts','ui.spec.ts','map.spec.ts','navigation.spec.ts','landscape.spec.ts','persistence.spec.ts'],workers:1,
 use:{...base.use,baseURL:'http://127.0.0.1:5192'},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5192 --strictPort',url:'http://127.0.0.1:5192',reuseExistingServer:false}});
