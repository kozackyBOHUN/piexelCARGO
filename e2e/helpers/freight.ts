import {type Page} from '@playwright/test';
import {menu} from './interface06';
export async function takeTarnow(page:Page){
 await menu(page,'SPEDYCJA','Szukaj zleceń');await page.getByLabel('Miasto załadunku',{exact:true}).selectOption('geonames:3094802');await page.getByLabel('Miasto rozładunku',{exact:true}).selectOption('geonames:757026');await page.getByLabel('Wielkość ładunku',{exact:true}).selectOption('fits');
 await page.locator('[data-offer-id] button:enabled').first().click();await menu(page,'SPEDYCJA','Zlecenia przyjęte');await page.getByRole('button',{name:'PRZYDZIEL AUTO',exact:true}).click();await page.getByRole('button',{name:'ROZPOCZNIJ KURS',exact:true}).click();
}
/** Advance the installed test clock by the actual saved course duration, not an old route's estimate. */
export async function finishCurrentCourse(page:Page){
 const remaining=await page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('pixelcargo-0.1-preview-v1')!),a=s.active;if(!a)return 0;
  const phases=a.emptyOnly?['empty']:['empty','loading','loaded','unloading'];
  return phases.slice(phases.indexOf(a.phase)).reduce((sum:number,p:string)=>sum+(p==='empty'?Math.round(a.routeEmpty.seconds*1000):p==='loaded'?Math.round(a.routeLoaded.seconds*1000):900000)-(p===a.phase?a.phaseProgressMs:0),0);
 });
 await page.clock.fastForward(Math.ceil(remaining/60)+2000);await page.clock.runFor(1250);
}
