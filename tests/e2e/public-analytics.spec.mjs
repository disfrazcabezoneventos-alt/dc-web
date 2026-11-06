import {test,expect} from '@playwright/test';
import {setupSearch} from '../search-fixture.mjs';

const beacon='https://static.cloudflareinsights.com/beacon.min.js';
const publics=['/','/disfraces/','/cotillon/','/buscar/?q=princesa','/reservas/','/comprar/','/condiciones/','/arrepentimiento/','/p/spider/'];
const privates=['/admin/','/constancia/','/solicitud/','/reserva-local/'];
async function openMenu(page){if(page.viewportSize().width<=760)await page.getByRole('button',{name:'Abrir menú',exact:true}).click()}

async function setup(page,theme){
 await setupSearch(page,theme);
 const requests=[],errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route(beacon,route=>{requests.push(route.request().url());return route.fulfill({contentType:'text/javascript',body:'window.__analyticsTestDocument=location.pathname;'})});
 return {requests,errors};
}

for(const theme of ['default','halloween']){
 test(`${theme}: beacon diferido solo en las nueve rutas públicas, incluida una ficha`,async({page})=>{
  const {requests,errors}=await setup(page,theme);
  for(const path of publics){
   await page.goto(path);
   await expect.poll(()=>requests.length).toBe(publics.indexOf(path)+1);
   await expect.poll(()=>page.evaluate(()=>window.__analyticsTestDocument)).toBe(new URL(path,'http://127.0.0.1').pathname);
   const script=page.locator('#dc-cloudflare-web-analytics');
   await expect(script).toHaveAttribute('type','module');
   await expect(script).toHaveAttribute('data-nscript','lazyOnload');
   await expect(script).toHaveAttribute('data-cf-beacon',JSON.stringify({token:'423aece803a247f5aa622735d0e5c158'}));
   expect(await page.evaluate(()=>performance.getEntriesByType('resource').find(r=>r.name.includes('beacon.min.js')).startTime>=performance.getEntriesByType('navigation')[0].loadEventStart)).toBe(true);
  }
  expect(errors).toEqual([]);
 });

 test(`${theme}: ninguna descarga ni ejecución en las cuatro rutas privadas`,async({page})=>{
  const {requests,errors}=await setup(page,theme);
  for(const path of privates){
   await page.goto(path);await expect(page.locator('main')).toBeVisible();
   await page.evaluate(()=>new Promise(resolve=>requestIdleCallback(resolve)));
   await expect(page.locator('#dc-cloudflare-web-analytics')).toHaveCount(0);
   expect(await page.evaluate(()=>window.__analyticsTestDocument)).toBeUndefined();
  }
  expect(requests).toEqual([]);expect(errors).toEqual([]);
 });
}

test('navegación pública conserva un beacon; el cruce privado y volver crean documentos aislados',async({page})=>{
 const {requests,errors}=await setup(page,'default');
 await page.goto('/');await expect.poll(()=>requests.length).toBe(1);
 await openMenu(page);
 await page.locator('.site-header').getByRole('link',{name:'Disfraces',exact:true}).click();
 await expect(page).toHaveURL(/\/disfraces\/$/);
 expect(await page.evaluate(()=>window.__analyticsTestDocument)).toBe('/');expect(requests).toHaveLength(1);
 // Test a Next Link crossing the boundary, without adding any real public admin link.
 await openMenu(page);
 await page.locator('.site-header').getByRole('link',{name:'Cotillón',exact:true}).evaluate(el=>el.href='/admin/');
 await page.locator('.site-header').getByRole('link',{name:'Cotillón',exact:true}).click();
 await expect(page).toHaveURL(/\/admin\/$/);await expect(page.locator('main')).toBeVisible();
 expect(await page.evaluate(()=>window.__analyticsTestDocument)).toBeUndefined();expect(requests).toHaveLength(1);
 await openMenu(page);
 await page.locator('.site-header').getByRole('link',{name:'Disfraces',exact:true}).click();
 await expect.poll(()=>requests.length).toBe(2);expect(await page.evaluate(()=>window.__analyticsTestDocument)).toBe('/disfraces/');
 await page.goBack();await expect(page).toHaveURL(/\/admin\/$/);
 expect(await page.evaluate(()=>window.__analyticsTestDocument)).toBeUndefined();
 expect(errors).toEqual([]);
});
