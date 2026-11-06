/* Validación obligatoria del servidor, antes de cualquier escritura del formulario. */
var TURNSTILE_VALIDATED_=[];
function turnstileProtected_(action){return ['submit','submitLocal','cancel','correct','purchaseCheck','cartCheck'].includes(action);}
function turnstileRequire_(b){
 if(config_('TURNSTILE_ENABLED')!=='yes'||!turnstileProtected_(b.action)||TURNSTILE_VALIDATED_.includes(b))return;
 const token=b.turnstileToken,secret=config_('TURNSTILE_SECRET_KEY');need_(secret,'Falta configurar la protección del formulario.');need_(typeof token==='string'&&token.length>0&&token.length<=2048,'Completá la verificación de seguridad antes de enviar.');
 let result;try{const r=UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'post',contentType:'application/json',payload:JSON.stringify({secret,response:token}),muteHttpExceptions:true});need_(r.getResponseCode()===200,'Validación no disponible.');result=JSON.parse(r.getContentText());}catch(_){throw new Error('No pudimos verificar la seguridad. Volvé a intentarlo.');}
 const hosts=config_('TURNSTILE_HOSTNAMES').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);need_(hosts.length>0,'Falta configurar los dominios del formulario.');
 const test=config_('TURNSTILE_TEST_MODE')==='yes';if(test)need_(config_('MAIL_MODE')==='disabled'&&config_('SECURITY_ENV')==='ensayo'&&SpreadsheetApp.openById(config_('SPREADSHEET_ID')).getName().startsWith('ENSAYO '),'Las claves de prueba solo se permiten en ensayo sin correo.');
 const claims=test?token==='XXXX.DUMMY.TOKEN.XXXX'&&/^[123]x0{31}AA$/.test(secret)&&result.hostname==='example.com'&&!result.action:hosts.includes(String(result.hostname||'').toLowerCase())&&result.action===b.action;
 const age=Date.now()-Date.parse(result?.challenge_ts);need_(result?.success===true&&claims&&Number.isFinite(age)&&age>=-30000&&age<=300000,'La verificación de seguridad venció o no corresponde a este formulario. Intentá otra vez.');
 TURNSTILE_VALIDATED_.push(b);if(TURNSTILE_VALIDATED_.length>20)TURNSTILE_VALIDATED_.shift();
}

function purchaseCheck_(b){
 need_(['disfraces','cotillon'].includes(b.area),'Área inválida.');const items=b.action==='cartCheck'?b.items:[{id:b.id,quantity:b.quantity,unitPrice:b.unitPrice}];need_(Array.isArray(items)&&items.length>0&&items.length<=50,'Revisá los productos de la compra.');const products=rows_(b.area),totals={};
 const checked=items.map(item=>{need_(item&&typeof item.id==='string'&&Number.isInteger(item.quantity)&&item.quantity>0,'Cantidad inválida.');const p=products.find(p=>p.id===item.id&&p.active&&p.publicationState!=='draft'&&p.mode!=='alquiler');need_(p,'El producto ya no está disponible. Actualizá el catálogo.');const limit=p.saleCondition==='Nuevo a pedido'?Math.min(10,p.orderLimit||1):Math.min(10,Math.max(0,Number(p.stock)||0));totals[p.id]=(totals[p.id]||0)+item.quantity;need_(totals[p.id]<=limit,'La cantidad supera la disponibilidad actual. Actualizá el carrito.');if(item.unitPrice!==undefined&&p.priceKnown!==false)need_(item.unitPrice===p.price,'El precio cambió. Actualizá el catálogo antes de continuar.');return {id:p.id,name:p.name,price:p.price,quantity:item.quantity};});return {items:checked};
}
