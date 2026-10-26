import {expect,type Page} from '@playwright/test';
export async function menu(page:Page,section:string,item:string){const button=page.getByRole('navigation',{name:'Menu gry'}).getByRole('button',{name:section,exact:true});if(await button.getAttribute('aria-expanded')!=='true')await button.click();await page.getByRole('button',{name:item,exact:true}).click()}
export async function readyCompany(page:Page,company='Stabilny Transport',url='/?preview=1'){
 await page.goto(url);await page.getByLabel('Nazwa firmy').fill(company);await page.getByRole('button',{name:'ZAŁÓŻ FIRMĘ',exact:true}).click();await menu(page,'PARKING','Giełda używanych');await expect(page.locator('.pv-car-card')).toHaveCount(5);await page.getByRole('button',{name:'KUP POJAZD',exact:true}).first().click();await menu(page,'KADRY','Rekrutacja');await page.getByRole('button',{name:'ZATRUDNIJ KIEROWCĘ',exact:true}).click();
}
