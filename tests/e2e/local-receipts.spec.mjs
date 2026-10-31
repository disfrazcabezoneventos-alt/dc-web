import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {receiptsHarness} from '../local-receipts-harness.mjs';
async function bridge(page,h){
 await page.clock.install({time:new Date('2026-10-29T15:00:00Z')});
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||'');let result;
  try{result={ok:true,data:h.dispatch(JSON.parse(fields.get('payload')))}}catch(error){result={ok:false,error:error.message}}
  const message={type:'dc-apps-result',id:fields.get('bridgeId'),result};
  await route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><script>parent.postMessage(${JSON.stringify(message)},${JSON.stringify(fields.get('origin'))})</script>`});
 });
}
async function open(page,h){
 await bridge(page,h);await page.addInitScript(t=>sessionStorage.setItem('dc-admin',t),h.token);await page.goto('/admin/');
 await page.getByRole('button',{name:'Formularios entrantes',exact:true}).click();await page.getByRole('button',{name:'Formulario local',exact:true}).click();
 await page.getByRole('button',{name:'Abrir '+h.created.code}).click();return page.getByRole('dialog');
}
test('constancia local: confirmar, cobro real, correo, PDF y WhatsApp desde admin',async({page},testInfo)=>{
 const h=receiptsHarness(),modal=await open(page,h),manager=modal.locator('.local-receipts');
 await manager.getByLabel('Cobro de alquiler recibido ahora',{exact:true}).fill('30000');await manager.getByLabel('Seguro / garantía recibido ahora',{exact:true}).fill('10000');
 await manager.getByRole('checkbox',{name:/Verifiqué/}).check();await manager.getByRole('button',{name:'Confirmar reserva y enviar constancia'}).click();
 await expect(manager.getByText('Constancia emitida.',{exact:false})).toBeVisible();await expect(manager.getByText('Correo aceptado para envío (revisar recepción)',{exact:true})).toBeVisible();
 expect(h.tables.movimientos).toHaveLength(2);expect(h.sent).toHaveLength(1);expect(h.sent[0].body).toContain('30.000,00');
 const download=page.waitForEvent('download');await manager.getByRole('button',{name:'Descargar constancia PDF'}).click();const file=await download;expect((await PDFDocument.load(fs.readFileSync(await file.path()))).getPageCount()).toBe(1);
 await page.evaluate(()=>{window.__opened=[];window.open=url=>{window.__opened.push(url);return null}});
 await manager.getByRole('button',{name:'Enviar por WhatsApp'}).click();const target=await page.evaluate(()=>window.__opened[0]);expect(target).toContain('https://wa.me/5491100000000?text=');expect(decodeURIComponent(target)).toContain('Saldo:');
 await manager.getByRole('button',{name:'Reenviar por correo'}).scrollIntoViewIfNeeded();page.once('dialog',d=>d.dismiss());await manager.getByRole('button',{name:'Reenviar por correo'}).click();expect(h.sent).toHaveLength(1);
 page.once('dialog',d=>d.accept());await manager.getByRole('button',{name:'Reenviar por correo'}).click();await expect(manager.getByText('Solicitud de envío procesada.',{exact:false})).toBeVisible();expect(h.sent).toHaveLength(2);expect(h.tables.movimientos).toHaveLength(2);
 await page.screenshot({path:testInfo.outputPath('admin-constancia.png'),fullPage:true});
});
test('constancia privada: descarga, protección de acceso y aviso tras anular un cobro',async({page},testInfo)=>{
 const h=receiptsHarness(),c=h.dispatch(h.issue).receipts[0];await bridge(page,h);const hash=new URL(c.url).hash;
 await page.goto('/constancia/'+hash);await expect(page.getByRole('heading',{name:c.snapshot.code,exact:true})).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar constancia PDF'}).click();expect((await PDFDocument.load(fs.readFileSync(await(await download).path()))).getPageCount()).toBe(1);
 await page.screenshot({path:testInfo.outputPath('cliente-constancia.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 h.dispatch({action:'voidMovement',id:h.tables.movimientos[0].id,note:'Prueba de anulación',token:h.token});await page.getByRole('button',{name:'Actualizar',exact:true}).click();await expect(page.getByText(/Hubo cambios después/)).toBeVisible();
 await page.goto('/constancia/#id='+c.id+'&acceso=incorrecto');await expect(page.getByRole('alert').filter({hasText:'Enlace privado inválido'})).toBeVisible();await expect(page.getByRole('button',{name:'Descargar constancia PDF'})).toHaveCount(0);
});
test('constancia local: correo sin cuota y bloqueo cuando hay cambios sin guardar',async({page})=>{
 const h=receiptsHarness();h.ctx.MailApp.getRemainingDailyQuota=()=>0;const modal=await open(page,h),manager=modal.locator('.local-receipts');
 await modal.getByLabel('Nombre y apellido',{exact:true}).fill('Cliente Modificado');await expect(manager.getByText(/Guardá los cambios/)).toBeVisible();await expect(manager.getByRole('button',{name:'Confirmar reserva y enviar constancia'})).toBeDisabled();
 await modal.getByLabel('Nombre y apellido',{exact:true}).fill('Cliente Local');await manager.getByRole('checkbox',{name:/Verifiqué/}).check();await manager.getByRole('button',{name:'Confirmar reserva y enviar constancia'}).click();await expect(manager.getByText('Sin cuota de correo: reintentar más tarde',{exact:true})).toBeVisible();
 expect(h.sent).toHaveLength(0);expect(h.tables.movimientos).toHaveLength(0);await expect(manager.getByRole('button',{name:'Enviar por WhatsApp'})).toBeEnabled();
});
