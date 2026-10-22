import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const source=fs.readFileSync('backend/Code.gs','utf8');
const snapshot=fs.readFileSync('backend/import-cotillon-excel-2026.json','utf8');
const imported=JSON.parse(snapshot).products;

function setup({tampered=false,failPhoto=false,failSwap=false}={}){
 const settings={SPREADSHEET_ID:'private-sheet',COTILLON_STRUCTURE_V1:'ready',COTILLON_DEPTH3_V1:'ready',CLOUDINARY_CLOUD_NAME:'cloud',CLOUDINARY_API_KEY:'key',CLOUDINARY_API_SECRET:'secret'};
 const triggers=[];
 const categories=[];
 const groups={
  'COTILLÓN':['Fiestas','Cumpleaños infantil'],
  'REPOSTERÍA':['Golosinas','Comestibles','Accesorios'],
  'FECHAS ESPECIALES':['Navidad','Halloween','Pascua','San Valentín','Patrios','Baby Shower y revelación de género','Bautismo, comunión, 1 año','Egresados, UPD y recibidas','Primavera','Mundial','Despedida de soltera','Otros...'],
  'DESCARTABLES':['Bandejas','Cubiertos','Servilletas','Platos','Vasos / Copas / Jarras','Cajas','Sobres / Bolsas','Sorbetes','Hilos y cintas']
 };
 for(const [group,names] of Object.entries(groups))for(const name of names)categories.push({id:`${group}:${name}`,area:'cotillon',name,group,storefront:true});
 for(const [parentName,names] of Object.entries({'Fiestas':['Carnaval carioca','Anteojos','Máscaras y antifaces','Accesorios para lanzar','Pelucas y barbas','Maquillaje pinta pelo','Sombreros cascos','Vinchas y coronas','Armas bastones escudos','Accesorios','Alas y tutús','Guantes y medias','Capas','Corbatas moños cinturones y tiradores'],'Cumpleaños infantil':['Personajes','Adorno para torta','Decoración','Bolsas y piñatas']}))for(const name of names)categories.push({id:`inner:${parentName}:${name}`,area:'cotillon',name,group:'COTILLÓN',parentId:`COTILLÓN:${parentName}`,storefront:true});
 const sheets=new Map();
 class Sheet{
  constructor(name,rows=[]){this.name=name;this.rows=rows;}
  getLastRow(){return this.rows.length;}
  setFrozenRows(){}
  clearContents(){this.rows=[];return this;}
  getRange(start,column,height,width){return {
   getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>this.rows[start-1+i]?.[column-1+j]??'')),
   setValues:values=>{assert.equal(values.length,height);values.forEach((row,i)=>{assert.equal(row.length,width);const index=start-1+i;this.rows[index]??=[];row.forEach((value,j)=>this.rows[index][column-1+j]=value)});return this}
  };}
  setName(name){if(failSwap&&this.name==='_cotillon_preparado_excel_2026'&&name==='cotillon')throw Error('swap failed');assert.ok(!sheets.has(name));sheets.delete(this.name);this.name=name;sheets.set(name,this);return this;}
 }
 const initial=[{id:'legacy-old-1',name:'Viejo producto',area:'cotillon',active:true},{id:'legacy-old-2',name:'Otro producto',area:'cotillon',active:true}];
 sheets.set('cotillon',new Sheet('cotillon',[['id','registro_json'],...initial.map(p=>[p.id,JSON.stringify(p)])]));
 sheets.set('categorias_cotillon',new Sheet('categorias_cotillon',[['id','registro_json'],...categories.map(c=>[c.id,JSON.stringify(c)])]));
 sheets.set('movimientos',new Sheet('movimientos',[['id','registro_json']]));
 const spreadsheet={getSheetByName:name=>sheets.get(name)||null,insertSheet:name=>{assert.ok(!sheets.has(name));const sheet=new Sheet(name);sheets.set(name,sheet);return sheet}};
 const context=vm.createContext({console:{log(){}},Date,JSON,Set,Map,PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]||'',setProperty:(key,value)=>settings[key]=value,setProperties:values=>Object.assign(settings,values)})},Utilities:{Charset:{UTF_8:'UTF-8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_algorithm,text)=>[...crypto.createHash('sha256').update(text,'utf8').digest()],getUuid:()=>crypto.randomUUID(),formatDate:()=> '20261022_120000'},UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>tampered?snapshot+' ':snapshot})},SpreadsheetApp:{openById:id=>{assert.equal(id,'private-sheet');return spreadsheet},flush(){}},ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:name=>({timeBased:()=>({everyMinutes:minutes=>({create:()=>{assert.equal(minutes,5);const trigger={getHandlerFunction:()=>name};triggers.push(trigger);return trigger}})})}),deleteTrigger:trigger=>{triggers.splice(triggers.indexOf(trigger),1)}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}});
 vm.runInContext(source,context);
 let failedOnce=false;
 context.subirFotoCotillon_=(url,id)=>{if(failPhoto&&!failedOnce){failedOnce=true;throw Error('temporary Cloudinary error')}return {image:`https://res.cloudinary.com/demo/image/upload/${id}.jpg`,thumbnail:`https://res.cloudinary.com/demo/image/upload/c_limit,h_160,w_160/${id}.jpg`}};
 const products=()=>sheets.get('cotillon').rows.slice(1).map(row=>JSON.parse(row[1]));
 return {context,settings,triggers,sheets,products,initial};
}

test('el archivo sólo incluye los 790 visibles y las dos decisiones de clasificación',()=>{
 assert.equal(imported.length,790);
 assert.equal(new Set(imported.map(p=>p.sourceId)).size,790);
 assert.ok(imported.every(p=>p.stock>0&&p.price>0&&p.sourceImage.startsWith('https://images.rappi.com.ar/products/')));
 assert.deepEqual(imported.filter(p=>!p.section).map(p=>p.name),['Mantel Friselina Colores Varios Rectangular']);
 const cortante=imported.find(p=>p.excelRow===398);
 assert.equal(cortante.group,'REPOSTERÍA');assert.equal(cortante.section,'Accesorios');assert.equal(cortante.photoReview,true);
 const mantel=imported.find(p=>p.excelRow===723);
 assert.equal(mantel.group,'DESCARTABLES');assert.equal(mantel.section,'');
});

test('checksum inválido impide tocar el catálogo viejo',()=>{
 const {context,sheets,settings}=setup({tampered:true});
 assert.throws(()=>context.iniciarImportacionCotillonExcel2026(),/catálogo publicado cambió/);
 assert.equal(sheets.get('cotillon').getLastRow(),3);
 assert.equal(sheets.size,3);
 assert.equal(settings.COTILLON_EXCEL_2026_STATE,undefined);
});

test('la importación archiva la pestaña anterior, asigna categorías y se puede reanudar',()=>{
 const {context,settings,sheets,products,initial,triggers}=setup();
 const result=context.iniciarImportacionCotillonExcel2026();
 assert.equal(result.importados,790);
 assert.equal(result.anterioresArchivados,2);
 assert.ok(sheets.has(result.pestañaRespaldo));
 assert.deepEqual(sheets.get(result.pestañaRespaldo).rows.slice(1).map(r=>JSON.parse(r[1])),initial);
 assert.equal(products().length,790);
 assert.ok(products().every(p=>p.active===false&&p.price>0&&p.stock>0));
 assert.equal(products().find(p=>p.name==='Cortante Momia').category,'REPOSTERÍA › Accesorios');
 assert.equal(products().find(p=>p.name==='Cortante Momia').sourceImage,'');
 assert.deepEqual(JSON.parse(JSON.stringify(products().find(p=>p.excelRow===723).catalogGroups)),['DESCARTABLES']);
 assert.equal(context.iniciarImportacionCotillonExcel2026().productosNuevos,790);
 settings.COTILLON_EXCEL_2026_STATE='preparando';
 assert.equal(context.iniciarImportacionCotillonExcel2026().productosNuevos,790);
 assert.equal(settings.COTILLON_EXCEL_2026_STATE,'photos');
 assert.equal([...sheets.keys()].filter(k=>k.startsWith('cotillon_archivo_')).length,1);
 assert.equal(triggers.length,1);
 for(let i=0;i<79;i++)context.procesarFotosCotillonExcel2026();
 assert.equal(settings.COTILLON_EXCEL_2026_STATE,'ready');
 assert.equal(triggers.length,0);
 assert.equal(products().filter(p=>p.active).length,790);
 assert.equal(products().filter(p=>p.image).length,789);
 assert.equal(context.estadoImportacionCotillonExcel2026().sinFotoEnRevision,1);
});

test('una foto fallida detiene publicación y permite retomar sin duplicar productos',()=>{
 const {context,settings,products}=setup({failPhoto:true});
 context.iniciarImportacionCotillonExcel2026();
 for(let i=0;i<79;i++)context.procesarFotosCotillonExcel2026();
 assert.equal(settings.COTILLON_EXCEL_2026_STATE,'photo_errors');
 assert.equal(products().filter(p=>p.active).length,0);
 assert.equal(context.estadoImportacionCotillonExcel2026().fallidas,1);
 assert.equal(context.reintentarFotosCotillonExcel2026().reintentosHabilitados,1);
 context.procesarFotosCotillonExcel2026();
 assert.equal(settings.COTILLON_EXCEL_2026_STATE,'ready');
 assert.equal(products().filter(p=>p.active).length,790);
});

test('un fallo al intercambiar las pestañas recupera cotillon anterior',()=>{
 const {context,sheets,settings}=setup({failSwap:true});
 assert.throws(()=>context.iniciarImportacionCotillonExcel2026(),/swap failed/);
 assert.equal(sheets.get('cotillon').getLastRow(),3);
 assert.equal(settings.COTILLON_EXCEL_2026_STATE,'preparando');
});
