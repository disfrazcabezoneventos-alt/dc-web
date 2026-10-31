/* Formulario presencial y gestión de entradas. Requiere Code.gs y Validation.gs. */
function rentalPrices_(){
 const read=(key,fallback)=>{const raw=config_(key);return raw?amount_(Number(raw)):fallback;};
 const adulto=read('LOCAL_PRICE_ADULTO',60000),cabezon=read('LOCAL_PRICE_CABEZON',75000);
 need_(adulto>0&&cabezon>0,'Revisá Precios disfraces.');
 return {adulto,cabezon,revision:hash_(JSON.stringify({adulto,cabezon}))};
}
function formSource_(r){return r.source==='local'?'local':'web';}
function formData_(r){return r.managementData||r.data;}
function safeIncoming_(r){
 return {id:r.id,code:r.code,source:formSource_(r),status:r.status,formState:r.formState||'reserved',createdAt:r.createdAt,updatedAt:r.updatedAt,revision:r.managementRevision||0,data:formData_(r),originalData:r.data,events:r.events||[],fileSlots:Object.keys({...r.files,...r.managementFiles}),hasEdits:!!r.managementData,terms:r.terms,termsVersion:r.termsVersion,signedHash:r.signedHash,receiptsReady:config_('LOCAL_RECEIPTS_ENABLED')==='yes'};
}
// Run once before deploying the frontend. No new spreadsheet or Drive folder is created.
function prepararFormulariosLocales(){
 prepararConfiguracion();
 return lock_(()=>{
  const prices=rentalPrices_();
  if(!config_('LOCAL_PRICE_ADULTO'))props_().setProperty('LOCAL_PRICE_ADULTO',String(prices.adulto));
  if(!config_('LOCAL_PRICE_CABEZON'))props_().setProperty('LOCAL_PRICE_CABEZON',String(prices.cabezon));
  if(!config_('FORM_NOTIFICATIONS_SINCE'))props_().setProperty('FORM_NOTIFICATIONS_SINCE',now_());
  props_().setProperty('LOCAL_FORMS_ENABLED','yes');
  return {ready:true,prices:rentalPrices_(),notificationsSince:config_('FORM_NOTIFICATIONS_SINCE')};
 });
}
function incomingDispatch_(b){
 const actions=['localConfig','submitLocal','incomingForms','incomingRequest','incomingNotifications','dismissFormNotifications','saveRentalPrices','updateIncomingForm','deleteIncomingForm','incomingFile'];
 if(!actions.includes(b.action))return null;
 if(!['localConfig','submitLocal'].includes(b.action))session_(b.token);
 need_(config_('LOCAL_FORMS_ENABLED')==='yes','Primero ejecutá prepararFormulariosLocales y publicá Apps Script.');
 if(b.action==='localConfig')return {data:{version:1,prices:rentalPrices_()}};
 if(b.action==='submitLocal')return {data:submitLocal_(b)};
 if(b.action==='saveRentalPrices'){
  need_(b.revision===rentalPrices_().revision,'Otra sesión cambió los precios. Recargá antes de guardar.');
  const adulto=amount_(b.prices?.adulto),cabezon=amount_(b.prices?.cabezon);
  need_(adulto>0&&cabezon>0,'Los precios deben ser mayores que cero.');
  props_().setProperties({LOCAL_PRICE_ADULTO:String(adulto),LOCAL_PRICE_CABEZON:String(cabezon)});
  return {data:rentalPrices_()};
 }
 const rows=rows_('reservas');
 if(b.action==='incomingForms')return {data:{requests:rows.filter(r=>!r.deletedAt).map(safeIncoming_),prices:rentalPrices_()}};
 if(b.action==='incomingNotifications'){
  const since=config_('FORM_NOTIFICATIONS_SINCE');
  return {data:{notifications:rows.filter(r=>!r.deletedAt&&!r.adminNotificationReadAt&&r.createdAt>=since).map(r=>({id:r.id,code:r.code,source:formSource_(r),createdAt:r.createdAt,costumes:formData_(r).items.map(i=>i.name).join(', ')})).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}};
 }
 if(b.action==='dismissFormNotifications'){
  need_(Array.isArray(b.ids)&&b.ids.length<=500&&b.ids.every(id=>typeof id==='string'),'Notificaciones inválidas.');
  rows.filter(r=>b.ids.includes(r.id)&&!r.adminNotificationReadAt).forEach(r=>{r.adminNotificationReadAt=now_();put_('reservas',r);});
  return {data:{ok:true}};
 }
 const row=rows.find(r=>r.id===b.id&&!r.deletedAt);need_(row,'El formulario ya no está disponible.');
 if(b.action==='incomingRequest')return {data:safeIncoming_(row)};
 if(b.action==='incomingFile'){
  need_(['dniFront','dniBack','addressProof','receipt','signature'].includes(b.slot),'Archivo inválido.');
  const file=(b.original?row.files:{...row.files,...row.managementFiles})?.[b.slot];need_(file,'No hay archivo en ese campo.');
  const blob=DriveApp.getFileById(file.id).getBlob();return {data:{base64:Utilities.base64Encode(blob.getBytes()),type:blob.getContentType()}};
 }
 if(typeof needNoPendingReceipt_==='function')needNoPendingReceipt_(row.id);
 need_(b.revision===(row.managementRevision||0),'Otra sesión modificó este formulario. Cerrá y volvé a abrirlo para actualizar.');
 if(b.action==='deleteIncomingForm'){
  row.deletedAt=now_();row.adminNotificationReadAt=now_();row.managementRevision=(row.managementRevision||0)+1;
  row.events=row.events||[];row.events.push({action:'archived',note:'Eliminado de formularios entrantes; original y documentos conservados para recuperación.',at:row.deletedAt});
  put_('reservas',row);return {data:{ok:true}};
 }
 const data=b.data;
 validateIncomingEdit_(data,formSource_(row));
 need_(Object.prototype.hasOwnProperty.call(FORM_STATES,b.formState),'Estado operativo inválido.');
 const collected=rows_('movimientos').filter(m=>m.requestId===row.id&&m.kind==='alquiler'&&!m.voided).reduce((sum,m)=>sum+m.amount,0);
 need_(data.total>=collected,'El precio no puede ser menor a los cobros registrados en Caja.');
 const slots=Object.keys(b.files||{}),allowed=formSource_(row)==='local'?['dniFront','dniBack','signature']:['dniFront','dniBack','addressProof','receipt','signature'];
 need_(slots.every(slot=>allowed.includes(slot)),'Adjunto no permitido en este formulario.');
 const checked=checkFiles_(b.files||{},slots),saved=slots.length?saveFiles_(checked,row.id+'-gestion'):{};
 const oldRevision=row.managementRevision||0;
 row.managementData=data;row.formState=b.formState;row.managementRevision=oldRevision+1;row.updatedAt=now_();
 row.managementFiles={...row.managementFiles,...saved};
 row.events=row.events||[];row.events.push({action:'management_edit',note:'Edición de gestión '+row.managementRevision+'. Se conserva el original firmado.',at:row.updatedAt});
 try{put_('reservas',row)}catch(error){Object.values(saved).forEach(f=>{try{DriveApp.getFileById(f.id).setTrashed(true)}catch(_){}});throw error;}
 return {data:safeIncoming_(row)};
}
function validateIncomingEdit_(r,source){
 need_(r&&typeof r==='object'&&JSON.stringify(r).length<20000,'Datos inválidos.');
 Object.keys(EMPTY).forEach(k=>{if(k!=='items')need_(typeof r[k]===typeof EMPTY[k]&&(typeof r[k]!=='string'||r[k].length<=1500),'Campo inválido: '+k);});
 ['birthDate','pickupDate','returnDate'].forEach(k=>date_(r[k]));if(r.docDate)date_(r.docDate);
 // Historical dates are valid during management. An edit does not re-sign customer declarations.
 const errors=validate(r,1,r.pickupDate),ignored=['adult','privacy','priorInfo'];ignored.forEach(k=>delete errors[k]);
 need_(!Object.keys(errors).length,Object.values(errors).join(' ').slice(0,280));
 need_(r.items.every(i=>i.name.length<=150&&typeof i.catalogCategory==='string'&&i.catalogCategory.length>0&&i.catalogCategory.length<=80),'Revisá los disfraces y categorías.');
 if(source==='local')need_(!r.specialSchedule&&r.pickupWindow===windows(r.pickupDate,'pickup')&&r.returnWindow===windows(r.returnDate,'return'),'El formulario local tiene horarios fijos.');
 need_(source!=='local'||!r.docDate&&!r.docType,'El formulario local no usa comprobante de domicilio.');
}
function submitLocal_(b){
 const data=b.data;
 need_(data&&/^[a-f0-9-]{36}$/.test(data.requestKey)&&typeof b.access==='string'&&b.access.length>=64,'Acceso de solicitud inválido.');
 const existing=rows_('reservas').find(r=>r.requestKey===data.requestKey);
 if(existing){need_(formSource_(existing)==='local'&&equal_(existing.accessHash,hash_(b.access))&&JSON.stringify(existing.data)===JSON.stringify(data),'Esta solicitud ya fue recibida con otros datos. Consultá al local.');return {id:existing.id,code:existing.code,mailStatus:existing.mailStatus,duplicate:true};}
 const prices=rentalPrices_();
 need_(b.pricingRevision===prices.revision&&data.total===localTotal(data.items,prices),'Los precios cambiaron. Volvé al paso Tu alquiler y actualizá la tarifa antes de firmar.');
 need_(!data.docType&&!data.docDate&&!data.specialSchedule&&!data.scheduleAgreement,'El formulario local no admite domicilio adjunto ni horarios especiales.');
 validateRental_(data,1);
 data.items.forEach(item=>{
  const product=item.productId?products_('disfraces').find(p=>p.id===item.productId):null;
  if(product)need_(item.category===(product.category==='Cabezones'?'cabezon':'adulto'),'El tipo del disfraz no coincide con el catálogo. Volvé a seleccionarlo.');
  if(item.catalogCategory==='Cabezones')need_(item.category==='cabezon','Los cabezones usan la tarifa de cabezón.');
 });
 const errors=validateLocal(data,3,today_());need_(!Object.keys(errors).length,Object.values(errors).join(' ').slice(0,280));
 need_(Object.keys(b.files||{}).every(k=>['dniFront','dniBack','signature'].includes(k)),'El formulario local solo admite DNI y firma.');
 limit_('submit-local:'+data.email,8,3600);limit_('submit-local-global',160,3600);
 const checked=checkFiles_(b.files,['dniFront','dniBack','signature']),id=Utilities.getUuid(),createdAt=now_(),code='LOCAL-'+today_().replace(/-/g,'')+'-'+id.slice(0,6).toUpperCase();
 const signedHash=hash_(JSON.stringify({data,termsVersion:LOCAL_TERMS_VERSION,terms:localTerms,createdAt,files:Object.fromEntries(Object.entries(checked).map(([k,f])=>[k,f.hash]))}));
 const files=saveFiles_(checked,id),row={id,code,source:'local',requestKey:data.requestKey,accessHash:hash_(b.access),data,files,signedFiles:JSON.parse(JSON.stringify(files)),status:'pending',formState:'reserved',priceSnapshot:prices,createdAt,updatedAt:createdAt,terms:localTerms,termsVersion:LOCAL_TERMS_VERSION,signedHash,events:[{action:'pending',note:'Formulario presencial recibido. No acredita pagos.',at:createdAt}],mailStatus:'pending'};
 try{put_('reservas',row)}catch(error){Object.values(files).forEach(f=>{try{DriveApp.getFileById(f.id).setTrashed(true)}catch(_){}});throw error;}
 try{row.mailStatus=notify_(row);put_('reservas',row)}catch(_){/* Saved; never ask to submit twice because email failed. */}
 return {id,code,mailStatus:row.mailStatus};
}
