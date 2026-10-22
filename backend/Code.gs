/* Disfraz Cabezón · API para Next.js estático. Secretos: Script Properties. */
const TABLES = ['disfraces','cotillon','categorias_disfraces','categorias_cotillon','reservas','movimientos','cancelaciones','notifications'];
const CATEGORY_AREAS = ['disfraces','cotillon'];
const SUGGESTED_COSTUME_CATEGORIES = ['Hombres','Cabezones','Mujeres','Personajes','Profesiones','Superheroes y Princesas','Halloween','Históricos','Otros'];
const COTILLON_GROUPS = {
 'COTILLÓN':['Fiestas','Cumpleaños infantil'],
 'REPOSTERÍA':['Golosinas','Comestibles','Accesorios'],
 'FECHAS ESPECIALES':['Navidad','Halloween','Pascua','San Valentín','Patrios','Baby Shower y revelación de género','Bautismo, comunión, 1 año','Egresados, UPD y recibidas','Primavera','Mundial','Despedida de soltera','Otros...'],
 'DESCARTABLES':['Bandejas','Cubiertos','Servilletas','Platos','Vasos / Copas / Jarras','Cajas','Sobres / Bolsas','Sorbetes','Hilos y cintas']
};
const COTILLON_INNER = {
 'Fiestas':['Carnaval carioca','Anteojos','Máscaras y antifaces','Accesorios para lanzar','Pelucas y barbas','Maquillaje pinta pelo','Sombreros cascos','Vinchas y coronas','Armas bastones escudos','Accesorios','Alas y tutús','Guantes y medias','Capas','Corbatas moños cinturones y tiradores'],
 'Cumpleaños infantil':['Personajes','Adorno para torta','Decoración','Bolsas y piñatas']
};
const STATES = {pending:['correction','confirmed','rejected','cancel_requested'],correction:['pending','confirmed','rejected','cancel_requested'],confirmed:['returned','incident','cancel_requested'],incident:['returned','refund_pending'],cancel_requested:['refund_pending','confirmed','rejected'],rejected:['refund_pending'],refund_pending:['refunded'],returned:[],refunded:[]};
function props_(){return PropertiesService.getScriptProperties();}
function config_(key){return props_().getProperty(key)||'';}
function siteTheme_(){return config_('SITE_THEME')==='halloween'?'halloween':'default';}
function siteCampaign_(){return {halloween:config_('CAMPAIGN_HALLOWEEN')!=='off'};}
function hex_(bytes){return bytes.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function hash_(text){return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8));}
function equal_(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;}
function need_(ok,message){if(!ok)throw new Error(message);}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function sheet_(name){need_(TABLES.includes(name),'Tabla inválida.');const s=SpreadsheetApp.openById(config_('SPREADSHEET_ID')).getSheetByName(name);need_(s,'Ejecutá prepararConfiguracion primero.');return s;}
function rows_(name){const s=sheet_(name);return s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,2).getValues().map(r=>JSON.parse(r[1]));}
function put_(name,obj){const s=sheet_(name),all=rows_(name),index=all.findIndex(r=>r.id===obj.id);const raw=JSON.stringify(obj);need_(raw.length<48000,'El registro excede el tamaño permitido.');s.getRange(index<0?s.getLastRow()+1:index+2,1,1,2).setValues([[obj.id,raw]]);SpreadsheetApp.flush();return obj;}
function remove_(name,id){const index=rows_(name).findIndex(r=>r.id===id);need_(index>=0,'No se encontró el registro.');sheet_(name).deleteRow(index+2);}
function lock_(fn){const lock=LockService.getScriptLock();need_(lock.tryLock(15000),'El sistema está ocupado. Intentá nuevamente.');try{return fn()}finally{lock.releaseLock()}}
function limit_(key,max,seconds){const cache=CacheService.getScriptCache();const k='limit:'+hash_(key);const count=Number(cache.get(k)||0);need_(count<max,'Demasiados intentos. Esperá unos minutos.');cache.put(k,String(count+1),seconds);}
function session_(token){need_(typeof token==='string'&&token.length>30&&CacheService.getScriptCache().get('session:'+hash_(token))==='admin','Sesión vencida. Volvé a ingresar.');}
function text_(v,max=200){need_(typeof v==='string'&&v.trim().length>0&&v.length<=max,'Revisá los campos de texto.');return v.trim();}
function amount_(v){need_(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100000000,'Importe inválido.');return Math.round(v*100)/100;}
function date_(v){need_(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v,'Fecha inválida.');return v;}
function now_(){return new Date().toISOString();}
function today_(){return Utilities.formatDate(new Date(),'America/Argentina/Buenos_Aires','yyyy-MM-dd');}
function categoryTable_(area){need_(CATEGORY_AREAS.includes(area),'Área inválida.');return 'categorias_'+area;}
function categoryKey_(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();}
function categories_(area){return rows_(categoryTable_(area));}
// No toca filas de productos: conserva IDs, fotos, precios, stock y categorías de origen.
// Si una ejecución se interrumpe, la siguiente reutiliza los nombres ya creados.
function ensureCotillonStructure_(){
 if(config_('COTILLON_STRUCTURE_V1')==='ready')return;
 const existing=categories_('cotillon'),newRows=[];
 Object.keys(COTILLON_GROUPS).forEach(group=>COTILLON_GROUPS[group].forEach(name=>{
  let category=existing.find(c=>categoryKey_(c.name)===categoryKey_(name));
  if(category){if(category.group!==group||category.storefront!==true){category={...category,group,storefront:true};put_('categorias_cotillon',category);existing[existing.findIndex(c=>c.id===category.id)]=category;}}
  else{category={id:Utilities.getUuid(),area:'cotillon',name,group,storefront:true};newRows.push([category.id,JSON.stringify(category)]);existing.push(category);}
 }));
 if(newRows.length){const sheet=sheet_('categorias_cotillon');sheet.getRange(sheet.getLastRow()+1,1,newRows.length,2).setValues(newRows);SpreadsheetApp.flush();}
 existing.filter(c=>!c.group&&c.storefront!==false).forEach(c=>put_('categorias_cotillon',{...c,storefront:false}));
 props_().setProperty('COTILLON_STRUCTURE_V1','ready');
}
// Agrega solo filas nuevas de categorías. Los productos y sus vínculos actuales no se modifican.
function ensureCotillonDepth3_(){
 if(config_('COTILLON_DEPTH3_V1')==='ready')return;
 ensureCotillonStructure_();
 const existing=categories_('cotillon'),newRows=[];
 Object.keys(COTILLON_INNER).forEach(parentName=>{
  const parent=existing.find(c=>c.group==='COTILLÓN'&&!c.parentId&&categoryKey_(c.name)===categoryKey_(parentName));
  need_(parent,'Falta la categoría '+parentName+'. Revisá categorías_cotillon antes de continuar.');
  COTILLON_INNER[parentName].forEach(name=>{
   if(existing.some(c=>c.parentId===parent.id&&categoryKey_(c.name)===categoryKey_(name)))return;
   const category={id:Utilities.getUuid(),area:'cotillon',name,group:'COTILLÓN',parentId:parent.id,storefront:true};
   newRows.push([category.id,JSON.stringify(category)]);existing.push(category);
  });
 });
 if(newRows.length){const sheet=sheet_('categorias_cotillon');sheet.getRange(sheet.getLastRow()+1,1,newRows.length,2).setValues(newRows);SpreadsheetApp.flush();}
 props_().setProperty('COTILLON_DEPTH3_V1','ready');
}
function productCategoryIds_(p){return [...new Set([p.categoryId,...(Array.isArray(p.categoryIds)?p.categoryIds:[])].filter(Boolean))];}
function linkedCategory_(p,c){return productCategoryIds_(p).includes(c.id)||(!p.categoryId&&categoryKey_(p.category)===categoryKey_(c.name));}
function categoryPath_(category,categories){if(!category)return 'Sin categoría';const parent=category.parentId?categories.find(c=>c.id===category.parentId):null;return [category.group,parent?.name,category.name].filter(Boolean).join(' › ');}
function products_(area){const categories=categories_(area);return rows_(area).map(p=>{const original=categories.find(c=>c.id===p.categoryId)||categories.find(c=>!p.categoryId&&!c.parentId&&categoryKey_(c.name)===categoryKey_(p.category));const ids=productCategoryIds_(p).filter(id=>categories.some(c=>c.id===id));if(original&&!ids.includes(original.id))ids.unshift(original.id);if(area==='cotillon')ids.slice().forEach(id=>{const source=categories.find(c=>c.id===id),target=categories.find(c=>c.id===source?.mappedToCategoryId&&c.group&&c.storefront!==false);if(target&&!ids.includes(target.id))ids.push(target.id);});const primary=area==='cotillon'&&original?.mappedToCategoryId?categories.find(c=>c.id===original.mappedToCategoryId&&c.group&&c.storefront!==false)||original:original;const label=c=>area==='cotillon'?categoryPath_(c,categories):c.name;return {...p,categoryId:primary?primary.id:'',category:primary?label(primary):area==='cotillon'&&p.catalogGroups?.length?p.category||p.catalogGroups[0]:'Sin categoría',categoryIds:ids,categoryNames:ids.map(id=>label(categories.find(c=>c.id===id)))};});}
function categoryName_(name,area,ignoreId,group='',parentId=''){const clean=text_(name,80);need_(clean!=='Sin categoría','Ese nombre está reservado para los productos sin categoría.');need_(!categories_(area).some(c=>c.id!==ignoreId&&categoryKey_(c.name)===categoryKey_(clean)&&(area!=='cotillon'||(c.group||'')===group&&(c.parentId||'')===parentId)),'Ya existe una categoría con ese nombre en esa sección.');return clean;}
function doGet(){return json_({ok:true,data:{service:'Disfraz Cabezón',version:9,catalogSchema:'cotillon-excel-2026-v1',cotillonImportReady:config_('COTILLON_EXCEL_2026_STATE')==='ready',theme:siteTheme_(),campaign:siteCampaign_()}});}
function reply_(e,result){
 if(!e||!e.parameter||e.parameter.transport!=='frame')return json_(result);
 const id=String(e.parameter.bridgeId||'');
 need_(/^[a-f0-9-]{36}$/.test(id),'Identificador de respuesta inválido.');
 const site=config_('SITE_URL')||'https://dc-web-8ai4.onrender.com';
 const match=/^https:\/\/[^\s/?#]+/.exec(site);
 need_(match,'SITE_URL debe empezar con https:// y contener el dominio de Render.');
 const origin=match[0];
 need_(e.parameter.origin===origin,'Origen del sitio no configurado. Revisá SITE_URL.');
 const message=JSON.stringify({type:'dc-apps-result',id,result}).replace(/</g,'\\u003c');
 const html='<!doctype html><html><body><script>window.top.postMessage('+message+','+JSON.stringify(origin)+');</script></body></html>';
 return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function doPost(e){let result;try{need_(e&&e.postData&&e.postData.contents.length<47000000,'Solicitud demasiado grande.');const raw=e.parameter&&e.parameter.transport==='frame'?e.parameter.payload:e.postData.contents;const b=JSON.parse(raw);need_(b&&typeof b.action==='string','Solicitud inválida.');result={ok:true,data:b.action==='siteTheme'?{theme:siteTheme_()}:lock_(()=>dispatch_(b))};}catch(error){result={ok:false,error:String(error.message||'No se pudo completar la operación.').slice(0,300)};}return reply_(e,result);}
function dispatch_(b){
  if(b.action==='siteTheme')return {theme:siteTheme_()};
 recoverStock_();
 if(['catalog','catalogData','admin','saveCategory','saveProduct','mapLegacyCategory'].includes(b.action))ensureCotillonDepth3_();
 if(b.action==='catalog')return CATEGORY_AREAS.flatMap(a=>products_(a).filter(p=>p.active));
 if(b.action==='catalogData')return {products:CATEGORY_AREAS.flatMap(a=>products_(a).filter(p=>p.active)),categories:CATEGORY_AREAS.flatMap(categories_),campaign:siteCampaign_(),cotillonImportReady:config_('COTILLON_EXCEL_2026_STATE')==='ready'};
 if(b.action==='login'){
  limit_('login-global',60,900);limit_('login:'+String(b.username).toLowerCase(),8,900);
  need_(config_('ADMIN_PASSWORD').length>=12,'Configurá una contraseña de al menos 12 caracteres.');
  need_(equal_(hash_(String(b.username)),hash_(config_('ADMIN_USER')))&&equal_(hash_(String(b.password)),hash_(config_('ADMIN_PASSWORD'))),'Usuario o contraseña incorrectos.');
  const token=Utilities.getUuid()+Utilities.getUuid();CacheService.getScriptCache().put('session:'+hash_(token),'admin',21600);return {token};
 }
 if(b.action==='bank'){validateRental_(b.data,2);checkFiles_(b.files,['dniFront','dniBack','addressProof']);return bank_();}
 if(b.action==='submit')return submit_(b);
 if(['request','file','correct'].includes(b.action)){
  const r=authorizedRequest_(b);if(b.action==='request'){const {accessHash,files,...safe}=r;return safe;}
  if(b.action==='file'){need_(['signature','dniFront','dniBack','addressProof','receipt'].includes(b.slot),'Archivo inválido.');if(b.slot!=='signature')session_(b.token);const f=DriveApp.getFileById(r.files[b.slot].id).getBlob();return {base64:Utilities.base64Encode(f.getBytes()),type:f.getContentType()};}
  need_(r.status==='correction'&&Date.now()<Date.parse(r.correctionDeadline),'La corrección no está habilitada o venció.');
  const checked=checkFiles_(b.files,['dniFront','dniBack','addressProof']),saved=saveFiles_(checked,r.id+'-correction');
  const previous=r.files;r.files={...previous,...saved};r.status='pending';r.events.push({action:'pending',note:'Documentación corregida por el cliente.',at:now_()});put_('reservas',r);
  Object.keys(saved).forEach(k=>{if(previous[k].id!==r.signedFiles?.[k]?.id)try{DriveApp.getFileById(previous[k].id).setTrashed(true)}catch(_){}});return {ok:true};
 }
 if(b.action==='cancel'){const d=b.data;need_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email),'Correo inválido.');limit_('cancel:'+d.email,5,3600);const id=Utilities.getUuid();const r={id,code:'ARR-'+id.slice(0,8).toUpperCase(),name:text_(d.name,150),email:text_(d.email,200),reference:String(d.reference||'').slice(0,100),note:String(d.note||'').slice(0,2000),createdAt:now_(),resolved:false};put_('cancelaciones',r);return {code:r.code};}
 session_(b.token);
 if(b.action==='logout'){CacheService.getScriptCache().remove('session:'+hash_(b.token));return {ok:true};}
 if(b.action==='admin')return {products:CATEGORY_AREAS.flatMap(products_),categories:CATEGORY_AREAS.flatMap(categories_),requests:rows_('reservas').map(({accessHash,terms,files,...r})=>r),movements:rows_('movimientos'),cancellations:rows_('cancelaciones'),bank:bank_(),mailMode:config_('MAIL_MODE'),siteTheme:siteTheme_(),campaign:siteCampaign_()};
 if(b.action==='setSiteTheme'){need_(['default','halloween'].includes(b.theme),'Tema inválido.');props_().setProperty('SITE_THEME',b.theme);return {theme:siteTheme_()};}
 if(b.action==='setHalloweenCampaign'){need_(typeof b.enabled==='boolean','Estado de campaña inválido.');props_().setProperty('CAMPAIGN_HALLOWEEN',b.enabled?'on':'off');return siteCampaign_();}
 if(b.action==='saveCategory'){
  const area=b.area,table=categoryTable_(area),all=categories_(area),old=b.id?all.find(c=>c.id===b.id):null;
  need_(!b.id||old,'Categoría inexistente.');
  const group=area==='cotillon'?String(b.group||old?.group||''):'',parentId=area==='cotillon'?String(Object.prototype.hasOwnProperty.call(b,'parentId')?b.parentId||'':old?.parentId||''):'';
  need_(area!=='cotillon'||Object.prototype.hasOwnProperty.call(COTILLON_GROUPS,group)||old&&!group,'Elegí una categoría principal válida.');
  const parent=parentId?all.find(c=>c.id===parentId):null;
  need_(!parentId||group==='COTILLÓN'&&parent&&parent.group==='COTILLÓN'&&!parent.parentId&&(['Fiestas','Cumpleaños infantil'].some(name=>categoryKey_(name)===categoryKey_(parent.name))||all.some(c=>c.parentId===parent.id))&&parent.id!==old?.id,'Elegí Fiestas o Cumpleaños infantil como categoría superior.');
  need_(!old||!all.some(c=>c.parentId===old.id)||group==='COTILLÓN'&&!parentId,'No se puede mover una categoría que contiene subcategorías internas.');
  const name=categoryName_(b.name,area,b.id,group,parentId);
  const category={...(old||{}),id:old?old.id:Utilities.getUuid(),area,name,group,parentId,storefront:area==='cotillon'?!!group&&b.storefront!==false:true};
  put_(table,category);
  if(old&&old.name!==name)rows_(area).filter(p=>p.categoryId===old.id||(!p.categoryId&&categoryKey_(p.category)===categoryKey_(old.name))).forEach(p=>put_(area,{...p,categoryId:old.id,category:name}));
  return category;
 }
 if(b.action==='mapLegacyCategory'){const source=categories_('cotillon').find(c=>c.id===b.id&&!c.group),target=categories_('cotillon').find(c=>c.id===b.targetId&&c.group&&c.storefront!==false);need_(source,'Elegí una categoría anterior.');need_(target,'Elegí una subcategoría nueva y visible.');const updated={...source,mappedToCategoryId:target.id,storefront:false};put_('categorias_cotillon',updated);return {category:updated,affected:rows_('cotillon').filter(p=>linkedCategory_(p,source)).length};}
 if(b.action==='deleteCategory'&&b.area==='cotillon'){const categories=categories_('cotillon');need_(!categories.some(c=>c.mappedToCategoryId===b.id),'Esta subcategoría recibe productos de una categoría anterior. Cambiá primero esa vinculación.');need_(!categories.some(c=>c.parentId===b.id),'Esta sección contiene subcategorías internas. Reorganizalas antes de eliminarla.');}
 if(b.action==='deleteCategory'){const area=b.area,table=categoryTable_(area),category=categories_(area).find(c=>c.id===b.id);need_(category,'Categoría inexistente.');const affected=rows_(area).filter(p=>linkedCategory_(p,category));need_(Number.isInteger(b.expectedCount)&&b.expectedCount===affected.length,'Cambió la cantidad de productos. Actualizá el panel y volvé a revisar.');need_(['otros','uncategorized','new'].includes(b.strategy),'Elegí qué hacer con los productos.');let target=null;if(b.strategy==='otros'){target=categories_(area).find(c=>c.id!==category.id&&categoryKey_(c.name)==='otros');if(!target){target={id:Utilities.getUuid(),area,name:'Otros'};put_(table,target);}}if(b.strategy==='new'){const name=categoryName_(b.newName,area,category.id);target={id:Utilities.getUuid(),area,name};put_(table,target);}need_(!target||target.id!==category.id,'Elegí otra categoría de destino.');affected.forEach(p=>{let ids=productCategoryIds_(p).filter(id=>id!==category.id);if(target&&!ids.includes(target.id))ids.push(target.id);const primary=p.categoryId===category.id?(ids[0]||''):p.categoryId;put_(area,{...p,categoryId:primary,categoryIds:ids,category:primary===target?.id?target.name:p.categoryId===category.id?'':p.category});});remove_(table,category.id);return {affected:affected.length,target};}
 if(b.action==='saveProduct'){const p=b.product;need_(CATEGORY_AREAS.includes(p.area),'Área inválida.');need_(['venta','alquiler','ambos'].includes(p.mode)&&(p.area!=='cotillon'||p.mode==='venta'),'Modalidad inválida.');need_(Number.isInteger(p.stock)&&p.stock>=0&&p.stock<=100000,'Stock inválido.');need_(!p.image||/^https:\/\/res\.cloudinary\.com\//.test(p.image),'Usá una imagen de Cloudinary.');need_(!p.thumbnail||/^https:\/\/res\.cloudinary\.com\//.test(p.thumbnail),'Usá una miniatura de Cloudinary.');const old=p.id?rows_(p.area).find(x=>x.id===p.id):null;need_(!p.id||old,'Producto inexistente.');const allCategories=categories_(p.area),requested=[...new Set([p.categoryId,...(p.area==='cotillon'&&Array.isArray(p.categoryIds)?p.categoryIds:[])].filter(Boolean))];need_(requested.every(id=>allCategories.some(c=>c.id===id)),'Elegí categorías existentes.');const category=allCategories.find(c=>c.id===(p.categoryId||requested[0]));const selectedGroups=[...new Set(requested.map(id=>allCategories.find(c=>c.id===id)?.group).filter(Boolean))];const saleCondition=p.area==='disfraces'&&p.mode!=='alquiler'?String(p.saleCondition||''):'';need_(!saleCondition||['Nuevo a pedido','Nuevo Inmediato','Usado inmediato'].includes(saleCondition),'Condición de venta inválida.');const deliveryTime=saleCondition==='Nuevo a pedido'?text_(p.deliveryTime||'aproximadamente 1 mes',120):'';const orderLimit=saleCondition==='Nuevo a pedido'?(Number.isInteger(p.orderLimit)?p.orderLimit:(p.stock>0?p.stock:1)):0;need_(saleCondition!=='Nuevo a pedido'||orderLimit>=1&&orderLimit<=100000,'Límite de pedidos inválido.');return put_(p.area,{...(old||{}),id:p.id||Utilities.getUuid(),area:p.area,name:text_(p.name,150),categoryId:category?category.id:'',categoryIds:p.area==='cotillon'?requested:category?[category.id]:[],category:category?category.name:old?.catalogGroups?.length?old.category:'',catalogGroups:p.area==='cotillon'?(selectedGroups.length?selectedGroups:old?.catalogGroups||[]):[],description:text_(p.description,2000),mode:p.mode,saleCondition,deliveryTime,orderLimit,price:p.mode==='alquiler'?0:amount_(p.price),priceKnown:p.area==='cotillon'?p.priceKnown!==false:true,rentPrice:p.mode==='venta'?0:amount_(p.rentPrice),stock:saleCondition==='Nuevo a pedido'&&p.mode==='venta'?0:p.stock,stockUnknown:p.area==='cotillon'&&p.stockUnknown===true,image:String(p.image||''),thumbnail:p.image?String(p.thumbnail||''):'',active:!!p.active,sourceId:old?.sourceId||'',sourceImage:old?.sourceImage||''});}
 if(b.action==='deleteProduct'){need_(['disfraces','cotillon'].includes(b.area),'Área inválida.');need_(!rows_('movimientos').some(m=>m.kind==='venta'&&m.area===b.area&&m.productId===b.id&&!m.voided),'No se puede eliminar este producto porque tiene ventas registradas sin anular. Ocultalo del catálogo o anulá esas ventas primero.');remove_(b.area,b.id);return {ok:true};}
 if(b.action==='uploadImage'){need_(config_('CLOUDINARY_API_SECRET'),'Configurá Cloudinary.');const f=checkFiles_({image:b.file},['image']).image;need_(f.type.startsWith('image/'),'Solo imágenes.');const timestamp=Math.floor(Date.now()/1000),folder='disfraz-cabezon/catalogo',eager='c_limit,h_160,w_160';const signature=hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1,'eager='+eager+'&folder='+folder+'&timestamp='+timestamp+config_('CLOUDINARY_API_SECRET'),Utilities.Charset.UTF_8));const result=UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(config_('CLOUDINARY_CLOUD_NAME'))+'/image/upload',{method:'post',payload:{file:Utilities.newBlob(f.bytes,f.type,'producto'),folder,eager,timestamp:String(timestamp),api_key:config_('CLOUDINARY_API_KEY'),signature},muteHttpExceptions:true});need_(result.getResponseCode()<300,'No se pudo subir la imagen a Cloudinary.');const uploaded=JSON.parse(result.getContentText());need_(uploaded.secure_url&&uploaded.eager&&uploaded.eager[0]&&uploaded.eager[0].secure_url,'Cloudinary no devolvió la miniatura.');return {url:uploaded.secure_url,thumbnail:uploaded.eager[0].secure_url};}
 if(b.action==='status'){const r=rows_('reservas').find(r=>r.id===b.id);need_(r,'Reserva inexistente.');need_((STATES[r.status]||[]).includes(b.status),'Cambio de estado no permitido.');const note=text_(b.note,1000);r.status=b.status;r.updatedAt=now_();if(b.status==='correction')r.correctionDeadline=new Date(Date.now()+12*3600000).toISOString();if(b.status==='refund_pending'&&!r.refundDeadline)r.refundDeadline=new Date(Date.now()+24*3600000).toISOString();r.events.push({action:b.status,note,at:now_()});put_('reservas',r);return {ok:true};}
 if(b.action==='movement'){const d=b.data;need_(['venta','alquiler','gasto','reintegro'].includes(d.kind),'Tipo inválido.');need_(['disfraces','cotillon'].includes(d.area),'Área inválida.');date_(d.date);need_(d.date<=today_(),'No registres cobros futuros.');need_(/^[a-f0-9-]{36}$/.test(d.id),'Identificador inválido.');const old=rows_('movimientos').find(x=>x.id===d.id);if(old){need_(old.inputHash===hash_(JSON.stringify(d)),'Conflicto de movimiento.');return old;}
  if(d.kind==='alquiler'){const r=rows_('reservas').find(x=>x.id===d.requestId);need_(r&&['confirmed','returned','incident'].includes(r.status),'Elegí un alquiler confirmado.');const collected=rows_('movimientos').filter(x=>x.requestId===r.id&&x.kind==='alquiler'&&!x.voided).reduce((s,x)=>s+x.amount,0);need_(collected+amount_(d.amount)<=r.data.total,'El cobro supera el total del alquiler.');}
  const p=d.productId?rows_(d.area).find(x=>x.id===d.productId):null;if(d.kind==='venta'){need_(p&&(p.mode==='venta'||p.mode==='ambos'),'Elegí un producto a la venta.');const limit=p.area==='disfraces'&&p.saleCondition==='Nuevo a pedido'?(p.orderLimit||p.stock||1):p.area==='cotillon'&&p.stockUnknown?99:p.stock;need_(Number.isInteger(d.quantity)&&d.quantity>0&&d.quantity<=limit,'Stock o límite de pedido insuficiente.');}
  if(d.kind==='alquiler')need_(d.area==='disfraces','Los alquileres pertenecen a Disfraces.');
  const r={id:d.id,kind:d.kind,area:d.area,date:d.date,amount:amount_(d.amount),cost:amount_(d.cost),note:text_(d.note,500),requestId:String(d.requestId||''),productId:String(d.productId||''),quantity:d.kind==='venta'?d.quantity:0,inventoryUsed:d.kind==='venta'&&!(p.area==='disfraces'&&p.saleCondition==='Nuevo a pedido')&&!(p.area==='cotillon'&&p.stockUnknown),voided:false,createdAt:now_(),inputHash:hash_(JSON.stringify(d))};need_(r.amount>0,'El importe debe ser mayor que cero.');if(p&&r.inventoryUsed)r.stockPending={before:p.stock,after:p.stock-d.quantity};put_('movimientos',r);recoverStock_();return r;
 }
 if(b.action==='voidMovement'){const r=rows_('movimientos').find(x=>x.id===b.id);need_(r&&!r.voided,'Movimiento inexistente o ya anulado.');r.voided=true;r.voidReason=text_(b.note,500);if(r.kind==='venta'&&r.inventoryUsed!==false){const p=rows_(r.area).find(x=>x.id===r.productId);if(p)r.stockPending={before:p.stock,after:p.stock+r.quantity};}put_('movimientos',r);recoverStock_();return {ok:true};}
 if(b.action==='resolveCancel'){const r=rows_('cancelaciones').find(x=>x.id===b.id);need_(r,'Pedido inexistente.');r.resolved=true;r.resolvedAt=now_();put_('cancelaciones',r);return {ok:true};}
 if(b.action==='bankSettings'){const d=b.data;need_(d.alias||d.cbu,'Ingresá alias o CBU.');need_(!d.cbu||/^\d{22}$/.test(d.cbu),'CBU de 22 dígitos.');need_(!d.alias||/^[a-zA-Z0-9._-]{6,20}$/.test(d.alias),'Alias inválido.');['holder','bank','alias','cbu','cuit'].forEach(k=>props_().setProperty('BANK_'+k.toUpperCase(),String(d[k]||'').slice(0,150)));return bank_();}
 throw new Error('Acción desconocida.');
}
// Diario recuperable: si Sheets interrumpe entre caja y stock, la siguiente llamada completa la operación una sola vez.
function recoverStock_(){rows_('movimientos').filter(r=>r.stockPending).forEach(r=>{const p=rows_(r.area).find(p=>p.id===r.productId);need_(p,'Revisá el producto de un movimiento pendiente.');need_(p.stock===r.stockPending.before||p.stock===r.stockPending.after,'Stock modificado durante una operación pendiente.');p.stock=r.stockPending.after;put_(r.area,p);delete r.stockPending;put_('movimientos',r);});}
function bank_(){return {configured:!!(config_('BANK_HOLDER')&&(config_('BANK_ALIAS')||config_('BANK_CBU'))),holder:config_('BANK_HOLDER'),alias:config_('BANK_ALIAS'),cbu:config_('BANK_CBU'),bank:config_('BANK_BANK'),cuit:config_('BANK_CUIT')};}
function validateRental_(r,step){need_(r&&typeof r==='object'&&JSON.stringify(r).length<20000,'Datos inválidos.');Object.keys(EMPTY).forEach(k=>{if(k!=='items')need_(typeof r[k]===typeof EMPTY[k]&&(typeof r[k]!=='string'||r[k].length<=1500),'Campo inválido: '+k);});need_(Array.isArray(r.items)&&r.items.every(i=>i&&typeof i.name==='string'&&i.name.length<=150),'Personajes inválidos.');['birthDate','pickupDate','returnDate','docDate'].forEach(k=>{if(r[k])date_(r[k]);});const errors=validate(r,step,today_());need_(!Object.keys(errors).length,Object.values(errors).join(' ').slice(0,280));if(step>=1)r.items.forEach(i=>{need_(typeof i.catalogCategory==='string'&&i.catalogCategory.length<=80&&i.catalogCategory,'Elegí la categoría del disfraz.');const category=i.catalogCategoryId?categories_('disfraces').find(c=>c.id===i.catalogCategoryId):null;need_(!i.catalogCategoryId||category,'La categoría elegida ya no existe. Volvé a cargar el formulario.');need_(category?category.name===i.catalogCategory:i.catalogCategory==='Sin categoría','La categoría cambió. Volvé a cargar el formulario.');if(i.productId){const p=products_('disfraces').find(p=>p.id===i.productId&&p.active&&p.mode!=='venta');need_(p&&p.name===i.name&&p.categoryId===(i.catalogCategoryId||''),'El disfraz elegido cambió. Volvé a seleccionarlo.');need_(p.stock>=i.quantity,'No hay suficientes unidades de ese disfraz para alquilar.');}});if(step>=1){const quantities={};r.items.forEach(i=>{if(i.productId)quantities[i.productId]=(quantities[i.productId]||0)+i.quantity});Object.keys(quantities).forEach(id=>{const p=products_('disfraces').find(p=>p.id===id);need_(p&&p.stock>=quantities[id],'No hay suficientes unidades de ese disfraz para alquilar.');});}}
function checkFiles_(files,slots){const out={};slots.forEach(slot=>{const f=files&&files[slot];need_(f&&typeof f.base64==='string'&&f.base64.length<11200000,'Falta un archivo o supera 8 MB.');const bytes=Utilities.base64Decode(f.base64);need_(bytes.length>=40&&bytes.length<=8*1024*1024,'Archivo inválido o demasiado grande.');const u=bytes.map(b=>(b+256)%256);let type='';if(u[0]===137&&u[1]===80&&u[2]===78&&u[3]===71)type='image/png';if(u[0]===255&&u[1]===216&&u[2]===255)type='image/jpeg';if(String.fromCharCode(...u.slice(0,4))==='RIFF'&&String.fromCharCode(...u.slice(8,12))==='WEBP')type='image/webp';if(String.fromCharCode(...u.slice(0,5))==='%PDF-')type='application/pdf';need_(type&&type===f.type,'Formato de archivo inválido.');if(['dniFront','dniBack','image'].includes(slot))need_(type.startsWith('image/'),'Usá una imagen.');if(slot==='signature')need_(type==='image/png'&&bytes.length<=1024*1024,'Firma inválida.');out[slot]={bytes,type,hash:hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes))};});return out;}
function saveFiles_(files,prefix){const folder=DriveApp.getFolderById(config_('PRIVATE_FOLDER_ID')),saved={};try{Object.keys(files).forEach(k=>{const f=files[k],file=folder.createFile(Utilities.newBlob(f.bytes,f.type,prefix+'-'+k));saved[k]={id:file.getId(),hash:f.hash,type:f.type};});return saved;}catch(e){Object.values(saved).forEach(f=>{try{DriveApp.getFileById(f.id).setTrashed(true)}catch(_){}});throw e;}}
function authorizedRequest_(b){const r=rows_('reservas').find(r=>r.id===b.id);need_(r,'Solicitud inexistente.');if(b.token)session_(b.token);else need_(typeof b.access==='string'&&equal_(hash_(b.access),r.accessHash),'Acceso privado inválido.');return r;}
function submit_(b){
 const r=b.data;need_(r&&/^[a-f0-9-]{36}$/.test(r.requestKey)&&typeof b.access==='string'&&b.access.length>=64,'Acceso de solicitud inválido.');const previous=rows_('reservas').find(x=>x.requestKey===r.requestKey);if(previous){need_(equal_(previous.accessHash,hash_(b.access)),'Acceso inválido.');need_(JSON.stringify(previous.data)===JSON.stringify(r),'Esta solicitud ya fue recibida con otros datos. Consultá al local antes de volver a enviar.');return {id:previous.id,code:previous.code,mailStatus:previous.mailStatus,duplicate:true};}
 validateRental_(r,4);need_(bank_().configured,'La cuenta de cobro todavía no está habilitada.');limit_('submit:'+r.email,4,3600);limit_('submit-global',80,3600);
 const checked=checkFiles_(b.files,['dniFront','dniBack','addressProof','receipt','signature']);const id=Utilities.getUuid(),createdAt=now_(),code='DC-'+today_().replace(/-/g,'')+'-'+id.slice(0,6).toUpperCase();const signedHash=hash_(JSON.stringify({data:r,termsVersion:VERSION,terms:TERMS,createdAt,files:Object.fromEntries(Object.entries(checked).map(([k,v])=>[k,v.hash]))}));
 const files=saveFiles_(checked,id);const row={id,code,requestKey:r.requestKey,accessHash:hash_(b.access),status:'pending',data:r,files,signedFiles:JSON.parse(JSON.stringify(files)),createdAt,updatedAt:createdAt,terms:TERMS,termsVersion:VERSION,signedHash,events:[{action:'pending',note:'Solicitud y firma recibidas. Pago pendiente de verificación.',at:createdAt}],mailStatus:'pending'};
 try{put_('reservas',row)}catch(e){Object.values(files).forEach(f=>{try{DriveApp.getFileById(f.id).setTrashed(true)}catch(_){}});throw e;}
 try{row.mailStatus=notify_(row);put_('reservas',row)}catch(_){/* La reserva ya quedó guardada: nunca devolver error de envío. */}
 return {id,code,mailStatus:row.mailStatus};
}
/* Avisos privados sin adjuntos: conserva test/production e incertidumbre de envío. */
function sendNotice_(r,kind,mode,row){
 const business=config_('BUSINESS_EMAIL'),to=mode==='test'||kind==='business'?business:r.data.email;
 const details='Solicitud: '+r.code+'\nCliente: '+r.data.fullName+'\nPersonajes: '+r.data.items.map(i=>i.quantity+' × '+i.name).join(', ')+'\nRetiro: '+r.data.pickupDate+'\nDevolución: '+r.data.returnDate+'\nAlquiler declarado: $ '+r.data.total+'\nPago declarado: $ '+paid(r.data)+' (pendiente de verificación)';
 try{MailApp.sendEmail({to,subject:(mode==='test'?'[PRUEBA] ':'')+'Recibimos la solicitud '+r.code+' · Disfraz Cabezón',body:details+'\n\nPendiente de revisión. Este aviso NO confirma la reserva. Conservá el enlace privado del formulario. No enviamos documentos personales por correo.'+(kind==='business'?'\nPanel: '+config_('SITE_URL')+'/admin/':''),name:'Disfraz Cabezón',replyTo:business});row.status='sent';}catch(_){row.status='review';}
 row.updatedAt=now_();put_('notifications',row);return row.status;
}
function notify_(r){const mode=config_('MAIL_MODE');if(!['test','production'].includes(mode))return 'disabled';const results=['business','customer'].map(kind=>{
 const id=mode+':'+r.id+':'+kind+':received:v1',old=rows_('notifications').find(x=>x.id===id);if(old)return old.status==='sent'?'sent':'review';
 const row={id,status:'sending',updatedAt:now_()};if(MailApp.getRemainingDailyQuota()<1){row.status='retry';put_('notifications',row);return 'retry';}put_('notifications',row);
 return sendNotice_(r,kind,mode,row);
});return mode==='test'?'test':results.every(s=>s==='sent')?'sent':'review';}
// Ejecutar manualmente desde el editor. Sólo retoma avisos que nunca llegaron a MailApp por falta de cuota.
function reintentarAvisosSinCuota(){
 const mode=config_('MAIL_MODE');need_(['test','production'].includes(mode),'MAIL_MODE debe ser test o production.');
 return lock_(()=>{
  const batch=rows_('notifications').filter(row=>row.status==='retry'&&typeof row.id==='string'&&row.id.startsWith(mode+':')).slice(0,10);
  const requests=new Map(rows_('reservas').map(r=>[r.id,r]));
  const result={mode,revisados:batch.length,enviados:0,revisionManual:0,omitidos:0,sinCuota:0};
  for(const row of batch){
   const match=/^(test|production):([a-f0-9-]{36}):(business|customer):received:v1$/.exec(row.id);
   const request=match&&match[1]===mode?requests.get(match[2]):null;
   if(!request){result.omitidos++;continue;}
   if(MailApp.getRemainingDailyQuota()<1){result.sinCuota=batch.length-result.enviados-result.revisionManual-result.omitidos;break;}
   row.status='sending';row.updatedAt=now_();put_('notifications',row);
   if(sendNotice_(request,match[3],mode,row)==='sent')result.enviados++;else result.revisionManual++;
  }
  console.log(JSON.stringify(result));return result;
 });
}
function prepararConfiguracion(){const p=props_();if(!config_('SPREADSHEET_ID')){const ss=SpreadsheetApp.create('Disfraz Cabezón — tienda y reservas');p.setProperty('SPREADSHEET_ID',ss.getId());}const ss=SpreadsheetApp.openById(config_('SPREADSHEET_ID'));TABLES.forEach(name=>{let s=ss.getSheetByName(name);if(!s){s=ss.insertSheet(name);s.appendRow(['id','registro_json']);s.setFrozenRows(1);}});if(!config_('PRIVATE_FOLDER_ID'))p.setProperty('PRIVATE_FOLDER_ID',DriveApp.createFolder('Disfraz Cabezón — documentación privada').getId());if(!config_('ADMIN_USER'))p.setProperty('ADMIN_USER','admin');if(!config_('ADMIN_PASSWORD'))p.setProperty('ADMIN_PASSWORD',Utilities.getUuid()+Utilities.getUuid());if(!config_('MAIL_MODE'))p.setProperty('MAIL_MODE','test');if(!config_('BUSINESS_EMAIL'))p.setProperty('BUSINESS_EMAIL','disfrazcabezoneventos@gmail.com');}
// Ejecutar una vez después de actualizar Code.gs. Se puede repetir sin duplicar datos.
function prepararCategorias(){prepararConfiguracion();return lock_(()=>{const summary={};CATEGORY_AREAS.forEach(area=>{const table=categoryTable_(area),existing=categories_(area),products=rows_(area),firstRun=!config_('CATEGORIES_SEEDED_V1'),names=firstRun?(area==='disfraces'?SUGGESTED_COSTUME_CATEGORIES.slice():['Otros']):[];if(firstRun)products.forEach(p=>{if(!p.categoryId&&p.category&&categoryKey_(p.category)!==categoryKey_('Sin categoría'))names.push(p.category);});names.forEach(name=>{if(!existing.some(c=>categoryKey_(c.name)===categoryKey_(name))){const category={id:Utilities.getUuid(),area,name:String(name).trim()};put_(table,category);existing.push(category);}});products.forEach(p=>{const category=existing.find(c=>c.id===p.categoryId)||existing.find(c=>categoryKey_(c.name)===categoryKey_(p.category));if(category&&(p.categoryId!==category.id||p.category!==category.name))put_(area,{...p,categoryId:category.id,category:category.name});});summary[area]={categorias:existing.length,productos:products.length};});props_().setProperty('CATEGORIES_SEEDED_V1','yes');return summary;});}

// Migración de los ocho rubros públicos del sitio anterior. Nunca reemplaza productos ya importados o editados.
const COTILLON_IMPORT_URL='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-cotillon.json';
function cotillonSnapshot_(){const response=UrlFetchApp.fetch(COTILLON_IMPORT_URL,{muteHttpExceptions:true});need_(response.getResponseCode()===200,'No se pudo leer el archivo de migración publicado en GitHub.');const data=JSON.parse(response.getContentText());need_(Array.isArray(data.categories)&&data.categories.length===8&&Array.isArray(data.products)&&data.products.length===635,'El archivo de migración no coincide con el catálogo revisado.');const keys=data.categories.map(c=>c.key);need_(new Set(keys).size===8,'Categorías repetidas en la migración.');data.products.forEach(item=>{need_(/^[a-f0-9-]{36}$/.test(item.sourceId),'ID de origen inválido.');need_(Array.isArray(item.categoryKeys)&&item.categoryKeys.length>0&&item.categoryKeys.every(k=>keys.includes(k)),'Categoría de origen inválida.');need_(typeof item.name==='string'&&item.name.trim().length>0&&item.name.length<=150,'Nombre de origen inválido.');need_(item.price===null||typeof item.price==='number'&&item.price>=0,'Precio de origen inválido.');need_(item.stock===null||Number.isInteger(item.stock)&&item.stock>=0,'Stock de origen inválido.');need_(!item.sourceImage||/^https:\/\/ajgiwtpbwhfffoimqkwj\.supabase\.co\/storage\/v1\/object\/public\/catalogo\//.test(item.sourceImage),'Foto de origen inválida.');});return data;}
function importarCotillonAnterior(){prepararConfiguracion();return lock_(()=>{const source=cotillonSnapshot_(),known=categories_('cotillon'),categoryByKey={};source.categories.forEach(c=>{let found=known.find(x=>categoryKey_(x.name)===categoryKey_(c.name));if(!found){found={id:Utilities.getUuid(),area:'cotillon',name:c.name};put_('categorias_cotillon',found);known.push(found);}categoryByKey[c.key]=found;});known.forEach(c=>{const visible=source.categories.some(item=>categoryKey_(item.name)===categoryKey_(c.name));if(c.storefront!==visible){c.storefront=visible;put_('categorias_cotillon',c);}});const existing=rows_('cotillon'),ids=new Set(existing.map(p=>p.sourceId).filter(Boolean)),newRows=[];source.products.forEach(item=>{if(ids.has(item.sourceId))return;const linked=[...new Set(item.categoryKeys.map(k=>categoryByKey[k].id))],primary=categoryByKey[item.categoryKeys[0]];const product={id:'legacy-'+item.sourceId,area:'cotillon',name:item.name.trim(),description:String(item.description||item.name).slice(0,2000),categoryId:primary.id,categoryIds:linked,category:primary.name,mode:'venta',price:item.price===null?0:item.price,priceKnown:item.price!==null,rentPrice:0,stock:item.stock===null?0:item.stock,stockUnknown:item.stock===null,image:'',thumbnail:'',active:true,sourceId:item.sourceId,sourceImage:item.sourceImage||'',sku:item.sku||''};newRows.push([product.id,JSON.stringify(product)]);ids.add(item.sourceId);});if(newRows.length){const sheet=sheet_('cotillon');sheet.getRange(sheet.getLastRow()+1,1,newRows.length,2).setValues(newRows);SpreadsheetApp.flush();}const result={agregados:newRows.length,yaExistian:source.products.length-newRows.length,categorias:source.categories.length,fotosPendientes:rows_('cotillon').filter(p=>p.sourceImage&&!p.image).length};console.log(JSON.stringify(result));return result;});}
function subirFotoCotillon_(url,sourceId){const cloud=config_('CLOUDINARY_CLOUD_NAME'),key=config_('CLOUDINARY_API_KEY'),secret=config_('CLOUDINARY_API_SECRET');need_(cloud&&key&&secret,'Configurá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en Propiedades del script.');const folder='disfraz-cabezon/catalogo',eager='c_limit,h_160,w_160',publicId='anterior-'+sourceId,timestamp=Math.floor(Date.now()/1000);const signed='eager='+eager+'&folder='+folder+'&public_id='+publicId+'&timestamp='+timestamp+secret;const signature=hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1,signed,Utilities.Charset.UTF_8));const response=UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloud)+'/image/upload',{method:'post',payload:{file:url,folder,eager,public_id:publicId,timestamp:String(timestamp),api_key:key,signature},muteHttpExceptions:true});need_(response.getResponseCode()<300,'Cloudinary devolvió HTTP '+response.getResponseCode());const uploaded=JSON.parse(response.getContentText());need_(uploaded.secure_url&&uploaded.eager?.[0]?.secure_url,'Cloudinary no devolvió la miniatura.');return {image:uploaded.secure_url,thumbnail:uploaded.eager[0].secure_url};}
function procesarFotosCotillon(){return lock_(()=>{const pending=rows_('cotillon').filter(p=>p.sourceImage&&!p.image&&!p.imageImportError).slice(0,10),result={procesadas:0,fallidas:0,pendientes:0};pending.forEach(p=>{try{const photo=subirFotoCotillon_(p.sourceImage,p.sourceId);put_('cotillon',{...p,...photo});result.procesadas++;}catch(error){put_('cotillon',{...p,imageImportError:String(error.message||error).slice(0,200)});result.fallidas++;}});result.pendientes=rows_('cotillon').filter(p=>p.sourceImage&&!p.image&&!p.imageImportError).length;if(!result.pendientes)ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='procesarFotosCotillon').forEach(t=>ScriptApp.deleteTrigger(t));console.log(JSON.stringify(result));return result;});}
function iniciarFotosCotillon(){need_(config_('CLOUDINARY_CLOUD_NAME')&&config_('CLOUDINARY_API_KEY')&&config_('CLOUDINARY_API_SECRET'),'Primero configurá las tres propiedades de Cloudinary.');const pending=rows_('cotillon').filter(p=>p.sourceImage&&!p.image&&!p.imageImportError).length;need_(pending>0,'No hay fotos pendientes de migrar.');if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='procesarFotosCotillon'))ScriptApp.newTrigger('procesarFotosCotillon').timeBased().everyMinutes(5).create();return procesarFotosCotillon();}
function reintentarFotosCotillon(){return lock_(()=>{let count=0;rows_('cotillon').filter(p=>p.imageImportError&&p.sourceImage&&!p.image).forEach(p=>{delete p.imageImportError;put_('cotillon',p);count++;});return {habilitadas:count};});}

// Importación revisada de la pestaña "Web dc" (Excel 2026). La versión pública de
// GitHub contiene únicamente los 790 productos marcados "Sí"; no contiene borradores.
// La pestaña cotillon previa se conserva completa con nombre cotillon_archivo_*.
const COTILLON_EXCEL_2026_URL='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/main/backend/import-cotillon-excel-2026.json';
const COTILLON_EXCEL_2026_SHA256='e972d080f488f388859454322257b900442649391d672b66e1a43f358f7b27bf';
const COTILLON_EXCEL_2026_BATCH='cotillon-excel-2026';
function cotillonExcel2026Source_(){
 const response=UrlFetchApp.fetch(COTILLON_EXCEL_2026_URL,{muteHttpExceptions:true,followRedirects:true});
 need_(response.getResponseCode()===200,'No se pudo descargar el catálogo revisado de GitHub. No se modificó la hoja.');
 const raw=response.getContentText('UTF-8');
 need_(hash_(raw)===COTILLON_EXCEL_2026_SHA256,'El catálogo publicado cambió o está incompleto. No se modificó la hoja.');
 const source=JSON.parse(raw);
 need_(source.version===1&&Array.isArray(source.products)&&source.products.length===790,'Se esperaban exactamente 790 publicaciones visibles.');
 const ids=new Set();
 source.products.forEach(p=>{
  need_(typeof p.sourceId==='string'&&/^[A-Za-z0-9_-]{3,40}$/.test(p.sourceId)&&!ids.has(p.sourceId),'Identificador duplicado o inválido en el catálogo.');ids.add(p.sourceId);
  need_(typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=150&&typeof p.description==='string'&&p.description.length<=2000,'Nombre o descripción inválidos.');
  need_(typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0&&p.price<=100000000&&Number.isInteger(p.stock)&&p.stock>0&&p.stock<=100000,'Precio o stock inválido.');
  need_(typeof p.sourceImage==='string'&&/^https:\/\/images\.rappi\.com\.ar\/products\/[^\s]+$/.test(p.sourceImage),'Foto de origen inválida.');
  const group=Object.keys(COTILLON_GROUPS).find(name=>categoryKey_(name)===categoryKey_(p.group));
  need_(group,'Categoría principal desconocida en el Excel.');
  need_(p.section===''&&group==='DESCARTABLES'&&p.excelRow===723||COTILLON_GROUPS[group].includes(p.section),'Subcategoría desconocida en el Excel.');
  need_(!p.inner||group==='COTILLÓN'&&Array.isArray(COTILLON_INNER[p.section])&&COTILLON_INNER[p.section].includes(p.inner),'Categoría interna desconocida en el Excel.');
 });
 return source.products;
}
function cotillonExcel2026Status_(){
 const ss=SpreadsheetApp.openById(config_('SPREADSHEET_ID')),sheet=ss.getSheetByName('cotillon');
 need_(sheet,'Falta la pestaña cotillon. No ejecutes otras funciones y revisá las pestañas de la hoja.');
 const all=rows_('cotillon'),batch=all.filter(p=>p.importBatch===COTILLON_EXCEL_2026_BATCH);
 return {estado:config_('COTILLON_EXCEL_2026_STATE')||'sin_iniciar',productosNuevos:batch.length,conFoto:batch.filter(p=>!!p.image&&!!p.thumbnail).length,pendientes:batch.filter(p=>!!p.sourceImage&&(!p.image||!p.thumbnail)&&!p.imageImportError).length,fallidas:batch.filter(p=>!!p.imageImportError).length,sinFotoEnRevision:batch.filter(p=>p.photoReview&&!p.image).length,publicadas:batch.filter(p=>p.active).length,anterioresArchivadosEn:config_('COTILLON_EXCEL_2026_ARCHIVE_SHEET')||'',errores:batch.filter(p=>p.imageImportError).slice(0,5).map(p=>({nombre:p.name,error:p.imageImportError}))};
}
function estadoImportacionCotillonExcel2026(){const status=cotillonExcel2026Status_();console.log(JSON.stringify(status));return status;}
function iniciarImportacionCotillonExcel2026(){
 need_(config_('SPREADSHEET_ID'),'Falta SPREADSHEET_ID en Propiedades del script.');
 if(config_('COTILLON_EXCEL_2026_STATE')&&config_('COTILLON_EXCEL_2026_STATE')!=='preparando')return lock_(()=>{
  if(config_('COTILLON_EXCEL_2026_STATE')==='photos'&&!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='procesarFotosCotillonExcel2026'))ScriptApp.newTrigger('procesarFotosCotillonExcel2026').timeBased().everyMinutes(5).create();
  return cotillonExcel2026Status_();
 });
 need_(config_('CLOUDINARY_CLOUD_NAME')&&config_('CLOUDINARY_API_KEY')&&config_('CLOUDINARY_API_SECRET'),'Configurá primero las tres propiedades de Cloudinary. No se modificó la hoja.');
 const source=cotillonExcel2026Source_(); // Verifica cantidad y SHA-256 antes de cualquier escritura.
 const summary=lock_(()=>{
  const state=config_('COTILLON_EXCEL_2026_STATE');
  if(state&&state!=='preparando'){
   if(state==='photos'&&!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='procesarFotosCotillonExcel2026'))ScriptApp.newTrigger('procesarFotosCotillonExcel2026').timeBased().everyMinutes(5).create();
   return cotillonExcel2026Status_();
  }
  ensureCotillonDepth3_();
  // Resuelve cualquier descuento de stock interrumpido antes de archivar los productos anteriores.
  recoverStock_();
  const ss=SpreadsheetApp.openById(config_('SPREADSHEET_ID')),current=ss.getSheetByName('cotillon');
  need_(current,'Falta la pestaña cotillon; no se modificó nada.');
  const existing=rows_('cotillon');
  if(existing.some(p=>p.importBatch===COTILLON_EXCEL_2026_BATCH)){
   need_(existing.filter(p=>p.importBatch===COTILLON_EXCEL_2026_BATCH).length===790,'La carga anterior quedó incompleta. Conservá las pestañas y revisá el estado antes de continuar.');
   need_(config_('COTILLON_EXCEL_2026_ARCHIVE_SHEET')&&ss.getSheetByName(config_('COTILLON_EXCEL_2026_ARCHIVE_SHEET')),'Falta la pestaña de respaldo de la carga anterior.');
   props_().setProperty('COTILLON_EXCEL_2026_STATE','photos');
   if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='procesarFotosCotillonExcel2026'))ScriptApp.newTrigger('procesarFotosCotillonExcel2026').timeBased().everyMinutes(5).create();
   return cotillonExcel2026Status_();
  }
  const categories=categories_('cotillon');
  const staged=source.map(p=>{
   const group=Object.keys(COTILLON_GROUPS).find(name=>categoryKey_(name)===categoryKey_(p.group));
   const section=categories.find(c=>c.group===group&&!c.parentId&&c.name===p.section&&c.storefront!==false);
   need_(!p.section||section,'Falta la categoría '+group+' › '+p.section+' en Google Sheets.');
   const inner=p.inner?categories.find(c=>c.parentId===section.id&&c.name===p.inner&&c.storefront!==false):null;
   need_(!p.inner||inner,'Falta la categoría interna '+p.inner+' en Google Sheets.');
   const category=inner||section;
   const product={id:'excel-'+p.sourceId,area:'cotillon',name:p.name,description:p.description,categoryId:category?.id||'',categoryIds:category?[...new Set([category.id,...(inner?[section.id]:[])])]:[],category:category?categoryPath_(category,categories):'Descartables',catalogGroups:[group],mode:'venta',price:p.price,priceKnown:true,rentPrice:0,stock:p.stock,stockUnknown:false,image:'',thumbnail:'',active:false,sourceId:p.sourceId,sourceImage:p.photoReview?'':p.sourceImage,sourceImageReviewUrl:p.photoReview?p.sourceImage:'',photoReview:p.photoReview===true,sku:p.sku||'',excelRow:p.excelRow,importBatch:COTILLON_EXCEL_2026_BATCH};
   need_(JSON.stringify(product).length<48000,'Producto demasiado grande: '+p.name);
   return [product.id,JSON.stringify(product)];
  });
  const stageName='_cotillon_preparado_excel_2026';
  let stage=ss.getSheetByName(stageName);
  if(stage){need_(stage.getLastRow()<2||stage.getRange(1,1,1,2).getValues()[0].join('|')==='id|registro_json','Existe una pestaña de preparación ajena. Revisala antes de continuar.');stage.clearContents();}
  else stage=ss.insertSheet(stageName);
  stage.getRange(1,1,1,2).setValues([['id','registro_json']]);
  stage.setFrozenRows(1);
  stage.getRange(2,1,staged.length,2).setValues(staged);
  SpreadsheetApp.flush();
  const readback=stage.getRange(2,1,staged.length,2).getValues();
  need_(stage.getLastRow()===791&&readback.every((row,i)=>row[0]===staged[i][0]&&row[1]===staged[i][1]),'No se pudo verificar la pestaña preparada. Cotillón anterior sigue intacto.');
  const archiveName='cotillon_archivo_'+Utilities.formatDate(new Date(),'America/Argentina/Buenos_Aires','yyyyMMdd_HHmmss')+'_'+Utilities.getUuid().slice(0,6);
  props_().setProperties({COTILLON_EXCEL_2026_STATE:'preparando',COTILLON_EXCEL_2026_ARCHIVE_SHEET:archiveName});
  current.setName(archiveName);
  try{stage.setName('cotillon');}catch(error){current.setName('cotillon');throw error;}
  props_().setProperties({COTILLON_EXCEL_2026_STATE:'photos',COTILLON_EXCEL_2026_ARCHIVE_SHEET:archiveName,COTILLON_EXCEL_2026_SOURCE_SHA256:COTILLON_EXCEL_2026_SHA256});
  // El disparador anterior ya no debe trabajar sobre el nuevo lote.
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='procesarFotosCotillon').forEach(t=>ScriptApp.deleteTrigger(t));
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='procesarFotosCotillonExcel2026'))ScriptApp.newTrigger('procesarFotosCotillonExcel2026').timeBased().everyMinutes(5).create();
  return {estado:'photos',importados:staged.length,anterioresArchivados:existing.length,pestañaRespaldo:archiveName};
 });
 console.log(JSON.stringify(summary));
 return summary;
}
function procesarFotosCotillonExcel2026(){return lock_(()=>{
 if(config_('COTILLON_EXCEL_2026_STATE')==='ready')return cotillonExcel2026Status_();
 need_(config_('COTILLON_EXCEL_2026_STATE')==='photos','Esta importación no está en la etapa de fotos.');
 const sheet=sheet_('cotillon'),last=sheet.getLastRow();
 need_(last>=2,'No hay productos nuevos para procesar.');
 const data=sheet.getRange(2,1,last-1,2).getValues();
 const items=data.map((row,index)=>({row:index+2,product:JSON.parse(row[1])})).filter(item=>item.product.importBatch===COTILLON_EXCEL_2026_BATCH);
 need_(items.length===790,'El lote nuevo está incompleto: se esperaban 790 productos.');
 const pending=items.filter(item=>item.product.sourceImage&&(!item.product.image||!item.product.thumbnail)&&!item.product.imageImportError).slice(0,10);
 const result={procesadas:0,fallidas:0};
 pending.forEach(item=>{
  const p=item.product;
  try{Object.assign(p,subirFotoCotillon_(p.sourceImage,'excel-2026-'+p.sourceId));result.procesadas++;}
  catch(error){p.imageImportError=String(error.message||error).slice(0,200);result.fallidas++;}
  sheet.getRange(item.row,1,1,2).setValues([[p.id,JSON.stringify(p)]]);
 });
 SpreadsheetApp.flush();
 const missing=items.filter(item=>item.product.sourceImage&&(!item.product.image||!item.product.thumbnail)&&!item.product.imageImportError).length;
 const failed=items.filter(item=>!!item.product.imageImportError).length;
 if(!missing){
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='procesarFotosCotillonExcel2026').forEach(t=>ScriptApp.deleteTrigger(t));
  if(failed)props_().setProperty('COTILLON_EXCEL_2026_STATE','photo_errors');
  else{
   need_(items.every(item=>item.product.photoReview&&!item.product.image||/^https:\/\/res\.cloudinary\.com\//.test(item.product.image)&&/^https:\/\/res\.cloudinary\.com\//.test(item.product.thumbnail)),'Al menos una foto o miniatura no está en Cloudinary.');
   const updated=new Map(items.map(item=>[item.row,item.product]));
   const published=data.map((row,index)=>{const p=updated.get(index+2)||JSON.parse(row[1]);if(p.importBatch===COTILLON_EXCEL_2026_BATCH)p.active=true;return [p.id,JSON.stringify(p)];});
   sheet.getRange(2,1,published.length,2).setValues(published);SpreadsheetApp.flush();
   props_().setProperty('COTILLON_EXCEL_2026_STATE','ready');
  }
 }
 const status={...result,...cotillonExcel2026Status_()};console.log(JSON.stringify(status));return status;
});}
function reintentarFotosCotillonExcel2026(){
 const reset=lock_(()=>{
  need_(config_('COTILLON_EXCEL_2026_STATE')==='photo_errors','No hay una importación con fotos fallidas.');
  const sheet=sheet_('cotillon'),data=sheet.getRange(2,1,sheet.getLastRow()-1,2).getValues();let count=0;
  data.forEach((row,index)=>{const p=JSON.parse(row[1]);if(p.importBatch!==COTILLON_EXCEL_2026_BATCH||!p.imageImportError)return;delete p.imageImportError;sheet.getRange(index+2,1,1,2).setValues([[p.id,JSON.stringify(p)]]);count++;});
  SpreadsheetApp.flush();props_().setProperty('COTILLON_EXCEL_2026_STATE','photos');
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='procesarFotosCotillonExcel2026'))ScriptApp.newTrigger('procesarFotosCotillonExcel2026').timeBased().everyMinutes(5).create();
  return {reintentosHabilitados:count};
 });console.log(JSON.stringify(reset));return reset;
}
