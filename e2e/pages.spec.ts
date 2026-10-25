import {readyCompany} from './helpers/interface06';
import {takeTarnow} from './helpers/freight';
import {test,expect} from '@playwright/test';
test('production Pages base serves assets, routes and persistent preview',async({page})=>{
 const errors:string[]=[],failed:string[]=[],requests:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`)});
 page.on('request',r=>requests.push(r.url()));
 await readyCompany(page,'Firma GitHub Pages','/piexelCARGO/?preview=1');
 expect(await page.evaluate(()=>location.pathname)).toBe('/piexelCARGO/');
 await page.waitForTimeout(2100);
 const artManifest=await (await page.request.get('/piexelCARGO/art/manifest.json')).json();
 for(const a of artManifest.items){const r=await page.request.get('/piexelCARGO/'+a.path.replace(/^public\//,''));expect(r.status()).toBe(200);expect(r.headers()['content-type']).toContain('image/png')}

 const readSaved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pixelcargo-0.1-preview-v1')??'null'));
 const before=await readSaved();expect(before?.company?.name).toBe('Firma GitHub Pages');expect(before.van).not.toBeNull();expect(before.driverHiredAt).not.toBeNull();
 await page.reload();await expect(page.locator('.pc-company')).toContainText('Firma GitHub Pages');
 expect((await readSaved()).driverHiredAt).not.toBeNull();
 await takeTarnow(page);
 await expect(page.getByTestId('osm-route')).toBeVisible();
 expect((await page.getByTestId('osm-route').getAttribute('d'))!.split('L').length).toBeGreaterThan(1000);
 expect(requests.some(u=>u.endsWith('/piexelCARGO/roads/preview/routes.json'))).toBe(true);
 expect(requests.some(u=>u.includes('/roads/demo/graph'))).toBe(false);
 // Navigation and credits must stay inside the repository path too.
 await page.getByRole('button',{name:'MAPA',exact:true}).click();
 await expect(page.getByTestId('poland-map')).toBeVisible();
 await expect(page.locator('[data-layer="landscape"]')).toHaveAttribute('data-landscape-status','ready');
 await expect(page.getByRole('link',{name:'Źródła i licencje'})).toHaveAttribute('href','/piexelCARGO/map-sources.html');
 await page.getByRole('button',{name:'Ustawienia',exact:true}).click();
 await expect(page.getByRole('link',{name:'WIDOK DEVELOPERSKI'})).toHaveAttribute('href','/piexelCARGO/?dev=1');
 await page.goto('/piexelCARGO/map-sources.html');
 const links=await page.locator('a[href^="licenses/"],a[href^="roads/"]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLAnchorElement).href));
 for(const url of links){const response=await page.request.head(url);expect(response.status(),url).toBe(200)}
 expect(requests.filter(u=>u.startsWith('http://127.0.0.1:4193/')&&!u.includes('/piexelCARGO/'))).toEqual([]);
 expect(failed).toEqual([]);expect(errors).toEqual([]);
});
