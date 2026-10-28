import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';

export const raw=fs.readFileSync('backend/import-cotillon-seis-rappi-2026-10-28.json','utf8');
export const source=JSON.parse(raw).products;
export const sha=crypto.createHash('sha256').update(raw).digest('hex');
export const categories=[
 {id:'fiestas',area:'cotillon',group:'COTILLÓN',name:'Fiestas',storefront:true},
 {id:'cumple',area:'cotillon',group:'COTILLÓN',name:'Cumpleaños infantil',storefront:true},
 {id:'deco',area:'cotillon',group:'COTILLÓN',parentId:'cumple',name:'Decoración',storefront:true},
 {id:'pinatas',area:'cotillon',group:'COTILLÓN',parentId:'cumple',name:'Bolsas y piñatas',storefront:true},
 {id:'tutus',area:'cotillon',group:'COTILLÓN',parentId:'fiestas',name:'Alas y tutús',storefront:true},
 {id:'cintas',area:'cotillon',group:'DESCARTABLES',name:'Hilos y cintas',storefront:true}
];
export const unrelated={id:'manual-1',sourceId:'2115000000',area:'cotillon',name:'Producto manual',price:1234,stock:7,active:true,description:'Conservar',custom:{note:'Manual'}};
export const rowsOf=products=>[['id','registro_json'],...products.map(p=>[p.id,JSON.stringify(p)])];

export function setup(options={}){
 const settings={SPREADSHEET_ID:'production-dummy-000000000000000',COTILLON_SIX_20261028_TEST_ID:'test-copy-dummy-000000000000000',CLOUDINARY_CLOUD_NAME:'dummy',CLOUDINARY_API_KEY:'dummy',CLOUDINARY_API_SECRET:'dummy'};
 const sheets=new Map(),events=[],state={photoChanged:false,cloudError:false,thumbnail404:false,payloadChanged:false};
 Object.assign(state,options);
 class Sheet{
  constructor(name,rows){this.name=name;this.rows=structuredClone(rows)}
  getLastRow(){return this.rows.length}
  getRange(row,col,height,width){return {
   getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>this.rows[row-1+i]?.[col-1+j]??'')),
   setValues:values=>{events.push('write');assert.equal(values.length,height);values.forEach((cells,i)=>{assert.equal(cells.length,width);this.rows[row-1+i]??=[];cells.forEach((v,j)=>this.rows[row-1+i][col-1+j]=v)});}
  }}
  copyTo(){events.push('backup');const copied=new Sheet('Copy of '+this.name,this.rows);assert.ok(!sheets.has(copied.name));sheets.set(copied.name,copied);return copied}
  setName(name){assert.ok(!sheets.has(name));sheets.delete(this.name);this.name=name;sheets.set(name,this);return this}
 }
 sheets.set('cotillon',new Sheet('cotillon',options.rows||rowsOf([unrelated])));
 sheets.set('categorias_cotillon',new Sheet('categorias_cotillon',options.categories||rowsOf(categories)));
 const ss={getSheetByName:name=>sheets.get(name)||null};
 const calls=[];
 const context=vm.createContext({console:{log(){}},Date,JSON,Set,Map,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]||'',setProperty:(key,value)=>settings[key]=value})},
  Utilities:{Charset:{UTF_8:'UTF-8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_algo,value)=>[...crypto.createHash('sha256').update(Array.isArray(value)?Buffer.from(value):value).digest()]},
  SpreadsheetApp:{openById:id=>{assert.equal(id,options.production?settings.SPREADSHEET_ID:settings.COTILLON_SIX_20261028_TEST_ID);return ss},flush(){}},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
  UrlFetchApp:{fetch:url=>{
   calls.push(url);
   if(url.endsWith('import-cotillon-seis-rappi-2026-10-28.json'))return {getResponseCode:()=>200,getContentText:()=>raw+(state.payloadChanged?' ':'')};
   const match=url.match(/cotillon-seis-2026-10-28\/(\d{10})\.jpg$/);
   if(match)return {getResponseCode:()=>200,getAllHeaders:()=>({'Content-Type':'image/jpeg'}),getContent:()=>[...(state.photoChanged?Buffer.from('changed photo'):fs.readFileSync('backend/import-images/cotillon-seis-2026-10-28/'+match[1]+'.jpg'))]};
   if(url.startsWith('https://res.cloudinary.com/'))return {getResponseCode:()=>state.thumbnail404&&url.includes('/thumb/')?404:200,getAllHeaders:()=>({'Content-Type':'image/jpeg'})};
   throw Error('Unexpected external request: '+url);
  }}
 });
 for(const filename of ['Code.gs','CotillonIncremental20261027.gs','CotillonSeisRappi20261028.gs'])vm.runInContext(fs.readFileSync('backend/'+filename,'utf8'),context,{filename});
 context.subirFotoCotillon_=(_url,id)=>{calls.push('cloud-upload:'+id);if(state.cloudError)throw Error('simulated upload failure');return {image:'https://res.cloudinary.com/test/image/'+id+'.jpg',thumbnail:'https://res.cloudinary.com/test/thumb/'+id+'.jpg'}};
 return {context,settings,sheets,events,state,calls,products:()=>sheets.get('cotillon').rows.slice(1).map(r=>JSON.parse(r[1]))};
}
