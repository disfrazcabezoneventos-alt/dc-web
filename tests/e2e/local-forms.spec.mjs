import {test,expect} from '@playwright/test';
import {localHarness,fixture,submission,png} from '../local-forms-harness.mjs';
import fs from 'node:fs';
import {PDFDocument} from 'pdf-lib';

test('portal local: descarga una hoja A4 y conserva la copia original completa',async({page})=>{
 const h=localHarness(),created=h.dispatch(submission(h));await backend(page,h);
 await page.goto('/solicitud/#id='+created.id+'&acceso='+'a'.repeat(72));
 await expect(page.getByRole('heading',{name:created.code,exact:true})).toBeVisible();
 const compactDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar contrato (1 hoja)',exact:true}).click();
 const compact=await compactDownload;expect((await PDFDocument.load(fs.readFileSync(await compact.path()))).getPageCount()).toBe(1);
 const originalDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar original completo',exact:true}).click();
 const original=await originalDownload;expect((await PDFDocument.load(fs.readFileSync(await original.path()))).getPageCount()).toBeGreaterThan(1);
 expect(h.tables.reservas).toHaveLength(1);
});

test('portal web: mantiene su descarga habitual y el contrato completo',async({page})=>{
 const h=localHarness(),created=h.dispatch(submission(h));h.tables.reservas[0].source='web';h.tables.reservas[0].code='DC-WEB-PRUEBA';
 await backend(page,h);await page.goto('/solicitud/#id='+created.id+'&acceso='+'a'.repeat(72));
 await expect(page.getByRole('heading',{name:'DC-WEB-PRUEBA',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Descargar contrato (1 hoja)',exact:true})).toHaveCount(0);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar contrato firmado',exact:true}).click();
 const original=await download;expect((await PDFDocument.load(fs.readFileSync(await original.path()))).getPageCount()).toBeGreaterThan(1);
});

async function backend(page,h){
 h.tables.categorias_disfraces.push({id:'cabezones',area:'disfraces',name:'Cabezones'},{id:'adultos',area:'disfraces',name:'Adultos'});
 h.tables.disfraces.push({id:'p1',area:'disfraces',name:'Cabezón de prueba',category:'Cabezones',categoryId:'cabezones',mode:'alquiler',rentPrice:99000,stock:5,active:true,image:''});
 await page.clock.install({time:new Date('2026-10-29T15:00:00Z')});
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||'');let result;
  try{result={ok:true,data:h.dispatch(JSON.parse(fields.get('payload')))}}catch(error){result={ok:false,error:error.message}}
  const message={type:'dc-apps-result',id:fields.get('bridgeId'),result};
  await route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><script>parent.postMessage(${JSON.stringify(message)},${JSON.stringify(fields.get('origin'))})</script>`});
 });
}
async function admin(page,h){await page.addInitScript(token=>sessionStorage.setItem('dc-admin',token),h.token);await page.goto('/admin/');await expect(page.getByRole('button',{name:'Formularios entrantes',exact:true})).toBeVisible()}
async function identity(page){
 for(const [label,value]of Object.entries({'Nombre y apellido':'Cliente Local','Número de DNI':'12345678','Fecha de nacimiento':'1990-01-01','Correo electrónico':'test@example.invalid','Calle, número, piso y departamento':'Prueba 123','Localidad y provincia':'CABA','Tu teléfono / WhatsApp':'1100000000','Teléfono alternativo':'1100000001'}))await page.getByLabel(label,{exact:true}).fill(value);
 await page.getByRole('checkbox',{name:/18 años/}).check();await page.getByRole('checkbox',{name:/tratamiento/}).check();await page.getByRole('button',{name:'Continuar',exact:true}).click();
}
async function costume(page,date='2026-10-29'){
 await page.getByRole('combobox',{name:'Categoría del disfraz 1',exact:true}).selectOption('cabezones');await page.getByRole('combobox',{name:'Disfraz del catálogo 1',exact:true}).selectOption('p1');
 await page.getByLabel('Fecha de retiro',{exact:true}).fill(date);await page.getByLabel('Fecha de devolución',{exact:true}).fill('2026-11-02');
 await page.getByRole('checkbox',{name:/Recibí en el local/}).check();
}
async function attach(page,label){await page.getByLabel(label,{exact:true}).setInputFiles({name:'PRUEBA-SIN-VALIDEZ.png',mimeType:'image/png',buffer:Buffer.from(png.base64,'base64')})}
async function signature(page){
 const canvas=page.locator('canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
 await page.mouse.move(box.x+25,box.y+35);await page.mouse.down();await page.mouse.move(box.x+150,box.y+95,{steps:20});await page.mouse.move(box.x+60,box.y+125,{steps:15});await page.mouse.up();
}

test('local: recorrido completo, precios del admin, horarios fijos, mismo día, DNI y firma',async({page})=>{
 const h=localHarness();await backend(page,h);await page.goto('/reserva-local/');await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeEnabled();await identity(page);await costume(page);
 await expect(page.locator('.local-total')).toContainText('75.000');await expect(page.getByLabel('Alquiler completo',{exact:true})).toBeChecked();await expect(page.getByLabel('Seña del 50%',{exact:true})).toBeDisabled();
 await expect(page.getByLabel(/Franja/)).toHaveCount(0);await expect(page.locator('.local-fixed-hours')).toContainText('16:00 a 20:00');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.getByText('No necesitás comprobante de domicilio.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.locator('.local-form .error-banner[role=alert]')).toContainText('Adjuntá esta foto');
 await attach(page,'DNI · frente *');await attach(page,'DNI · dorso *');await page.getByRole('checkbox',{name:/ambas fotos/}).check();await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(page.getByLabel(/Comprobante de pago/)).toHaveCount(0);await signature(page);await page.getByLabel('Aclaración de firma',{exact:true}).fill('Cliente Local');
 await page.getByRole('checkbox',{name:/mis datos y las fotos/}).check();await page.getByRole('checkbox',{name:/términos y condiciones/}).check();await page.getByRole('button',{name:'Firmar y enviar formulario'}).click();
 await expect(page.getByRole('heading',{name:'¡Recibimos tu formulario!'})).toBeVisible();expect(h.tables.reservas).toHaveLength(1);expect(h.tables.reservas[0].data.total).toBe(75000);expect(Object.keys(h.tables.reservas[0].files).sort()).toEqual(['dniBack','dniFront','signature']);
 await page.screenshot({path:test.info().outputPath('local-enviado.png'),fullPage:true});
});
test('local: varias cantidades, seña futura y domingo bloqueado',async({page})=>{
 const h=localHarness();await backend(page,h);await page.goto('/reserva-local/');await identity(page);await costume(page,'2026-10-30');
 await page.getByLabel('Seña del 50%',{exact:true}).check();await expect(page.getByLabel('Seña del 50%',{exact:true})).toBeEnabled();await page.getByLabel('Cantidad 1',{exact:true}).fill('2');
 await page.getByRole('button',{name:'Agregar otro traje'}).click();await page.getByRole('combobox',{name:'Categoría del disfraz 2',exact:true}).selectOption('adultos');await page.getByLabel('Personaje 2',{exact:true}).fill('Adulto manual');
 await expect(page.locator('.local-total')).toContainText('210.000');await page.getByLabel('Fecha de retiro',{exact:true}).fill('2026-11-01');await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.locator('.local-form .error-banner[role=alert]')).toContainText('excepción');
});
test('admin: precios, autocompletado, tres ordenamientos, edición guardar/cancelar y estados',async({page})=>{
 const h=localHarness();await backend(page,h);const first=h.dispatch(submission(h));
 h.tables.reservas.push({...structuredClone(h.tables.reservas[0]),id:'web-fixture',source:undefined,code:'DC-WEB',createdAt:'2026-10-29T10:00:00Z'});
 await admin(page,h);await page.getByRole('button',{name:'Precios disfraces',exact:true}).click();await page.getByLabel('Disfraz adulto',{exact:true}).fill('62000');await page.getByRole('button',{name:'Guardar precios'}).click();await expect(page.getByText('Precios guardados.',{exact:true})).toBeVisible();expect(h.settings.LOCAL_PRICE_ADULTO).toBe('62000');
 await page.getByRole('button',{name:'Formularios entrantes',exact:true}).click();await expect(page.getByRole('button',{name:'Abrir DC-WEB',exact:true})).toBeVisible();await page.getByRole('button',{name:'Formulario local',exact:true}).click();
 await page.getByLabel('Buscar por nombre de disfraz',{exact:true}).fill('pers');await expect(page.getByRole('list',{name:'Sugerencias de disfraces'})).toBeVisible();await page.getByRole('button',{name:'Personaje prueba',exact:true}).click();
 for(const value of ['createdAt','pickupDate','returnDate'])await page.getByRole('combobox',{name:'Ordenar por',exact:true}).selectOption(value);
 await page.getByRole('button',{name:'Más recientes primero'}).click();await page.getByRole('button',{name:'Abrir '+first.code,exact:true}).click();
 const modal=page.getByRole('dialog');await modal.getByLabel('Precio total',{exact:true}).fill('61000');
 page.once('dialog',d=>d.accept());await modal.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(modal).toHaveCount(0);expect(h.tables.reservas[0].managementData).toBeUndefined();
 await page.getByRole('button',{name:'Editar precio de '+first.code,exact:true}).click();await modal.getByLabel('Nombre y apellido',{exact:true}).fill('Cliente Actualizado');await modal.getByLabel('Precio total',{exact:true}).fill('66000');await modal.getByLabel('Nombre de disfraz 1',{exact:true}).fill('Disfraz editado');await modal.getByLabel('Categoría 1',{exact:true}).fill('Cabezones');await modal.getByRole('combobox',{name:'Estado operativo',exact:true}).selectOption('dispatched');await modal.getByRole('button',{name:'Guardar cambios'}).click();await expect(modal).toHaveCount(0);
 expect(h.tables.reservas[0].managementData.fullName).toBe('Cliente Actualizado');expect(h.tables.reservas[0].data.fullName).toBe('Cliente Local');
 await page.getByLabel('Buscar por nombre de disfraz',{exact:true}).fill('');await page.getByRole('combobox',{name:'Estado de '+first.code,exact:true}).selectOption('finished');await expect(page.getByRole('combobox',{name:'Estado de '+first.code,exact:true})).toHaveValue('finished');
 await page.screenshot({path:test.info().outputPath('entrantes-admin.png'),fullPage:true});
});

test('admin: archivos, contrato original, orden real por cada fecha y aviso web',async({page})=>{
 const h=localHarness();await backend(page,h);const created=h.dispatch(submission(h));
 Object.assign(h.tables.reservas[0],{createdAt:'2026-10-29T12:00:00Z'});
 const second={...structuredClone(h.tables.reservas[0]),id:'second-local',code:'LOCAL-SECOND',createdAt:'2026-10-29T11:00:00Z'};second.data.pickupDate='2026-10-30';second.data.returnDate='2026-11-02';h.tables.reservas.push(second);
 const web={...structuredClone(second),id:'web-new',code:'DC-WEB-NEW',source:undefined};h.tables.reservas.push(web);
 await admin(page,h);await page.getByRole('button',{name:'Formularios entrantes',exact:true}).click();await page.getByRole('button',{name:'Formulario local',exact:true}).click();
 const rows=page.locator('.incoming-table tbody tr');await expect(rows.first()).toContainText(created.code);
 for(const sort of ['pickupDate','returnDate']){await page.getByRole('combobox',{name:'Ordenar por',exact:true}).selectOption(sort);await expect(rows.first()).toContainText('LOCAL-SECOND')}
 await page.getByRole('button',{name:'Más recientes primero'}).click();await expect(rows.first()).toContainText(created.code);
 await page.getByRole('button',{name:'Abrir '+created.code,exact:true}).click();const modal=page.getByRole('dialog');
 const originalFiles=structuredClone(h.tables.reservas[0].files);
 await modal.getByLabel('Reemplazar DNI frente',{exact:true}).setInputFiles({name:'REEMPLAZO-PRUEBA.png',mimeType:'image/png',buffer:Buffer.from(png.base64,'base64')});
 await modal.getByRole('button',{name:'Guardar cambios'}).click();await expect(modal).toHaveCount(0);expect(h.tables.reservas[0].managementFiles.dniFront.id).not.toBe(originalFiles.dniFront.id);expect(h.tables.reservas[0].files).toEqual(originalFiles);
 await page.getByRole('button',{name:'Abrir '+created.code,exact:true}).click();
 const imagePromise=page.waitForEvent('download');await modal.getByRole('button',{name:'Ver / descargar DNI frente',exact:true}).click();expect((await imagePromise).suggestedFilename()).toContain('dniFront');
 const compactPromise=page.waitForEvent('download');await modal.getByRole('button',{name:'Descargar contrato (1 hoja)',exact:true}).click();const compact=await compactPromise;expect(compact.suggestedFilename()).toContain('una-hoja.pdf');expect((await PDFDocument.load(fs.readFileSync(await compact.path()))).getPageCount()).toBe(1);
 const pdfPromise=page.waitForEvent('download');await modal.getByRole('button',{name:'Descargar contrato original firmado'}).click();const original=await pdfPromise;expect(original.suggestedFilename()).toContain('original-firmado.pdf');expect((await PDFDocument.load(fs.readFileSync(await original.path()))).getPageCount()).toBeGreaterThan(1);
 await modal.getByRole('button',{name:'Cerrar',exact:true}).click();await page.getByRole('button',{name:'Notificaciones de formularios: 3'}).click();await page.getByRole('button',{name:/Formulario web · DC-WEB-NEW/}).click();await expect(modal).toContainText('FORMULARIO WEB');await expect(modal.getByRole('heading',{name:'DC-WEB-NEW'})).toBeVisible();
 await page.screenshot({path:test.info().outputPath('modal-formulario-web.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('admin: polling a los 10 segundos, abrir aviso, borrar todos cancelar/aceptar y eliminar',async({page})=>{
 const h=localHarness();await backend(page,h);await admin(page,h);await expect(page.getByRole('button',{name:'Notificaciones de formularios: 0'})).toBeVisible();
 const created=h.dispatch(submission(h));await page.clock.fastForward(11000);await expect(page.getByRole('button',{name:'Notificaciones de formularios: 1'})).toBeVisible();
 await page.getByRole('button',{name:'Notificaciones de formularios: 1'}).click();await page.getByRole('button',{name:new RegExp('Formulario local · '+created.code)}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Cerrar',exact:true}).click();await expect(page.getByRole('button',{name:'Notificaciones de formularios: 0'})).toBeVisible();
 h.tables.reservas.push({...structuredClone(h.tables.reservas[0]),id:'notice-web',code:'DC-NUEVO',source:undefined,adminNotificationReadAt:undefined});await page.clock.fastForward(11000);await page.getByRole('button',{name:'Notificaciones de formularios: 1'}).click();
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Borrar todas',exact:true}).click();await expect(page.getByRole('button',{name:'Notificaciones de formularios: 1'})).toBeVisible();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Borrar todas',exact:true}).click();await expect(page.getByRole('button',{name:'Notificaciones de formularios: 0'})).toBeVisible();await page.getByRole('region',{name:'Notificaciones de formularios'}).getByRole('button',{name:'Cerrar',exact:true}).click();
 await page.getByRole('button',{name:'Abrir '+created.code,exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Eliminar formulario',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Abrir '+created.code,exact:true})).toHaveCount(0);expect(h.tables.reservas[0].deletedAt).toBeTruthy();
});
