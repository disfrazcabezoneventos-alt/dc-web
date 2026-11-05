import {test,expect} from './theme-fixture.mjs';
import {setupSearch} from '../search-fixture.mjs';
for(const theme of ['default','halloween'])test(`${theme}: Aladdín aparece por ambas grafías en catálogo y búsqueda global`,async({page},info)=>{
 const {h}=await setupSearch(page,theme);
 h.tables.disfraces=[{...h.product,id:'aladdin',name:'Aladdín Verde',description:'Traje para fiestas temáticas'},{...h.product,id:'fairy',name:'Campanita',description:'Disfraz de hada'}];
 await page.goto('/buscar/?q=aladin');await expect(page.locator('.product-card')).toHaveCount(1);await expect(page.locator('.product-card')).toContainText('Aladdín Verde');
 await page.goto('/disfraces/');const catalog=page.getByRole('textbox',{name:'Buscar productos',exact:true});await catalog.fill('ALADDIN');await expect(page.locator('.product-card')).toHaveCount(1);await catalog.fill('aladín');await expect(page.locator('.product-card')).toHaveCount(1);
 await page.screenshot({path:info.outputPath(theme+'-aladin.png'),fullPage:false});
 if(page.viewportSize().width<1000)await page.getByRole('button',{name:'Abrir búsqueda global',exact:true}).click();else await page.keyboard.press('/');
 const input=page.getByRole('combobox',{name:'Buscar en toda la tienda'}).filter({visible:true});await input.fill('aladin');await expect(page.getByRole('option').filter({visible:true})).toHaveCount(1);await expect(page.getByRole('option').filter({visible:true})).toContainText('Aladdín Verde');
 await input.fill('aladin azul');await expect(page.getByRole('option').filter({visible:true})).toHaveCount(0);await input.press('Escape');
 await page.goto('/buscar/?q=tinkerbell');await expect(page.locator('.product-card')).toHaveCount(1);await expect(page.locator('.product-card')).toContainText('Campanita');
});
