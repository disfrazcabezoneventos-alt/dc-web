/* Importación incremental de Cotillón, separada de Code.gs y de otras migraciones.
 * NO ejecutar en producción hasta aprobar el plan y configurar la propiedad
 * COTILLON_INC_20261027_APPROVED con el SHA-256 indicado en la guía.
 * Requiere las funciones existentes de Code.gs en el mismo proyecto Apps Script.
 */
const COTILLON_INC_20261027_URL='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-cotillon-incremental-2026-10-27.json';
const COTILLON_INC_20261027_SHA256='9ed07dcfce353e0b4efdcd05458028a426de0fcf83c8c01637007cf432367c49';
const COTILLON_INC_20261027_BATCH='cotillon-incremental-2026-10-27';

function cotillonInc27Source_(){
 const response=UrlFetchApp.fetch(COTILLON_INC_20261027_URL,{muteHttpExceptions:true,followRedirects:true});
 need_(response.getResponseCode()===200,'No se pudo obtener la importación desde GitHub. No se modificó la hoja.');
 const raw=response.getContentText('UTF-8');
 need_(hash_(raw)===COTILLON_INC_20261027_SHA256,'Cambió el archivo de importación. No se modificó la hoja.');
 const source=JSON.parse(raw);
 need_(source.version===1&&source.batch===COTILLON_INC_20261027_BATCH&&Array.isArray(source.products)&&source.products.length===661,'El archivo no contiene los 661 productos revisados.');
 const ids=new Set();let existing=0,created=0;
 source.products.forEach(p=>{
  need_(typeof p.sourceId==='string'&&/^\d{10}$/.test(p.sourceId)&&!ids.has(p.sourceId),'ID de Rappi inválido o repetido.');ids.add(p.sourceId);
  need_(typeof p.name==='string'&&p.name.trim()===p.name&&p.name.length>0&&p.name.length<=150,'Nombre inválido.');
  need_(typeof p.description==='string'&&p.description.length<=2000,'Descripción inválida.');
  need_(typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0&&p.price<=100000000&&Number.isInteger(p.stock)&&p.stock>0&&p.stock<=100000,'Precio o stock inválido.');
  const approvedLocal='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-images/cotillon-2026-10-27/sorbetes-halloween__2115454079.jpg';
  const hosted=/^https:\/\/(?:images\.rappi\.com\.ar\/products\/|cotilloncasaalberto\.com\.ar\/pedido\/imagen\/producto\/grande\/)[^\s]+$/.test(p.photoUrl);
  need_(typeof p.photoUrl==='string'&&(hosted||p.sourceId==='2115454079'&&p.photoUrl===approvedLocal)&&typeof p.photoFile==='string'&&p.photoFile.length>0,'Foto de origen inválida.');
  const group=Object.keys(COTILLON_GROUPS).find(g=>categoryKey_(g)===categoryKey_(p.group));
  need_(group&&COTILLON_GROUPS[group].includes(p.section),'Categoría principal o subcategoría no admitida.');
  need_(!p.inner||group==='COTILLÓN'&&Array.isArray(COTILLON_INNER[p.section])&&COTILLON_INNER[p.section].includes(p.inner),'Subcategoría interna no admitida.');
  if(p.baselinePrice===null&&p.baselineStock===null){created++;}
  else{need_(typeof p.baselinePrice==='number'&&Number.isInteger(p.baselineStock)&&p.baselineStock>=0,'Referencia original incompleta.');existing++;}
 });
 need_(created===107&&existing===554,'La distribución de altas y existentes cambió.');
 return source.products;
}

function cotillonInc27Sheet_(spreadsheetId,name){
 need_(typeof spreadsheetId==='string'&&spreadsheetId.length>20,'Falta el ID de la copia de prueba.');
 const sheet=SpreadsheetApp.openById(spreadsheetId).getSheetByName(name);
 need_(sheet,'Falta la pestaña '+name+' en la copia de prueba.');return sheet;
}
function cotillonInc27Rows_(sheet){
 return sheet.getLastRow()<2?[]:sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues().map((row,index)=>{
  need_(typeof row[1]==='string'&&row[1].length>0,'Fila vacía o ilegible: '+(index+2));
  const product=JSON.parse(row[1]);need_(product.id===row[0],'ID inconsistente en fila '+(index+2));
  return {row:index+2,product};
 });
}
function cotillonInc27Failed_(){
 const raw=config_('COTILLON_INC_20261027_FAILED_IDS');
 if(!raw)return [];
 const ids=JSON.parse(raw);need_(Array.isArray(ids)&&ids.every(id=>typeof id==='string'&&/^\d{10}$/.test(id)),'La lista de fotos fallidas está dañada.');return ids;
}
function cotillonInc27Plan_(spreadsheetId,source,failedIds=[]){
 const sheet=cotillonInc27Sheet_(spreadsheetId,'cotillon');
 const categories=cotillonInc27Rows_(cotillonInc27Sheet_(spreadsheetId,'categorias_cotillon')).map(item=>item.product);
 const current=cotillonInc27Rows_(sheet),byId=new Map(),bySourceId=new Map();
 current.forEach(item=>{
  need_(!byId.has(item.product.id),'Hay IDs duplicados en Cotillón. No se modificó la hoja.');byId.set(item.product.id,item);
  if(item.product.sourceId){need_(!bySourceId.has(item.product.sourceId),'Hay IDs de Rappi duplicados en Cotillón. No se modificó la hoja.');bySourceId.set(item.product.sourceId,item);}
 });
 const operations=[],failed=new Set(failedIds),summary={fuente:source.length,altas:0,actualizaciones:0,sinCambios:0,camposManualesOmitidos:0,conflictos:0,pendientesDeFoto:0,fotosFallidas:0};
 source.forEach(p=>{
  const id='excel-'+p.sourceId,existing=byId.get(id),sourceMatch=bySourceId.get(p.sourceId);
  if((existing&&existing.product.sourceId!==p.sourceId)||(sourceMatch&&sourceMatch.product.id!==id)){
   summary.conflictos++;return;
  }
  if(p.baselinePrice===null){
   if(existing){
    if(existing.product.importBatch!==COTILLON_INC_20261027_BATCH){summary.conflictos++;return;}
    summary.sinCambios++;if(!existing.product.image||!existing.product.thumbnail)summary.pendientesDeFoto++;return;
   }
   if(failed.has(p.sourceId)){summary.fotosFallidas++;return;}
   const section=categories.find(c=>c.group===p.group&&!c.parentId&&c.name===p.section&&c.storefront!==false);
   const inner=p.inner?categories.find(c=>section&&c.parentId===section.id&&c.name===p.inner&&c.storefront!==false):null;
   if(!section||(p.inner&&!inner)){summary.conflictos++;return;}
   const category=inner||section;
   const product={id,area:'cotillon',name:p.name,description:p.description,categoryId:category.id,categoryIds:inner?[inner.id,section.id]:[section.id],category:categoryPath_(category,categories),catalogGroups:[p.group],mode:'venta',price:p.price,priceKnown:true,rentPrice:0,stock:p.stock,stockUnknown:false,image:'',thumbnail:'',active:false,sourceId:p.sourceId,sourceImage:p.photoUrl,sku:p.sku,importBatch:COTILLON_INC_20261027_BATCH};
   need_(JSON.stringify(product).length<48000,'Registro demasiado largo: '+p.sourceId);
   operations.push({kind:'new',row:sheet.getLastRow()+1+summary.altas,product});summary.altas++;summary.pendientesDeFoto++;return;
  }
  if(!existing){summary.conflictos++;return;}
  const currentProduct=existing.product,patch={};let manual=0;
  if(currentProduct.price!==p.price){if(currentProduct.price===p.baselinePrice)patch.price=p.price;else manual++;}
  if(currentProduct.stock!==p.stock){if(currentProduct.stock===p.baselineStock)patch.stock=p.stock;else manual++;}
  summary.camposManualesOmitidos+=manual;
  if(Object.keys(patch).length){operations.push({kind:'update',row:existing.row,product:{...currentProduct,...patch}});summary.actualizaciones++;}
  else summary.sinCambios++;
 });
 return {sheet,operations,summary};
}
function cotillonInc27Preview_(spreadsheetId,production){
 const plan=cotillonInc27Plan_(spreadsheetId,cotillonInc27Source_(),production?cotillonInc27Failed_():[]);
 console.log(JSON.stringify(plan.summary));return plan.summary;
}
function previsualizarCotillon27Copia(){return cotillonInc27Preview_(config_('COTILLON_INC_20261027_TEST_ID'),false);}
function previsualizarCotillon27Produccion(){return cotillonInc27Preview_(config_('SPREADSHEET_ID'),true);}

function cotillonInc27Approved_(){
 need_(config_('COTILLON_INC_20261027_APPROVED')===COTILLON_INC_20261027_SHA256,'Falta aprobación de esta importación. No se modificó producción.');
}
function cotillonInc27Backup_(spreadsheetId,mode){
 const property='COTILLON_INC_20261027_BACKUP_'+mode.toUpperCase(),saved=config_(property);
 const ss=SpreadsheetApp.openById(spreadsheetId);
 if(saved){need_(ss.getSheetByName(saved),'Falta el respaldo '+saved+'. No se escribió ningún producto.');return saved;}
 const original=cotillonInc27Sheet_(spreadsheetId,'cotillon');
 const name='cotillon_respaldo_20261027_'+mode;
 need_(!ss.getSheetByName(name),'Existe un respaldo sin registrar. Revisalo antes de continuar.');
 original.copyTo(ss).setName(name);
 SpreadsheetApp.flush();props_().setProperty(property,name);return name;
}
function cotillonInc27Apply_(spreadsheetId,mode){return lock_(()=>{
 if(mode==='production'){
  cotillonInc27Approved_();need_(spreadsheetId===config_('SPREADSHEET_ID'),'La hoja de producción cambió.');
 }else need_(mode==='test'&&spreadsheetId!==config_('SPREADSHEET_ID'),'La copia de prueba apunta a producción.');
 const source=cotillonInc27Source_(),failed=mode==='production'?cotillonInc27Failed_():[],plan=cotillonInc27Plan_(spreadsheetId,source,failed);
 need_(plan.summary.conflictos===0,'Hay conflictos de identidad o categorías. No se escribió ningún producto.');
 if(!plan.operations.length)return {...plan.summary,procesados:0};
 if(mode==='production'&&plan.operations.some(item=>item.kind==='new'))need_(config_('CLOUDINARY_CLOUD_NAME')&&config_('CLOUDINARY_API_KEY')&&config_('CLOUDINARY_API_SECRET'),'Falta configurar Cloudinary. No se modificó la hoja.');
 const backup=cotillonInc27Backup_(spreadsheetId,mode),chosen=plan.operations.slice(0,15);
 const failedSet=new Set(failed);let processed=0,photoFailures=0;
 chosen.forEach(item=>{
  let product=item.product;
  if(mode==='production'&&item.kind==='new'){
   try{
    if(product.sourceId==='2115454079'){
     const photo=UrlFetchApp.fetch(product.sourceImage,{muteHttpExceptions:true,followRedirects:true});
     need_(photo.getResponseCode()===200&&hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,photo.getContent()))==='3ad62bbad1660350471754f1603c2bca07050823aedd7fce4c92dd5381a1b786','La foto local de Sorbetes Halloween cambió o no está disponible.');
    }
    product={...product,...subirFotoCotillon_(product.sourceImage,'incremental-20261027-'+product.sourceId),active:true};
   }
   catch(error){failedSet.add(product.sourceId);photoFailures++;return;}
  }
  const row=item.kind==='new'?plan.sheet.getLastRow()+1:item.row;
  plan.sheet.getRange(row,1,1,2).setValues([[product.id,JSON.stringify(product)]]);processed++;
 });
 SpreadsheetApp.flush();
 if(mode==='production'&&photoFailures)props_().setProperty('COTILLON_INC_20261027_FAILED_IDS',JSON.stringify([...failedSet]));
 const result={...plan.summary,procesados:processed,fotosFallidasEnEsteLote:photoFailures,respaldo:backup};console.log(JSON.stringify(result));return result;
});}
function probarLoteCotillon27Copia(){return cotillonInc27Apply_(config_('COTILLON_INC_20261027_TEST_ID'),'test');}
function aplicarLoteCotillon27Produccion(){return cotillonInc27Apply_(config_('SPREADSHEET_ID'),'production');}

function reintentarFotosCotillon27Produccion(){return lock_(()=>{
 cotillonInc27Approved_();
 const ids=cotillonInc27Failed_();
 props_().deleteProperty('COTILLON_INC_20261027_FAILED_IDS');
 const result={reintentosHabilitados:ids.length};console.log(JSON.stringify(result));return result;
});}
