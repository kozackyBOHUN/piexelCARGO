import {defineConfig} from '@playwright/test';
import base from './playwright.stage11.config';
/** Read-only static deployment; all company data stays in the disposable test browser.
 * ignoreHTTPSErrors is only for this cloud's Chromium proxy CA, never a product setting. */
export default defineConfig({...base,testMatch:'routing11.spec.ts',workers:1,webServer:undefined,use:{...base.use,baseURL:'https://kozackybohun.github.io/piexelCARGO/',ignoreHTTPSErrors:true}});
