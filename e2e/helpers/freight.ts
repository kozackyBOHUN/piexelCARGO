import {type Page} from '@playwright/test';
import {menu} from './interface06';
export async function takeTarnow(page:Page){
 await menu(page,'SPEDYCJA','Szukaj zleceń');await page.getByLabel('Miasto załadunku',{exact:true}).selectOption('geonames:3094802');await page.getByLabel('Miasto rozładunku',{exact:true}).selectOption('geonames:757026');await page.getByLabel('Wielkość ładunku',{exact:true}).selectOption('fits');
 await page.locator('[data-offer-id] button:enabled').first().click();await menu(page,'SPEDYCJA','Zlecenia przyjęte');await page.getByRole('button',{name:'PRZYDZIEL AUTO',exact:true}).click();await page.getByRole('button',{name:'ROZPOCZNIJ KURS',exact:true}).click();
}
