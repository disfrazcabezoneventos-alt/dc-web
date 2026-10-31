import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {receiptsHarness} from './local-receipts-harness.mjs';
import {pdfModules} from './pdf-harness.mjs';
import {PDFDocument} from 'pdf-lib';
const {receipt,receiptPdf,stats}=pdfModules();

test('constancia: confirma, registra una sola vez alquiler y garantía; el original queda intacto',async()=>{
 const h=receiptsHarness(),before=structuredClone(h.tables.reservas[0].data);
 const info=h.dispatch(h.issue),c=info.receipts[0];assert.equal(c.snapshot.paid,30000);assert.equal(c.snapshot.balance,30000);assert.equal(c.snapshot.guarantee,10000);
 assert.equal(h.tables.reservas[0].status,'confirmed');assert.deepEqual(h.tables.reservas[0].data,before);assert.equal(h.sent.length,1);
 h.dispatch(h.issue);assert.equal(h.tables.movimientos.length,2);assert.equal(h.sent.length,1);assert.equal(h.tables.constancias.length,1);
 assert.equal((await PDFDocument.load(await receiptPdf.receiptPdf(c))).getPageCount(),1);
 assert.match(h.sent[0].body,/constancia\/#id=/);assert.match(h.sent[0].body,/30.000,00/);assert.equal(h.sent[0].to,before.email);
 assert.equal(stats.statistics(h.tables.movimientos,'2026-10-01','2026-10-31').income,30000);
 const url=new URL(c.url),params=new URLSearchParams(url.hash.slice(1));
 const pub=h.dispatch({action:'viewLocalReceipt',id:c.id,access:params.get('acceso')});assert.equal(pub.snapshot.fullName,before.fullName);assert.equal(pub.email,undefined);assert.equal(pub.phone,undefined);assert.equal(pub.url,undefined);assert.equal(JSON.stringify(pub).includes('dni'),false);
 assert.throws(()=>h.dispatch({action:'viewLocalReceipt',id:c.id,access:'incorrecto'}),/inválido/);
 assert.throws(()=>h.dispatch({...h.issue,payment:{...h.issue.payment,amount:20000}}),/otros datos/);
});
test('constancia: sesión, preparación, revisión, exceso, fecha, cancelación y origen web',()=>{
 const h=receiptsHarness();assert.throws(()=>h.dispatch({...h.issue,token:''}),/Sesión/);
 h.settings.LOCAL_RECEIPTS_ENABLED='no';assert.throws(()=>h.dispatch(h.issue),/prepararConstanciasLocales/);h.settings.LOCAL_RECEIPTS_ENABLED='yes';
 for(const patch of [{revision:2},{payment:{...h.issue.payment,amount:60001}},{payment:{...h.issue.payment,amount:-1}},{payment:{...h.issue.payment,date:'2099-01-01'}}])assert.throws(()=>h.dispatch({...h.issue,...patch}));
 h.tables.reservas[0].status='correction';assert.throws(()=>h.dispatch(h.issue),/pendiente o confirmada/);
 h.tables.reservas[0].source='web';assert.throws(()=>h.dispatch(h.issue),/local/);assert.equal(h.tables.movimientos.length,0);
});
test('constancia: recupera interrupción después de Caja, sin duplicar y bloqueando cambios incompatibles',()=>{
 const h=receiptsHarness(),original=h.ctx.put_;let writes=0;
 h.ctx.put_=(table,row)=>{if(table==='movimientos'&&++writes===2)throw new Error('Corte simulado');return original(table,row)};
 assert.throws(()=>h.dispatch(h.issue),/Corte/);assert.equal(h.tables.movimientos.length,1);
 const info=h.dispatch({action:'localReceiptInfo',id:h.created.id,token:h.token});assert.equal(info.pending.length,1);
 assert.throws(()=>h.dispatch({action:'status',id:h.created.id,status:'returned',note:'Prueba',token:h.token}),/pendiente/);
 assert.throws(()=>h.dispatch({action:'voidMovement',id:h.tables.movimientos[0].id,note:'Prueba',token:h.token}),/pendiente/);
 assert.throws(()=>h.dispatch({action:'updateIncomingForm',id:h.created.id,revision:0,token:h.token,data:h.tables.reservas[0].data,formState:'reserved'}),/pendiente/);
 h.ctx.put_=original;h.dispatch({...h.issue,resume:true});assert.equal(h.tables.movimientos.length,2);assert.equal(h.tables.constancias[0].state,'issued');assert.equal(h.sent.length,1);
});
test('constancia: cero no duplica un cobro existente; admite pagos posteriores y detecta cambios/anulación',()=>{
 const h=receiptsHarness();h.dispatch(h.issue);
 const zero={...h.issue,operationId:crypto.randomUUID(),payment:{...h.issue.payment,amount:0,guarantee:0}};
 assert.equal(h.dispatch(zero).receipts[0].snapshot.paid,30000);assert.equal(h.tables.movimientos.length,2);
 const more={...zero,operationId:crypto.randomUUID(),payment:{...zero.payment,amount:30000}};h.dispatch(more);
 const latest=h.tables.constancias.at(-1);assert.equal(latest.snapshot.balance,0);
 const first=h.tables.constancias[0];assert.equal(h.ctx.receiptCurrent_(first,h.tables.reservas[0]),false);
 assert.throws(()=>h.dispatch({action:'sendLocalReceipt',id:h.created.id,token:h.token,receiptId:first.id,sendId:crypto.randomUUID()}),/cambiaron/);
 h.dispatch({action:'voidMovement',token:h.token,id:h.tables.movimientos[0].id,note:'Error de caja'});assert.equal(h.ctx.receiptCurrent_(latest,h.tables.reservas[0]),false);
});
test('correo: cuota, modo prueba/deshabilitado, envío incierto y reenvío con idempotencia',()=>{
 for(const mode of ['production','test','disabled']){
  const h=receiptsHarness();h.settings.MAIL_MODE=mode;h.ctx.MailApp.getRemainingDailyQuota=()=>0;
  h.dispatch(h.issue);assert.equal(h.sent.length,0);assert.equal(h.tables.constancias[0].mailStatus,mode==='disabled'?'disabled':'retry');
  h.ctx.MailApp.getRemainingDailyQuota=()=>100;h.settings.MAIL_MODE=mode==='disabled'?'production':mode;
  const b={action:'sendLocalReceipt',id:h.created.id,token:h.token,receiptId:h.issue.operationId,sendId:crypto.randomUUID()};h.dispatch(b);h.dispatch(b);assert.equal(h.sent.length,1);
  assert.equal(h.sent[0].to,mode==='test'?'negocio@example.invalid':'test@example.invalid');
 }
 const h=receiptsHarness();let calls=0;h.ctx.MailApp.sendEmail=()=>{calls++;throw new Error('Corte después de enviar')};h.dispatch(h.issue);assert.equal(h.tables.constancias[0].mailStatus,'review');h.dispatch(h.issue);assert.equal(calls,1);
 const b={action:'sendLocalReceipt',id:h.created.id,token:h.token,receiptId:h.issue.operationId,sendId:crypto.randomUUID()};h.dispatch(b);h.dispatch(b);assert.equal(calls,2);
});
test('copia del formulario por correo: token separado de constancia, sin guardar accesos en filas',()=>{
 const h=receiptsHarness(),r=h.tables.reservas[0];
 h.ctx.notify_(r);const mail=h.sent.find(m=>m.to===r.data.email);assert.match(mail.body,/solicitud\/#id=/);
 const access=h.ctx.receiptKey_('copy',r.id);assert.equal(h.dispatch({action:'request',id:r.id,access}).code,r.code);
 assert.throws(()=>h.dispatch({action:'request',id:r.id,access:h.ctx.receiptKey_('receipt',r.id)}),/inválido/);
 assert.equal(JSON.stringify(h.tables.reservas).includes(access),false);
});
test('WhatsApp prepara mensaje con saldo real y normaliza el número argentino',()=>{
 const h=receiptsHarness(),c=h.dispatch(h.issue).receipts[0];c.phone='011 4989 7969';
 const url=new URL(receipt.receiptWhatsapp(c));assert.equal(url.pathname,'/5491149897969');assert.match(url.searchParams.get('text'),/Saldo:.*30.000/);assert.match(url.searchParams.get('text'),/constancia\/#id=/);
 c.phone='011 15 4989 7969';assert.equal(new URL(receipt.receiptWhatsapp(c)).pathname,'/5491149897969');
 c.phone='+54 11 1512 3456';assert.equal(new URL(receipt.receiptWhatsapp(c)).pathname,'/5491115123456');
 c.phone='abc';assert.throws(()=>receipt.receiptWhatsapp(c),/número/);
});

test('PDF de constancia: textos extensos y muchos disfraces generan páginas legibles sin perder datos',async()=>{
 const h=receiptsHarness(),c=h.dispatch(h.issue).receipts[0];c.snapshot.items=Array.from({length:80},(_,n)=>({name:'Personaje '+n+' '+('NOMBRELARGO'.repeat(12)),category:'Halloween',quantity:1}));
 const before=JSON.stringify(c),doc=await PDFDocument.load(await receiptPdf.receiptPdf(c));
 assert.ok(doc.getPageCount()>1);assert.equal(JSON.stringify(c),before);assert.ok(doc.getPages().every(p=>p.getWidth()===595.28));
});
