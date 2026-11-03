import {test,expect} from '@playwright/test';
import {setupSearch} from '../search-fixture.mjs';
test('Admin ve búsquedas agrupadas y Editor no ve esa sección',async({page},info)=>{
 const {h,logs}=await setupSearch(page,'default',false);h.ctx.dispatch_({action:'recordSearchMiss',query:'Dragon'});logs.push(['"Dragón"','2026-11-03T12:00:00Z']);h.ctx.dispatch_({action:'recordSearchMiss',query:'Unicornio'});
 await page.addInitScript(token=>{if(!sessionStorage.getItem('dc-admin'))sessionStorage.setItem('dc-admin',token)},h.admin);await page.goto('/admin/');await page.getByRole('button',{name:'Lo que buscan y no tenemos',exact:true}).click();
 await expect(page.locator('tbody tr')).toHaveCount(2);await expect(page.locator('tbody tr').first()).toContainText('Dragon');await expect(page.locator('tbody tr').first()).toContainText('2');await page.screenshot({path:info.outputPath('admin-busquedas.png'),fullPage:false});
 h.createEditor();const token=h.loginEditor();await page.evaluate(token=>sessionStorage.setItem('dc-admin',token),token);await page.reload();await expect(page.getByRole('heading',{name:'Tu catálogo.'})).toBeVisible();await expect(page.getByRole('button',{name:'Lo que buscan y no tenemos',exact:true})).toHaveCount(0);
});

test('registra solo consulta y fecha sin invalidar la caché ni recargar el catálogo',async({page})=>{
 const {logs,catalogCalls}=await setupSearch(page,'default',false);await page.goto('/buscar/?q=idea-imposible');await expect(page.getByRole('heading',{name:'No encontramos esa idea todavía.'})).toBeVisible();await expect.poll(()=>logs.length).toBe(2);expect(logs[1]).toHaveLength(2);expect(JSON.parse(logs[1][0])).toBe('idea-imposible');await expect(page.locator('.error-banner')).toHaveCount(0);
 await expect(page.locator('iframe[name^="dc-apps-"]')).toHaveCount(0);expect(catalogCalls()).toBe(1);
 expect(await page.evaluate(()=>!!sessionStorage.getItem('dc-public-catalog-v1'))).toBe(true);
 await page.goto('/buscar/?q=mascara');await expect(page.locator('.product-card')).toHaveCount(2);expect(catalogCalls()).toBe(1);
});
