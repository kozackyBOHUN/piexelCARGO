import {defineConfig} from '@playwright/test';
import base from './playwright.interface06.config';
export default defineConfig({...base,testMatch:[...(base.testMatch as string[]),'layout07.spec.ts'],use:{...base.use,baseURL:'http://127.0.0.1:5197'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5197 --strictPort',url:'http://127.0.0.1:5197',reuseExistingServer:false}});
