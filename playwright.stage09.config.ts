import {defineConfig} from '@playwright/test';
import base from './playwright.stage08.config';
export default defineConfig({...base,testMatch:[...(base.testMatch as string[]),'stage09.spec.ts'],workers:1,use:{...base.use,baseURL:'http://127.0.0.1:5199'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5199 --strictPort',url:'http://127.0.0.1:5199',reuseExistingServer:false}});
