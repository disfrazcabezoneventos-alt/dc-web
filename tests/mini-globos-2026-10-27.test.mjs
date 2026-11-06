import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';

const code=fs.readFileSync('backend/Code.gs','utf8');
const addon=fs.readFileSync('backend/CotillonMiniGlobos20261027.gs','utf8');
const raw=fs.readFileSync('backend/import-mini-globos-2026-10-27.json','utf8');
const payload=JSON.parse(raw).products;

function csvRows(input){
 const rows=[],row=[];let field='',quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'){if(quoted&&input[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(field);field='';}
  else if(c==='\n'&&!quoted){row.push(field);rows.push(row.splice(0));field='';}
  else if(c!=='\r'||quoted)field+=c;
 }
 if(field||row.length){row.push(field);rows.push(row);}
 return rows;
}
function setup(){
 const settings={SPREADSHEET_ID:'production-sheet-dummy-012345678901234',MINI_GLOBOS_20261027_TEST_ID:'copy-of-store-sheet-012345678901234'};
 const sheets=new Map();let writes=0;
 class Sheet{
  constructor(name,rows){this.name=name;this.rows=rows;}
  getLastRow(){return this.rows.length;}
  getRange(start,column,height,width){return {
   getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>this.rows[start-1+i]?.[column-1+j]??'')),
   setValues:values=>{assert.equal(values.length,height);values.forEach((row,i)=>{const at=start-1+i;this.rows[at]??=[];row.forEach((cell,j)=>this.rows[at][column-1+j]=cell);writes++;});}
  };}
  copyTo(){const copy=new Sheet(`Copy of ${this.name}`,structuredClone(this.rows));sheets.set(copy.name,copy);return copy;}
  setName(name){sheets.delete(this.name);this.name=name;sheets.set(name,this);return this;}
 }
 for(const name of ['cotillon','categorias_cotillon'])sheets.set(name,new Sheet(name,csvRows(fs.readFileSync(`tmp/import-2026-10-27/originales/${name}.csv`,'utf8'))));
 const spreadsheet={getSheetByName:name=>sheets.get(name)||null};
 const context=vm.createContext({console:{log(){}},Date,JSON,Map,Set,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]??'',setProperty:(key,value)=>settings[key]=value,deleteProperty:key=>delete settings[key]})},
  Utilities:{Charset:{UTF_8:'UTF-8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_algorithm,value)=>[...crypto.createHash('sha256').update(Array.isArray(value)?Buffer.from(value):value).digest()]},
  UrlFetchApp:{fetch:url=>url.endsWith('.jpg')?({getResponseCode:()=>200,getContent:()=>[...fs.readFileSync(`backend/import-images/mini-globos-2026-10-27/${url.split('/').at(-1)}`)]}):({getResponseCode:()=>200,getContentText:()=>raw})},
  SpreadsheetApp:{openById:id=>{assert.equal(id,settings.MINI_GLOBOS_20261027_TEST_ID);return spreadsheet;},flush(){}},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}
 });
 vm.runInContext(code,context,{filename:'Code.gs'});
 vm.runInContext(addon,context,{filename:'CotillonMiniGlobos20261027.gs'});
 const products=()=>sheets.get('cotillon').rows.slice(1).map(row=>JSON.parse(row[1]));
 return {context,settings,sheets,products,get writes(){return writes}};
}

test('24 fichas y 12 fotos locales, identidad Mini única y bytes conservados',()=>{
 assert.equal(payload.length,24);
 assert.equal(new Set(payload.map(p=>p.sourceId)).size,24);
 assert.equal(new Set(payload.map(p=>p.photoFile)).size,12);
 assert.equal(payload.filter(p=>p.variant==='unidad').length,12);
 assert.equal(payload.filter(p=>p.variant==='x25').length,12);
 for(const p of payload){
  const file=fs.readFileSync(`backend/import-images/mini-globos-2026-10-27/${p.photoFile}`);
  assert.equal(crypto.createHash('sha256').update(file).digest('hex'),p.photoSha256);
  assert.equal(p.price,p.variant==='x25'?5000:200);
 }
});

test('la vista previa no escribe y la copia prueba crea solo 24 fichas inactivas',()=>{
 const state=setup(),before=JSON.stringify(state.sheets.get('cotillon').rows);
 assert.equal(state.context.previsualizarMiniGlobos27Copia().altas,24);
 assert.equal(state.writes,0);
 assert.equal(JSON.stringify(state.sheets.get('cotillon').rows),before);
 assert.equal(state.context.probarLoteMiniGlobos27Copia().procesados,15);
 assert.equal(state.context.probarLoteMiniGlobos27Copia().procesados,9);
 assert.equal(state.context.probarLoteMiniGlobos27Copia().procesados,0);
 assert.equal(state.products().length,1230);
 assert.ok(state.products().slice(1206).every(p=>!p.active&&!p.image&&!p.thumbnail));
 assert.ok(state.sheets.has('cotillon_respaldo_mini_globos_20261027_test'));
});

test('producción exige aprobación y una foto fallida no crea ficha ni afecta existentes',()=>{
 const state=setup(),before=JSON.stringify(state.products());
 assert.throws(()=>state.context.aplicarLoteMiniGlobos27Produccion(),/Falta aprobación/);
 assert.equal(JSON.stringify(state.products()),before);
 state.settings.SPREADSHEET_ID=state.settings.MINI_GLOBOS_20261027_TEST_ID;
 state.settings.MINI_GLOBOS_20261027_APPROVED=crypto.createHash('sha256').update(raw).digest('hex');
 state.settings.CLOUDINARY_CLOUD_NAME='test';state.settings.CLOUDINARY_API_KEY='test';state.settings.CLOUDINARY_API_SECRET='test';
 const fail=payload[0].sourceId;
 state.context.subirFotoCotillon_=(url,id)=>{
  assert.ok(url.startsWith('https://raw.githubusercontent.com/'));
  if(id.endsWith(fail))throw Error('foto inaccesible');
  return {image:`https://res.cloudinary.com/test/image/upload/${id}.jpg`,thumbnail:`https://res.cloudinary.com/test/image/upload/w_160/${id}.jpg`};
 };
 for(let i=0;i<3;i++)state.context.aplicarLoteMiniGlobos27Produccion();
 assert.equal(state.products().length,1229);
 assert.equal(state.context.previsualizarMiniGlobos27Produccion().fotosFallidas,1);
 assert.equal(state.context.reintentarFotosMiniGlobos27Produccion().reintentosHabilitados,1);
 state.context.subirFotoCotillon_=(url,id)=>({image:`https://res.cloudinary.com/test/image/upload/${id}.jpg`,thumbnail:`https://res.cloudinary.com/test/image/upload/w_160/${id}.jpg`});
 assert.equal(state.context.aplicarLoteMiniGlobos27Produccion().procesados,1);
 assert.equal(state.products().length,1230);
 assert.equal(JSON.stringify(state.products().slice(0,1206)),before);
});

test('un ID Mini ocupado manualmente detiene todo antes del respaldo',()=>{
 const state=setup(),id=payload[0].sourceId;
 state.sheets.get('cotillon').rows.push([id,JSON.stringify({id,sourceId:id,area:'cotillon',name:'Registro manual'})]);
 assert.equal(state.context.previsualizarMiniGlobos27Copia().conflictos,1);
 assert.throws(()=>state.context.probarLoteMiniGlobos27Copia(),/conflictos de identidad/);
 assert.ok(!state.sheets.has('cotillon_respaldo_mini_globos_20261027_test'));
});
