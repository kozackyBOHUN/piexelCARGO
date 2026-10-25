import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:['interface06.spec.ts','preview.spec.ts','unified.spec.ts','freight.spec.ts','app.spec.ts','ui.spec.ts','map.spec.ts','navigation.spec.ts','landscape.spec.ts','persistence.spec.ts'],workers:1,use:{...base.use,baseURL:'http://127.0.0.1:5196'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5196 --strictPort',url:'http://127.0.0.1:5196',reuseExistingServer:false}});
