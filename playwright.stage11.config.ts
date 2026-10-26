import {defineConfig} from '@playwright/test';
import base from './playwright.stage10.config';
export default defineConfig({...base,testMatch:[...(base.testMatch as string[]),'routing11.spec.ts'],workers:1,use:{...base.use,baseURL:'http://127.0.0.1:5211'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5211 --strictPort',url:'http://127.0.0.1:5211',reuseExistingServer:false}});
