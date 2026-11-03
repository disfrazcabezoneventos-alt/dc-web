/* Roles, cuentas individuales y auditoría. Propiedades privadas; nunca devolver hashes. */
const CATALOG_PBKDF2_ITERATIONS=600000;
const CATALOG_PUBLIC_ACTIONS=['siteTheme','catalog','catalogData','login','bank','submit','submitLocal','localConfig','request','file','correct','cancel','viewLocalReceipt','rentalConfig','recordSearchMiss'];
const CATALOG_EDITOR_ACTIONS=['admin','logout','saveProduct','quickUpdate','uploadImage','publishProduct'];
const CATALOG_ADMIN_ACTIONS=['admin','logout','saveCategory','mapLegacyCategory','deleteCategory','saveProduct','deleteProduct','uploadImage','status','movement','voidMovement','resolveCancel','bankSettings','setSiteTheme','setHalloweenCampaign','incomingForms','incomingRequest','incomingNotifications','dismissFormNotifications','saveRentalPrices','updateIncomingForm','deleteIncomingForm','incomingFile','localReceiptInfo','issueLocalReceipt','sendLocalReceipt','quickUpdate','catalogUsers','createCatalogUser','setCatalogUserActive','resetCatalogUserPassword','productHistory','restoreProductPhoto','restoreRentalCatalogChange','publishProduct','recoverProductHistory','saveRentalPromotion','searchDemand'];
function catalogRolesReady_(){return config_('CATALOG_ROLES_ENABLED')==='yes';}
function catalogPrivateJson_(raw){try{return JSON.parse(raw)}catch(_){throw new Error('Configuración de cuentas inválida. Consultá al administrador.');}}
function catalogAccount_(id){const raw=config_('CATALOG_USER_'+id);return raw?catalogPrivateJson_(raw):null;}
function catalogAccounts_(){const all=props_().getProperties();return Object.keys(all).filter(k=>k.startsWith('CATALOG_USER_')).map(k=>catalogPrivateJson_(all[k]));}
function catalogAccountView_(u){return {id:u.id,username:u.username,role:'editor',active:u.active,createdAt:u.createdAt,updatedAt:u.updatedAt};}
function passwordRecord_(password){
 need_(typeof password==='string'&&password.length>=12&&password.length<=128,'La contraseña debe tener entre 12 y 128 caracteres.');
 need_(typeof DcPasswords!=='undefined','Agregá AuthCrypto.gs antes de preparar los roles.');
 const salt=hash_(Utilities.getUuid()+Utilities.getUuid());
 return {algorithm:'pbkdf2-sha256',iterations:CATALOG_PBKDF2_ITERATIONS,salt,hash:DcPasswords.derive(password,salt,CATALOG_PBKDF2_ITERATIONS)};
}
function passwordMatches_(password,record){return typeof password==='string'&&password.length<=128&&record&&record.algorithm==='pbkdf2-sha256'&&Number.isInteger(record.iterations)&&record.iterations>=100000&&record.iterations<=1000000&&equal_(DcPasswords.derive(password,record.salt,record.iterations),record.hash);}
function medirHashCatalogo_(iterations=CATALOG_PBKDF2_ITERATIONS){
 need_(typeof DcPasswords!=='undefined','Falta AuthCrypto.gs.');
 need_(Number.isInteger(iterations)&&iterations>=100000&&iterations<=1000000,'Costo de ensayo inválido.');
 const ficticia='ensayo-'+Utilities.getUuid(),salt=hash_(Utilities.getUuid()+Utilities.getUuid());
 const start=Date.now();DcPasswords.derive(ficticia,salt,iterations);const ms=Date.now()-start;
 console.log(JSON.stringify({iterations,ms}));return ms;
}
function catalogSessionVersion_(u){return hash_(JSON.stringify([u.id,u.username,u.active,u.password,u.sessionVersion]));}
function catalogIdentity_(token){
 need_(typeof token==='string'&&token.length>30,'Sesión vencida. Volvé a ingresar.');
 const cache=CacheService.getScriptCache(),key='session:'+hash_(token),raw=cache.get(key);
 if(equal_(raw,adminSessionVersion_()))return {id:'administrator',username:config_('ADMIN_USER'),role:'admin'};
 let s;try{s=JSON.parse(raw||'null')}catch(_){}
 const u=s&&s.role==='editor'&&catalogRolesReady_()?catalogAccount_(s.id):null;
 if(u&&u.active&&equal_(s.version,catalogSessionVersion_(u)))return {id:u.id,username:u.username,role:'editor'};
 cache.remove(key);throw new Error('Sesión vencida. Volvé a ingresar.');
}
function catalogApiActor_(b){
 if(b.action==='login')return null;
 const isPublic=CATALOG_PUBLIC_ACTIONS.includes(b.action);
 if(isPublic&&!b.token)return null;
 const actor=session_(b.token,true);
 const allowed=actor.role==='admin'?CATALOG_ADMIN_ACTIONS.concat(CATALOG_PUBLIC_ACTIONS):CATALOG_EDITOR_ACTIONS.concat(['siteTheme','catalog','catalogData']);
 need_(allowed.includes(b.action),'No tenés permiso para esta acción.');
 return actor;
}
function catalogLogin_(b){
 const username=String(b.username||'').trim().toLowerCase(),password=b.password;
 limit_('login-global',60,900);limit_('login:'+username,8,900);
 need_(typeof password==='string'&&password.length<=128,'Usuario o contraseña incorrectos.');
 let identity,version;
 if(username===config_('ADMIN_USER').trim().toLowerCase()){
  const stored=config_('ADMIN_PASSWORD_RECORD'),record=stored?catalogPrivateJson_(stored):null;
  const valid=record?passwordMatches_(password,record):config_('ADMIN_PASSWORD').length>=12&&equal_(hash_(password),hash_(config_('ADMIN_PASSWORD')));
  need_(valid,'Usuario o contraseña incorrectos.');identity={id:'administrator',username:config_('ADMIN_USER'),role:'admin'};version=adminSessionVersion_();
 }else{
  const u=catalogRolesReady_()?catalogAccounts_().find(u=>u.username===username):null;
  need_(u&&u.active&&passwordMatches_(password,u.password),'Usuario o contraseña incorrectos.');
  identity={id:u.id,username:u.username,role:'editor'};version=JSON.stringify({id:u.id,role:'editor',version:catalogSessionVersion_(u)});
 }
 const token=Utilities.getUuid()+Utilities.getUuid();CacheService.getScriptCache().put('session:'+hash_(token),version,21600);return {token,user:identity};
}
function prepararRolesCatalogo_(){
 return lock_(()=>{
  need_(config_('SPREADSHEET_ID'),'Configurá la hoja de ensayo o la hoja autorizada.');
  need_(typeof DcPasswords!=='undefined','Falta AuthCrypto.gs.');
  if(!config_('ADMIN_PASSWORD_RECORD')){
   const record=passwordRecord_(config_('ADMIN_PASSWORD'));props_().setProperty('ADMIN_PASSWORD_RECORD',JSON.stringify(record));
  }
  props_().deleteProperty('ADMIN_PASSWORD');
  const ss=SpreadsheetApp.openById(config_('SPREADSHEET_ID'));
  if(!ss.getSheetByName('historial_cambios')){const sheet=ss.insertSheet('historial_cambios');sheet.appendRow(['id','registro_json']);sheet.setFrozenRows(1);}
  props_().setProperty('CATALOG_ROLES_ENABLED','yes');return {ready:true,credentials:'hash-and-salt',productsChanged:0};
 });
}
function catalogAccessDispatch_(b,actor){
 if(!['catalogUsers','createCatalogUser','setCatalogUserActive','resetCatalogUserPassword','productHistory','restoreProductPhoto','restoreRentalCatalogChange','publishProduct','recoverProductHistory'].includes(b.action))return null;
 need_(actor&&(actor.role==='admin'||actor.role==='editor'&&b.action==='publishProduct'),'No tenés permiso para esta acción.');
 need_(catalogRolesReady_(),'Ejecutá prepararRolesCatalogo_ en la hoja autorizada.');
 if(b.action==='recoverProductHistory')return {data:recoverCatalogHistory_({historyId:b.historyId,mode:b.mode})};
 if(b.action==='catalogUsers')return {data:catalogAccounts_().map(catalogAccountView_)};
 if(b.action==='createCatalogUser'){
  const username=String(b.username||'').trim().toLowerCase();need_(/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username),'Usuario: 3 a 50 letras, números, punto, guion o guion bajo.');
  need_(username!==config_('ADMIN_USER').trim().toLowerCase()&&!catalogAccounts_().some(u=>u.username===username),'Ese usuario ya existe.');
  const u={id:Utilities.getUuid(),username,role:'editor',active:true,password:passwordRecord_(b.password),sessionVersion:Utilities.getUuid(),createdAt:now_(),updatedAt:now_()};
  props_().setProperty('CATALOG_USER_'+u.id,JSON.stringify(u));return {data:catalogAccountView_(u)};
 }
 if(['setCatalogUserActive','resetCatalogUserPassword'].includes(b.action)){
  const u=catalogAccount_(String(b.id||''));need_(u,'Usuario inexistente.');
  if(b.action==='setCatalogUserActive'){need_(typeof b.active==='boolean','Estado inválido.');u.active=b.active;}else u.password=passwordRecord_(b.password);
  u.sessionVersion=Utilities.getUuid();u.updatedAt=now_();props_().setProperty('CATALOG_USER_'+u.id,JSON.stringify(u));return {data:catalogAccountView_(u)};
 }
 if(b.action==='productHistory'){
  need_(!b.cursor||typeof b.cursor==='string'&&b.cursor.length<150,'Cursor inválido.');
  const key=h=>h.at+'|'+h.id,all=rows_('historial_cambios').filter(h=>(!b.area||h.area===b.area)&&(!b.productId||h.productId===b.productId||h.action==='category_bulk'&&h.products.some(p=>p.id===b.productId))).sort((a,b)=>key(b).localeCompare(key(a)));
  const available=all.filter(h=>!b.cursor||key(h)<b.cursor),entries=available.slice(0,100);
  return {data:{entries,nextCursor:available.length>100?key(entries.at(-1)):null,pendingCount:all.filter(h=>h.status==='pending').length}};
 }
 need_(CATEGORY_AREAS.includes(b.area),'Área inválida.');const p=rows_(b.area).find(p=>p.id===b.id);need_(p,'Producto inexistente.');
 need_(hash_(JSON.stringify(p))===b.revision,'El producto cambió. Recargá antes de continuar.');
 if(b.action==='publishProduct'){
  need_(p.publicationState==='draft','El producto no es un borrador.');need_(p.image&&p.name,'El borrador necesita nombre y foto.');
  return {data:catalogWriteProduct_(actor,b.area,p,{...p,publicationState:'published',active:true},'publish',b.operationId)};
 }
 const h=rows_('historial_cambios').find(h=>h.id===b.historyId&&h.area===b.area&&h.productId===b.id&&h.status==='committed');
 if(b.action==='restoreRentalCatalogChange'){
  need_(h&&h.action==='rental_catalog_correction'&&h.batch==='PR37-20261103'&&h.before&&h.after,'Elegí una corrección de alquiler del PR37.');
  const allowed=['rentPrice','insuranceDeposit','tariff','categoryId','categoryIds','category'];
  const fields=Object.keys(h.changes||{});
  need_(fields.length>0&&fields.every(k=>allowed.includes(k)),'Campos de corrección inválidos.');
  const after={...p};
  for(const key of fields){
   need_(JSON.stringify(p[key])===JSON.stringify(h.after[key]),'El campo '+key+' cambió después de la corrección. Revisalo antes de deshacer.');
   if(Object.prototype.hasOwnProperty.call(h.before,key))after[key]=h.before[key];else delete after[key];
  }
  const result=catalogWriteProduct_(actor,b.area,p,after,'undo_rental_catalog_correction',b.operationId);
  return {data:result};
 }
 need_(h&&h.changes.image&&h.changes.image.before,'No hay una foto anterior para restaurar.');
 const image=h.changes.image.before;need_(/^https:\/\/res\.cloudinary\.com\//.test(image)||image.startsWith('/catalog/'),'La foto histórica no tiene una URL permitida.');
 return {data:catalogWriteProduct_(actor,b.area,p,{...p,image,thumbnail:h.before.thumbnail||''},'restore_photo',b.operationId)};
}
function catalogPublicProduct_(p){return !p.publicationState||p.publicationState==='published';}
function catalogEditorProduct_(p){
 const keys=['id','area','name','description','category','categoryId','categoryIds','categoryNames','catalogGroups','mode','saleCondition','deliveryTime','orderLimit','price','rentPrice','priceKnown','stockUnknown','stock','image','thumbnail','active','publicationState','revision'];
 return Object.fromEntries(keys.filter(k=>Object.prototype.hasOwnProperty.call(p,k)).map(k=>[k,p[k]]));
}
function catalogProductsForManagement_(){return CATEGORY_AREAS.flatMap(area=>{const raw=new Map(rows_(area).map(p=>[p.id,p]));return products_(area).map(p=>({...p,revision:hash_(JSON.stringify(raw.get(p.id)))}));});}
function catalogOptionalText_(value,max){need_(typeof value==='string'&&value.length<=max,'Texto inválido.');return value.trim();}
function catalogSaveProduct_(b,actor){
 const p=b.product;need_(p&&CATEGORY_AREAS.includes(p.area),'Área inválida.');
 const old=p.id?rows_(p.area).find(x=>x.id===p.id):null;need_(!p.id||old,'Producto inexistente.');
 if(old&&(p.revision||b.revision))need_((p.revision||b.revision)===hash_(JSON.stringify(old)),'El producto cambió. Recargá antes de guardar.');
 const editor=actor.role==='editor',input={...(old||{}),...p};
 if(editor){
  const editable=['name','description','price','rentPrice','categoryId','categoryIds','category','image','thumbnail'];
  if(old){
   need_(p.revision===hash_(JSON.stringify(old)),'El producto cambió. Recargá antes de guardar.');
   const view=catalogEditorProduct_({...products_(p.area).find(x=>x.id===p.id),revision:hash_(JSON.stringify(old))});
   Object.keys(p).filter(k=>!editable.includes(k)).forEach(k=>need_(Object.prototype.hasOwnProperty.call(view,k)&&JSON.stringify(p[k])===JSON.stringify(view[k]),'El editor no puede cambiar '+k+'.'));
  }else{
   need_(p.stock===undefined||p.stock===0,'Un producto nuevo del editor debe tener stock cero.');
   need_(p.active===undefined||typeof p.active==='boolean','Estado inválido.');
   need_(p.publicationState===undefined||['draft','published'].includes(p.publicationState),'Estado de publicación inválido.');
   const allowed=editable.concat(['id','area','stock','active','mode','saleCondition','deliveryTime','orderLimit','priceKnown','stockUnknown','publicationState']);
   need_(Object.keys(p).every(k=>allowed.includes(k)),'Campo no permitido para crear el producto.');
  }
  need_(typeof input.image==='string'&&input.image.length>0,'El editor no puede dejar un producto sin foto.');
 }
 need_(['venta','alquiler','ambos'].includes(input.mode)&&(p.area!=='cotillon'||input.mode==='venta'),'Modalidad inválida.');
 const stock=old&&editor?old.stock:(input.stock??0);need_(Number.isInteger(stock)&&stock>=0&&stock<=100000,'Stock inválido.');
 const image=String(input.image||''),thumbnail=String(input.thumbnail||'');
 need_(image.length<=2000&&(!image||image===old?.image||/^https:\/\/res\.cloudinary\.com\//.test(image)),'Usá una imagen de Cloudinary.');
 need_(thumbnail.length<=2000&&(!thumbnail||thumbnail===old?.thumbnail||/^https:\/\/res\.cloudinary\.com\//.test(thumbnail)),'Usá una miniatura de Cloudinary.');
 need_(!old||!Object.prototype.hasOwnProperty.call(p,'publicationState')||p.publicationState===old.publicationState,'Usá Publicar borrador para cambiar su publicación.');
 const categories=categories_(p.area);
 const secondary=Array.isArray(p.categoryIds)?p.categoryIds:(old?productCategoryIds_(old).filter(id=>id!==old.categoryId):[]);
 const requested=[...new Set([input.categoryId,...secondary].filter(Boolean))];
 need_(requested.every(id=>typeof id==='string'&&categories.some(c=>c.id===id)),'Elegí categorías existentes.');
 const category=categories.find(c=>c.id===(input.categoryId||requested[0]));
 const saleCondition=p.area==='disfraces'&&input.mode!=='alquiler'?String(input.saleCondition||''):'';
 need_(!saleCondition||['Nuevo a pedido','Nuevo Inmediato','Usado inmediato'].includes(saleCondition),'Condición de venta inválida.');
 const deliveryTime=saleCondition==='Nuevo a pedido'?text_(input.deliveryTime||'aproximadamente 1 mes',120):'';
 const orderLimit=saleCondition==='Nuevo a pedido'?(Number.isInteger(input.orderLimit)?input.orderLimit:(stock>0?stock:1)):0;
 need_(saleCondition!=='Nuevo a pedido'||orderLimit>=1&&orderLimit<=100000,'Límite de pedidos inválido.');
 const groups=[...new Set(requested.map(id=>categories.find(c=>c.id===id)?.group).filter(Boolean))];
 const after={...(old||{}),id:old?.id||b.operationId||Utilities.getUuid(),area:p.area,name:text_(input.name,150),description:catalogOptionalText_(input.description??'',2000),categoryId:category?.id||'',categoryIds:requested,category:category?category.name:old?.catalogGroups?.length?old.category:'',catalogGroups:p.area==='cotillon'?(groups.length?groups:old?.catalogGroups||[]):[],mode:input.mode,saleCondition,deliveryTime,orderLimit,price:input.mode==='alquiler'?0:amount_(input.price??0),rentPrice:input.mode==='venta'?0:amount_(input.rentPrice??0),priceKnown:p.area==='cotillon'?input.priceKnown!==false:true,stockUnknown:p.area==='cotillon'&&input.stockUnknown===true,stock:editor?stock:saleCondition==='Nuevo a pedido'&&input.mode==='venta'?0:stock,image,thumbnail:image?thumbnail:'',active:editor&&!old?input.publicationState!=='draft'&&input.active!==false:!!input.active};
 if(!old&&editor)after.publicationState=input.publicationState==='draft'?'draft':'published';
 else if(!old&&input.publicationState==='draft')after.publicationState='draft';
 // Existing editor changes are restricted even if a normalizer would alter a legacy field.
 if(editor&&old)for(const key of ['mode','saleCondition','deliveryTime','orderLimit','priceKnown','stockUnknown','stock','active','publicationState']){
  if(Object.prototype.hasOwnProperty.call(old,key))after[key]=old[key];else delete after[key];
 }
 return catalogWriteProduct_(actor,p.area,old,after,old?'edit':'create',b.operationId);
}
function catalogWriteProduct_(actor,area,before,after,action,operationId){
 const raw=()=>{const previous=CATALOG_WRITE_DIRECT_;CATALOG_WRITE_DIRECT_=true;try{return after?put_(area,after):remove_(area,before.id)}finally{CATALOG_WRITE_DIRECT_=previous;}};
 const collision=!before&&after?rows_(area).find(p=>p.id===after.id):null;
 if(!catalogRolesReady_()){need_(!collision,'Ya existe un producto con ese identificador.');return raw();}
 const changes={};for(const key of new Set([...Object.keys(before||{}),...Object.keys(after||{})]))if(JSON.stringify(before?.[key])!==JSON.stringify(after?.[key]))changes[key]={before:before?.[key]??null,after:after?.[key]??null};
 if(!Object.keys(changes).length)return after;
 const id=operationId||Utilities.getUuid();need_(/^[a-f0-9-]{36}$/.test(id),'Identificador de cambio inválido.');
 const productId=after?.id||before.id,history=rows_('historial_cambios'),existing=history.find(h=>h.id===id);
 if(existing){need_(existing.area===area&&existing.productId===productId&&existing.actor.id===actor.id&&JSON.stringify(existing.after)===JSON.stringify(after),'Conflicto de cambio. Recargá el producto.');if(existing.status==='committed')return after;}
 need_(!collision||existing&&JSON.stringify(collision)===JSON.stringify(existing.after),'Ya existe un producto con ese identificador.');
 need_(!history.some(h=>h.area===area&&h.status==='pending'&&h.id!==id&&(h.productId===productId||h.action==='category_bulk'&&h.products.some(p=>p.id===productId))),'Hay un cambio pendiente. El administrador debe recuperarlo desde Historial.');
 const h=existing||{id,area,productId,productName:after?.name||before.name,actor:{id:actor.id,username:actor.username,role:actor.role},action,at:now_(),before:before||null,after,changes,status:'pending'};
 put_('historial_cambios',h);raw();h.status='committed';put_('historial_cambios',h);return after;
}
function recuperarHistorialCatalogo_(){return lock_(recoverCatalogHistory_);}
// Solo desde el editor de Apps Script, tras aprobación y revisión de disparadores.
// Las tres tareas creadas por este repositorio conservan su intervalo de 5 minutos.
function migrarDisparadoresCatalogo_(){
 const handlers=['procesarFotosCotillon','procesarFotosCotillonExcel2026','procesarFotosAgotadosCotillonExcel2026'];
 const triggers=ScriptApp.getProjectTriggers(),known=new Set(triggers.map(t=>t.getHandlerFunction()));let migrated=0;
 for(const old of triggers){
  const name=old.getHandlerFunction();if(!handlers.includes(name))continue;
  need_(old.getEventType()===ScriptApp.EventType.CLOCK,'Revisá manualmente el disparador '+name+'.');
  if(!known.has(name+'_')){ScriptApp.newTrigger(name+'_').timeBased().everyMinutes(5).create();known.add(name+'_');}
  ScriptApp.deleteTrigger(old);migrated++;
 }
 return {migrated,manualReview:triggers.filter(t=>!t.getHandlerFunction().endsWith('_')&&!handlers.includes(t.getHandlerFunction())).map(t=>t.getHandlerFunction())};
}
function recoverCatalogHistory_(options={}){
 need_(catalogRolesReady_(),'Prepará roles primero.');
 need_(!options.mode||['forward','rollback'].includes(options.mode),'Modo de recuperación inválido.');
 need_(!options.historyId||typeof options.historyId==='string','Identificador de historial inválido.');
 const history=catalogBulkRead_('historial_cambios');let recovered=0;
 if(options.historyId){
  const entry=history.records.find(h=>h.id===options.historyId);
  need_(entry&&entry.action==='category_bulk','Elegí un cambio de categoría en lote.');
  const mode=options.mode||'forward';
  recovered=catalogRecoverBulk_(history,entry,mode);return {recovered};
 }
 need_(options.mode!=='rollback','Elegí el lote que querés deshacer.');
 const seen=new Set();
 for(const entry of history.records.filter(h=>h.action==='category_bulk'&&h.status==='pending')){
  if(seen.has(entry.operationId))continue;seen.add(entry.operationId);
  recovered+=catalogRecoverBulk_(history,entry,entry.direction||'forward');
 }
  for(const h of history.records.filter(h=>h.action!=='category_bulk'&&h.status==='pending')){
   const current=rows_(h.area).find(p=>p.id===h.productId)||null;
   need_(JSON.stringify(current)===JSON.stringify(h.before)||JSON.stringify(current)===JSON.stringify(h.after),'Conflicto en '+h.productId+': revisar manualmente antes de recuperar.');
   if(JSON.stringify(current)!==JSON.stringify(h.after)){
    const previous=CATALOG_WRITE_DIRECT_;CATALOG_WRITE_DIRECT_=true;
    try{if(h.after)put_(h.area,h.after);else remove_(h.area,h.productId);}finally{CATALOG_WRITE_DIRECT_=previous;}
   }
   h.status='committed';put_('historial_cambios',h);recovered++;
  }return {recovered};

}

// Snapshot y escrituras por rango. Los productos ajenos al cambio conservan su JSON exacto.
function catalogBulkRead_(name){
 const sheet=sheet_(name),count=Math.max(0,sheet.getLastRow()-1);
 const values=count?sheet.getRange(2,1,count,2).getValues():[];
 const records=values.map(row=>JSON.parse(row[1]));
 need_(new Set(records.map(r=>r.id)).size===records.length,'La tabla tiene identificadores duplicados. Revisala antes de continuar.');
 return {name,sheet,values,records};
}
function catalogBulkWrite_(state,updates){
 if(!updates.size)return;
 const remaining=new Map(updates),next=[];
 for(const row of state.values){
  if(!remaining.has(row[0])){next.push(row);continue;}
  const value=remaining.get(row[0]);remaining.delete(row[0]);
  if(value!==null){const raw=JSON.stringify(value);need_(raw.length<48000,'El registro excede el tamaño permitido.');next.push([value.id,raw]);}
 }
 for(const value of remaining.values())if(value!==null){const raw=JSON.stringify(value);need_(raw.length<48000,'El registro excede el tamaño permitido.');next.push([value.id,raw]);}
 const count=Math.max(state.values.length,next.length);let first=-1,last=-1;
 for(let i=0;i<count;i++)if(JSON.stringify(state.values[i]||['',''])!==JSON.stringify(next[i]||['',''])){if(first<0)first=i;last=i;}
 if(first>=0)state.sheet.getRange(first+2,1,last-first+1,2).setValues(Array.from({length:last-first+1},(_,i)=>next[first+i]||['','']));
 state.values=next;state.records=next.map(row=>JSON.parse(row[1]));
}
function catalogCategoryState_(product){
 return Object.fromEntries(['categoryId','category','categoryIds'].filter(k=>Object.prototype.hasOwnProperty.call(product,k)).map(k=>[k,product[k]]));
}
function catalogCategoryApply_(product,state){
 const after={...product};for(const key of ['categoryId','category','categoryIds'])if(!Object.prototype.hasOwnProperty.call(state,key))delete after[key];return Object.assign(after,state);
}
function catalogBulkContext_(area){
 categoryTable_(area);return {area:catalogBulkRead_(area),categories:catalogBulkRead_(categoryTable_(area)),history:catalogRolesReady_()?catalogBulkRead_('historial_cambios'):null};
}
function catalogBulkEntries_(actor,area,kind,category,products,categories){
 const operationId=Utilities.getUuid(),base={operationId,action:'category_bulk',kind,area,categoryId:category.id,actor:{id:actor.id,username:actor.username,role:actor.role},at:now_(),productName:'Categoría '+category.name,changes:{},totalProducts:products.length,status:'pending',direction:'forward'};
 const entries=[];let entry={...base,id:Utilities.getUuid(),part:0,parts:999999,categories,products:[]};
 need_(JSON.stringify(entry).length<47000,'Los datos de la categoría exceden el tamaño permitido.');
 for(const product of products){
  if(JSON.stringify({...entry,products:entry.products.concat([product])}).length>=47000){
   need_(entry.products.length>0,'Los vínculos de un producto exceden el tamaño permitido.');entries.push(entry);
   entry={...base,id:Utilities.getUuid(),part:entries.length,parts:999999,categories:[],products:[]};
  }
  entry.products.push(product);need_(JSON.stringify(entry).length<47000,'Los vínculos de un producto exceden el tamaño permitido.');
 }
 entries.push(entry);entries.forEach(e=>{e.parts=entries.length;need_(JSON.stringify(e).length<48000,'El historial excede el tamaño permitido.');});return entries;
}
function catalogBulkPersist_(context,entries,products,categories,mode,isNew=false){
 const history=context.history;
 if(history&&(isNew||mode==='rollback')){
  const pending=entries.map(h=>({...h,status:'pending',direction:mode}));
  catalogBulkWrite_(history,new Map(pending.map(h=>[h.id,h])));entries=pending;
 }
 catalogBulkWrite_(context.area,products);catalogBulkWrite_(context.categories,categories);
 // Un único flush de los datos, antes de confirmar el historial. No hay flush por producto.
 SpreadsheetApp.flush();
 if(history)catalogBulkWrite_(history,new Map(entries.map(h=>[h.id,{...h,status:mode==='rollback'?'rolled_back':'committed',direction:mode}])));
}
function catalogBulkChange_(context,actor,area,kind,category,updates,categoryUpdates){
 const products=[...updates].map(([id,after])=>({id,before:catalogCategoryState_(context.area.records.find(p=>p.id===id)),after:catalogCategoryState_(after)}));
 const categories=[...categoryUpdates].map(([id,after])=>({id,before:context.categories.records.find(c=>c.id===id)||null,after})).filter(c=>JSON.stringify(c.before)!==JSON.stringify(c.after));
 if(!products.length&&!categories.length)return;
 const ids=new Set(products.map(p=>p.id));
 need_(!context.history?.records.some(h=>h.status==='pending'&&h.area===area&&(h.action==='category_bulk'||ids.has(h.productId))),'Hay un cambio pendiente. Recuperalo o deshacelo desde Historial antes de continuar.');
 // Validar todos los productos y el tamaño de todas las partes antes de escribir el diario.
 for(const value of [...updates.values(),...categoryUpdates.values()])need_(value===null||JSON.stringify(value).length<48000,'El registro excede el tamaño permitido.');
 const entries=context.history?catalogBulkEntries_(actor,area,kind,category,products,categories):[];
 catalogBulkPersist_(context,entries,updates,new Map(categories.map(c=>[c.id,c.after])),'forward',true);
}
function catalogBulkResume_(context,area,categoryId,kind){
 const pending=context.history?.records.find(h=>h.status==='pending'&&h.action==='category_bulk'&&h.area===area);
 if(!pending)return;
 need_(pending.categoryId===categoryId&&pending.kind===kind&&pending.direction!=='rollback','Hay otro lote pendiente. Recuperalo o deshacelo desde Historial.');
 catalogRecoverBulk_(context.history,pending,'forward',context);
}
function catalogRenameCategory_(actor,area,old,category){
 const context=catalogBulkContext_(area);catalogBulkResume_(context,area,category.id,'rename');
 const updates=new Map();
 for(const p of context.area.records){
  const primary=old&&(p.categoryId===category.id||(!p.categoryId&&categoryKey_(p.category)===categoryKey_(old.name)));
  if(primary&&(p.category!==category.name||p.categoryId!==category.id))updates.set(p.id,{...p,categoryId:category.id,category:category.name});
 }
 catalogBulkChange_(context,actor,area,'rename',category,updates,new Map([[category.id,category]]));
}
function catalogDeleteCategory_(b,actor){
 const area=b.area,context=catalogBulkContext_(area);
 const pending=context.history?.records.find(h=>h.status==='pending'&&h.action==='category_bulk'&&h.categoryId===b.id&&h.kind==='delete');
 if(pending){catalogBulkResume_(context,area,b.id,'delete');return {affected:pending.totalProducts,target:pending.categories.find(c=>c.after)?.after||null};}
 const all=context.categories.records,category=all.find(c=>c.id===b.id);need_(category,'Categoría inexistente.');
 if(area==='cotillon'){
  need_(!all.some(c=>c.mappedToCategoryId===b.id),'Esta subcategoría recibe productos de una categoría anterior. Cambiá primero esa vinculación.');
  need_(!all.some(c=>c.parentId===b.id),'Esta sección contiene subcategorías internas. Reorganizalas antes de eliminarla.');
 }
 const affected=context.area.records.filter(p=>linkedCategory_(p,category));
 need_(Number.isInteger(b.expectedCount)&&b.expectedCount===affected.length,'Cambió la cantidad de productos. Actualizá el panel y volvé a revisar.');
 need_(['otros','uncategorized','new'].includes(b.strategy),'Elegí qué hacer con los productos.');
 let target=null;const categoryUpdates=new Map([[category.id,null]]);
 if(b.strategy==='otros')target=all.find(c=>c.id!==category.id&&categoryKey_(c.name)==='otros')||{id:Utilities.getUuid(),area,name:'Otros'};
 if(b.strategy==='new')target={id:Utilities.getUuid(),area,name:categoryName_(b.newName,area,category.id)};
 if(target&&!all.some(c=>c.id===target.id))categoryUpdates.set(target.id,target);
 const updates=new Map();
 for(const p of affected){
  const ids=productCategoryIds_(p).filter(id=>id!==category.id);if(target&&!ids.includes(target.id))ids.push(target.id);
  const removedPrimary=p.categoryId===category.id||!p.categoryId;
  const primary=removedPrimary?(ids[0]||''):p.categoryId;
  const name=removedPrimary?(target?.id===primary?target.name:all.find(c=>c.id===primary)?.name||''):p.category;
  updates.set(p.id,{...p,categoryId:primary,categoryIds:ids,category:name});
 }
 catalogBulkChange_(context,actor,area,'delete',category,updates,categoryUpdates);return {affected:affected.length,target};
}
function catalogRecoverBulk_(history,entry,mode,existingContext){
 need_(['forward','rollback'].includes(mode),'Modo de recuperación inválido.');
 const group=history.records.filter(h=>h.action==='category_bulk'&&h.operationId===entry.operationId).sort((a,b)=>a.part-b.part);
 need_(group.length===entry.parts&&group.every((h,i)=>h.part===i&&h.parts===entry.parts&&h.area===entry.area),'El diario del lote está incompleto. Revisá el historial antes de recuperar.');
 if(mode==='rollback'&&group.every(h=>h.status==='rolled_back')||mode==='forward'&&group.every(h=>h.status!=='pending'))return 0;
 const context=existingContext||{area:catalogBulkRead_(entry.area),categories:catalogBulkRead_(categoryTable_(entry.area)),history};
 const currentProducts=new Map(context.area.records.map(p=>[p.id,p])),currentCategories=new Map(context.categories.records.map(c=>[c.id,c]));
 const products=new Map(),categories=new Map();
 for(const h of group){
  for(const change of h.products){
   const p=currentProducts.get(change.id),state=p&&catalogCategoryState_(p);
   need_(p&&(JSON.stringify(state)===JSON.stringify(change.before)||JSON.stringify(state)===JSON.stringify(change.after)),'Conflicto de categorías en '+change.id+': revisar antes de recuperar.');
   products.set(p.id,catalogCategoryApply_(p,mode==='rollback'?change.before:change.after));
  }
  for(const change of h.categories){
   const current=currentCategories.get(change.id)||null;
   need_(JSON.stringify(current)===JSON.stringify(change.before)||JSON.stringify(current)===JSON.stringify(change.after),'Conflicto en la categoría del lote: revisar antes de recuperar.');
   categories.set(change.id,mode==='rollback'?change.before:change.after);
  }
 }
 // No quitar una categoría que recibió otros productos después del lote, ni
 // restaurar un nombre que ahora ocupa otra categoría de la misma sección.
 const nextCategories=new Map(currentCategories);
 for(const [id,value] of categories){
  if(value===null){
   const category=currentCategories.get(id);
   need_(!category||!context.area.records.some(p=>!products.has(p.id)&&linkedCategory_(p,category)),'Conflicto: la categoría tiene otros productos vinculados.');
   nextCategories.delete(id);
  }else nextCategories.set(id,value);
 }
 for(const value of categories.values())if(value)need_(![...nextCategories.values()].some(c=>c.id!==value.id&&categoryKey_(c.name)===categoryKey_(value.name)&&(entry.area!=='cotillon'||(c.group||'')===(value.group||'')&&(c.parentId||'')===(value.parentId||''))),'Conflicto: ya existe otra categoría con ese nombre.');
 catalogBulkPersist_(context,group,products,categories,mode);return group.length;
}
