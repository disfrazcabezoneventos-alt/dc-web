import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const code=fs.readFileSync('backend/Code.gs','utf8');
const addon=fs.readFileSync('backend/CotillonIncremental20261027.gs','utf8');
const raw=fs.readFileSync('backend/import-cotillon-incremental-2026-10-27.json','utf8');
const payload=JSON.parse(raw).products;
const sourceDir='tmp/import-2026-10-27/originales';

function csvRows(text){
 const rows=[],line=[];let value='',quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='"'){
   if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;
  }else if(char===','&&!quoted){line.push(value);value='';}
  else if((char==='\n'||char==='\r'&&text[i+1]!=='\n')&&!quoted){line.push(value);rows.push(line.splice(0));value='';}
  else if(char!=='\r'||quoted)value+=char;
 }
 if(value||line.length){line.push(value);rows.push(line);}
 return rows;
}

function setup(){
 const settings={SPREADSHEET_ID:'production-sheet-dummy-012345678901234',COTILLON_INC_20261027_TEST_ID:'copy-of-store-sheet-012345678901234'};
 const writeCounts={total:0};
 const data={
  cotillon:csvRows(fs.readFileSync(`${sourceDir}/cotillon.csv`,'utf8')),
  categorias_cotillon:csvRows(fs.readFileSync(`${sourceDir}/categorias_cotillon.csv`,'utf8')),
 };
 const sheets=new Map();
 class Sheet{
  constructor(name,rows){this.name=name;this.rows=rows;}
  getLastRow(){return this.rows.length;}
  getRange(start,column,height,width){return {
   getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>this.rows[start-1+i]?.[column-1+j]??'')),
   setValues:values=>{assert.equal(values.length,height);values.forEach((row,i)=>{assert.equal(row.length,width);const at=start-1+i;this.rows[at]??=[];row.forEach((cell,j)=>this.rows[at][column-1+j]=cell);writeCounts.total++;});return this;}
  };}
  copyTo(){const name=`Copy of ${this.name}`;assert.ok(!sheets.has(name));const copy=new Sheet(name,structuredClone(this.rows));sheets.set(name,copy);return copy;}
  setName(name){assert.ok(!sheets.has(name));sheets.delete(this.name);this.name=name;sheets.set(name,this);return this;}
 }
 for(const [name,rows] of Object.entries(data))sheets.set(name,new Sheet(name,rows));
 const spreadsheet={getSheetByName:name=>sheets.get(name)||null};
 const context=vm.createContext({console:{log(){}},Date,JSON,Map,Set,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]??'',setProperty:(key,value)=>settings[key]=value,deleteProperty:key=>delete settings[key]})},
  Utilities:{Charset:{UTF_8:'UTF-8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_algorithm,text)=>[...crypto.createHash('sha256').update(text,'utf8').digest()]},
  UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>raw})},
  SpreadsheetApp:{openById:id=>{assert.equal(id,settings.COTILLON_INC_20261027_TEST_ID);return spreadsheet;},flush(){}},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}
 });
 vm.runInContext(code,context,{filename:'Code.gs'});
 vm.runInContext(addon,context,{filename:'CotillonIncremental20261027.gs'});
 const products=()=>sheets.get('cotillon').rows.slice(1).map(row=>JSON.parse(row[1]));
 return {settings,sheets,context,products,writeCounts};
}

test('la fuente fija conserva 661 IDs de Rappi y prioriza las altas de Halloween',()=>{
 assert.equal(payload.length,661);
 assert.equal(new Set(payload.map(p=>p.sourceId)).size,661);
 assert.equal(payload.filter(p=>p.baselinePrice===null).length,107);
 assert.equal(payload.filter(p=>p.baselinePrice!==null).length,554);
 assert.ok(payload.every(p=>p.stock>0&&p.price>0&&p.photoUrl.startsWith('https://')));
 const firstOther=payload.findIndex(p=>p.baselinePrice===null&&p.section!=='Halloween');
 assert.ok(firstOther>0);
 assert.ok(payload.slice(0,firstOther).every(p=>p.baselinePrice===null&&p.section==='Halloween'));
 const sorbetes=payload.find(p=>p.sourceId==='2115454079');
 assert.equal(sorbetes.name,'Sorbetes Halloween');
 assert.match(sorbetes.description,/24 sorbetes de papel biodegradables.*197 × 6 mm/);
 assert.match(sorbetes.photoUrl,/sorbetes-halloween__2115454079\.jpg$/);
});

test('previsualizar la copia no escribe y detecta solo 87 cambios reales',()=>{
 const {context,sheets,writeCounts}=setup();
 const before=JSON.stringify(sheets.get('cotillon').rows);
 const summary=context.previsualizarCotillon27Copia();
 assert.equal(summary.fuente,661);
 assert.equal(summary.altas,107);
 assert.equal(summary.actualizaciones,87);
 assert.equal(summary.sinCambios,467);
 assert.equal(summary.conflictos,0);
 assert.equal(writeCounts.total,0);
 assert.equal(JSON.stringify(sheets.get('cotillon').rows),before);
 if(process.env.DC_COTILLON_EXPORT_COPY_PLAN){
  const operations=context.cotillonInc27Plan_(context.config_('COTILLON_INC_20261027_TEST_ID'),context.cotillonInc27Source_()).operations;
  fs.writeFileSync(process.env.DC_COTILLON_EXPORT_COPY_PLAN,JSON.stringify(operations));
 }
});

test('la carga de prueba se reanuda por lotes, preserva campos ajenos y deja nuevos ocultos',()=>{
 const {context,sheets,products}=setup();
 const old=products().find(p=>p.sourceId==='2115088426');
 let count=0;
 while(context.previsualizarCotillon27Copia().altas+context.previsualizarCotillon27Copia().actualizaciones){
  assert.ok(context.probarLoteCotillon27Copia().procesados<=15);
  if(++count>20)throw Error('La carga no converge.');
 }
 assert.equal(products().length,1313);
 const updated=products().find(p=>p.sourceId==='2115088426');
 assert.equal(updated.stock,2);
 for(const field of ['id','name','description','categoryId','categoryIds','image','thumbnail','active','sourceImage'])assert.deepEqual(updated[field],old[field],field);
 const added=products().filter(p=>p.importBatch==='cotillon-incremental-2026-10-27');
 assert.equal(added.length,107);
 assert.ok(added.every(p=>p.active===false&&p.image===''&&p.thumbnail===''&&p.stock>0));
 const inactiveRestocked=products().filter(p=>['2115451969','2115451970','2115451972','2115451973','2115451975','2115451976','2115451977','2115451978','2115451979','2115451981','2115451983','2115451984','2115451986','2115451987'].includes(p.sourceId));
 assert.equal(inactiveRestocked.length,14);
 assert.ok(inactiveRestocked.every(p=>p.active===false&&p.stock>0));
 assert.ok(sheets.has('cotillon_respaldo_20261027_test'));
 assert.equal(sheets.get('cotillon_respaldo_20261027_test').rows.length,1207);
 assert.equal(context.probarLoteCotillon27Copia().procesados,0);
});

test('una edición manual del precio o stock se conserva, aun si la otra columna se actualiza',()=>{
 const {context,products,sheets}=setup();
 const row=sheets.get('cotillon').rows.find(r=>r[0]==='excel-2115053617');
 const changed=JSON.parse(row[1]);changed.price=12345;changed.categoryId='categoria-editada-manualmente';row[1]=JSON.stringify(changed);
 const preview=context.previsualizarCotillon27Copia();
 assert.equal(preview.camposManualesOmitidos,1);
 while(context.previsualizarCotillon27Copia().altas+context.previsualizarCotillon27Copia().actualizaciones)context.probarLoteCotillon27Copia();
 const current=products().find(p=>p.sourceId==='2115053617');
 assert.equal(current.price,12345);
 assert.equal(current.stock,8);
 assert.equal(current.categoryId,'categoria-editada-manualmente');
});

test('un conflicto de identidad bloquea el lote completo antes de crear un respaldo',()=>{
 const {context,sheets}=setup();
 const newId=payload.find(p=>p.baselinePrice===null).sourceId;
 sheets.get('cotillon').rows.push([`excel-${newId}`,JSON.stringify({id:`excel-${newId}`,sourceId:'otro-id',area:'cotillon'})]);
 assert.ok(context.previsualizarCotillon27Copia().conflictos>0);
 assert.throws(()=>context.probarLoteCotillon27Copia(),/conflictos de identidad/);
 assert.ok(!sheets.has('cotillon_respaldo_20261027_test'));
});

test('en producción simulada nunca escribe un alta sin foto y permite reintentarla',()=>{
 const {context,settings,products}=setup();
 const existingBefore=products().filter(p=>p.importBatch!=='cotillon-incremental-2026-10-27').map(p=>[p.id,p.image,p.thumbnail,p.active]);
 settings.SPREADSHEET_ID=settings.COTILLON_INC_20261027_TEST_ID;
 settings.COTILLON_INC_20261027_APPROVED=crypto.createHash('sha256').update(raw).digest('hex');
 settings.CLOUDINARY_CLOUD_NAME='test';settings.CLOUDINARY_API_KEY='test';settings.CLOUDINARY_API_SECRET='test';
 const failing=payload.find(p=>p.baselinePrice===null).sourceId;
 context.subirFotoCotillon_=(url,id)=>{
  assert.ok(url.startsWith('https://'));
  if(id.endsWith(failing))throw Error('foto inaccesible');
  return {image:`https://res.cloudinary.com/test/image/upload/${id}.jpg`,thumbnail:`https://res.cloudinary.com/test/image/upload/w_160/${id}.jpg`};
 };
 for(let i=0;i<20;i++){
  const pending=context.previsualizarCotillon27Produccion();
  if(pending.altas+pending.actualizaciones===0)break;
  context.aplicarLoteCotillon27Produccion();
 }
 const added=products().filter(p=>p.importBatch==='cotillon-incremental-2026-10-27');
 assert.equal(added.filter(p=>p.active&&p.image&&p.thumbnail).length,106);
 assert.equal(added.filter(p=>p.sourceId===failing).length,0);
 assert.equal(context.previsualizarCotillon27Produccion().fotosFallidas,1);
 assert.equal(context.reintentarFotosCotillon27Produccion().reintentosHabilitados,1);
 context.subirFotoCotillon_=(url,id)=>({image:`https://res.cloudinary.com/test/image/upload/${id}.jpg`,thumbnail:`https://res.cloudinary.com/test/image/upload/w_160/${id}.jpg`});
 assert.equal(context.aplicarLoteCotillon27Produccion().procesados,1);
 assert.equal(products().filter(p=>p.importBatch==='cotillon-incremental-2026-10-27'&&p.active).length,107);
 const after=products().filter(p=>p.importBatch!=='cotillon-incremental-2026-10-27').map(p=>[p.id,p.image,p.thumbnail,p.active]);
 assert.deepEqual(after,existingBefore);
});

test('la función de producción exige aprobación explícita',()=>{
 const {context,sheets}=setup();
 const before=JSON.stringify(sheets.get('cotillon').rows);
 assert.throws(()=>context.aplicarLoteCotillon27Produccion(),/Falta aprobación/);
 assert.equal(JSON.stringify(sheets.get('cotillon').rows),before);
});
