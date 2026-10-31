/* Constancias presenciales. Datos firmados inmutables; cobros en Caja; enlaces con propósito. */
function prepararConstanciasLocales(){
 prepararConfiguracion();
 return lock_(()=>{
  need_(config_('LOCAL_FORMS_ENABLED')==='yes','Prepará primero los formularios locales.');
  if(!config_('LOCAL_RECEIPT_SECRET'))props_().setProperty('LOCAL_RECEIPT_SECRET',Utilities.getUuid()+Utilities.getUuid());
  props_().setProperty('LOCAL_RECEIPTS_ENABLED','yes');
  return {ready:true,mailMode:config_('MAIL_MODE'),site:receiptSite_()};
 });
}
function receiptsReady_(){return config_('LOCAL_RECEIPTS_ENABLED')==='yes'&&config_('LOCAL_RECEIPT_SECRET').length>=64;}
function needNoPendingReceipt_(id){if(receiptsReady_())need_(!rows_('constancias').some(c=>c.requestId===id&&c.state==='prepared'),'Completá primero la operación pendiente en Formularios entrantes.');}
function receiptSite_(){const site=config_('SITE_URL').replace(/\/$/,'');need_(/^https:\/\/[^\s/?#]+$/.test(site),'Revisá SITE_URL: solo el origen https de la web.');return site;}
function receiptKey_(purpose,id){return hex_(Utilities.computeHmacSha256Signature(purpose+':'+id,config_('LOCAL_RECEIPT_SECRET')));}
function localCopyLink_(r){return receiptsReady_()?receiptSite_()+'/solicitud/#id='+r.id+'&acceso='+receiptKey_('copy',r.id):'';}
function localCopyAccess_(r,access){return receiptsReady_()&&r.source==='local'&&equal_(access,receiptKey_('copy',r.id));}
function receiptLink_(receipt){return receiptSite_()+'/constancia/#id='+receipt.id+'&acceso='+receiptKey_('receipt',receipt.id);}
function receiptBalance_(r){
 const data=formData_(r),movements=rows_('movimientos').filter(m=>m.requestId===r.id&&!m.voided);
 const paid=amount_(movements.filter(m=>m.kind==='alquiler').reduce((sum,m)=>sum+m.amount,0));
 const guarantee=amount_(movements.filter(m=>m.kind==='garantia').reduce((sum,m)=>sum+m.amount,0));
 const refunds=movements.filter(m=>m.kind==='reintegro').reduce((sum,m)=>sum+m.amount,0);
 return {total:data.total,paid,balance:amount_(Math.max(0,data.total-paid)),guarantee,refunds,movements};
}
function receiptSnapshot_(r){
 const d=formData_(r),b=receiptBalance_(r);
 return {code:r.code,fullName:d.fullName,items:d.items.map(i=>({name:i.name,quantity:i.quantity,category:i.catalogCategory||i.category})),pickupDate:d.pickupDate,returnDate:d.returnDate,pickupWindow:d.pickupWindow,returnWindow:d.returnWindow,total:b.total,paid:b.paid,balance:b.balance,guarantee:b.guarantee,payments:b.movements.filter(m=>['alquiler','garantia'].includes(m.kind)).map(m=>({id:m.id,date:m.date,amount:m.amount,kind:m.kind,method:m.method||'Registrado en Caja'}))};
}
function receiptCurrent_(receipt,r){return !!r&&!r.deletedAt&&['confirmed','returned','incident'].includes(r.status)&&receipt.fingerprint===hash_(JSON.stringify(receiptSnapshot_(r)))&&receipt.email===formData_(r).email&&receipt.phone===formData_(r).phone&&!receiptBalance_(r).refunds;}
function receiptView_(receipt,r,admin=false){
 const view={id:receipt.id,issuedAt:receipt.issuedAt,snapshot:receipt.snapshot,outdated:!receiptCurrent_(receipt,r)};
 if(admin)Object.assign(view,{url:receiptLink_(receipt),email:receipt.email,phone:receipt.phone,mailStatus:receipt.mailStatus||'pending',attempts:(receipt.attempts||[]).map(a=>({id:a.id,status:a.status,at:a.at,mode:a.mode}))});
 return view;
}
function receiptInfo_(r){
 const all=rows_('constancias').filter(c=>c.requestId===r.id).sort((a,b)=>b.issuedAt.localeCompare(a.issuedAt));
 return {balance:receiptBalance_(r),receipts:all.filter(c=>c.state==='issued').map(c=>receiptView_(c,r,true)),pending:all.filter(c=>c.state==='prepared').map(c=>({id:c.id,amount:c.payment.amount,guarantee:c.payment.guarantee,date:c.payment.date})),status:r.status,revision:r.managementRevision||0};
}
function receiptDispatch_(b){
 if(!['localReceiptInfo','issueLocalReceipt','sendLocalReceipt','viewLocalReceipt'].includes(b.action))return null;
 if(b.action!=='viewLocalReceipt')session_(b.token);
 need_(receiptsReady_(),'Actualizá Apps Script y ejecutá prepararConstanciasLocales.');
 if(b.action==='viewLocalReceipt'){
  need_(typeof b.id==='string'&&typeof b.access==='string'&&equal_(b.access,receiptKey_('receipt',b.id)),'Enlace privado inválido.');
  const c=rows_('constancias').find(c=>c.id===b.id&&c.state==='issued');need_(c,'Constancia no disponible.');
  return {data:receiptView_(c,rows_('reservas').find(r=>r.id===c.requestId))};
 }
 const r=rows_('reservas').find(r=>r.id===b.id&&!r.deletedAt&&r.source==='local');need_(r,'Elegí un formulario local disponible.');
 if(b.action==='localReceiptInfo')return {data:receiptInfo_(r)};
 if(b.action==='sendLocalReceipt'){
  const c=rows_('constancias').find(c=>c.id===b.receiptId&&c.requestId===r.id&&c.state==='issued');need_(c,'Constancia inexistente.');
  need_(receiptCurrent_(c,r),'Los datos o cobros cambiaron. Emití una nueva constancia.');
  need_(/^[a-f0-9-]{36}$/.test(b.sendId),'Identificador de envío inválido.');
  sendLocalReceipt_(c,b.sendId);return {data:receiptInfo_(r)};
 }
 return {data:issueLocalReceipt_(b,r)};
}
function issueLocalReceipt_(b,r){
 need_(/^[a-f0-9-]{36}$/.test(b.operationId),'Identificador de operación inválido.');
 let c=rows_('constancias').find(c=>c.id===b.operationId);
 if(c){
  need_(c.requestId===r.id,'Conflicto de operación.');
  if(!b.resume)need_(c.inputHash===hash_(JSON.stringify({revision:b.revision,payment:b.payment})),'La operación ya existe con otros datos. Recargá el formulario.');
  if(c.state==='issued')return receiptInfo_(r);
 }else{
  need_(!b.resume,'No hay una operación pendiente.');
  need_(!rows_('constancias').some(c=>c.requestId===r.id&&c.state==='prepared'),'Completá la operación pendiente antes de emitir otra.');
  need_(b.revision===(r.managementRevision||0),'Otra sesión cambió el formulario. Cerrá y volvé a abrirlo.');
  need_(['pending','confirmed'].includes(r.status),'La solicitud debe estar pendiente o confirmada, sin correcciones ni cancelación.');
  const p=b.payment;need_(p&&typeof p==='object','Faltan datos del cobro.');
  const amount=amount_(p.amount),guarantee=amount_(p.guarantee);date_(p.date);need_(p.date<=today_(),'No registres cobros futuros.');
  need_(['Efectivo','Transferencia','Tarjeta','Otro'].includes(p.method),'Elegí el medio de pago.');
  const balance=receiptBalance_(r);need_(!balance.refunds,'Esta reserva tiene reintegros. Revisala en Caja antes de emitir una constancia.');
  need_(amount<=balance.balance,'El cobro supera el saldo del alquiler.');
  const d=formData_(r);need_(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email),'Revisá el correo del cliente.');
  c={id:b.operationId,requestId:r.id,state:'prepared',issuedAt:now_(),inputHash:hash_(JSON.stringify({revision:b.revision,payment:b.payment})),payment:{amount,guarantee,date:p.date,method:p.method},guaranteeMovementId:Utilities.getUuid(),email:d.email,phone:d.phone};
  put_('constancias',c); // Journal before any cash mutation: an interrupted operation can be resumed.
 }
 if(r.status==='pending'){r.status='confirmed';r.events.push({action:'confirmed',note:'Reserva presencial verificada en el local.',at:c.issuedAt});r.updatedAt=now_();put_('reservas',r);}
 need_(r.status==='confirmed','La reserva cambió de estado. Revisá la operación pendiente antes de continuar.');
 const p=c.payment;
 for(const kind of ['alquiler','garantia']){
  const id=kind==='alquiler'?c.id:c.guaranteeMovementId,amount=kind==='alquiler'?p.amount:p.guarantee;
  if(!amount)continue;
  const old=rows_('movimientos').find(m=>m.id===id);
  if(old){need_(!old.voided&&old.requestId===r.id&&old.amount===amount&&old.kind===kind,'El cobro de esta operación fue modificado. Revisalo en Caja.');continue;}
  if(kind==='alquiler')need_(amount<=receiptBalance_(r).balance,'El saldo cambió. Revisá Caja.');
  put_('movimientos',{id,kind,area:'disfraces',date:p.date,amount,cost:0,note:(kind==='alquiler'?'Cobro de alquiler':'Seguro / garantía recibido')+' · '+r.code,requestId:r.id,productId:'',quantity:0,method:p.method,inventoryUsed:false,voided:false,createdAt:c.issuedAt,receiptOperationId:c.id});
 }
 c.snapshot=receiptSnapshot_(r);c.fingerprint=hash_(JSON.stringify(c.snapshot));c.state='issued';c.mailStatus='pending';put_('constancias',c);
 try{sendLocalReceipt_(c,c.id)}catch(_){/* Receipt and cash are saved. Delivery can be reviewed separately. */}
 return receiptInfo_(r);
}
function sendLocalReceipt_(c,sendId){
 const mode=config_('MAIL_MODE');c.attempts=c.attempts||[];
 const old=c.attempts.find(a=>a.id===sendId);
 if(old&&old.status!=='retry')return;
 need_(c.attempts.length<30,'Límite de reenvíos alcanzado. Compartí el enlace por WhatsApp.');
 const a=old||{id:sendId,at:now_(),mode,status:'pending'};
 if(!old)c.attempts.push(a);
 const save=()=>{c.mailStatus=a.status;put_('constancias',c)};
 if(!['test','production'].includes(mode)){a.status='disabled';save();return;}
 if(MailApp.getRemainingDailyQuota()<1){a.status='retry';save();return;}
 const s=c.snapshot,money=n=>'$ '+Number(n).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
 const body='Hola '+s.fullName+',\n\nTu reserva '+s.code+' está confirmada.\n'+s.items.map(i=>i.quantity+' × '+i.name).join('\n')+'\nRetiro: '+s.pickupDate+' · '+s.pickupWindow+' h\nDevolución: '+s.returnDate+' · '+s.returnWindow+' h\n\nTotal del alquiler: '+money(s.total)+'\nCobrado por alquiler: '+money(s.paid)+'\nSaldo del alquiler: '+money(s.balance)+'\nSeguro / garantía recibido (separado): '+money(s.guarantee)+'\n\nConsultá y descargá tu constancia:\n'+receiptLink_(c)+'\n\nLos importes corresponden a los cobros registrados al emitir esta constancia. Conservá este enlace privado.\nDisfraz Cabezón · Av. Rivadavia 3314, CABA\nWhatsApp: 11 4989-7969';
 a.status='sending';a.mode=mode;a.at=now_();save(); // Never automatically repeat an uncertain MailApp call.
 try{MailApp.sendEmail({to:mode==='test'?config_('BUSINESS_EMAIL'):c.email,subject:(mode==='test'?'[PRUEBA] ':'')+'Reserva confirmada y constancia · '+s.code,body,name:'Disfraz Cabezón',replyTo:config_('BUSINESS_EMAIL')});a.status=mode==='test'?'test':'sent';}catch(_){a.status='review';}
 save();
}
