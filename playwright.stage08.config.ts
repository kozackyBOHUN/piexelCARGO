import {defineConfig} from '@playwright/test';
import base from './playwright.layout07.config';
export default defineConfig({...base,testMatch:[...(base.testMatch as string[]),'stage08.spec.ts'],workers:1,use:{...base.use,baseURL:'http://127.0.0.1:5198'},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5198 --strictPort',url:'http://127.0.0.1:5198',reuseExistingServer:false}});
