import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const code=fs.readFileSync('backend/Code.gs','utf8');
const addon=fs.readFileSync('backend/DisfracesIncremental20261028.gs','utf8');
const raw=fs.readFileSync('backend/import-disfraces-2026-10-28.json','utf8');
const manifest=JSON.parse(raw);
const folder='tmp/disfraces-2026-10-28';
const names=['Hombres','Cabezones','Mujeres','Personajes','Profesiones','Superheroes y Princesas','Halloween','Históricos','Otros'];

function unzipStored(bytes){
 const files=[];let offset=0;
 while(offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50){
  const method=bytes.readUInt16LE(offset+8),size=bytes.readUInt32LE(offset+18);
  const nameSize=bytes.readUInt16LE(offset+26),extraSize=bytes.readUInt16LE(offset+28);
  assert.equal(method,0);
  const name=bytes.subarray(offset+30,offset+30+nameSize).toString('utf8');
  const data=bytes.subarray(offset+30+nameSize+extraSize,offset+30+nameSize+extraSize+size);
  files.push({getName:()=>name,getBytes:()=>[...data]});
  offset+=30+nameSize+extraSize+size;
 }
 return files;
}
function setup(){
 const productionId='production-sheet-012345678901234567890',testId='copy-sheet-012345678901234567890';
 const settings={SPREADSHEET_ID:productionId,DISFRACES_20261028_TEST_ID:testId};
 const initialProducts=['Scream','Medusa','Woody','Scream Venta','Scream Preventa'].map((name,i)=>({
  id:'manual-'+i,area:'disfraces',name,mode:i===0||i===2?'alquiler':'venta',active:true,
  rentPrice:i===0||i===2?60000:0,stock:1,image:'https://res.cloudinary.com/demo/image/upload/manual.jpg'
 }));
 const fixture=process.env.DC_DISFRACES_COPY_FIXTURE?JSON.parse(fs.readFileSync(process.env.DC_DISFRACES_COPY_FIXTURE,'utf8')):null;
 const initial=fixture?.disfraces??[['id','registro_json'],...initialProducts.map(p=>[p.id,JSON.stringify(p)])];
 const categoryRows=fixture?.categories??[['id','registro_json'],...names.map((name,i)=>['cat-'+i,JSON.stringify({id:'cat-'+i,area:'disfraces',name})])];
 const copies={test:new Map(),production:new Map()};
 class Sheet{
  constructor(name,rows,store){this.name=name;this.rows=rows;this.store=store;}
  getLastRow(){return this.rows.length;}
  getRange(start,column,height,width){return {
   getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>this.rows[start+i-1]?.[column+j-1]??'')),
   setValues:values=>{assert.equal(values.length,height);values.forEach((row,i)=>{this.rows[start+i-1]??=[];row.forEach((cell,j)=>this.rows[start+i-1][column+j-1]=cell)});}
  };}
  copyTo(){const copy=new Sheet('temporary',structuredClone(this.rows),this.store);this.store.set('temporary',copy);return copy;}
  setName(name){assert.ok(!this.store.has(name));this.store.delete(this.name);this.name=name;this.store.set(name,this);return this;}
 }
 for(const store of Object.values(copies)){
  store.set('disfraces',new Sheet('disfraces',structuredClone(initial),store));
  store.set('categorias_disfraces',new Sheet('categorias_disfraces',structuredClone(categoryRows),store));
  store.set('cotillon',new Sheet('cotillon',[['id','registro_json'],['untouched','{}']],store));
 }
 const archiveById=new Map(manifest.photoArchives.map(a=>[a.driveId,a.name]));
 let cloudinaryCalls=0;
 const context=vm.createContext({console:{log(){}},Date,JSON,Map,Set,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]??'',setProperty:(key,value)=>settings[key]=value})},
  Utilities:{Charset:{UTF_8:'UTF-8'},DigestAlgorithm:{SHA_256:'sha256',SHA_1:'sha1'},
   computeDigest:(algo,value)=>[...crypto.createHash(algo).update(Array.isArray(value)?Buffer.from(value):value).digest()],
   unzip:blob=>unzipStored(Buffer.from(blob.getBytes())),newBlob:(bytes)=>({getBytes:()=>bytes})},
  UrlFetchApp:{fetch:url=>{
   if(url.includes('api.cloudinary.com')){
    cloudinaryCalls++;
    const response=cloudinaryCalls===1?{secure_url:'https://res.cloudinary.com/test/photo.jpg'}:{secure_url:'https://res.cloudinary.com/test/photo.jpg',eager:[{secure_url:'https://res.cloudinary.com/test/thumb.jpg'}]};
    return {getResponseCode:()=>200,getContentText:()=>JSON.stringify(response)};
   }
   return {getResponseCode:()=>200,getContentText:()=>raw};
  }},
  DriveApp:{getFileById:id=>{const name=archiveById.get(id);assert.ok(name);return {getBlob:()=>({getBytes:()=>[...fs.readFileSync(`${folder}/${name}`)]})};}},
  SpreadsheetApp:{openById:id=>({getSheetByName:name=>copies[id===testId?'test':'production'].get(name)||null}),flush(){}},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}
 });
 vm.runInContext(code,context,{filename:'Code.gs'});
 vm.runInContext(addon,context,{filename:'DisfracesIncremental20261028.gs'});
 const products=mode=>copies[mode].get('disfraces').rows.slice(1).map(row=>JSON.parse(row[1]));
 return {context,settings,copies,products,getCloudinaryCalls:()=>cloudinaryCalls};
}

test('la fuente conserva los 443 IDs, fotos y reglas de selección',()=>{
 assert.equal(manifest.products.length,443);
 assert.equal(new Set(manifest.products.map(p=>p.sourceId)).size,443);
 assert.equal(manifest.products.filter(p=>p.photoWidth>=600).length,309);
 assert.equal(manifest.products.filter(p=>p.manualConflict).length,2);
 assert.equal(manifest.products.filter(p=>p.photoBatch).length,308);
 assert.equal(manifest.products.filter(p=>p.stockFromCross).length,167);
 assert.equal(manifest.products.find(p=>p.name==='Enfermera blanca').stock,0);
 assert.equal(manifest.products.find(p=>p.name==='Spider Man Spectacular').stock,1);
 assert.ok(manifest.products.every(p=>p.review==='Pendiente'));
});
test('la previsualización no escribe y producción queda bloqueada',()=>{
 const {context,copies}=setup();
 const before=JSON.stringify(copies.test.get('disfraces').rows);
 const summary=context.previsualizarDisfraces28Copia();
 assert.equal(summary.altas,441);assert.equal(summary.omitidasManuales,2);
 assert.equal(summary.activasPotenciales,308);assert.equal(summary.inactivasPorAncho,133);
 assert.equal(summary.conflictos,0);assert.equal(summary.categoriasSinEquivalencia,1);
 assert.equal(JSON.stringify(copies.test.get('disfraces').rows),before);
 assert.throws(()=>context.aplicarLoteDisfraces28Produccion(),/aprobación expresa/);
 assert.equal(copies.production.get('disfraces').rows.length,6);
});
test('los 30 lotes en la copia crean respaldo y preservan fichas manuales y Cotillón',()=>{
 const {context,copies,products,getCloudinaryCalls}=setup();
 const before=JSON.stringify(copies.test.get('disfraces').rows);
 let batches=0,total=0;
 while(context.previsualizarDisfraces28Copia().altas){
  const result=context.probarLoteDisfraces28Copia();
  assert.ok(result.procesados>0&&result.procesados<=15);
  batches++;total+=result.procesados;
  assert.ok(batches<=30);
 }
 assert.equal(batches,30);assert.equal(total,441);
 assert.equal(products('test').length,446);
 assert.equal(products('test').filter(p=>p.importBatch===manifest.batch).length,441);
 assert.equal(products('test').filter(p=>p.importBatch===manifest.batch&&p.active).length,0);
 assert.deepEqual(products('test').slice(0,5).map(p=>p.name),['Scream','Medusa','Woody','Scream Venta','Scream Preventa']);
 assert.equal(JSON.stringify(copies.test.get('disfraces_respaldo_20261028_test').rows),before);
 assert.equal(JSON.stringify(copies.test.get('cotillon').rows),JSON.stringify(copies.production.get('cotillon').rows));
 assert.equal(getCloudinaryCalls(),0);
 assert.equal(context.probarLoteDisfraces28Copia().procesados,0);
 if(process.env.DC_DISFRACES_EXPORT_COPY_ROWS)fs.writeFileSync(process.env.DC_DISFRACES_EXPORT_COPY_ROWS,JSON.stringify({rows:copies.test.get('disfraces').rows,backup:copies.test.get('disfraces_respaldo_20261028_test').rows,batches}));
});
test('simulación local: solo se activa una ficha cuando Cloudinary entrega foto y miniatura',()=>{
 const {context,settings,copies,products,getCloudinaryCalls}=setup();
 settings.DISFRACES_20261028_APPROVED=crypto.createHash('sha256').update(raw).digest('hex');
 settings.CLOUDINARY_CLOUD_NAME='test';
 settings.CLOUDINARY_API_KEY='test';
 settings.CLOUDINARY_API_SECRET='test';
 const result=context.aplicarLoteDisfraces28Produccion();
 assert.equal(result.procesados,15);
 assert.equal(result.fotosFallidasEnEsteLote,1);
 assert.ok(result.activadosEnEsteLote>0);
 assert.equal(getCloudinaryCalls(),result.activadosEnEsteLote+1);
 const imported=products('production').filter(p=>p.importBatch===manifest.batch);
 assert.equal(imported.length,15);
 assert.ok(imported.filter(p=>p.active).every(p=>p.image&&p.thumbnail));
 assert.equal(imported.filter(p=>p.photoImportError).length,1);
 assert.ok(imported.filter(p=>p.photoImportError).every(p=>!p.active&&!p.image&&!p.thumbnail));
 assert.equal(copies.production.get('disfraces_respaldo_20261028_production').rows.length,6);
 assert.equal(copies.test.get('disfraces').rows.length,6);
});
