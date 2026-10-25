import {takeTarnow} from './helpers/freight';
import {test,expect,type Page} from '@playwright/test';
import type {PreviewState} from '../src/preview/gameplay';
const saved=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('pixelcargo-0.1-preview-v1')??'null') as PreviewState|null);
const nav=(page:Page,name:string)=>page.getByRole('navigation',{name:'Widoki gry'}).getByRole('button',{name,exact:true});
async function assertCanonical(page:Page){
 await page.getByTestId('poland-map').waitFor({state:'attached'});
 const values=await page.evaluate(()=>['[data-testid="canonical-clock"]','[data-testid="poland-map"]','[data-testid="game-timeline"]'].map(s=>{const e=document.querySelector(s)!;return e.getAttribute('data-time')??e.getAttribute('data-game-time')}));
 expect(values[0]).not.toBeNull();expect(new Set(values).size).toBe(1);
}
async function assertMarkerProjection(page:Page){
 const error=await page.evaluate(()=>{
  const marker=document.querySelector('[data-testid="game-vehicle"]')!,map=document.querySelector('[data-testid="poland-map"]')!;
  const n=(e:Element,k:string)=>Number(e.getAttribute(k));const lon=n(marker,'data-lon'),lat=n(marker,'data-lat'),scale=n(map,'data-map-scale');
  const x=6378137*lon*Math.PI/180*scale+n(map,'data-offset-x'),y=-6378137*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*scale+n(map,'data-offset-y');
  return Math.max(Math.abs(x-n(marker,'data-screen-x')),Math.abs(y-n(marker,'data-screen-y')));
 });expect(error).toBeLessThan(1e-6);
}
for(const viewport of [{width:1366,height:768},{width:1920,height:1080}])test(`one world, map, real schedule, delivery and restart ${viewport.width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize(viewport);await page.clock.install();
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByTestId('poland-map')).toBeVisible();
 await page.getByLabel('Nazwa firmy').fill('Jedna gra');
 await page.getByLabel('Miasto pierwszej bazy').selectOption('geonames:3094802');
 await page.getByRole('button',{name:'ZAŁÓŻ FIRMĘ'}).click();
 await page.getByRole('button',{name:/PARKING, poziom 1, otwarty/}).click();
 await page.getByRole('tab',{name:'GIEŁDA',exact:true}).click();
 const price=await page.locator('.pv-car-card').first().locator('.pv-car-purchase strong').innerText();expect(price).toContain('zł');
 await page.getByRole('button',{name:'KUP POJAZD',exact:true}).first().click();
 await page.getByRole('button',{name:/KADRY, poziom 1, otwarty/}).click();
 await page.getByRole('button',{name:'ZATRUDNIJ KIEROWCĘ'}).click();
 await nav(page,'Rynek zleceń').click();
 await takeTarnow(page);
 await page.clock.runFor(500);
 await expect(page.getByTestId('osm-route')).toBeVisible();await expect(page.getByTestId('game-vehicle')).toBeVisible();
 await expect(page.getByTestId('transport-phase')).toHaveText('Załadunek');await assertCanonical(page);await assertMarkerProjection(page);
 const plan=await page.locator('.transport-block').evaluateAll(nodes=>nodes.map(n=>({phase:n.getAttribute('data-phase'),start:Number(n.getAttribute('data-start')),end:Number(n.getAttribute('data-end'))})));
 expect(plan.map(p=>p.phase)).toEqual(['empty','loading','loaded','unloading']);
 expect(plan[0].end-plan[0].start).toBe(0);expect(plan[1].end-plan[1].start).toBe(900000);expect(plan[3].end-plan[3].start).toBe(900000);
 const firstLon=await page.getByTestId('game-vehicle').getAttribute('data-lon');
 await page.clock.runFor(17000);await expect(page.getByTestId('transport-phase')).toHaveText('Jazda z ładunkiem');
 expect(await page.getByTestId('game-vehicle').getAttribute('data-lon')).not.toBe(firstLon);
 await assertCanonical(page);await assertMarkerProjection(page);
 const map=page.getByTestId('poland-map'),box=(await map.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,-250);await page.clock.runFor(100);await assertMarkerProjection(page);
 await page.mouse.down();await page.mouse.move(box.x+box.width/2+30,box.y+box.height/2+15,{steps:5});await page.mouse.up();await assertMarkerProjection(page);
 await page.getByRole('button',{name:'Pokaż pojazd',exact:true}).click();await page.getByTestId('game-vehicle').click();
 await expect(page.getByLabel('Wybrany pojazd')).toContainText('Tarnów');await expect(page.getByLabel('Wybrany pojazd')).toContainText('Postęp');
 await page.screenshot({path:`/tmp/pixelcargo-unified-${viewport.width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const before=(await saved(page))!;expect(before.active?.phase).toBe('loaded');
 for(const name of ['Baza firmy','Flota / parking','Rynek zleceń','Harmonogram','Mapa Polski']){await nav(page,name).click();await assertCanonical(page);}
 expect((await saved(page))!.active?.offer.id).toBe(before.active!.offer.id);
 await page.reload();await expect(page.getByTestId('transport-phase')).toHaveText('Jazda z ładunkiem');await assertCanonical(page);
 await page.clock.runFor(1250);const restored=(await saved(page))!;
 expect(restored.active?.offer.id).toBe(before.active!.offer.id);expect(restored.active!.phaseProgressMs).toBeGreaterThanOrEqual(before.active!.phaseProgressMs);
 await page.clock.fastForward(120000);await page.clock.runFor(1250);
 const delivered=(await saved(page))!;expect(delivered.active).toBeNull();expect(delivered.completedOfferIds).toEqual([before.active!.offer.id]);
 expect(delivered.events.filter(e=>e.message.startsWith('Dostarczono'))).toHaveLength(1);
 expect(delivered.van?.cityId).toBe('geonames:757026');
 await expect(page.getByTestId('game-vehicle')).toHaveAttribute('data-status','Oczekiwanie');
 await expect(page.getByTestId('game-vehicle')).toHaveAttribute('data-lon',String(before.active!.routeLoaded.geometry.at(-1)![0]));
 await expect(page.locator('.transport-block[data-phase="waiting"]')).toBeVisible();
 const elapsed=delivered.time-delivered.driverHiredAt!;expect(delivered.paidWagesGrosze).toBe(Math.floor(elapsed/3600000)*2500);
 expect(delivered.company!.balanceGrosze).toBe(2000000-delivered.van!.specs!.priceGrosze+before.active!.offer.payoutGrosze-delivered.paidWagesGrosze);
 await page.goto('/?preview=1');await expect(page.getByTestId('poland-map')).toBeVisible();await assertCanonical(page);
 await page.clock.runFor(1250);expect((await saved(page))!.completedOfferIds).toEqual(delivered.completedOfferIds);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'RESTART FIRMY'}).click();
 const reset=(await saved(page))!;expect(reset.time).toBe(21600000);expect(reset.company).toBeNull();expect(reset.van).toBeNull();expect(reset.completedOfferIds).toEqual([]);expect(reset.lastTransport).toBeUndefined();
 await page.reload();await expect(page.getByLabel('Nazwa firmy')).toHaveValue('');expect((await saved(page))?.company).toBeNull();expect(errors).toEqual([]);
});
