import {expect,type Page} from '@playwright/test';
/** Reserving a market offer and dispatching it are deliberately separate actions. */
export async function takeTarnow(page:Page){
 await page.getByLabel('Miejsce nadania',{exact:true}).selectOption('geonames:3094802');
 await page.getByLabel('Wielkość ładunku',{exact:true}).selectOption('fits');
 const job=page.locator('[data-offer-id]').filter({has:page.getByText('Kraków → Tarnów',{exact:true})}).first();
 await job.getByRole('button',{name:'PRZYJMIJ',exact:true}).click();
 await expect(page.locator('[data-order-id]')).toHaveCount(1);
 await page.locator('[data-order-id]').getByRole('button',{name:'ROZPOCZNIJ KURS',exact:true}).click();
}
