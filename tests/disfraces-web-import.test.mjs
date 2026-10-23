import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const code=fs.readFileSync('backend/Code.gs','utf8');
const raw=fs.readFileSync('backend/import-disfraces-web-2026.json','utf8');
const entries=JSON.parse(raw).products;

function setup({tampered=false,manualConflict=false}={}){
 const settings={SPREADSHEET_ID:'sheet',PRIVATE_FOLDER_ID:'folder',ADMIN_USER:'admin',ADMIN_PASSWORD:'private',MAIL_MODE:'test',BUSINESS_EMAIL:'business@example.com',CLOUDINARY_CLOUD_NAME:'cloud',CLOUDINARY_API_KEY:'key',CLOUDINARY_API_SECRET:'secret'};
 const triggers=[];
 class Sheet{
  constructor(name){this.name=name;this.rows=[['id','registro_json']];}
  getLastRow(){return this.rows.length;}
  appendRow(row){this.rows.push(row);}
  setFrozenRows(){}
  getRange(start,col,height,width){return {getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>this.rows[start-1+i]?.[col-1+j]??'')),setValues:rows=>{assert.equal(rows.length,height);rows.forEach((row,i)=>{assert.equal(row.length,width);this.rows[start-1+i]??=[];row.forEach((value,j)=>this.rows[start-1+i][col-1+j]=value);});}};}
 }
 const sheets=new Map();for(const name of ['disfraces','categorias_disfraces'])sheets.set(name,new Sheet(name));
 const original={id:'manual-1',area:'disfraces',name:manualConflict?entries[0].name:'Otro disfraz',mode:'alquiler',rentPrice:5000,stock:2,active:true};
 sheets.get('disfraces').rows.push([original.id,JSON.stringify(original)]);
 const spreadsheet={getSheetByName:name=>sheets.get(name)||null,insertSheet:name=>{const s=new Sheet(name);s.rows=[];sheets.set(name,s);return s;}};
 const ctx=vm.createContext({console:{log(){}},Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]||'',setProperty:(key,value)=>settings[key]=value})},Utilities:{Charset:{UTF_8:'UTF-8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_algorithm,text)=>[...crypto.createHash('sha256').update(text,'utf8').digest()],getUuid:()=>crypto.randomUUID(),formatDate:()=> '20261023_010000'},UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>tampered?raw+' ':raw})},SpreadsheetApp:{openById:()=>spreadsheet,flush(){}},ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:name=>({timeBased:()=>({everyMinutes:()=>({create:()=>triggers.push({getHandlerFunction:()=>name})})})}),deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1)},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}});
 vm.runInContext(code,ctx);
 const products=()=>sheets.get('disfraces').rows.slice(1).map(row=>JSON.parse(row[1]));
 return {ctx,products,sheets,original,triggers};
}

test('respaldo contiene 447 fichas únicas y fuentes de la web anterior',()=>{
 assert.equal(entries.length,447);
 assert.equal(new Set(entries.map(p=>p.sourceId)).size,447);
 assert.equal(new Set(entries.map(p=>p.sourcePage)).size,447);
 assert.ok(entries.every(p=>p.sourceImage.startsWith('https://www.disfrazcabezon.com.ar/img/admin/disfraces/')));
});

test('checksum distinto impide importar cualquier ficha',()=>{
 const {ctx,products}=setup({tampered:true});
 assert.throws(()=>ctx.importarDisfracesWeb2026(),/respaldo de disfraces publicado cambió/);
 assert.equal(products().length,1);
});

test('importación es repetible, oculta y conserva fichas manuales',()=>{
 const {ctx,products,original,sheets}=setup({manualConflict:true});
 const first=ctx.importarDisfracesWeb2026();
 assert.equal(first.agregados,446);assert.equal(first.conflictos,1);
 assert.equal(products().length,447);
 assert.deepEqual(products()[0],original);
 assert.ok(products().slice(1).every(p=>p.active===false&&p.stock===0&&p.rentPrice===0&&p.mode==='alquiler'&&!p.image));
 assert.equal(sheets.get('categorias_disfraces').rows.length,10);
 const second=ctx.importarDisfracesWeb2026();
 assert.equal(second.agregados,0);assert.equal(second.conflictos,1);
 assert.equal(products().length,447);
});

test('subida de fotos trabaja en lotes sin publicar los disfraces',()=>{
 const {ctx,products,triggers}=setup();ctx.importarDisfracesWeb2026();
 ctx.subirFotoCotillon_=(url,id)=>({image:`https://res.cloudinary.com/demo/image/upload/${id}.jpg`,thumbnail:`https://res.cloudinary.com/demo/image/upload/c_limit,h_160,w_160/${id}.jpg`});
 const result=ctx.iniciarFotosDisfracesWeb2026();
 assert.equal(result.procesadas,8);assert.equal(result.pendientes,439);assert.equal(result.visibles,0);assert.equal(triggers.length,1);
 assert.equal(products().filter(p=>p.image).length,8);
 assert.equal(ctx.importarDisfracesWeb2026().agregados,0);
});
