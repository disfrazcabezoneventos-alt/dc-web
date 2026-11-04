import {test,expect} from './theme-fixture.mjs';
import {setupSearch} from '../search-fixture.mjs';
for(const width of [1093,1024,900,768,390])for(const theme of ['default','halloween'])test(`${width}px ${theme}: menú, foco exterior y vacío de sugerencias`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await setupSearch(page,theme);await page.goto('/disfraces/');await expect(page.locator('.product-card').first()).toBeVisible();
 const header=page.locator('.site-header'),nav=header.locator('nav');
 if(width>=761){await expect(nav).toBeVisible();for(const label of ['Disfraces','Cotillón','Reservá tu disfraz','Hablemos'])await expect(nav.getByRole('link',{name:label,exact:true})).toBeVisible();await expect(header.getByRole('button',{name:'Abrir menú'})).toBeHidden();}
 else{await expect(nav).toBeHidden();await expect(header.getByRole('button',{name:'Abrir menú'})).toBeVisible();}
 const targets=['.wordmark',width>=1000?'.global-search-desktop':'.global-search-trigger',width>=761?'nav':'.menu-button'];
 const boxes=await Promise.all(targets.map(selector=>header.locator(selector).boundingBox()));
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.x+a.width<=b.x+1||b.x+b.width<=a.x+1).toBe(true);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`${width}-${theme}-encabezado.png`),fullPage:false});
 if(width<1000)await page.getByRole('button',{name:'Abrir búsqueda global'}).click();else await page.keyboard.press('/');
 const input=page.getByRole('combobox',{name:'Buscar en toda la tienda'}).filter({visible:true});await expect(input).toBeFocused();await input.fill('spiderman');await expect(page.getByRole('option').filter({visible:true})).toHaveCount(1);
 expect(await input.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
 const field=page.locator(width>=1000?'.global-search-desktop':'.global-search-mobile-field');
 expect(await field.evaluate(el=>getComputedStyle(el).outlineWidth)).toBe('3px');expect(await field.evaluate(el=>getComputedStyle(el).borderRadius)).toBe('30px');
 await page.screenshot({path:info.outputPath(`${width}-${theme}-foco.png`),fullPage:false});
 await input.fill('inexistente12345');const results=page.locator(width>=1000?'.global-search-popover':'.global-search-dialog');
 await expect(results.getByText('No encontramos esa idea todavía.',{exact:true})).toBeVisible();await expect(results.getByRole('button',{name:'Ver todos los resultados'})).toHaveCount(0);
 const links=results.locator('.search-empty-suggestions a');await expect(links).toHaveText(['Consultar por WhatsApp','Disfraces','Cotillón']);await expect(links.first()).toHaveClass(/dark/);await expect(links.first()).toHaveAttribute('href',/Hola%2C%20busco%3A/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath(`${width}-${theme}-vacio.png`),fullPage:false});
});
