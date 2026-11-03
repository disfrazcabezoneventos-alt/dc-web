import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogHarness} from './catalog-access-harness.mjs';
function setup(){const h=catalogHarness(),rows=[];let sheet=null;h.ctx.SpreadsheetApp={openById:()=>({getSheetByName:()=>sheet,insertSheet:()=>sheet={appendRow:r=>rows.push([...r]),setFrozenRows(){},getLastRow:()=>rows.length,getRange:()=>({getValues:()=>rows.slice(1)})}})};return {...h,rows};}
test('registro opt-in almacena solo consulta y fecha, neutraliza fórmulas y limita frecuencia',()=>{
 const h=setup();assert.equal(h.ctx.dispatch_({action:'recordSearchMiss',query:'unicornio'}).accepted,false);assert.equal(h.rows.length,0);
 h.settings.SEARCH_MISS_LOG_ENABLED='yes';h.ctx.dispatch_({action:'recordSearchMiss',query:'=unicornio',email:'ignored@example.invalid',token:''});
 assert.equal(h.rows[1].length,2);assert.equal(h.rows[1][0],'"=unicornio"');assert.ok(!JSON.stringify(h.rows).includes('ignored'));
 assert.throws(()=>h.ctx.dispatch_({action:'recordSearchMiss',query:'=UNICORNIO'}),/Demasiados/);
 for(const query of ['',1,'x'.repeat(121)])assert.throws(()=>h.ctx.dispatch_({action:'recordSearchMiss',query}));
});
test('recuento únicamente para Admin, orden por cantidad y consultas de hoja ausente sin crearla',()=>{
 const h=setup();assert.deepEqual([...h.ctx.dispatch_({action:'searchDemand',token:h.admin})],[]);assert.equal(h.rows.length,0);
 h.settings.SEARCH_MISS_LOG_ENABLED='yes';h.ctx.dispatch_({action:'recordSearchMiss',query:'Dragon'});h.rows.push(['"Dragón"','2026-11-03T12:00:00Z']);h.ctx.dispatch_({action:'recordSearchMiss',query:'Unicornio'});
 const result=h.ctx.dispatch_({action:'searchDemand',token:h.admin});assert.equal(result[0].count,2);assert.equal(result[1].count,1);
 h.createEditor();const editor=h.loginEditor();assert.throws(()=>h.ctx.dispatch_({action:'searchDemand',token:editor}),/permiso/);assert.throws(()=>h.ctx.dispatch_({action:'searchDemand'}),/Sesión/);
});
test('límite global y tope de hoja impiden escrituras adicionales sin borrar registros',()=>{
 const h=setup();h.settings.SEARCH_MISS_LOG_ENABLED='yes';
 for(let i=0;i<60;i++)h.ctx.dispatch_({action:'recordSearchMiss',query:'idea '+i});
 const count=h.rows.length;assert.throws(()=>h.ctx.dispatch_({action:'recordSearchMiss',query:'otra idea'}),/Demasiados/);assert.equal(h.rows.length,count);
 const full=setup();full.settings.SEARCH_MISS_LOG_ENABLED='yes';full.ctx.dispatch_({action:'recordSearchMiss',query:'crear hoja'});while(full.rows.length<10001)full.rows.push(['"ficticio"','2026-11-03']);
 assert.equal(full.ctx.dispatch_({action:'recordSearchMiss',query:'supera el limite'}).accepted,false);assert.equal(full.rows.length,10001);
});
