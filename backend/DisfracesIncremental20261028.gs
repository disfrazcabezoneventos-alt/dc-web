/* Importación de disfraces 2026-10-28. Archivo separado de Code.gs.
 * Prueba únicamente en una copia hasta recibir aprobación expresa.
 */
const DISFRACES_20261028_BRANCH='codex/importar-disfraces-20261028';
const DISFRACES_20261028_FILE='backend/import-disfraces-2026-10-28.json';
const DISFRACES_20261028_SHA256='ba46b567c8a83de18a725cc87b4d82d62f96817a14241837198019572136cde6';
const DISFRACES_20261028_BATCH='disfraces-2026-10-28';
const DISFRACES_20261028_CATEGORY={
 hombres:'Hombres',cabezones:'Cabezones',mujeres:'Mujeres',
 personajes:'Personajes',profesiones:'Profesiones',
 'superheroes-y-princesas':'Superheroes y Princesas',
 halloween:'Halloween',historicos:'Históricos',otros:'Otros'
};
const DISFRACES_20261028_TARIFF={
 Cabezones:{rent:75000,insurance:100000},
 Premium:{rent:65000,insurance:65000},
 'Estándar':{rent:60000,insurance:60000}
};

function disfraces28Source_(mode){
 const ref=mode==='test'?DISFRACES_20261028_BRANCH:'main';
 const url='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/'+ref+'/'+DISFRACES_20261028_FILE;
 const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true});
 need_(response.getResponseCode()===200,'No se pudo descargar el manifiesto. No se escribió nada.');
 const raw=response.getContentText('UTF-8');
 need_(hash_(raw)===DISFRACES_20261028_SHA256,'El manifiesto cambió. No se escribió nada.');
 const source=JSON.parse(raw),ids=new Set(),archives=new Set();
 need_(source.version===1&&source.batch===DISFRACES_20261028_BATCH&&source.products?.length===443&&source.photoArchives?.length===21,'Fuente incompleta.');
 source.photoArchives.forEach(a=>{
  need_(/^disfraces-20261028-\d{2}\.zip$/.test(a.name)&&!archives.has(a.name)&&/^[A-Za-z0-9_-]{20,}$/.test(a.driveId)&&/^[a-f0-9]{64}$/.test(a.sha256),'Paquete de fotos inválido.');
  archives.add(a.name);
 });
 let eligible=0,manual=0;
 source.products.forEach(p=>{
  need_(/^\d+$/.test(p.sourceId)&&!ids.has(p.sourceId),'ID de origen inválido o duplicado.');ids.add(p.sourceId);
  need_(typeof p.name==='string'&&p.name.trim()===p.name&&p.name.length>0&&p.name.length<=150,'Nombre inválido.');
  need_(p.review==='Pendiente'&&Array.isArray(p.categories)&&p.categories.every(c=>Object.prototype.hasOwnProperty.call(DISFRACES_20261028_CATEGORY,c)||c==='adultos'),'Categoría o revisión inválida.');
  const tariff=DISFRACES_20261028_TARIFF[p.tariff];
  need_(tariff&&p.rentPrice===tariff.rent&&p.insurance===tariff.insurance,'Tarifa o seguro inconsistente.');
  need_(Number.isInteger(p.stock)&&p.stock>=0&&p.stock<=100000&&Number.isInteger(p.catalogStock)&&p.catalogStock>=0&&Number.isInteger(p.photoWidth)&&p.photoWidth>0,'Stock o tamaño inválido.');
  need_(typeof p.photoPath==='string'&&p.photoPath.startsWith('fotos-catalogo/')&&/^[a-f0-9]{64}$/.test(p.photoSha256),'Foto inválida.');
  need_(p.manualConflict===['Scream','Woody'].includes(p.name),'Conflicto manual inesperado.');
  if(p.manualConflict){manual++;need_(!p.photoBatch,'Una ficha manual no debe subir foto.');}
  else if(p.photoWidth>=600){eligible++;need_(archives.has(p.photoBatch),'Falta el paquete de una foto activa.');}
  else need_(!p.photoBatch,'Una foto pequeña no debe subirse.');
 });
 need_(ids.size===443&&manual===2&&eligible===308,'Los conteos del catálogo cambiaron.');
 return source;
}
function disfraces28Sheet_(id,name){
 need_(typeof id==='string'&&id.length>20,'Falta el ID de la copia de prueba.');
 const sheet=SpreadsheetApp.openById(id).getSheetByName(name);
 need_(sheet,'Falta la pestaña '+name+'.');return sheet;
}
function disfraces28Rows_(sheet){
 return sheet.getLastRow()<2?[]:sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues().map((row,index)=>{
  const p=JSON.parse(row[1]);need_(p.id===row[0],'ID inconsistente en fila '+(index+2));return {row:index+2,product:p};
 });
}
function disfraces28Plan_(id,source){
 const sheet=disfraces28Sheet_(id,'disfraces');
 const categories=disfraces28Rows_(disfraces28Sheet_(id,'categorias_disfraces')).map(x=>x.product);
 const current=disfraces28Rows_(sheet),byId=new Map(),bySource=new Map(),byName=new Map();
 current.forEach(item=>{
  const p=item.product;need_(!byId.has(p.id),'ID duplicado en disfraces.');byId.set(p.id,item);
  if(p.sourceId){need_(!bySource.has(p.sourceId),'ID de origen duplicado en disfraces.');bySource.set(p.sourceId,item);}
  const name=categoryKey_(p.name);if(!byName.has(name))byName.set(name,[]);byName.get(name).push(item);
 });
 const ops=[],summary={fuente:443,altas:0,activasPotenciales:0,inactivasPorAncho:0,omitidasManuales:0,yaImportadas:0,pendientesDeFoto:0,conflictos:0,stockDelCruce:0,categoriasSinEquivalencia:0};
 source.products.forEach(p=>{
  if(p.manualConflict){summary.omitidasManuales++;return;}
  const idProduct='catalogo-disfraz-'+p.sourceId,existing=byId.get(idProduct),sameSource=bySource.get(p.sourceId);
  if((existing&&existing.product.sourceId!==p.sourceId)||(sameSource&&sameSource.product.id!==idProduct)){summary.conflictos++;return;}
  if(existing){summary.yaImportadas++;return;}
  if((byName.get(categoryKey_(p.name))||[]).some(item=>item.product.importBatch!==DISFRACES_20261028_BATCH)){summary.conflictos++;return;}
  const selected=p.categories.map(slug=>DISFRACES_20261028_CATEGORY[slug]).filter(Boolean);
  const linked=selected.map(name=>categories.find(c=>c.name===name&&c.area==='disfraces'));
  if(linked.some(c=>!c)){summary.conflictos++;return;}
  const categoryIds=[...new Set(linked.map(c=>c.id))],eligible=p.photoWidth>=600&&p.stock>0;
  if(p.categories.length&&!selected.length)summary.categoriasSinEquivalencia++;
  if(p.stockFromCross)summary.stockDelCruce++;
  if(eligible)summary.activasPotenciales++;else summary.inactivasPorAncho++;
  const product={
   id:idProduct,area:'disfraces',sourceId:p.sourceId,name:p.name,
   description:'',categoryId:categoryIds[0]||'',categoryIds,
   category:selected[0]||'',originalCategories:p.categories,
   mode:'alquiler',price:0,rentPrice:p.rentPrice,insuranceDeposit:p.insurance,
   tariff:p.tariff,stock:p.stock,image:'',thumbnail:'',active:false,
   photoWidth:p.photoWidth,photoReview:'Pendiente',sourcePhotoPath:p.photoPath,
   importBatch:DISFRACES_20261028_BATCH,
   importBaseline:{name:p.name,rentPrice:p.rentPrice,stock:p.stock,categoryIds,active:false}
  };
  need_(JSON.stringify(product).length<48000,'Ficha demasiado larga: '+p.name);
  ops.push({source:p,product,eligible});summary.altas++;
  if(eligible)summary.pendientesDeFoto++;
 });
 return {sheet,ops,summary};
}
function previsualizarDisfraces28Copia(){
 const testId=config_('DISFRACES_20261028_TEST_ID');
 need_(testId&&testId!==config_('SPREADSHEET_ID'),'La copia de prueba apunta a producción.');
 const result=disfraces28Plan_(testId,disfraces28Source_('test')).summary;
 console.log(JSON.stringify(result));return result;
}
function previsualizarDisfraces28Produccion(){
 const result=disfraces28Plan_(config_('SPREADSHEET_ID'),disfraces28Source_('production')).summary;
 console.log(JSON.stringify(result));return result;
}
function disfraces28Backup_(id,mode){
 const key='DISFRACES_20261028_BACKUP_'+mode.toUpperCase(),ss=SpreadsheetApp.openById(id),saved=config_(key);
 if(saved){need_(ss.getSheetByName(saved),'Falta el respaldo registrado.');return saved;}
 const name='disfraces_respaldo_20261028_'+mode;
 need_(!ss.getSheetByName(name),'Ya existe un respaldo sin registrar.');
 disfraces28Sheet_(id,'disfraces').copyTo(ss).setName(name);
 SpreadsheetApp.flush();props_().setProperty(key,name);return name;
}
function disfraces28PhotoBlob_(source,archives){
 const archive=archives.get(source.photoBatch);
 need_(archive,'No se abrió el paquete de la foto.');
 const blob=archive.find(item=>item.getName()===source.photoPath);
 need_(blob,'No se encontró la foto '+source.sourceId+'.');
 const bytes=blob.getBytes();
 need_(hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes))===source.photoSha256,'La foto cambió: '+source.sourceId);
 return blob;
}
function disfraces28Photo_(source,archives){
 const blob=disfraces28PhotoBlob_(source,archives);
 const cloud=config_('CLOUDINARY_CLOUD_NAME'),key=config_('CLOUDINARY_API_KEY'),secret=config_('CLOUDINARY_API_SECRET');
 need_(cloud&&key&&secret,'Falta configurar Cloudinary.');
 const folder='disfraz-cabezon/catalogo',eager='c_limit,h_160,w_160',publicId='disfraz-20261028-'+source.sourceId,timestamp=Math.floor(Date.now()/1000);
 const signed='eager='+eager+'&folder='+folder+'&public_id='+publicId+'&timestamp='+timestamp+secret;
 const signature=hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1,signed,Utilities.Charset.UTF_8));
 const response=UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloud)+'/image/upload',{
  method:'post',payload:{file:blob,folder,eager,public_id:publicId,timestamp:String(timestamp),api_key:key,signature},muteHttpExceptions:true
 });
 need_(response.getResponseCode()<300,'Cloudinary devolvió HTTP '+response.getResponseCode());
 const result=JSON.parse(response.getContentText());
 need_(result.secure_url&&result.eager?.[0]?.secure_url,'Cloudinary no devolvió foto y miniatura.');
 return {image:result.secure_url,thumbnail:result.eager[0].secure_url};
}
function disfraces28Archives_(chosen,source){
 const archives=new Map();
 [...new Set(chosen.filter(x=>x.eligible).map(x=>x.source.photoBatch))].forEach(name=>{
  const reference=source.photoArchives.find(a=>a.name===name);
  need_(reference,'Paquete no registrado: '+name);
  const bytes=DriveApp.getFileById(reference.driveId).getBlob().getBytes();
  need_(hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes))===reference.sha256,'Cambió el paquete '+name+'. No se escribió nada.');
  archives.set(name,Utilities.unzip(Utilities.newBlob(bytes,'application/zip',name)));
 });
 return archives;
}
function disfraces28Apply_(mode){return lock_(()=>{
 const id=mode==='test'?config_('DISFRACES_20261028_TEST_ID'):config_('SPREADSHEET_ID');
 if(mode==='test')need_(id&&id!==config_('SPREADSHEET_ID'),'La copia de prueba apunta a producción.');
 else need_(mode==='production'&&config_('DISFRACES_20261028_APPROVED')===DISFRACES_20261028_SHA256,'Falta aprobación expresa de esta importación.');
 const source=disfraces28Source_(mode),plan=disfraces28Plan_(id,source);
 need_(plan.summary.conflictos===0,'Hay conflictos en disfraces; no se escribió nada.');
 if(!plan.ops.length){const done={...plan.summary,procesados:0};console.log(JSON.stringify(done));return done;}
 const chosen=plan.ops.slice(0,15);
 if(mode==='production'&&chosen.some(item=>item.eligible))need_(config_('CLOUDINARY_CLOUD_NAME')&&config_('CLOUDINARY_API_KEY')&&config_('CLOUDINARY_API_SECRET'),'Falta Cloudinary.');
 const archives=disfraces28Archives_(chosen,source);
 if(mode==='test')chosen.filter(item=>item.eligible).forEach(item=>disfraces28PhotoBlob_(item.source,archives));
 const backup=disfraces28Backup_(id,mode);
 let processed=0,active=0,photoFailed=0;
 chosen.forEach(item=>{
  let product=item.product;
  if(mode==='production'&&item.eligible){
   try{product={...product,...disfraces28Photo_(item.source,archives),active:true};active++;}
   catch(error){product={...product,active:false,photoImportError:String(error.message||error).slice(0,200)};photoFailed++;}
  }
  const row=plan.sheet.getLastRow()+1;
  plan.sheet.getRange(row,1,1,2).setValues([[product.id,JSON.stringify(product)]]);
  processed++;
 });
 SpreadsheetApp.flush();
 const result={...plan.summary,procesados:processed,activadosEnEsteLote:active,fotosFallidasEnEsteLote:photoFailed,respaldo:backup};
 console.log(JSON.stringify(result));return result;
});}
function probarLoteDisfraces28Copia(){return disfraces28Apply_('test');}
function aplicarLoteDisfraces28Produccion(){return disfraces28Apply_('production');}
function disfraces28Status_(id){
 const imported=disfraces28Rows_(disfraces28Sheet_(id,'disfraces')).map(x=>x.product).filter(p=>p.importBatch===DISFRACES_20261028_BATCH);
 const result={importadas:imported.length,activas:imported.filter(p=>p.active).length,
  inactivas:imported.filter(p=>!p.active).length,conFoto:imported.filter(p=>p.image&&p.thumbnail).length,
  fotosFallidas:imported.filter(p=>p.photoImportError).map(p=>({id:p.sourceId,nombre:p.name,error:p.photoImportError})),
  sinCategoria:imported.filter(p=>!p.categoryId).map(p=>({id:p.sourceId,nombre:p.name}))};
 console.log(JSON.stringify(result));return result;
}
function estadoDisfraces28Copia(){return disfraces28Status_(config_('DISFRACES_20261028_TEST_ID'));}
function estadoDisfraces28Produccion(){return disfraces28Status_(config_('SPREADSHEET_ID'));}
function reintentarFotosDisfraces28Produccion(){return lock_(()=>{
 need_(config_('DISFRACES_20261028_APPROVED')===DISFRACES_20261028_SHA256,'Falta aprobación expresa de esta importación.');
 const id=config_('SPREADSHEET_ID'),source=disfraces28Source_('production');
 const sourceById=new Map(source.products.map(p=>[p.sourceId,p]));
 const failed=disfraces28Rows_(disfraces28Sheet_(id,'disfraces')).filter(x=>x.product.importBatch===DISFRACES_20261028_BATCH&&x.product.photoImportError).slice(0,15);
 if(!failed.length){const empty={revisados:0,activados:0,fallidos:0,omitidosPorEdicionManual:0};console.log(JSON.stringify(empty));return empty;}
 const chosen=[],result={revisados:failed.length,activados:0,fallidos:0,omitidosPorEdicionManual:0};
 failed.forEach(item=>{
  const p=item.product,sourceProduct=sourceById.get(p.sourceId),baseline=p.importBaseline;
  const unchanged=baseline&&p.name===baseline.name&&p.rentPrice===baseline.rentPrice&&p.stock===baseline.stock
   &&JSON.stringify(p.categoryIds||[])===JSON.stringify(baseline.categoryIds||[])
   &&p.active===false&&!p.image&&!p.thumbnail;
  if(!unchanged||!sourceProduct||sourceProduct.photoWidth<600){result.omitidosPorEdicionManual++;return;}
  chosen.push({source:sourceProduct,eligible:true,item});
 });
 if(!chosen.length){console.log(JSON.stringify(result));return result;}
 const archives=disfraces28Archives_(chosen,source);
 disfraces28Backup_(id,'production');
 chosen.forEach(({source:photoSource,item})=>{
  try{
   const photo=disfraces28Photo_(photoSource,archives),p={...item.product,...photo,active:true};
   delete p.photoImportError;
   disfraces28Sheet_(id,'disfraces').getRange(item.row,1,1,2).setValues([[p.id,JSON.stringify(p)]]);
   result.activados++;
  }catch(error){result.fallidos++;}
 });
 SpreadsheetApp.flush();console.log(JSON.stringify(result));return result;
});}
