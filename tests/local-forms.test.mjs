import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {localHarness,fixture,submission,png} from './local-forms-harness.mjs';

test('local: tarifas iniciales, autenticación y cambio sin tocar precios del catálogo',()=>{
 const h=localHarness();const before=structuredClone(h.tables);
 const prices=h.dispatch({action:'localConfig'}).prices;
 assert.equal(prices.adulto,60000);assert.equal(prices.cabezon,75000);
 assert.throws(()=>h.dispatch({action:'saveRentalPrices',prices:{adulto:70000,cabezon:80000},revision:prices.revision}),/Sesión/);
 const saved=h.dispatch({action:'saveRentalPrices',token:h.token,prices:{adulto:70000,cabezon:80000},revision:prices.revision});
 assert.equal(saved.adulto,70000);assert.deepEqual(h.tables,before);
 assert.throws(()=>h.dispatch({action:'saveRentalPrices',token:h.token,prices,revision:prices.revision}),/Otra sesión/);
});
test('local: firma y DNI obligatorios, sin cuenta bancaria, sin pago ni domicilio; idempotencia',()=>{
 const h=localHarness(),body=submission(h);
 const first=h.dispatch(body);assert.match(first.code,/LOCAL-/);assert.equal(h.tables.reservas[0].source,'local');assert.equal(h.tables.reservas[0].priceSnapshot.adulto,60000);
 assert.equal(h.dispatch(body).duplicate,true);assert.equal(h.tables.reservas.length,1);
 assert.deepEqual(Object.keys(h.tables.reservas[0].files).sort(),['dniBack','dniFront','signature']);
 assert.throws(()=>h.dispatch({...body,access:'b'.repeat(72)}),/otros datos/);
 for(const slot of ['dniFront','dniBack','signature']){const h2=localHarness(),next=submission(h2);delete next.files[slot];assert.throws(()=>h2.dispatch(next),/archivo/);assert.equal(h2.tables.reservas.length,0)}
});
test('local: no permite adulterar precios, horario, mismo día con seña ni documentos extra',()=>{
 for(const patch of [{total:1},{payMode:'half'},{pickupWindow:'a cualquier hora'},{specialSchedule:true},{docType:'servicio'}]){
  const h=localHarness();assert.throws(()=>h.dispatch(submission(h,{...fixture(),...patch})));assert.equal(h.tables.reservas.length,0);
 }
 const h=localHarness(),body=submission(h);body.files.receipt=png;assert.throws(()=>h.dispatch(body),/solo admite/);
 const h2=localHarness();assert.throws(()=>h2.dispatch({...submission(h2),pricingRevision:'old'}),/precios cambiaron/);
});
test('local: calcula adulto más cabezón por cantidades y admite seña futura',()=>{
 const h=localHarness(),data=fixture();data.pickupDate='2026-10-30';data.returnDate='2026-11-02';data.payMode='half';
 data.items.push({...data.items[0],name:'Cabezón prueba',category:'cabezon',quantity:2});data.total=210000;
 h.dispatch(submission(h,data));assert.equal(h.tables.reservas[0].data.total,210000);
});
test('local: un cabezón no puede enviarse como adulto para reducir su tarifa',()=>{
 const h=localHarness();h.tables.categorias_disfraces.push({id:'c1',area:'disfraces',name:'Cabezones'});
 h.tables.disfraces.push({id:'p1',area:'disfraces',name:'Gigante',categoryId:'c1',category:'Cabezones',active:true,mode:'alquiler',stock:5});
 const data=fixture();data.items=[{name:'Gigante',category:'adulto',catalogCategoryId:'c1',catalogCategory:'Cabezones',productId:'p1',quantity:1}];
 assert.throws(()=>h.dispatch(submission(h,data)),/tipo del disfraz/);assert.equal(h.tables.reservas.length,0);
 data.items[0].category='cabezon';data.total=75000;h.dispatch(submission(h,data));assert.equal(h.tables.reservas[0].data.total,75000);
});
test('notificaciones web y local: consulta ligera, lectura persistente y borrar solo el lote visto',()=>{
 const h=localHarness(),local=h.dispatch(submission(h));h.tables.reservas.push({...structuredClone(h.tables.reservas[0]),id:'web-1',source:undefined,code:'WEB-1'});
 const before=h.reads(),list=h.dispatch({action:'incomingNotifications',token:h.token}).notifications;
 assert.equal(h.reads()-before,1);assert.deepEqual(new Set(list.map(n=>n.source)),new Set(['web','local']));
 h.dispatch({action:'dismissFormNotifications',token:h.token,ids:[local.id]});assert.equal(h.dispatch({action:'incomingNotifications',token:h.token}).notifications.length,1);
 h.tables.reservas.push({...structuredClone(h.tables.reservas[1]),id:'new-after-snapshot',adminNotificationReadAt:undefined});
 h.dispatch({action:'dismissFormNotifications',token:h.token,ids:['web-1']});assert.equal(h.dispatch({action:'incomingNotifications',token:h.token}).notifications[0].id,'new-after-snapshot');
 assert.throws(()=>h.dispatch({action:'incomingNotifications'}),/Sesión/);
});
test('edición integral: originales firmados intactos, conflictos y precio mínimo por cobros',()=>{
 const h=localHarness(),created=h.dispatch(submission(h)),original=structuredClone(h.tables.reservas[0]);
 const data={...fixture(),...original.data,fullName:'Cliente Editado',total:65000,items:[{...original.data.items[0],name:'Otro disfraz',category:'cabezon',catalogCategory:'Cabezones'}]};
 const saved=h.dispatch({action:'updateIncomingForm',token:h.token,id:created.id,revision:0,data,formState:'dispatched',files:{dniFront:png}});
 assert.equal(saved.formState,'dispatched');assert.equal(saved.data.fullName,'Cliente Editado');assert.equal(saved.revision,1);
 assert.deepEqual(h.tables.reservas[0].data,original.data);assert.deepEqual(h.tables.reservas[0].files,original.files);assert.equal(h.tables.reservas[0].signedHash,original.signedHash);
 assert.throws(()=>h.dispatch({action:'updateIncomingForm',token:h.token,id:created.id,revision:0,data,formState:'finished'}),/Otra sesión/);
 h.tables.movimientos.push({requestId:created.id,kind:'alquiler',amount:64000});
 assert.throws(()=>h.dispatch({action:'updateIncomingForm',token:h.token,id:created.id,revision:1,data:{...data,total:60000},formState:'finished'}),/cobros registrados/);
 const list=h.dispatch({action:'incomingForms',token:h.token}).requests;assert.equal(list[0].data.total,65000);assert.equal(list[0].accessHash,undefined);
});
test('eliminación recuperable oculta entradas y avisos sin borrar documentación ni contrato',()=>{
 const h=localHarness(),created=h.dispatch(submission(h)),fileCount=h.files.size;
 h.dispatch({action:'deleteIncomingForm',token:h.token,id:created.id,revision:0});
 assert.equal(h.dispatch({action:'incomingForms',token:h.token}).requests.length,0);assert.equal(h.dispatch({action:'incomingNotifications',token:h.token}).notifications.length,0);
 assert.equal(h.files.size,fileCount);assert.equal(h.tables.reservas.length,1);assert.ok(h.tables.reservas[0].deletedAt);
});
test('regresión: la reserva web sigue exigiendo cuenta de cobro, domicilio y pago',()=>{
 const h=localHarness(),data={...fixture(),docType:'servicio',docDate:'2026-10-01'};
 assert.throws(()=>h.dispatch({...submission(h,data),action:'submit'}),/cuenta de cobro/);
 h.settings.BANK_HOLDER='Prueba';h.settings.BANK_ALIAS='prueba.alias';
 assert.throws(()=>h.dispatch({...submission(h,data),action:'submit'}),/archivo/);
 const created=h.dispatch({...submission(h,data),action:'submit',files:{...submission(h,data).files,addressProof:png,receipt:png}});
 assert.match(created.code,/^DC-/);assert.equal(h.tables.reservas[0].source,undefined);
 assert.equal(h.dispatch({action:'incomingForms',token:h.token}).requests[0].source,'web');
});
test('ruta del local no aparece en menús ni portada y tiene noindex',()=>{
 for(const p of ['components/Shell.tsx','components/Catalog.tsx','app/page.tsx'])assert.doesNotMatch(fs.readFileSync(p,'utf8'),/reserva-local/);
 assert.match(fs.readFileSync('app/reserva-local/page.tsx','utf8'),/index:false/);
});
