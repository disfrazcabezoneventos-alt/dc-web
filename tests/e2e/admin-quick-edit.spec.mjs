import {test,expect} from '@playwright/test';
import {setupAdmin} from './admin-quick-fixture.mjs';
const section=(page,area='Disfraces')=>page.getByRole('region',{name:'Productos de '+area,exact:true});
const row=(page,name)=>section(page).getByRole('row',{name,exact:true});
async function open(page,area='Disfraces'){await page.locator('.admin-tabs').getByRole('button',{name:area,exact:true}).click();await expect(section(page,area)).toBeVisible();}

test('filtra por estado, categoría secundaria y búsqueda sin tildes; conserva filtros por área',async({page})=>{
 const state=await setupAdmin(page);await open(page);
 await expect(section(page).getByRole('status')).toContainText('Mostrando 50 de 60 productos');
 await page.getByLabel('Buscar en Disfraces',{exact:true}).fill('SUPER HEROE');await expect(row(page,'Súper Héroe Niño')).toBeVisible();
 await page.getByRole('combobox',{name:'Categoría',exact:true}).selectOption('category:halloween-d');await expect(row(page,'Súper Héroe Niño')).toBeVisible();
 await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('disabled');await expect(section(page).getByRole('status')).toContainText('Mostrando 0 de 60');
 await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('enabled');
 await open(page,'Cotillón');await page.getByLabel('Buscar en Cotillón',{exact:true}).fill('mascara de fiesta');
 await expect(section(page,'Cotillón').getByRole('status')).toContainText('Mostrando 1 de 1200');
 await open(page);await expect(page.getByLabel('Buscar en Disfraces',{exact:true})).toHaveValue('SUPER HEROE');
 await page.getByRole('button',{name:'Limpiar filtros'}).click();await page.getByRole('combobox',{name:'Categoría',exact:true}).selectOption('uncategorized');
 await expect(row(page,'Disfraz sin categoría')).toBeVisible();await expect(section(page).getByRole('status')).toContainText('Mostrando 1 de 60');
 expect(state.received).toHaveLength(0);
});
test('pagina 1200 productos de Cotillón de a 50 y filtra grupo/padre/subcategoría',async({page})=>{
 const state=await setupAdmin(page);await open(page,'Cotillón');const list=section(page,'Cotillón');
 await expect(list.locator('tbody tr')).toHaveCount(50);await expect(list.getByRole('status')).toContainText('Mostrando 50 de 1200');
 await list.getByRole('button',{name:'Siguiente',exact:true}).click();await expect(list.getByText('Página 2 de 24',{exact:false})).toBeVisible();
 await expect(list.locator('tbody tr').first()).toContainText('Cotillón de prueba 0050');await expect(list.locator('tbody tr')).toHaveCount(50);
 for(const category of ['group:COTILLÓN','category:fiestas','category:mascaras']){
  await page.getByRole('combobox',{name:'Categoría',exact:true}).selectOption(category);await expect(list.getByText('Página 1 de 8',{exact:false})).toBeVisible();await expect(list.getByRole('status')).toContainText('400 coinciden');
 }
 await page.getByRole('combobox',{name:'Categoría',exact:true}).selectOption('uncategorized');await expect(list.getByRole('status')).toContainText('400 coinciden');
 await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('enabled');await expect(list.getByRole('status')).toContainText('200 coinciden');
 expect(state.received).toHaveLength(0);
});
test('interruptor optimista, bloqueo de doble envío y reversión visible si falla',async({page})=>{
 const state=await setupAdmin(page);await open(page);state.delay=900;
 const toggle=row(page,'Súper Héroe Niño').getByRole('switch');await toggle.click();await expect(toggle).not.toBeChecked();await expect(toggle).toBeDisabled();
 await expect(toggle).toBeEnabled();expect(state.received).toHaveLength(1);expect(state.received[0].cambios).toEqual({active:false});
 await toggle.click();await expect(toggle).toBeChecked();await expect(toggle).toBeEnabled();
 await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('enabled');state.failNext=true;
 await toggle.click();await expect(row(page,'Súper Héroe Niño')).toHaveCount(0);
 await expect(page.locator('main').getByRole('alert')).toContainText('Fallo de prueba');await expect(row(page,'Súper Héroe Niño').getByRole('switch')).toBeChecked();
 expect(state.tables.disfraces[0].active).toBe(true);expect(state.tables.disfraces[0].categoryIds).toEqual(['ninos','halloween-d']);
});
test('guarda alquiler y stock por Enter o botón, sin exigir descripción ni cambiar categorías',async({page})=>{
 const state=await setupAdmin(page);await open(page);const product=row(page,'Súper Héroe Niño');
 await product.getByLabel('Alquiler de Súper Héroe Niño',{exact:true}).fill('65000.5');await product.getByLabel('Alquiler de Súper Héroe Niño',{exact:true}).press('Enter');
 await expect(product.getByRole('button',{name:'Guardar alquiler de Súper Héroe Niño'})).toBeDisabled();
 await expect.poll(()=>state.tables.disfraces[0].rentPrice).toBe(65000.5);
 await product.getByLabel('Unidades de Súper Héroe Niño',{exact:true}).fill('9');await product.getByRole('button',{name:'Guardar unidades de Súper Héroe Niño'}).click();await expect.poll(()=>state.tables.disfraces[0].stock).toBe(9);
 expect(state.received.map(r=>r.cambios)).toEqual([{rentPrice:65000.5},{stock:9}]);expect(state.tables.disfraces[0].description).toBe('');expect(state.tables.disfraces[0].categoryIds).toEqual(['ninos','halloween-d']);expect(state.tables.disfraces[0].custom).toEqual({keep:true});
});
test('validación inline bloquea negativos, stock fraccionario y vacío; ambos precios se editan',async({page})=>{
 const state=await setupAdmin(page);await open(page);await page.getByLabel('Buscar en Disfraces',{exact:true}).fill('sin categoria');const product=row(page,'Disfraz sin categoría');
 const input=product.getByLabel('Unidades de Disfraz sin categoría',{exact:true}),save=product.getByRole('button',{name:'Guardar unidades de Disfraz sin categoría'});
 for(const invalid of ['-1','1.5','']){await input.fill(invalid);await save.click();await expect(product.getByRole('alert')).toContainText(invalid?'Stock:':'Ingresá');}
 expect(state.received).toHaveLength(0);
 for(const [label,value] of [['Venta','12000'],['Alquiler','45000']]){const field=product.getByLabel(label+' de Disfraz sin categoría',{exact:true});await field.fill(value);await field.press('Enter');await expect.poll(()=>state.tables.disfraces[2][label==='Venta'?'price':'rentPrice']).toBe(Number(value));}
 expect(state.received.map(r=>r.cambios)).toEqual([{price:12000},{rentPrice:45000}]);
});
test('un fallo al guardar precio revierte el valor y conserva el formulario completo',async({page})=>{
 const state=await setupAdmin(page);await open(page);state.failNext=true;const product=row(page,'Súper Héroe Niño');
 await product.getByLabel('Alquiler de Súper Héroe Niño',{exact:true}).fill('99000');await product.getByRole('button',{name:'Guardar alquiler de Súper Héroe Niño'}).click();
 await expect(page.locator('main').getByRole('alert')).toContainText('No se guardó');await expect(product.getByLabel('Alquiler de Súper Héroe Niño',{exact:true})).toHaveValue('60000');
 await expect(product.getByRole('button',{name:'Clonar producto'})).toBeVisible();await expect(product.getByRole('button',{name:'Eliminar',exact:true})).toBeVisible();
 await product.getByRole('button',{name:'Editar',exact:true}).click();await expect(page.locator('#product-editor')).toBeVisible();await expect(page.locator('#product-editor').getByLabel('Nombre',{exact:true})).toHaveValue('Súper Héroe Niño');
});
test('capturas con datos simulados y layout sin desborde en ambos temas y áreas',async({page},info)=>{
 const state=await setupAdmin(page);
 for(const theme of ['default','halloween']){
  state.settings.SITE_THEME=theme;if(theme==='halloween'){await page.reload();}
  for(const area of ['Disfraces','Cotillón']){
   await open(page,area);await page.evaluate(()=>document.fonts.ready);
   await page.getByRole('region',{name:'Productos de '+area,exact:true}).getByRole('status').waitFor();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
   const list=section(page,area);await expect(list.locator('tbody tr')).toHaveCount(50);
   await list.evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY-115,behavior:'instant'}));
   if(process.env.DC_ADMIN_SCREENSHOTS){
    const prefix=`${process.env.DC_ADMIN_SCREENSHOTS}/${info.project.name}-${theme}-${area==='Disfraces'?'disfraces':'cotillon'}`;
    await page.screenshot({path:prefix+'.png',animations:'disabled'});
    if(info.project.name==='mobile-390'){
     await list.locator('tbody tr').first().evaluate(element=>window.scrollTo({top:element.getBoundingClientRect().top+window.scrollY-115,behavior:'instant'}));
     await page.screenshot({path:prefix+'-fila.png',animations:'disabled'});
    }
   }
  }
 }
});
