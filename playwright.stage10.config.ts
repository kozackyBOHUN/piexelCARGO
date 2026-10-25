import {defineConfig} from '@playwright/test';
import base from './playwright.stage09.config';
export default defineConfig({...base,testMatch:[...(base.testMatch as string[]),'cargo10.spec.ts'],use:{...base.use,baseURL:'http://127.0.0.1:5200'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5200 --strictPort',url:'http://127.0.0.1:5200',reuseExistingServer:false}});
