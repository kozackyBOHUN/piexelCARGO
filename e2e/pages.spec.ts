import {test,expect} from '@playwright/test';
test('production Pages base serves assets, routes and persistent preview',async({page})=>{
 const errors:string[]=[],failed:string[]=[],requests:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`)});
 page.on('request',r=>requests.push(r.url()));
 await page.goto('/piexelCARGO/?preview=1');
 await expect(page.getByLabel('Nazwa firmy')).toBeVisible();
 expect(await page.evaluate(()=>location.pathname)).toBe('/piexelCARGO/');
 await page.getByLabel('Nazwa firmy').fill('Firma GitHub Pages');
 await page.getByLabel('Miasto pierwszej bazy').selectOption('geonames:3094802');
 await page.getByRole('button',{name:'ZAŁÓŻ FIRMĘ'}).click();
 await page.getByRole('button',{name:/PARKING, poziom 1, otwarty/}).click();
 await page.getByRole('tab',{name:'GIEŁDA'}).click();
 await page.getByRole('button',{name:'KUP POJAZD'}).first().click();
 await page.getByRole('button',{name:/KADRY, poziom 1, otwarty/}).click();
 await page.getByRole('button',{name:'ZATRUDNIJ KIEROWCĘ'}).click();
 await page.waitForTimeout(2100);
 const readSaved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pixelcargo-0.1-preview-v1')??'null'));
 const before=await readSaved();expect(before?.company?.name).toBe('Firma GitHub Pages');expect(before.van).not.toBeNull();expect(before.driverHiredAt).not.toBeNull();
 await page.reload();await expect(page.locator('.pv-summary')).toContainText('Firma GitHub Pages');
 await expect(page.locator('.pv-stat').filter({hasText:'Kierowca:'})).toContainText('Zatrudniony');
 await page.locator('.pv-job').filter({has:page.getByText('Kraków → Tarnów',{exact:true})}).getByRole('button',{name:'PRZYJMIJ'}).click();
 await expect(page.getByTestId('osm-route')).toBeVisible();
 expect((await page.getByTestId('osm-route').getAttribute('d'))!.split('L').length).toBeGreaterThan(1000);
 expect(requests.some(u=>u.endsWith('/piexelCARGO/roads/preview/routes.json'))).toBe(true);
 expect(requests.some(u=>u.includes('/roads/demo/graph'))).toBe(false);
 // Navigation and credits must stay inside the repository path too.
 await page.getByRole('navigation',{name:'Widoki gry'}).getByRole('button',{name:'Mapa Polski',exact:true}).click();
 await expect(page.getByTestId('poland-map')).toBeVisible();
 await expect(page.locator('[data-layer="landscape"]')).toHaveAttribute('data-landscape-status','ready');
 await expect(page.getByRole('link',{name:'Źródła i licencje'})).toHaveAttribute('href','/piexelCARGO/map-sources.html');
 await expect(page.getByRole('link',{name:'WIDOK DEVELOPERSKI'})).toHaveAttribute('href','/piexelCARGO/?dev=1');
 await page.goto('/piexelCARGO/map-sources.html');
 const links=await page.locator('a[href^="licenses/"],a[href^="roads/"]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLAnchorElement).href));
 for(const url of links){const response=await page.request.head(url);expect(response.status(),url).toBe(200)}
 expect(requests.filter(u=>u.startsWith('http://127.0.0.1:4193/')&&!u.includes('/piexelCARGO/'))).toEqual([]);
 expect(failed).toEqual([]);expect(errors).toEqual([]);
});
