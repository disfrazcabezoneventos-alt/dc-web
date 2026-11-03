import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogHarness} from './catalog-access-harness.mjs';

function setup(count=120){
 const h=catalogHarness();h.tables.disfraces=Array.from({length:count},(_,i)=>({...h.product,id:'fixture-'+i,custom:{preserve:i}}));
 h.sheetCalls.length=0;return h;
}
const rename=h=>h.ctx.dispatch_({action:'saveCategory',token:h.admin,area:'disfraces',id:'d-primary',name:'Nombre nuevo'});
const undo=(h,id)=>h.ctx.dispatch_({action:'recoverProductHistory',token:h.admin,historyId:id,mode:'rollback'});

test('120 y 441: una lectura/escritura de productos, un flush, historial compacto y ajenos intactos',()=>{
 for(const count of [120,441]){
  const h=setup(count),before=structuredClone(h.tables.disfraces);
  h.tables.disfraces.splice(2,0,{...h.product,id:'unrelated',categoryId:'d-secondary',categoryIds:['d-secondary'],category:'Segunda categoría'});
  const unrelated=JSON.stringify(h.tables.disfraces[2]);rename(h);
  assert.equal(h.sheetCalls.filter(c=>c.type==='read'&&c.table==='disfraces').length,1);
  assert.equal(h.sheetCalls.filter(c=>c.type==='write'&&c.table==='disfraces').length,1);
  assert.equal(h.sheetCalls.filter(c=>c.type==='flush').length,1);
  assert.equal(JSON.stringify(h.tables.disfraces[2]),unrelated);
  for(const p of h.tables.disfraces.filter(p=>p.id!=='unrelated')){
   const original=before.find(b=>b.id===p.id);assert.deepEqual({...p,category:original.category},original);
  }
  const entries=h.tables.historial_cambios;assert.ok(entries.length<count);assert.equal(entries.flatMap(h=>h.products).length,count);
  for(const e of entries){assert.equal(e.action,'category_bulk');assert.equal(e.status,'committed');assert.ok(JSON.stringify(e).length<48000);
   for(const p of e.products){assert.deepEqual(Object.keys(p).sort(),['after','before','id']);assert.deepEqual(Object.keys(p.before).sort(),['category','categoryId','categoryIds']);}
  }
  assert.equal(h.ctx.dispatch_({action:'productHistory',token:h.admin,productId:'fixture-0'}).entries.length,1);
 }
});
test('volver a guardar el mismo nombre completa exactamente los 29 rezagados',()=>{
 const h=setup();h.tables.categorias_disfraces[0].name='Nombre nuevo';h.tables.disfraces.slice(0,91).forEach(p=>p.category='Nombre nuevo');
 rename(h);assert.equal(h.tables.historial_cambios.flatMap(h=>h.products).length,29);assert.ok(h.tables.disfraces.every(p=>p.category==='Nombre nuevo'));
 h.sheetCalls.length=0;rename(h);assert.equal(h.sheetCalls.filter(c=>c.type==='write'||c.type==='flush').length,0);
});
test('borrado: tres destinos, primarias/secundarias/legadas, y deshacer conserva todo el producto',()=>{
 for(const strategy of ['otros','new','uncategorized']){
  const h=setup(2);h.tables.disfraces[1]={...h.product,id:'secondary',categoryId:'d-secondary',categoryIds:['d-secondary','d-primary'],category:'Segunda categoría'};
  h.tables.disfraces.push({id:'legacy',area:'disfraces',category:h.product.category,stock:7});
  const before=structuredClone(h.tables.disfraces),categories=structuredClone(h.tables.categorias_disfraces);
  const result=h.ctx.dispatch_({action:'deleteCategory',token:h.admin,area:'disfraces',id:'d-primary',expectedCount:3,strategy,newName:'Destino nuevo'});
  assert.equal(result.affected,3);assert.ok(!h.tables.categorias_disfraces.some(c=>c.id==='d-primary'));
  assert.ok(h.tables.disfraces.every(p=>!h.ctx.productCategoryIds_(p).includes('d-primary')));
  assert.equal(h.tables.disfraces[0].category,'Segunda categoría');assert.equal(h.tables.disfraces[1].category,'Segunda categoría');
  const entry=h.tables.historial_cambios[0];h.tables.disfraces[0].price=999;undo(h,entry.id);
  assert.deepEqual(h.tables.disfraces,before.map((p,i)=>i===0?{...p,price:999}:p));
  assert.deepEqual(h.tables.categorias_disfraces.slice().sort((a,b)=>a.id.localeCompare(b.id)),categories.slice().sort((a,b)=>a.id.localeCompare(b.id)));assert.equal(h.tables.historial_cambios[0].status,'rolled_back');
  assert.equal(undo(h,entry.id).recovered,0);
 }
});
test('interrupciones antes/después de productos y al confirmar: reanudar o deshacer todas las partes',()=>{
 for(const mode of ['forward','rollback'])for(const phase of ['before_products','after_products','commit']){
  const h=setup(441),before=structuredClone(h.tables.disfraces),write=h.ctx.catalogBulkWrite_;let failed=false;
  h.ctx.catalogBulkWrite_=(state,updates)=>{
   const products=updates.has('fixture-0'),commit=[...updates.values()].some(v=>v?.action==='category_bulk'&&v.status==='committed');
   if(!failed&&((phase==='before_products'&&products)||(phase==='commit'&&commit))){failed=true;throw Error('Interrupción');}
   const result=write(state,updates);if(!failed&&phase==='after_products'&&products){failed=true;throw Error('Interrupción');}return result;
  };
  assert.throws(()=>rename(h),/Interrupción/);h.ctx.catalogBulkWrite_=write;
  assert.ok(h.tables.historial_cambios.length>1);assert.ok(h.tables.historial_cambios.every(h=>h.status==='pending'));
  if(mode==='forward')rename(h);else undo(h,h.tables.historial_cambios[0].id);
  assert.ok(h.tables.historial_cambios.every(h=>h.status===(mode==='forward'?'committed':'rolled_back')));
  assert.deepEqual(h.tables.disfraces,mode==='forward'?before.map(p=>({...p,category:'Nombre nuevo'})):before);
 }
});
test('recuperación global de lote y recuperación de rollback interrumpido',()=>{
 const h=setup(),before=structuredClone(h.tables.disfraces);rename(h);
 const id=h.tables.historial_cambios[0].id,write=h.ctx.catalogBulkWrite_;let failed=false;
 h.ctx.catalogBulkWrite_=(state,updates)=>{if(!failed&&updates.has('fixture-0')){failed=true;throw Error('Interrupción');}return write(state,updates);};
 assert.throws(()=>undo(h,id));h.ctx.catalogBulkWrite_=write;
 assert.equal(h.tables.historial_cambios[0].direction,'rollback');
 assert.equal(h.ctx.dispatch_({action:'recoverProductHistory',token:h.admin}).recovered,1);assert.deepEqual(h.tables.disfraces,before);
});
test('conflictos, diario incompleto y un producto demasiado grande se rechazan sin escrituras parciales',()=>{
 for(const kind of ['conflict','missing_part','missing_product']){
  const h=setup(441);rename(h);const id=h.tables.historial_cambios[0].id;
  if(kind==='conflict')h.tables.disfraces[0].category='Otro cambio';if(kind==='missing_part')h.tables.historial_cambios.pop();if(kind==='missing_product')h.tables.disfraces.shift();
  const before=JSON.stringify(h.tables);h.sheetCalls.length=0;assert.throws(()=>undo(h,id),/Conflicto|incompleto/);assert.equal(JSON.stringify(h.tables),before);assert.ok(!h.sheetCalls.some(c=>c.type==='write'||c.type==='flush'));
 }
 const h=setup(1);h.tables.disfraces[0].categoryIds=Array.from({length:1000},(_,i)=>'x'.repeat(70)+i);
 const before=JSON.stringify(h.tables);assert.throws(()=>rename(h),/tamaño/);assert.equal(JSON.stringify(h.tables),before);
});
test('Editor no puede iniciar ni recuperar/deshacer lotes; el guardado individual permanece con su historial habitual',()=>{
 const h=setup(1);h.createEditor();const editor=h.loginEditor();
 for(const action of ['saveCategory','deleteCategory','recoverProductHistory'])assert.throws(()=>h.ctx.dispatch_({action,token:editor,area:'disfraces',id:'d-primary',mode:'rollback'}),/permiso/);
 h.ctx.dispatch_({action:'quickUpdate',token:editor,area:'disfraces',id:'fixture-0',cambios:{active:false}});assert.equal(h.tables.historial_cambios[0].action,'quick_update');
 const p=h.ctx.dispatch_({action:'admin',token:editor}).products[0];h.ctx.dispatch_({action:'saveProduct',token:editor,product:{...p,name:'Individual'}});assert.equal(h.tables.historial_cambios[1].action,'edit');
});
test('deshacer no borra destinos que recibieron nuevos productos ni restaura categorías con nombres en conflicto',()=>{
 for(const kind of ['new_link','duplicate_name']){
  const h=setup(1),result=h.ctx.dispatch_({action:'deleteCategory',token:h.admin,area:'disfraces',id:'d-primary',expectedCount:1,strategy:'new',newName:'Destino nuevo'});
  if(kind==='new_link')h.tables.disfraces.push({...h.product,id:'later',categoryId:result.target.id,categoryIds:[result.target.id],category:result.target.name});
  else h.tables.categorias_disfraces.push({id:'later-category',area:'disfraces',name:'Categoría de ensayo'});
  const before=JSON.stringify(h.tables);assert.throws(()=>undo(h,h.tables.historial_cambios[0].id),/Conflicto/);assert.equal(JSON.stringify(h.tables),before);
 }
});
