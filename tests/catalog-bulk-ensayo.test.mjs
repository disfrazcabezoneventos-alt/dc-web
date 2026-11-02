import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {catalogHarness} from './catalog-access-harness.mjs';
test('ensayo real preparado: reanuda 29, renombra 120/441, borra 120 y restaura las fichas originales',()=>{
 const h=catalogHarness();h.settings.PR32_ENSAYO='yes';h.ctx.console={log(){}};
 const category={id:'qa-category-fixture',area:'disfraces',name:'ENSAYO anterior renombrada'};
 h.tables.categorias_disfraces.push(category);
 const original=Array.from({length:558},(_,i)=>({...h.product,id:'original-'+i,categoryIds:i%2?h.product.categoryIds:undefined}));
 // Undefined fields do not exist in Sheets JSON.
 h.tables.disfraces=JSON.parse(JSON.stringify(original));const baseline=JSON.stringify(h.tables.disfraces);
 h.tables.disfraces.push(...Array.from({length:120},(_,i)=>({...h.product,id:'qa-product-'+i,categoryId:category.id,categoryIds:[category.id],category:i<91?category.name:'ENSAYO anterior'})));
 vm.runInContext(fs.readFileSync('scripts/apps-script-ensayo/EnsayoCategoria.gs','utf8')+'\n'+fs.readFileSync('scripts/apps-script-ensayo/EnsayoLotes.gs','utf8'),h.ctx);
 const result=h.ctx.ejecutarEnsayoLotes();
 assert.deepEqual([...result.reports.map(r=>r.products)],[29,120,441,120]);assert.equal(result.originalsRestored,441);assert.equal(result.deleteUndone,true);assert.equal(result.hashIterations,600000);
 assert.equal(JSON.stringify(h.tables.disfraces.slice(0,558)),baseline);assert.ok(h.tables.historial_cambios.every(e=>JSON.stringify(e).length<48000));assert.equal(result.copyProducts,678);
 assert.ok(h.tables.disfraces.slice(558).every(p=>p.category.startsWith('ENSAYO lote 120')));
 assert.equal(h.ctx.ejecutarEnsayoLotes().reports.length,4);
});
