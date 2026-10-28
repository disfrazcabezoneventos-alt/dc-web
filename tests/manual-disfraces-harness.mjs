import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

export const raw=fs.readFileSync('backend/limpieza-manuales-disfraces-2026-10-28.json','utf8');
export const source=JSON.parse(raw);
export const sha=crypto.createHash('sha256').update(raw).digest('hex');
export const fixture=JSON.parse(fs.readFileSync('tests/fixtures/manual-disfraces-20261028.json','utf8'));
const original=fs.readFileSync('backend/import-disfraces-2026-10-28.json','utf8');
const photo=fs.readFileSync('backend/manual-cleanup-assets/154-scream.jpg');
const header=['id','registro_json'];

export function setup(){
 const settings={SPREADSHEET_ID:'production',LM28_TEST_ID:'copy'};
 const books=new Map();let cloud=0,writes=0,backupFails=false,batchFails=false,corruptPhoto=false,afterBackup=()=>{};
 class Sheet{
  constructor(ss,name,values,id){Object.assign(this,{ss,name,values,id});}
  getLastRow(){return this.values.length;}
  getLastColumn(){return Math.max(...this.values.map(r=>r.length));}
  getSheetId(){return this.id;}
  getRange(row,col,height,width){return {getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>this.values[row+i-1]?.[col+j-1]??''))};}
  copyTo(ss){if(backupFails)throw Error('backup failed');const s=new Sheet(ss,'temporary',structuredClone(this.values),999);ss.sheets.set(s.name,s);return s;}
  setName(name){this.ss.sheets.delete(this.name);this.name=name;this.ss.sheets.set(name,this);afterBackup(this.ss);return this;}
 }
 for(const id of ['copy','production']){
  const ss={id,sheets:new Map(),getId(){return this.id;},getSheetByName(name){return this.sheets.get(name)||null;}};
  const untouched=['untouched',JSON.stringify({id:'untouched',name:'Otro producto',sourceId:'777',active:true,stock:9})];
  ss.sheets.set('disfraces',new Sheet(ss,'disfraces',[header,...structuredClone(fixture.manual),untouched],895672318));
  ss.sheets.set('categorias_disfraces',new Sheet(ss,'categorias_disfraces',structuredClone(fixture.categories),1160767326));
  ['reservas','movimientos','cancelaciones'].forEach((name,i)=>ss.sheets.set(name,new Sheet(ss,name,[header],i+10)));
  books.set(id,ss);
 }
 const digest=(algo,value)=>[...crypto.createHash(algo).update(Array.isArray(value)?Buffer.from(value):value).digest()];
 const context=vm.createContext({console:{log(){}},Map,Set,Date,JSON,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]||'',setProperty:(key,value)=>settings[key]=value})},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
  SpreadsheetApp:{openById:id=>{assert.ok(books.has(id));return books.get(id);},flush(){}},
  Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256',SHA_1:'sha1'},computeDigest:digest},
  UrlFetchApp:{fetch:url=>{
   if(url.includes('api.cloudinary.com')){cloud++;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({secure_url:'https://res.cloudinary.com/test/scream.jpg',eager:[{secure_url:'https://res.cloudinary.com/test/scream-thumb.jpg'}]})};}
   if(url.endsWith('.jpg'))return {getResponseCode:()=>200,getBlob:()=>({setName(name){this.name=name;return this;},getName(){return this.name;},getBytes:()=>[...(corruptPhoto?Buffer.from('bad'):photo)]})};
   return {getResponseCode:()=>200,getContentText:()=>url.endsWith('limpieza-manuales-disfraces-2026-10-28.json')?raw:original};
  }},
  Sheets:{Spreadsheets:{batchUpdate:({requests},id)=>{
   if(batchFails)throw Error('batch rejected');
   const sheet=books.get(id).getSheetByName('disfraces'),copy=structuredClone(sheet.values);
   for(const request of requests){
    if(request.appendCells){assert.equal(request.appendCells.sheetId,sheet.id);copy.push(...request.appendCells.rows.map(r=>r.values.map(c=>c.userEnteredValue.stringValue)));}
    else {const range=request.deleteDimension.range;assert.equal(range.sheetId,sheet.id);copy.splice(range.startIndex,range.endIndex-range.startIndex);}
   }
   sheet.values=copy;writes++;
  }}}
 });
 for(const name of ['Code.gs','DisfracesIncremental20261028.gs','LimpiezaManualesDisfraces20261028.gs'])vm.runInContext(fs.readFileSync('backend/'+name,'utf8'),context,{filename:name});
 const sheet=(id='copy',name='disfraces')=>books.get(id).getSheetByName(name);
 return {context,settings,books,sheet,products:(id='copy')=>sheet(id).values.slice(1).map(r=>JSON.parse(r[1])),
  calls:()=>({cloud,writes}),backupFail:()=>backupFails=true,batchFail:()=>batchFails=true,corruptPhoto:()=>corruptPhoto=true,
  onBackup:callback=>afterBackup=callback};
}
