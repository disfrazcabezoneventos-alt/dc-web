import {test,expect} from '@playwright/test';
import {catalogHarness} from '../catalog-access-harness.mjs';
import {png} from '../local-forms-harness.mjs';
import crypto from 'node:crypto';
async function setup(page,role='editor'){
 const h=catalogHarness();h.createEditor();h.editor=h.loginEditor();
 await page.route('https://res.cloudinary.com/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from(png.base64,'base64')}));
 // The upload transport is real; only the external Cloudinary service is simulated.
 h.ctx.Utilities.newBlob=bytes=>({bytes});
 h.settings.CLOUDINARY_API_SECRET=crypto.randomBytes(24).toString('hex');h.settings.CLOUDINARY_CLOUD_NAME='demo';h.settings.CLOUDINARY_API_KEY=crypto.randomBytes(12).toString('hex');
 h.ctx.UrlFetchApp={fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({secure_url:'https://res.cloudinary.com/demo/image/upload/reemplazo-ensayo.jpg',eager:[{secure_url:'https://res.cloudinary.com/demo/image/upload/miniatura-ensayo.jpg'}]})})};
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||'');let result;
  try{result={ok:true,data:h.ctx.dispatch_(JSON.parse(fields.get('payload')))}}catch(e){result={ok:false,error:e.message}}
  await route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><script>parent.postMessage(${JSON.stringify({type:'dc-apps-result',id:fields.get('bridgeId'),result}).replace(/</g,'\\u003c')},${JSON.stringify(fields.get('origin'))})</script>`});
 });
 await page.addInitScript(token=>{if(!sessionStorage.getItem('dc-admin'))sessionStorage.setItem('dc-admin',token)},role==='editor'?h.editor:h.admin);await page.goto('/admin/');return h;
}
test('Editor: panel móvil, H001/H002, reemplazo de foto y estado sin controles prohibidos',async({page},info)=>{
 const h=await setup(page);await expect(page.getByRole('heading',{name:'Tu catálogo.',exact:true})).toBeVisible();
 for(const label of ['Estadísticas','Caja','Revisión de reservas','Formularios entrantes','Usuarios e historial','Datos de cobro','Apariencia de la web','Categorías disfraces'])await expect(page.getByRole('button',{name:label,exact:true})).toHaveCount(0);
 await expect(page.getByRole('columnheader',{name:'Stock',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Cotillón',exact:true}).click();await expect(page.getByRole('columnheader',{name:'Stock',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Disfraces',exact:true}).click();
 const row=page.getByRole('row',{name:'Producto de ensayo',exact:true});await expect(row.getByRole('button',{name:'Eliminar',exact:true})).toHaveCount(0);await expect(row.locator('input[type="number"]')).toHaveCount(0);
 await row.getByRole('button',{name:'Editar',exact:true}).click();const form=page.locator('#product-editor');
 await expect(form.getByRole('checkbox',{name:'Segunda categoría',exact:true})).toBeChecked();await form.getByLabel('Descripción (opcional)',{exact:true}).fill('');await form.getByLabel('Nombre',{exact:true}).fill('Nombre de ensayo editado');
 await expect(form.getByLabel('Unidades de stock',{exact:true})).toHaveCount(0);
 await expect(form).not.toContainText('Stock:');
 await form.getByLabel('Foto del producto (hasta 8 MB)',{exact:true}).setInputFiles({name:'foto-ensayo.png',mimeType:'image/png',buffer:Buffer.from(png.base64,'base64')});await expect(form.getByRole('img',{name:'Foto del producto'})).toHaveAttribute('src',/miniatura-ensayo/);
 await form.getByRole('button',{name:'Guardar producto',exact:true}).click();await expect(form).toHaveCount(0);expect(h.tables.disfraces[0].categoryIds).toEqual(['d-primary','d-secondary']);expect(h.tables.disfraces[0].description).toBe('');expect(h.tables.disfraces[0].stock).toBe(4);
 const toggle=page.getByRole('row',{name:'Nombre de ensayo editado',exact:true}).getByRole('switch');await toggle.click();await expect(toggle).not.toBeChecked();expect(h.tables.historial_cambios.at(-1).changes.active.after).toBe(false);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:info.outputPath('editor-catalogo.png'),fullPage:true,animations:'disabled'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Editor: crea borrador con foto y no se publica por URL/API; Admin publica desde la lista',async({page},info)=>{
 const h=await setup(page);await page.getByRole('button',{name:'+ Nuevo borrador',exact:true}).click();const form=page.locator('#product-editor');
 await form.getByLabel('Nombre',{exact:true}).fill('Borrador de ensayo');await form.getByRole('combobox',{name:'Categoría',exact:true}).selectOption('d-primary');await form.getByLabel('Precio de venta',{exact:true}).fill('2500');
 await form.getByLabel('Foto del producto (hasta 8 MB)',{exact:true}).setInputFiles({name:'foto-ensayo.png',mimeType:'image/png',buffer:Buffer.from(png.base64,'base64')});await form.getByRole('button',{name:'Guardar borrador',exact:true}).click();await expect(form).toHaveCount(0);
 const draft=h.tables.disfraces.find(p=>p.name==='Borrador de ensayo');expect(draft.publicationState).toBe('draft');expect(draft.stock).toBe(0);expect(h.ctx.dispatch_({action:'catalogData'}).products.some(p=>p.id===draft.id)).toBe(false);
 expect(()=>h.ctx.dispatch_({action:'publishProduct',token:h.editor,area:draft.area,id:draft.id})).toThrow(/permiso/);
 await page.evaluate(token=>sessionStorage.setItem('dc-admin',token),h.admin);await page.reload();await page.getByRole('button',{name:'Disfraces',exact:true}).click();const row=page.getByRole('row',{name:'Borrador de ensayo',exact:true});await row.getByRole('button',{name:'Publicar borrador'}).click();await expect(row.getByRole('button',{name:'Publicar borrador'})).toHaveCount(0);expect(h.tables.disfraces.find(p=>p.id===draft.id).publicationState).toBe('published');
 await expect(page.getByRole('columnheader',{name:'Stock',exact:true})).toBeVisible();await expect(row.getByRole('spinbutton',{name:'Unidades de Borrador de ensayo',exact:true})).toBeVisible();
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:info.outputPath('admin-catalogo.png'),fullPage:true,animations:'disabled'});
});
test('Admin: crea cuenta, restablece, desactiva y restaura la foto desde historial',async({page},info)=>{
 const h=await setup(page,'admin');await page.getByRole('button',{name:'Usuarios e historial',exact:true}).click();
 await page.getByLabel('Usuario del colaborador',{exact:true}).fill('otro-editor-ensayo');await page.getByLabel('Contraseña inicial',{exact:true}).fill(crypto.randomBytes(24).toString('base64url'));await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();await expect(page.getByText(/Cuenta individual de Editor creada/)).toBeVisible();await expect(page.getByLabel('Contraseña inicial',{exact:true})).toHaveValue('');
 await page.getByRole('button',{name:'Restablecer contraseña de editor-ensayo',exact:true}).click();await page.getByLabel('Nueva contraseña',{exact:true}).fill(crypto.randomBytes(24).toString('base64url'));await page.getByRole('button',{name:'Restablecer acceso',exact:true}).click();await expect(page.getByText('Contraseña restablecida y sesiones invalidadas.')).toBeVisible();
 await page.getByRole('button',{name:'Desactivar editor-ensayo',exact:true}).click();await expect(page.getByRole('button',{name:'Activar editor-ensayo',exact:true})).toBeVisible();expect(()=>h.ctx.dispatch_({action:'admin',token:h.editor})).toThrow(/Sesión/);
 const changed=h.ctx.dispatch_({action:'saveProduct',token:h.admin,product:{...h.product,image:'https://res.cloudinary.com/demo/image/upload/reemplazo-ensayo.jpg'}});
 await page.getByRole('button',{name:'Actualizar historial',exact:true}).click();const item=page.locator('.catalog-history').filter({hasText:changed.name});await item.locator('summary').click();await item.getByRole('button',{name:'Restaurar foto anterior de Producto de ensayo',exact:true}).click();await expect(page.getByText('Foto anterior restaurada. El cambio quedó registrado.')).toBeVisible();expect(h.tables.disfraces[0].image).toBe(h.product.image);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:info.outputPath('admin-usuarios-historial.png'),fullPage:true,animations:'disabled'});
});

test('Admin: ve un cambio de categoría en lote y puede cancelar o confirmar deshacerlo',async({page},info)=>{
 const h=await setup(page,'admin'),before=structuredClone(h.tables.disfraces);
 h.ctx.dispatch_({action:'saveCategory',token:h.admin,area:'disfraces',id:'d-primary',name:'Categoría nueva de ensayo'});
 await page.getByRole('button',{name:'Usuarios e historial',exact:true}).click();
 const item=page.locator('.catalog-history').filter({hasText:'Categoría nueva de ensayo'});await item.locator('summary').click();
 await expect(item.getByText('Producto de ensayo',{exact:true})).toBeVisible();
 page.once('dialog',dialog=>dialog.dismiss());await item.getByRole('button',{name:'Deshacer cambio de categoría',exact:true}).click();
 expect(h.tables.historial_cambios[0].status).toBe('committed');
 await page.screenshot({path:info.outputPath('admin-lote-categoria.png'),fullPage:true,animations:'disabled'});
 page.once('dialog',dialog=>dialog.accept());await item.getByRole('button',{name:'Deshacer cambio de categoría',exact:true}).click();
 await expect(page.getByText('Cambio de categoría deshecho. Se conservaron los demás datos de los productos.',{exact:true})).toBeVisible();
 expect(h.tables.disfraces).toEqual(before);expect(h.tables.historial_cambios[0].status).toBe('rolled_back');
 await expect(page.locator('.catalog-history').locator('summary')).toContainText('Deshecho');
});
