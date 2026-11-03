import {test,expect} from '@playwright/test';
import {setupSearch as setup} from '../search-fixture.mjs';
async function searchField(page){
 await expect(page.locator('.product-card').first()).toBeVisible();
 if(page.viewportSize().width<=1100)await page.getByRole('button',{name:'Abrir búsqueda global',exact:true}).click();else await page.keyboard.press('/');
 const input=page.getByRole('combobox',{name:'Buscar en toda la tienda'}).filter({visible:true});await expect(input).toBeFocused();return input;
}
for(const theme of ['default','halloween']){
 test(`${theme}: sugerencias, teclado, caché, sticky y captura sin desbordes`,async({page},info)=>{
  await page.clock.setFixedTime(new Date('2026-10-28T12:00:00-03:00'));const mock=await setup(page,theme);await page.goto('/');await expect(page.locator('.product-card').first()).toBeVisible();
  const header=await page.locator('.site-header').boundingBox(),banner=await page.getByRole('region',{name:'Halloween es este sábado 🎃'}).boundingBox();expect(header.y+header.height).toBeLessThanOrEqual(banner.y+1);
  const input=await searchField(page);await input.fill('heroe');await expect(page.getByRole('option').filter({visible:true})).toHaveCount(6);await input.press('ArrowUp');await expect(input).toHaveAttribute('aria-activedescendant',/-suggestion-5$/);await input.fill('rojo hombre araña');await expect(page.getByRole('option').filter({visible:true})).toHaveCount(1);
  expect(mock.catalogCalls()).toBe(1);await page.screenshot({path:info.outputPath(theme+'-busqueda.png'),fullPage:false});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(page.viewportSize().width<=1100){const close=await page.getByRole('button',{name:'Cerrar búsqueda',exact:true}).boundingBox();expect(close.width).toBeGreaterThanOrEqual(44);expect(close.height).toBeGreaterThanOrEqual(44);await input.press('Escape');await expect(page.getByRole('button',{name:'Abrir búsqueda global'})).toBeFocused();await page.getByRole('button',{name:'Abrir búsqueda global'}).click()}
  await input.press('ArrowDown');await input.press('Enter');await expect(page).toHaveURL(/\/disfraces\/#producto=spider$/);await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('heading',{name:'Spider-Man rojo'})).toBeVisible();await page.getByRole('button',{name:'Cerrar detalle'}).click();
  await page.evaluate(()=>window.scrollTo(0,700));await expect.poll(()=>page.locator('.site-header').evaluate(el=>Math.round(el.getBoundingClientRect().top))).toBe(0);
  const hb=await page.locator('.site-header').boundingBox();for(const cls of ['.floating-cart','.floating-wa']){const b=await page.locator(cls).boundingBox();expect(b.y+b.height<=hb.y||b.y>=hb.y+hb.height).toBe(true);}
 });
 test(`${theme}: resultados, filtro, normalización local y sin resultados`,async({page},info)=>{
  const mock=await setup(page,theme);await page.goto('/buscar/?q=mascara');await expect(page.locator('.product-card')).toHaveCount(2);await page.screenshot({path:info.outputPath(theme+'-resultados.png'),fullPage:false});
  await page.getByRole('button',{name:'Cotillón',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(1);await page.getByRole('button',{name:'Todos',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(2);
  await page.goto('/buscar/?q=unicornio-imposible');await expect(page.getByRole('heading',{name:'No encontramos esa idea todavía.'})).toBeVisible();await expect(page.getByRole('link',{name:'Consultar por WhatsApp',exact:true}).filter({hasText:'Consultar por WhatsApp'})).toHaveAttribute('href',/Hola%2C%20busco%3A/);
  await expect.poll(()=>mock.missAttempts.length).toBe(1);await page.waitForTimeout(1700);expect(mock.missAttempts).toHaveLength(1);await expect(page.locator('.error-banner')).toHaveCount(0);await page.screenshot({path:info.outputPath(theme+'-sin-resultados.png'),fullPage:false});
  await page.goto('/disfraces/');await page.getByRole('textbox',{name:'Buscar productos',exact:true}).fill('infantil hombre araña');await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goto('/cotillon/');await page.getByRole('textbox',{name:'Buscar productos',exact:true}).fill('ROJA mascara');await expect(page.locator('.product-card')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('Enter sin selección y botón Ver todos navegan a la consulta, cambiar consulta en /buscar funciona',async({page})=>{
 await setup(page);await page.goto('/');let input=await searchField(page);await input.fill('princesa');await input.press('Enter');await expect(page).toHaveURL(/\/buscar\/\?q=princesa$/);await expect(page.locator('.product-card')).toHaveCount(1);
 input=await searchField(page);await input.fill('mascara');await page.getByRole('button',{name:'Ver todos los resultados',exact:true}).filter({visible:true}).click();await expect(page).toHaveURL(/\?q=mascara$/);await expect(page.locator('.product-card')).toHaveCount(2);
});
