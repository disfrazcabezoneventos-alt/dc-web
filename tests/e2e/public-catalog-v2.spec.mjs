import {test,expect} from './theme-fixture.mjs';
import fs from 'node:fs';
import {publicHarness} from '../public-catalog-test-backend.mjs';
test('public v2: no stock físico, máximo 10, inactivos ocultos, reserva y logo del tema',async({page},info)=>{
 const h=publicHarness(),theme=info.project.metadata.theme||'default';h.settings.SITE_THEME=theme;h.settings.COTILLON_EXCEL_2026_STATE='ready';
 h.tables.disfraces[0].stock=314;h.tables.disfraces[0].rentPrice=60000;h.tables.disfraces[0].mode='alquiler';h.tables.cotillon[0].stock=314;
 h.tables.cotillon.push({...h.tables.cotillon[0],id:'hidden',name:'Oculto de ensayo',active:false},{...h.tables.cotillon[0],id:'zero',name:'Agotado visible',stock:0});
 const responses=[],logos=[];page.on('request',r=>{if(/brand-(normal|halloween)-320/.test(r.url()))logos.push(r.url())});
 await page.route('https://res.cloudinary.com/**',r=>r.fulfill({contentType:'image/png',body:fs.readFileSync('public/brand-normal-320.png')}));
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const f=new URLSearchParams(route.request().postData()),body=JSON.parse(f.get('payload')),result=h.post(body);if(body.action==='catalogData')responses.push(result.data);
  await route.fulfill({contentType:'text/html; charset=utf-8',body:'<meta charset="utf-8"><script>parent.postMessage('+JSON.stringify({type:'dc-apps-result',id:f.get('bridgeId'),result}).replace(/</g,'\u003c')+','+JSON.stringify(f.get('origin'))+')</script>'});
 });
 await page.goto('/cotillon/');await expect(page.locator('.product-card')).toHaveCount(2);await expect(page.getByRole('heading',{name:'Oculto de ensayo'})).toHaveCount(0);await expect(page.locator('.product-card').filter({hasText:'Agotado visible'})).toContainText('AGOTADO');
 await page.getByRole('button',{name:'Agregar al carrito',exact:true}).click();await page.getByRole('button',{name:/Carrito 1 ·/}).click();const plus=page.getByRole('button',{name:'Agregar una unidad de Producto de ensayo',exact:true});for(let n=1;n<10;n++)await plus.click();await expect(plus).toBeDisabled();await expect(page.locator('.cart-quantity>span')).toHaveText('10');await page.getByRole('button',{name:'Cerrar carrito',exact:true}).click();
 await page.goto('/reservas/?producto=ensayo-disfraz');await expect(page.locator('.rental-product-note')).toContainText('Producto de ensayo');
 expect(responses.length).toBeGreaterThan(0);for(const data of responses){expect(data.catalogVersion).toBe(2);for(const p of data.products){expect(p.stock).toBeUndefined();expect(p.purchaseMax).toBeLessThanOrEqual(10);expect(typeof p.available).toBe('boolean')}}
 await expect.poll(()=>logos.length).toBeGreaterThan(0);expect(logos.some(url=>url.includes(theme==='halloween'?'brand-normal':'brand-halloween'))).toBe(false);
 await page.screenshot({path:info.outputPath('public-v2.png')});
});
