/* Roles, cuentas individuales y auditoría. Propiedades privadas; nunca devolver hashes. */
const CATALOG_PBKDF2_ITERATIONS=600000;
const CATALOG_PUBLIC_ACTIONS=['siteTheme','catalog','catalogData','login','bank','submit','submitLocal','localConfig','request','file','correct','cancel','viewLocalReceipt'];
const CATALOG_EDITOR_ACTIONS=['admin','logout','saveProduct','quickUpdate','uploadImage'];
const CATALOG_ADMIN_ACTIONS=['admin','logout','saveCategory','mapLegacyCategory','deleteCategory','saveProduct','deleteProduct','uploadImage','status','movement','voidMovement','resolveCancel','bankSettings','setSiteTheme','setHalloweenCampaign','incomingForms','incomingRequest','incomingNotifications','dismissFormNotifications','saveRentalPrices','updateIncomingForm','deleteIncomingForm','incomingFile','localReceiptInfo','issueLocalReceipt','sendLocalReceipt','quickUpdate','catalogUsers','createCatalogUser','setCatalogUserActive','resetCatalogUserPassword','productHistory','restoreProductPhoto','publishProduct','recoverProductHistory'];
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
function medirHashCatalogo_(){
 need_(typeof DcPasswords!=='undefined','Falta AuthCrypto.gs.');
 const ficticia='ensayo-'+Utilities.getUuid(),salt=hash_(Utilities.getUuid()+Utilities.getUuid());
 const start=Date.now();DcPasswords.derive(ficticia,salt,CATALOG_PBKDF2_ITERATIONS);const ms=Date.now()-start;
 console.log(JSON.stringify({iterations:CATALOG_PBKDF2_ITERATIONS,ms}));return ms;
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
 if(!['catalogUsers','createCatalogUser','setCatalogUserActive','resetCatalogUserPassword','productHistory','restoreProductPhoto','publishProduct','recoverProductHistory'].includes(b.action))return null;
 need_(actor&&actor.role==='admin','No tenés permiso para esta acción.');
 need_(catalogRolesReady_(),'Ejecutá prepararRolesCatalogo_ en la hoja autorizada.');
 if(b.action==='recoverProductHistory')return {data:recoverCatalogHistory_()};
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
  const key=h=>h.at+'|'+h.id,all=rows_('historial_cambios').filter(h=>(!b.area||h.area===b.area)&&(!b.productId||h.productId===b.productId)).sort((a,b)=>key(b).localeCompare(key(a)));
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
   need_(!p.stock&&!p.active&&(!p.publicationState||p.publicationState==='draft'),'Un producto nuevo del editor debe ser borrador, con stock cero y sin publicar.');
   const allowed=editable.concat(['id','area','stock','active','mode','saleCondition','deliveryTime','orderLimit','priceKnown','stockUnknown','publicationState']);
   need_(Object.keys(p).every(k=>allowed.includes(k)),'Campo no permitido para crear el borrador.');
  }
  need_(typeof input.image==='string'&&input.image.length>0,'El editor no puede dejar un producto sin foto.');
 }
 need_(['venta','alquiler','ambos'].includes(input.mode)&&(p.area!=='cotillon'||input.mode==='venta'),'Modalidad inválida.');
 const stock=old&&editor?old.stock:(input.stock??0);need_(Number.isInteger(stock)&&stock>=0&&stock<=100000,'Stock inválido.');
 const image=String(input.image||''),thumbnail=String(input.thumbnail||'');
 need_(image.length<=2000&&(!image||image===old?.image||/^https:\/\/res\.cloudinary\.com\//.test(image)),'Usá una imagen de Cloudinary.');
 need_(thumbnail.length<=2000&&(!thumbnail||thumbnail===old?.thumbnail||/^https:\/\/res\.cloudinary\.com\//.test(thumbnail)),'Usá una miniatura de Cloudinary.');
 need_(!old||!Object.prototype.hasOwnProperty.call(p,'publicationState')||p.publicationState===old.publicationState,'Publicá los borradores con la acción del administrador.');
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
 const after={...(old||{}),id:old?.id||b.operationId||Utilities.getUuid(),area:p.area,name:text_(input.name,150),description:catalogOptionalText_(input.description??'',2000),categoryId:category?.id||'',categoryIds:requested,category:category?category.name:old?.catalogGroups?.length?old.category:'',catalogGroups:p.area==='cotillon'?(groups.length?groups:old?.catalogGroups||[]):[],mode:input.mode,saleCondition,deliveryTime,orderLimit,price:input.mode==='alquiler'?0:amount_(input.price??0),rentPrice:input.mode==='venta'?0:amount_(input.rentPrice??0),priceKnown:p.area==='cotillon'?input.priceKnown!==false:true,stockUnknown:p.area==='cotillon'&&input.stockUnknown===true,stock:editor?stock:saleCondition==='Nuevo a pedido'&&input.mode==='venta'?0:stock,image,thumbnail:image?thumbnail:'',active:editor&&!old?false:!!input.active};
 if(!old&&(editor||input.publicationState==='draft'))after.publicationState='draft';
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
 need_(!history.some(h=>h.area===area&&h.productId===productId&&h.status==='pending'&&h.id!==id),'Hay un cambio pendiente. El administrador debe recuperarlo desde Historial.');
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
function recoverCatalogHistory_(){
 need_(catalogRolesReady_(),'Prepará roles primero.');let recovered=0;
  for(const h of rows_('historial_cambios').filter(h=>h.status==='pending')){
   const current=rows_(h.area).find(p=>p.id===h.productId)||null;
   need_(JSON.stringify(current)===JSON.stringify(h.before)||JSON.stringify(current)===JSON.stringify(h.after),'Conflicto en '+h.productId+': revisar manualmente antes de recuperar.');
   if(JSON.stringify(current)!==JSON.stringify(h.after)){
    const previous=CATALOG_WRITE_DIRECT_;CATALOG_WRITE_DIRECT_=true;
    try{if(h.after)put_(h.area,h.after);else remove_(h.area,h.productId);}finally{CATALOG_WRITE_DIRECT_=previous;}
   }
   h.status='committed';put_('historial_cambios',h);recovered++;
  }return {recovered};

}
