import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {catalogHarness} from './catalog-access-harness.mjs';
function setup(){
 const h=catalogHarness();const before={...h.product,rentPrice:65000,insuranceDeposit:65000,tariff:'Premium'};
 const after={...before,rentPrice:60000,insuranceDeposit:60000,tariff:'Estándar',category:'Cabezones',categoryId:'heads',categoryIds:['heads','d-primary','d-secondary']};
 const changes=Object.fromEntries(['rentPrice','insuranceDeposit','tariff','category','categoryId','categoryIds'].map(k=>[k,{before:before[k],after:after[k]}]));
 h.tables.disfraces[0]={...after,stock:9,description:'Edición posterior que se conserva'};
 const history={id:crypto.randomUUID(),area:'disfraces',productId:before.id,productName:before.name,actor:{id:'codex',username:'correccion-autorizada-PR37',role:'admin'},action:'rental_catalog_correction',batch:'PR37-20261103',at:'2026-11-03T16:00:00Z',status:'committed',before,after,changes};
 h.tables.historial_cambios.push(history);const request=()=>({action:'restoreRentalCatalogChange',token:h.admin,area:'disfraces',id:before.id,historyId:history.id,revision:h.ctx.hash_(JSON.stringify(h.tables.disfraces[0])),operationId:crypto.randomUUID()});
 return {...h,before,history,request};
}
test('corrección autorizada: deshacer solo precio, garantía, tarifa y categorías; conservar stock, descripción y otros campos',()=>{
 const h=setup(),restored=h.ctx.dispatch_(h.request());
 for(const key of Object.keys(h.history.changes))assert.equal(JSON.stringify(restored[key]),JSON.stringify(h.before[key]));
 assert.equal(restored.stock,9);assert.equal(restored.description,'Edición posterior que se conserva');assert.equal(restored.custom.preserve,true);
 assert.equal(h.tables.historial_cambios.at(-1).action,'undo_rental_catalog_correction');assert.equal(h.tables.historial_cambios.at(-1).status,'committed');
 assert.throws(()=>h.ctx.dispatch_(h.request()),/cambió después/);
});
test('reversión: sin sesión o Editor no escribe; revisión vieja, campos cambiados o historial adulterado tampoco',()=>{
 const h=setup();h.createEditor();const editor=h.loginEditor();
 for(const patch of [{token:''},{token:editor},{revision:'vieja'},{historyId:'inexistente'}]){const before=JSON.stringify(h.tables);assert.throws(()=>h.ctx.dispatch_({...h.request(),...patch}));assert.equal(JSON.stringify(h.tables),before);}
 h.tables.disfraces[0].rentPrice=61000;const before=JSON.stringify(h.tables);assert.throws(()=>h.ctx.dispatch_(h.request()),/cambió después/);assert.equal(JSON.stringify(h.tables),before);
 h.tables.disfraces[0].rentPrice=60000;h.history.changes.stock={before:4,after:9};assert.throws(()=>h.ctx.dispatch_(h.request()),/Campos/);
});
