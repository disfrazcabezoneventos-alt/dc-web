import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {setup,source,sha,fixture} from './manual-disfraces-harness.mjs';

test('plan y foto conservan SHA-256, nombres, tarifas y stocks del PR #11',()=>{
 const code=fs.readFileSync('backend/LimpiezaManualesDisfraces20261028.gs','utf8');
 assert.ok(code.includes("LM28_SHA256='"+sha+"'"));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('backend/manual-cleanup-assets/154-scream.jpg')).digest('hex'),source.add[0].photoSha256);
 assert.deepEqual(source.add.map(p=>[p.sourceId,p.name,p.stock,p.rentPrice,p.insurance,p.photoWidth]),[['154','Scream',3,60000,60000,1254],['427','Woody',1,75000,100000,160]]);
 fixture.manual.forEach((row,i)=>assert.equal(crypto.createHash('sha256').update(row[1]).digest('hex'),source.delete[i].recordSha256));
});
test('ensayo respalda exactamente, borra solo cinco y agrega dos sin Cloudinary; segunda ejecución no modifica',()=>{
 const h=setup(),before=structuredClone(h.sheet().values),production=structuredClone(h.sheet('production').values);
 const result=h.context.probarLimpiezaManuales28Copia();
 assert.equal(result.bajas,5);assert.equal(result.altas,2);
 assert.deepEqual(h.sheet('copy',result.respaldo).values,before);
 assert.equal(h.products().length,3);assert.equal(h.products()[0].id,'untouched');
 assert.ok(h.products().slice(1).every(p=>!p.active&&!p.image&&!p.thumbnail));
 assert.equal(h.products().at(-1).photoStatus,'pendiente de foto nueva');
 assert.deepEqual(h.sheet('production').values,production);
 assert.equal(h.settings.LM28_COPY_PASSED,sha);
 assert.equal(h.context.probarLimpiezaManuales28Copia().estado,'ya aplicado');
 assert.deepEqual(h.calls(),{cloud:0,writes:1});
});
for(const tab of ['reservas','movimientos','cancelaciones'])for(const match of ['id','name']){
 test('frena por referencia '+match+' en '+tab+', aunque diga prueba/cancelada',()=>{
  const h=setup(),before=structuredClone(h.sheet().values);
  const p={id:'ref-test',status:'cancelled',note:'prueba',data:{items:[match==='id'?{productId:source.delete[0].id}:{name:'SCREAM VENTA'}]}};
  h.sheet('copy',tab).values.push([p.id,JSON.stringify(p)]);
  assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/Hay referencias/);
  assert.deepEqual(h.sheet().values,before);assert.deepEqual(h.calls(),{cloud:0,writes:0});
 });
}
test('producción exige aprobación y ensayo de este manifiesto',()=>{
 const h=setup();assert.throws(()=>h.context.aplicarLimpiezaManuales28Produccion(),/Falta OK/);
 h.settings.LM28_APPROVED=sha;assert.throws(()=>h.context.aplicarLimpiezaManuales28Produccion(),/Falta OK/);
 assert.deepEqual(h.calls(),{cloud:0,writes:0});
});
test('producción simulada activa solo Scream con foto original y miniatura; Woody sigue sin foto',()=>{
 const h=setup();h.context.probarLimpiezaManuales28Copia();h.settings.LM28_APPROVED=sha;
 Object.assign(h.settings,{CLOUDINARY_CLOUD_NAME:'test',CLOUDINARY_API_KEY:'test',CLOUDINARY_API_SECRET:'test'});
 h.context.aplicarLimpiezaManuales28Produccion();
 const [scream,woody]=h.products('production').slice(1);
 assert.equal(scream.active,true);assert.match(scream.image,/scream.jpg/);assert.match(scream.thumbnail,/thumb/);
 assert.equal(woody.active,false);assert.equal(woody.image,'');assert.equal(woody.thumbnail,'');
 assert.deepEqual(h.calls(),{cloud:1,writes:2});
});
for(const failure of ['backupFail','batchFail','corruptPhoto'])test('frena sin borrar filas si falla '+failure,()=>{
 const h=setup(),before=structuredClone(h.sheet().values);h[failure]();
 assert.throws(()=>h.context.probarLimpiezaManuales28Copia());assert.deepEqual(h.sheet().values,before);assert.equal(h.calls().writes,0);
});
test('bloquea copia igual a producción, ficha editada, estado parcial y alta preexistente',()=>{
 let h=setup();h.settings.LM28_TEST_ID='production';assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/copia apunta/);
 h=setup();h.sheet().values[1][1]+=' ';assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/Cambió/);
 h=setup();h.sheet().values.splice(1,1);assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/Estado parcial/);
 h=setup();h.sheet().values.push(['catalogo-disfraz-154',JSON.stringify({id:'catalogo-disfraz-154',sourceId:'154',name:'Scream'})]);assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/Estado parcial/);
});
test('revisa referencias otra vez después del respaldo',()=>{
 const h=setup(),before=structuredClone(h.sheet().values);
 h.onBackup(ss=>ss.getSheetByName('reservas').values.push(['new',JSON.stringify({id:'new',data:{items:[{name:'Woody'}]}})]));
 assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/Hay referencias/);
 assert.deepEqual(h.sheet().values,before);assert.equal(h.calls().writes,0);
});
test('rechaza respaldo anterior distinto y categoría faltante',()=>{
 let h=setup();h.context.probarLimpiezaManuales28Copia();
 h.sheet().values=structuredClone(h.sheet('copy','disfraces_respaldo_limpieza_20261028_test').values);
 h.sheet('copy','disfraces_respaldo_limpieza_20261028_test').values.pop();
 assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/respaldo no coincide/);
 h=setup();h.sheet('copy','categorias_disfraces').values.splice(1,1);
 assert.throws(()=>h.context.probarLimpiezaManuales28Copia(),/Falta una categoría/);
 assert.equal(h.calls().writes,0);
});
