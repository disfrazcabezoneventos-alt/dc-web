import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {setup,source,raw,sha,rowsOf,unrelated,categories} from './cotillon-six-harness.mjs';

test('el lote conserva exactamente los seis precios y stocks solicitados y las fotos revisadas',()=>{
 assert.deepEqual(source.map(p=>[p.name,p.price,p.stock]),[
  ['Globo Surtido 5p',100,314],['Globos Surtidos Chrome',350,153],['Globos Surtidos Std',200,709],
  ['Piñata Globo Surtida 20"',2000,84],['Tutús Surtidos',8000,10],['Cinta De Precaución Amarilla X Metro',200,190]
 ]);
 assert.equal(new Set(source.map(p=>p.sourceId)).size,6);
 assert.match(fs.readFileSync('backend/CotillonSeisRappi20261028.gs','utf8'),new RegExp(sha));
 for(const p of source){
  const bytes=fs.readFileSync('backend/import-images/cotillon-seis-2026-10-28/'+p.photoFile);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),p.photoSha256);
  assert.equal(p.photoApproved,true);
 }
 assert.ok(raw.endsWith('\n'));
});

test('previsualizar no escribe, detecta seis altas y conserva toda la copia',()=>{
 const h=setup(),before=JSON.stringify([...h.sheets]);
 const preview=h.context.previsualizarCotillon6Copia();
 assert.equal(preview.altas,6);assert.equal(preview.conflictos,0);assert.equal(preview.sinFotoAprobada,0);
 assert.equal(h.events.length,0);assert.equal(JSON.stringify([...h.sheets]),before);
});

test('respaldo previo, lotes de dos, reanudación y seis altas inactivas sin subir fotos',()=>{
 const h=setup(),before=JSON.stringify(h.sheets.get('cotillon').rows);
 for(const count of [2,2,2,0])assert.equal(h.context.cotillonSix28Apply_(h.settings.COTILLON_SIX_20261028_TEST_ID,'test',2).procesados,count);
 assert.equal(h.events[0],'backup');assert.equal(h.events.filter(e=>e==='backup').length,1);
 assert.equal(JSON.stringify(h.sheets.get('cotillon_respaldo_seis_20261028_test').rows),before);
 assert.deepEqual(h.products()[0],unrelated);
 assert.equal(h.products().length,7);
 assert.ok(h.products().slice(1).every(p=>!p.active&&!p.image&&!p.thumbnail&&p.photoImportState==='copy-only'));
 assert.ok(!h.calls.some(url=>url.includes('/import-images/')||url.startsWith('cloud-upload:')));
});

test('no pisa una edición manual de una ficha propia al reanudar',()=>{
 const h=setup();h.context.probarLoteCotillon6Copia();
 const p=h.products()[1];p.price=999;p.stock=2;p.name='Nombre editado';p.active=false;
 h.sheets.get('cotillon').rows[2]=[p.id,JSON.stringify(p)];
 assert.equal(h.context.probarLoteCotillon6Copia().procesados,0);
 assert.deepEqual(h.products()[1],p);
});

test('SHA de JSON alterado bloquea antes del respaldo y de cualquier alta',()=>{
 const h=setup({payloadChanged:true});assert.throws(()=>h.context.probarLoteCotillon6Copia(),/SHA-256/);assert.equal(h.events.length,0);
});

test('identidad por ID, sourceId o nombre y categorías inválidas bloquean el lote completo',()=>{
 const p=source[0];
 for(const existing of [
  {...unrelated,id:'excel-'+p.sourceId}, {...unrelated,sourceId:p.sourceId},
  {...unrelated,name:p.name}, {...unrelated,name:source[1].sourceName}
 ]){
  const h=setup({rows:rowsOf([existing])});assert.throws(()=>h.context.probarLoteCotillon6Copia(),/conflictos/);assert.equal(h.events.length,0);
 }
 const h=setup({categories:rowsOf(categories.filter(c=>c.id!=='deco'))});
 assert.throws(()=>h.context.probarLoteCotillon6Copia(),/conflictos/);assert.equal(h.events.length,0);
});

test('copia igual a producción, modo inválido o sin aprobación nunca escribe',()=>{
 const missing=setup();delete missing.settings.SPREADSHEET_ID;
 assert.throws(()=>missing.context.probarLoteCotillon6Copia(),/identificar producción/);assert.equal(missing.events.length,0);
 const h=setup();h.settings.COTILLON_SIX_20261028_TEST_ID=h.settings.SPREADSHEET_ID;
 assert.throws(()=>h.context.probarLoteCotillon6Copia(),/copia apunta a producción/);
 const p=setup({production:true});
 assert.throws(()=>p.context.aplicarLoteCotillon6Produccion(),/aprobación/);
 assert.throws(()=>p.context.cotillonSix28Apply_(p.settings.SPREADSHEET_ID,'typo'),/Modo inválido/);
 assert.equal(h.events.length+p.events.length,0);
});

test('sin Cloudinary o con respaldo eliminado se bloquea sin agregar fichas',()=>{
 const h=setup({production:true});h.settings.COTILLON_SIX_20261028_APPROVED=sha;delete h.settings.CLOUDINARY_API_SECRET;
 assert.throws(()=>h.context.aplicarLoteCotillon6Produccion(),/Cloudinary/);assert.equal(h.events.length,0);
 const copy=setup();copy.context.cotillonSix28Apply_(copy.settings.COTILLON_SIX_20261028_TEST_ID,'test',2);
 copy.sheets.delete('cotillon_respaldo_seis_20261028_test');
 const count=copy.products().length;
 assert.throws(()=>copy.context.probarLoteCotillon6Copia(),/respaldo registrado/);assert.equal(copy.products().length,count);
});

test('foto no aprobada crea la ficha inactiva sin descargar ni subir su imagen',()=>{
 const h=setup({production:true});h.settings.COTILLON_SIX_20261028_APPROVED=sha;
 const custom=structuredClone(source);custom[0].photoApproved=false;custom[0].photoReviewReason='Foto no adecuada';
 h.context.cotillonSix28Source_=()=>custom;
 h.context.aplicarLoteCotillon6Produccion();
 const p=h.products().find(p=>p.sourceId===custom[0].sourceId);
 assert.equal(p.active,false);assert.equal(p.photoReview,true);assert.equal(p.photoImportState,'review');assert.equal(p.image,'');
 assert.ok(!h.calls.some(url=>url.endsWith(custom[0].photoFile)||url==='cloud-upload:seis-20261028-'+custom[0].sourceId));
});

test('foto alterada, fallo de subida o miniatura 404 dejan inactiva la ficha y permiten reintento sin duplicar',()=>{
 for(const failure of ['photoChanged','cloudError','thumbnail404']){
  const h=setup({production:true,[failure]:true});h.settings.COTILLON_SIX_20261028_APPROVED=sha;
  const first=h.context.aplicarLoteCotillon6Produccion();
  assert.equal(first.fotosFallidas,6);assert.equal(h.products().length,7);
  assert.ok(h.products().slice(1).every(p=>!p.active&&p.photoImportState==='error'&&!p.image&&!p.thumbnail));
  assert.equal(h.context.aplicarLoteCotillon6Produccion().procesados,0);
  h.state[failure]=false;
  const retry=h.context.reintentarFotosCotillon6Produccion();
  assert.equal(retry.procesados,6);assert.equal(retry.fotosFallidas,0);assert.equal(h.products().length,7);
  assert.ok(h.products().slice(1).every(p=>p.active&&p.image&&p.thumbnail&&p.photoImportState==='ready'));
  assert.deepEqual(h.products()[0],unrelated);
 }
});
