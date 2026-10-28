/* Lote independiente de seis altas. Requiere Code.gs y CotillonIncremental20261027.gs.
 * No ejecutar en producción: este PR solo prepara y prueba una copia.
 * No reemplaza ni modifica los módulos anteriores.
 */
const COTILLON_SIX_20261028_URL='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-cotillon-seis-rappi-2026-10-28.json';
const COTILLON_SIX_20261028_SHA256='9bc98afb0181c3928f7a377350fee9933c263c9c679f157f3c2a302ca7e6aae3';
const COTILLON_SIX_20261028_BATCH='cotillon-seis-rappi-2026-10-28';
const COTILLON_SIX_20261028_PREFIX='COTILLON_SIX_20261028_';

function cotillonSix28Source_(){
 const response=UrlFetchApp.fetch(COTILLON_SIX_20261028_URL,{muteHttpExceptions:true,followRedirects:true});
 need_(response.getResponseCode()===200,'No se pudo obtener el lote de seis. No se modificó la hoja.');
 const raw=response.getContentText('UTF-8');
 need_(hash_(raw)===COTILLON_SIX_20261028_SHA256,'Cambió el SHA-256 del lote. No se modificó la hoja.');
 const source=JSON.parse(raw),ids=new Set(),expected=['2115454129','2115454122','2115454124','2115456032','2115454118','2115454258'];
 need_(source.version===1&&source.batch===COTILLON_SIX_20261028_BATCH&&Array.isArray(source.products)&&source.products.length===6,'El lote no contiene las seis altas revisadas.');
 source.products.forEach(p=>{
  need_(expected.includes(p.sourceId)&&!ids.has(p.sourceId),'ID de Rappi inesperado o repetido.');ids.add(p.sourceId);
  need_(typeof p.name==='string'&&p.name===p.name.trim()&&p.name.length>0&&p.name.length<=150,'Nombre inválido.');
  need_(typeof p.description==='string'&&p.description.length<=2000,'Descripción inválida.');
  need_(Number.isFinite(p.price)&&p.price>0&&p.price<=100000000&&Number.isInteger(p.stock)&&p.stock>0&&p.stock<=100000,'Precio o stock inválido.');
  need_(COTILLON_GROUPS[p.group]&&COTILLON_GROUPS[p.group].includes(p.section),'Categoría no admitida.');
  need_(!p.inner||p.group==='COTILLÓN'&&COTILLON_INNER[p.section]&&COTILLON_INNER[p.section].includes(p.inner),'Subcategoría no admitida.');
  need_(typeof p.photoApproved==='boolean','Falta la decisión explícita de foto.');
  if(p.photoApproved){
   const url='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-images/cotillon-seis-2026-10-28/'+p.sourceId+'.jpg';
   need_(p.photoUrl===url&&p.photoFile===p.sourceId+'.jpg'&&/^[a-f0-9]{64}$/.test(p.photoSha256),'Foto revisada inválida.');
  }else need_(typeof p.photoReviewReason==='string'&&p.photoReviewReason.trim().length>0,'Falta el motivo de foto pendiente.');
 });
 return source.products;
}

function cotillonSix28Target_(spreadsheetId,mode){
 need_(mode==='test'||mode==='production','Modo inválido.');
 need_(config_('SPREADSHEET_ID').length>20,'Falta identificar producción para aislar la copia.');
 if(mode==='test')need_(spreadsheetId&&spreadsheetId!==config_('SPREADSHEET_ID'),'La copia apunta a producción.');
 else need_(spreadsheetId&&spreadsheetId===config_('SPREADSHEET_ID'),'La hoja de producción cambió.');
 return cotillonInc27Sheet_(spreadsheetId,'cotillon');
}

function cotillonSix28Plan_(spreadsheetId,source,retry=false){
 const sheet=cotillonInc27Sheet_(spreadsheetId,'cotillon');
 const current=cotillonInc27Rows_(sheet),categories=cotillonInc27Rows_(cotillonInc27Sheet_(spreadsheetId,'categorias_cotillon')).map(r=>r.product);
 const byId=new Map(),bySource=new Map(),byName=new Map();
 current.forEach(row=>{
  const p=row.product;
  need_(!byId.has(p.id),'Hay IDs duplicados en Cotillón.');byId.set(p.id,row);
  if(p.sourceId){need_(!bySource.has(p.sourceId),'Hay IDs de Rappi duplicados.');bySource.set(p.sourceId,row);}
  const name=categoryKey_(p.name);if(!byName.has(name))byName.set(name,[]);byName.get(name).push(row);
 });
 const operations=[],summary={fuente:source.length,altas:0,reintentosFoto:0,sinCambios:0,conflictos:0,sinFotoAprobada:0};
 source.forEach(p=>{
  if(!p.photoApproved)summary.sinFotoAprobada++;
  const id='excel-'+p.sourceId,existing=byId.get(id),sourceMatch=bySource.get(p.sourceId);
  const names=[categoryKey_(p.name),categoryKey_(p.sourceName||p.name)];
  const nameConflict=names.some(name=>(byName.get(name)||[]).some(row=>row.product.id!==id));
  if(nameConflict||(existing&&(existing.product.sourceId!==p.sourceId||existing.product.importBatch!==COTILLON_SIX_20261028_BATCH))||(sourceMatch&&sourceMatch.product.id!==id)){
   summary.conflictos++;return;
  }
  if(existing){
   const old=existing.product;
   if(retry&&p.photoApproved&&old.active===false&&old.photoImportState==='error'&&!old.image&&!old.thumbnail&&old.sourceImage===p.photoUrl&&old.sourcePhotoSha256===p.photoSha256){
    operations.push({kind:'photo',row:existing.row,product:old,source:p});summary.reintentosFoto++;
   }else summary.sinCambios++;
   return;
  }
  const section=categories.find(c=>c.area==='cotillon'&&c.group===p.group&&!c.parentId&&c.name===p.section&&c.storefront!==false);
  const inner=p.inner?categories.find(c=>section&&c.parentId===section.id&&c.name===p.inner&&c.storefront!==false):null;
  if(!section||(p.inner&&!inner)){summary.conflictos++;return;}
  const category=inner||section;
  const product={id,area:'cotillon',sourceId:p.sourceId,name:p.name,description:p.description,categoryId:category.id,categoryIds:inner?[inner.id,section.id]:[section.id],category:categoryPath_(category,categories),catalogGroups:[p.group],mode:'venta',price:p.price,priceKnown:true,rentPrice:0,stock:p.stock,stockUnknown:false,sku:p.sku,image:'',thumbnail:'',active:false,importBatch:COTILLON_SIX_20261028_BATCH,sourceImage:p.photoApproved?p.photoUrl:'',sourcePhotoSha256:p.photoApproved?p.photoSha256:'',photoReview:!p.photoApproved,photoReviewReason:p.photoReviewReason,photoImportState:p.photoApproved?'pending':'review'};
  operations.push({kind:'new',product,source:p});summary.altas++;
 });
 return {sheet,operations,summary};
}

function cotillonSix28Backup_(spreadsheetId,mode){
 const property=COTILLON_SIX_20261028_PREFIX+'BACKUP_'+mode.toUpperCase(),saved=config_(property);
 const ss=SpreadsheetApp.openById(spreadsheetId),name='cotillon_respaldo_seis_20261028_'+mode;
 if(saved){
  const info=JSON.parse(saved);
  need_(info.spreadsheetId===spreadsheetId&&info.name===name&&ss.getSheetByName(name),'Falta el respaldo registrado para esta hoja.');
  return name;
 }
 need_(!ss.getSheetByName(name),'Existe un respaldo sin registrar. Revisarlo antes de continuar.');
 cotillonInc27Sheet_(spreadsheetId,'cotillon').copyTo(ss).setName(name);
 SpreadsheetApp.flush();props_().setProperty(property,JSON.stringify({spreadsheetId,name}));return name;
}

function cotillonSix28Photo_(source,product){
 const response=UrlFetchApp.fetch(source.photoUrl,{muteHttpExceptions:true,followRedirects:true});
 const headers=response.getAllHeaders(),type=Object.keys(headers).find(k=>k.toLowerCase()==='content-type');
 need_(response.getResponseCode()===200&&/^image\//i.test(String(type?headers[type]:'')),'La foto revisada no responde como imagen.');
 need_(hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,response.getContent()))===source.photoSha256,'La foto revisada cambió de SHA-256.');
 const uploaded=subirFotoCotillon_(source.photoUrl,'seis-20261028-'+source.sourceId);
 need_(uploaded&&[uploaded.image,uploaded.thumbnail].every(url=>typeof url==='string'&&/^https:\/\/res\.cloudinary\.com\/[^\s]+$/.test(url)),'Cloudinary no devolvió imagen y miniatura válidas.');
 need_(cotillonInc27PhotoResponds_(uploaded.image)&&cotillonInc27PhotoResponds_(uploaded.thumbnail),'La imagen o miniatura final no está disponible.');
 const result={...product,image:uploaded.image,thumbnail:uploaded.thumbnail,active:true,photoImportState:'ready'};
 delete result.photoImportError;return result;
}

function cotillonSix28Apply_(spreadsheetId,mode,limit=15,retry=false){return lock_(()=>{
 cotillonSix28Target_(spreadsheetId,mode);
 need_(Number.isInteger(limit)&&limit>=1&&limit<=15,'El lote debe tener entre 1 y 15 operaciones.');
 if(mode==='production')need_(config_(COTILLON_SIX_20261028_PREFIX+'APPROVED')===COTILLON_SIX_20261028_SHA256,'Falta aprobación SHA-256. No se modificó producción.');
 const source=cotillonSix28Source_(),plan=cotillonSix28Plan_(spreadsheetId,source,retry);
 need_(plan.summary.conflictos===0,'Hay conflictos de identidad, nombre o categoría. No se modificó la hoja.');
 if(!plan.operations.length)return {...plan.summary,procesados:0};
 if(mode==='production'&&plan.operations.some(op=>op.source.photoApproved))need_(config_('CLOUDINARY_CLOUD_NAME')&&config_('CLOUDINARY_API_KEY')&&config_('CLOUDINARY_API_SECRET'),'Falta configurar Cloudinary.');
 const backup=cotillonSix28Backup_(spreadsheetId,mode);
 let processed=0,photoErrors=0;
 plan.operations.slice(0,limit).forEach(op=>{
  let product={...op.product};
  if(mode==='production'&&op.source.photoApproved){
   try{product=cotillonSix28Photo_(op.source,product);}
   catch(error){product={...product,active:false,photoImportState:'error',photoImportError:String(error.message||error).slice(0,500)};photoErrors++;}
  }else if(mode==='test'&&op.source.photoApproved)product.photoImportState='copy-only';
  const row=op.kind==='new'?plan.sheet.getLastRow()+1:op.row;
  plan.sheet.getRange(row,1,1,2).setValues([[product.id,JSON.stringify(product)]]);processed++;
 });
 SpreadsheetApp.flush();
 const result={...plan.summary,procesados:processed,fotosFallidas:photoErrors,respaldo:backup};console.log(JSON.stringify(result));return result;
});}

function previsualizarCotillon6Copia(){
 const id=config_(COTILLON_SIX_20261028_PREFIX+'TEST_ID');cotillonSix28Target_(id,'test');
 const summary=cotillonSix28Plan_(id,cotillonSix28Source_()).summary;console.log(JSON.stringify(summary));return summary;
}
function probarLoteCotillon6Copia(){return cotillonSix28Apply_(config_(COTILLON_SIX_20261028_PREFIX+'TEST_ID'),'test');}
// Solo para una autorización posterior y explícita. No ejecutar con este PR draft.
function aplicarLoteCotillon6Produccion(){return cotillonSix28Apply_(config_('SPREADSHEET_ID'),'production');}
function reintentarFotosCotillon6Produccion(){return cotillonSix28Apply_(config_('SPREADSHEET_ID'),'production',15,true);}
