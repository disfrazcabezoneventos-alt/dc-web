import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {catalogHarness} from './catalog-access-harness.mjs';
function setup(){
 const h=catalogHarness();h.settings.PR32_ENSAYO='yes';h.ctx.console={log(){}};
 vm.runInContext(fs.readFileSync('scripts/apps-script-ensayo/EnsayoCategoria.gs','utf8'),h.ctx);
 return h;
}
test('benchmark usa la API real sobre 120 productos sintéticos y verifica la escritura por lote',()=>{
 const h=setup(),originals=JSON.stringify({disfraces:h.tables.disfraces,cotillon:h.tables.cotillon});
 const result=h.ctx.ejecutarEnsayoCategoria();assert.equal(result.products,120);assert.ok(result.committedEvents<120);assert.equal(result.historyProducts,120);
 assert.deepEqual(JSON.parse(JSON.stringify(result.writes)),{products:1,history:2,categories:1});assert.ok(result.ms>=0);
 assert.equal(JSON.stringify({disfraces:h.tables.disfraces.slice(0,1),cotillon:h.tables.cotillon}),originals);
 assert.equal(h.tables.historial_cambios.flatMap(h=>h.products).length,120);assert.ok(h.tables.historial_cambios.every(h=>h.actor.username==='admin-ensayo'));
});
test('benchmark rechaza hojas ajenas al ensayo o con movimientos pendientes antes de escribir',()=>{
 for(const mode of ['flag','name','pending']){
  const h=setup();if(mode==='flag')delete h.settings.PR32_ENSAYO;if(mode==='name')h.ss.getName=()=> 'Hoja no destinada al ensayo';if(mode==='pending')h.tables.movimientos.push({stockPending:{before:1,after:0}});
  const before=JSON.stringify(h.tables),settings=JSON.stringify(h.settings);assert.throws(()=>h.ctx.ejecutarEnsayoCategoria());assert.equal(JSON.stringify(h.tables),before);assert.equal(JSON.stringify(h.settings),settings);
 }
});
