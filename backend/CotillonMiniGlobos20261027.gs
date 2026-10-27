/* Segunda etapa de globos Mini. Archivo independiente de CotillonIncremental20261027.gs.
 * No ejecutar en producción sin aprobación de la carga y sin revisar una copia.
 * Requiere las funciones ya existentes en Code.gs del mismo proyecto.
 */
const MINI_GLOBOS_20261027_URL='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-mini-globos-2026-10-27.json';
const MINI_GLOBOS_20261027_SHA256='7b234fcc5c2b4499b46b3294c3d0708ff917dbdc4d96a7ed279b2857d5d24747';
const MINI_GLOBOS_20261027_BATCH='mini-globos-2026-10-27';

function miniGlobos27Source_(){
 const response=UrlFetchApp.fetch(MINI_GLOBOS_20261027_URL,{muteHttpExceptions:true,followRedirects:true});
 need_(response.getResponseCode()===200,'No se pudo obtener el lote de globos. No se modificó la hoja.');
 const raw=response.getContentText('UTF-8');
 need_(hash_(raw)===MINI_GLOBOS_20261027_SHA256,'Cambió el lote de globos. No se modificó la hoja.');
 const source=JSON.parse(raw),products=source.products;
 need_(source.version===1&&source.batch===MINI_GLOBOS_20261027_BATCH&&Array.isArray(products)&&products.length===24,'El lote no contiene exactamente 24 globos.');
 const ids=new Set(),photos=new Set();let unit=0,bag=0;
 products.forEach(p=>{
  need_(typeof p.miniCode==='string'&&/^\d{10,14}$/.test(p.miniCode)&&['unidad','x25'].includes(p.variant)&&p.sourceId==='mini-'+p.miniCode+'-'+p.variant&&!ids.has(p.sourceId),'Código Mini o presentación inválidos.');ids.add(p.sourceId);
  if(p.variant==='unidad')unit++;else bag++;
  need_(typeof p.name==='string'&&p.name.startsWith('GLOBO ')&&p.name.endsWith(p.variant==='x25'?'12P X 25':'12P')&&p.name.length<=150,'Nombre del globo inválido.');
  need_(typeof p.description==='string'&&p.description.length<=2000&&p.group==='COTILLÓN'&&p.section==='Cumpleaños infantil'&&p.inner==='Decoración','Categoría o descripción inválida.');
  need_(p.price===(p.variant==='x25'?5000:200)&&Number.isInteger(p.stock)&&p.stock>0&&p.stock<=100000,'Precio o stock inválido.');
  need_(typeof p.photoFile==='string'&&/^globo-[a-z0-9-]+__\d{10,14}\.jpg$/.test(p.photoFile)&&p.photoFile.endsWith('__'+p.miniCode+'.jpg'),'Nombre de foto inválido.');
  need_(p.photoUrl==='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-images/mini-globos-2026-10-27/'+p.photoFile&&/^[a-f0-9]{64}$/.test(p.photoSha256),'URL de foto inválida.');photos.add(p.photoFile);
 });
 need_(unit===12&&bag===12&&photos.size===12,'Faltan presentaciones o fotos.');return products;
}
function miniGlobos27Sheet_(spreadsheetId,name){
 need_(typeof spreadsheetId==='string'&&spreadsheetId.length>20,'Falta el ID de la copia.');
 const sheet=SpreadsheetApp.openById(spreadsheetId).getSheetByName(name);need_(sheet,'Falta la pestaña '+name);return sheet;
}
function miniGlobos27Rows_(sheet){
 return sheet.getLastRow()<2?[]:sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues().map((row,index)=>{
  need_(typeof row[1]==='string'&&row[1].length>0,'Fila ilegible: '+(index+2));
  const product=JSON.parse(row[1]);need_(product.id===row[0],'ID inconsistente en fila '+(index+2));return product;
 });
}
function miniGlobos27Failed_(){
 const raw=config_('MINI_GLOBOS_20261027_FAILED_IDS');if(!raw)return [];
 const ids=JSON.parse(raw);need_(Array.isArray(ids)&&ids.every(id=>typeof id==='string'&&/^mini-\d{10,14}-(unidad|x25)$/.test(id)),'Lista de fotos fallidas dañada.');return ids;
}
function miniGlobos27Plan_(spreadsheetId,source,failedIds=[],production=false){
 const sheet=miniGlobos27Sheet_(spreadsheetId,'cotillon');
 const current=miniGlobos27Rows_(sheet),categories=miniGlobos27Rows_(miniGlobos27Sheet_(spreadsheetId,'categorias_cotillon'));
 const byId=new Map(),bySourceId=new Map();let conflicts=0;
 current.forEach(p=>{
  need_(!byId.has(p.id),'Hay IDs duplicados. No se modificó la hoja.');byId.set(p.id,p);
  if(p.sourceId){need_(!bySourceId.has(p.sourceId),'Hay IDs de origen duplicados. No se modificó la hoja.');bySourceId.set(p.sourceId,p);}
 });
 const section=categories.find(c=>c.group==='COTILLÓN'&&!c.parentId&&c.name==='Cumpleaños infantil'&&c.storefront!==false);
 const inner=categories.find(c=>section&&c.parentId===section.id&&c.name==='Decoración'&&c.storefront!==false);
 need_(section&&inner,'Falta la categoría Cotillón > Cumpleaños infantil > Decoración.');
 const operations=[],failed=new Set(failedIds);let unchanged=0,photoFailures=0;
 source.forEach(p=>{
  const existing=byId.get(p.sourceId),sourceMatch=bySourceId.get(p.sourceId);
  if((existing&&existing.sourceId!==p.sourceId)||(sourceMatch&&sourceMatch.id!==p.sourceId)){conflicts++;return;}
  if(existing){if(existing.importBatch!==MINI_GLOBOS_20261027_BATCH||production&&(!existing.active||!existing.image||!existing.thumbnail)){conflicts++;return;}unchanged++;return;}
  if(failed.has(p.sourceId)){photoFailures++;return;}
  const product={id:p.sourceId,sourceId:p.sourceId,miniCode:p.miniCode,variant:p.variant,area:'cotillon',name:p.name,description:p.description,categoryId:inner.id,categoryIds:[inner.id,section.id],category:categoryPath_(inner,categories),catalogGroups:['COTILLÓN'],mode:'venta',price:p.price,priceKnown:true,rentPrice:0,stock:p.stock,stockUnknown:false,image:'',thumbnail:'',active:false,sourceImage:p.photoUrl,sku:p.miniCode,importBatch:MINI_GLOBOS_20261027_BATCH};
  need_(JSON.stringify(product).length<48000,'Registro demasiado largo: '+p.sourceId);
  operations.push(product);
 });
 return {sheet,operations,summary:{fuente:source.length,altas:operations.length,sinCambios:unchanged,conflictos:conflicts,fotosFallidas:photoFailures}};
}
function miniGlobos27Preview_(spreadsheetId,production){
 const plan=miniGlobos27Plan_(spreadsheetId,miniGlobos27Source_(),production?miniGlobos27Failed_():[],production);console.log(JSON.stringify(plan.summary));return plan.summary;
}
function previsualizarMiniGlobos27Copia(){return miniGlobos27Preview_(config_('MINI_GLOBOS_20261027_TEST_ID'),false);}
function previsualizarMiniGlobos27Produccion(){return miniGlobos27Preview_(config_('SPREADSHEET_ID'),true);}
function miniGlobos27Backup_(spreadsheetId,mode){
 const property='MINI_GLOBOS_20261027_BACKUP_'+mode.toUpperCase(),saved=config_(property),ss=SpreadsheetApp.openById(spreadsheetId);
 if(saved){need_(ss.getSheetByName(saved),'Falta el respaldo '+saved+'. No se escribió ningún producto.');return saved;}
 const name='cotillon_respaldo_mini_globos_20261027_'+mode;
 need_(!ss.getSheetByName(name),'Existe un respaldo sin registrar. Revisalo antes de continuar.');
 miniGlobos27Sheet_(spreadsheetId,'cotillon').copyTo(ss).setName(name);SpreadsheetApp.flush();props_().setProperty(property,name);return name;
}
function miniGlobos27Apply_(spreadsheetId,mode){return lock_(()=>{
 if(mode==='production'){
  need_(config_('MINI_GLOBOS_20261027_APPROVED')===MINI_GLOBOS_20261027_SHA256,'Falta aprobación de los globos. No se modificó producción.');
  need_(spreadsheetId===config_('SPREADSHEET_ID'),'La hoja de producción cambió.');
 }else need_(mode==='test'&&spreadsheetId!==config_('SPREADSHEET_ID'),'La copia de prueba apunta a producción.');
 const failed=mode==='production'?miniGlobos27Failed_():[],source=miniGlobos27Source_(),plan=miniGlobos27Plan_(spreadsheetId,source,failed,mode==='production');
 need_(plan.summary.conflictos===0,'Hay conflictos de identidad. No se escribió ningún producto.');
 if(!plan.operations.length)return {...plan.summary,procesados:0};
 if(mode==='production')need_(config_('CLOUDINARY_CLOUD_NAME')&&config_('CLOUDINARY_API_KEY')&&config_('CLOUDINARY_API_SECRET'),'Falta configurar Cloudinary. No se modificó la hoja.');
 const backup=miniGlobos27Backup_(spreadsheetId,mode),failedSet=new Set(failed),byId=new Map(source.map(p=>[p.sourceId,p]));let processed=0,photoFailures=0;
 plan.operations.slice(0,15).forEach(item=>{
  let product=item;
  if(mode==='production'){
   try{
    const reference=byId.get(product.sourceId),response=UrlFetchApp.fetch(product.sourceImage,{muteHttpExceptions:true,followRedirects:true});
    need_(response.getResponseCode()===200&&hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,response.getContent()))===reference.photoSha256,'La foto local cambió o no está disponible.');
    product={...product,...subirFotoCotillon_(product.sourceImage,'mini-globos-20261027-'+product.sourceId),active:true};
   }
   catch(error){failedSet.add(product.sourceId);photoFailures++;return;}
  }
  plan.sheet.getRange(plan.sheet.getLastRow()+1,1,1,2).setValues([[product.id,JSON.stringify(product)]]);processed++;
 });
 SpreadsheetApp.flush();
 if(mode==='production'&&photoFailures)props_().setProperty('MINI_GLOBOS_20261027_FAILED_IDS',JSON.stringify([...failedSet]));
 const result={...plan.summary,procesados:processed,fotosFallidasEnEsteLote:photoFailures,respaldo:backup};console.log(JSON.stringify(result));return result;
});}
function probarLoteMiniGlobos27Copia(){return miniGlobos27Apply_(config_('MINI_GLOBOS_20261027_TEST_ID'),'test');}
function aplicarLoteMiniGlobos27Produccion(){return miniGlobos27Apply_(config_('SPREADSHEET_ID'),'production');}
function reintentarFotosMiniGlobos27Produccion(){return lock_(()=>{
 need_(config_('MINI_GLOBOS_20261027_APPROVED')===MINI_GLOBOS_20261027_SHA256,'Falta aprobación.');
 const ids=miniGlobos27Failed_();props_().deleteProperty('MINI_GLOBOS_20261027_FAILED_IDS');return {reintentosHabilitados:ids.length};
});}
