import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {localHarness,fixture,submission,png} from './local-forms-harness.mjs';
import {catalogHarness} from './catalog-access-harness.mjs';
import {receiptsHarness} from './local-receipts-harness.mjs';

const module={exports:{}};
new Function('exports',ts.transpileModule(fs.readFileSync('lib/rental-pricing.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(module.exports);
const pricing=module.exports;
const mirror=vm.createContext({});vm.runInContext(fs.readFileSync('backend/RentalPricing.gs','utf8')+'\nthis.pricing=RentalPricing;',mirror);
const plain=x=>JSON.parse(JSON.stringify(x));
test('preparación persistente idempotente: nunca reactiva una promoción apagada',()=>{
 const h=localHarness();h.ctx.lock_=fn=>fn();
 const first=h.ctx.prepararPromocionesAlquiler_();assert.equal(first.promotions.length,2);assert.ok(h.settings.RENTAL_PROMOTIONS_V1);
 h.dispatch({action:'saveRentalPromotion',token:h.token,revision:first.revision,promotion:{...first.promotions[0],active:false}});
 const stored=h.settings.RENTAL_PROMOTIONS_V1;assert.equal(h.ctx.prepararPromocionesAlquiler_().promotions.find(p=>p.id===first.promotions[0].id).active,false);assert.equal(h.settings.RENTAL_PROMOTIONS_V1,stored);
});
const items=(a,c)=>[...(a?[{category:'adulto',catalogCategory:'Halloween',quantity:a}]:[]),...(c?[{category:'cabezon',catalogCategory:'Cabezones',quantity:c}]:[])];
for(let a=0;a<=7;a++)for(let c=0;c<=7;c++)test(`regla ${a} adultos + ${c} cabezones y paridad exacta Apps Script`,()=>{
 const input=items(a,c),prices={adulto:60000,cabezon:75000},result=pricing.calculateRental(input,prices,pricing.DEFAULT_PROMOTIONS);
 assert.equal(result.total,Math.ceil(a/2)*60000+(c-Math.floor(c/3))*75000);
 assert.equal(result.guarantee,a*60000+c*100000);assert.equal(result.free,Math.floor(a/2)+Math.floor(c/3));
 assert.deepEqual(plain(mirror.pricing.calculateRental(input,prices,pricing.DEFAULT_PROMOTIONS)),result);
});
test('sin mezclar, acumula ítems, promo apagada, reglas editadas y centavos exactos',()=>{
 const split=[...items(1,1),...items(1,2)],prices={adulto:61234.57,cabezon:75432.19};
 for(const promos of [pricing.DEFAULT_PROMOTIONS,pricing.DEFAULT_PROMOTIONS.map(p=>({...p,active:false})),[{...pricing.DEFAULT_PROMOTIONS[0],take:4,pay:3}]]){
  assert.deepEqual(plain(mirror.pricing.calculateRental(split,prices,promos)),pricing.calculateRental(split,prices,promos));
 }
 assert.equal(pricing.calculateRental(split,prices,pricing.DEFAULT_PROMOTIONS).total,212098.95);
 assert.equal(pricing.calculateRental(items(1,1),prices,pricing.DEFAULT_PROMOTIONS).discount,0);
 assert.equal(pricing.calculateRental(split,prices,[]).total,348765.71);
});
test('Niños no participa; venta no lleva etiqueta; misma regla de categoría principal',()=>{
 for(const category of ['Niños','NIÑAS','Infantiles'])assert.equal(pricing.calculateRental([{category:'adulto',quantity:2,catalogCategory:category}],{adulto:60000,cabezon:75000},pricing.DEFAULT_PROMOTIONS).discount,0);
 assert.equal(pricing.productRentalCategory({area:'disfraces',mode:'alquiler',category:'Cabezones'}),'cabezon');
 assert.equal(pricing.productRentalCategory({area:'disfraces',mode:'alquiler',category:'Halloween'}),'adulto');
 assert.equal(pricing.productRentalCategory({area:'disfraces',mode:'venta',category:'Hombres'}),null);
 assert.equal(pricing.productRentalCategory({area:'disfraces',mode:'ambos',category:'Halloween',categoryNames:['Niños','Halloween']}),null);
 const resolved=pricing.rentalPricingItems([{category:'adulto',quantity:2,productId:'child',catalogCategory:'Halloween'}],[{id:'child',category:'Halloween',categoryNames:['Halloween','Niños']}]);assert.equal(pricing.calculateRental(resolved,{adulto:60000,cabezon:75000},pricing.DEFAULT_PROMOTIONS).discount,0);
});
test('avisos cuando falta uno, en cada grupo, y validación estricta de reglas/cantidades',()=>{
 const prices={adulto:60000,cabezon:75000},promos=pricing.DEFAULT_PROMOTIONS;
 assert.match(pricing.promotionNudges(pricing.calculateRental(items(3,2),prices,promos),promos).join(' '),/Sumá otro.*Con un cabezón/);
 assert.deepEqual(pricing.promotionNudges(pricing.calculateRental(items(2,3),prices,promos),promos),[]);
 assert.deepEqual(pricing.promotionNudges(pricing.calculateRental(items(1,2),prices,[]),[]),[]);
 for(const patch of [{take:1},{take:2.1},{pay:0},{pay:2},{take:101},{active:'yes'},{name:''}])assert.throws(()=>pricing.validatePromotions([{...promos[0],...patch}]));
 assert.throws(()=>pricing.validatePromotions([promos[0],{...promos[0],id:'otra'}]),/una promoción/);
 for(const quantity of [-1,0,1.5,21,'2',Infinity])assert.throws(()=>pricing.calculateRental([{category:'adulto',quantity}],prices,promos));
});
function body(h,source='local',data={}){
 const r={...fixture(),...data},b=submission(h,r);b.pricingRevision=h.dispatch({action:'rentalConfig'}).revision;
 if(source==='web'){h.settings.BANK_HOLDER='Prueba';h.settings.BANK_ALIAS='prueba.alias';r.docType='servicio';r.docDate='2026-10-01';b.action='submit';b.files.addressProof=png;b.files.receipt=png;}
 return b;
}
for(const source of ['web','local'])test(`${source}: servidor ignora total, snapshot, firma, seña e idempotencia tras apagar promo`,()=>{
 const h=localHarness(),b=body(h,source,{items:items(3,2).map(i=>({...i,name:'Ensayo',catalogCategory:'Sin categoría'})),total:1,pricing:{total:1,guarantee:1}});
 const created=h.dispatch(b),row=h.tables.reservas[0];assert.equal(created.total,270000);assert.equal(row.data.total,270000);assert.equal(row.data.pricing.guarantee,380000);assert.equal(row.pricingSnapshot.discount,60000);assert.equal(row.pricingSnapshot.free,1);assert.equal(row.pricingSnapshot.declaredTotal,1);assert.equal(row.pricingSnapshot.legacy,false);
 h.ctx.halfData={...row.data,payMode:'half'};assert.equal(vm.runInContext('paid(halfData)',h.ctx),135000);assert.match(row.termsVersion,/2026-11-05/);
 const original=structuredClone(row),config=h.dispatch({action:'rentalConfig'});
 h.dispatch({action:'saveRentalPromotion',token:h.token,revision:config.revision,promotion:{...config.promotions[0],active:false}});
 assert.equal(h.dispatch(b).duplicate,true);assert.deepEqual(h.tables.reservas[0],original);
 const next=body(h,source,{items:[{...fixture().items[0],quantity:2}],total:1});h.dispatch(next);assert.equal(h.tables.reservas[1].data.total,120000);
 const altered=structuredClone(b);altered.data.total=2;assert.throws(()=>h.dispatch(altered),/otros datos/);
});
test('compatibilidad: total manual viejo y revisión de tarifas local anterior se guardan informativos',()=>{
 for(const source of ['web','local']){const h=localHarness(),b=body(h,source,{items:[{...fixture().items[0],quantity:2}],total:999999});
  if(source==='web')delete b.pricingRevision;else b.pricingRevision=h.dispatch({action:'localConfig'}).prices.revision;
  h.dispatch(b);assert.equal(h.tables.reservas[0].data.total,60000);assert.equal(h.tables.reservas[0].pricingSnapshot.declaredTotal,999999);assert.equal(h.tables.reservas[0].pricingSnapshot.legacy,true);
 }
});
test('config pública no escribe; sin sesión/editor no cambia promociones; revisión y tipos estrictos',()=>{
 const h=catalogHarness(),before=JSON.stringify(h.settings),config=h.ctx.dispatch_({action:'rentalConfig'});
 assert.equal(JSON.stringify(h.settings),before);assert.equal(config.promotions.length,2);
 const change={action:'saveRentalPromotion',revision:config.revision,promotion:{...config.promotions[0],active:false}};
 assert.throws(()=>h.ctx.dispatch_(change),/Sesión/);assert.equal(JSON.stringify(h.settings),before);
 h.createEditor();const editor=h.loginEditor(),original=h.settings.RENTAL_PROMOTIONS_V1;
 assert.throws(()=>h.ctx.dispatch_({...change,token:editor}),/permiso/);assert.equal(h.settings.RENTAL_PROMOTIONS_V1,original);
 for(const patch of [{take:0},{pay:2},{active:1},{other:true}])assert.throws(()=>h.ctx.dispatch_({...change,token:h.admin,promotion:{...config.promotions[0],...patch}}));
 h.ctx.dispatch_({...change,token:h.admin});assert.throws(()=>h.ctx.dispatch_({...change,token:h.admin}),/Otra sesión/);
});
test('servidor rechaza revisión obsoleta antes de guardar archivos y categoría de cabezón adulterada',()=>{
 const h=localHarness(),b=body(h);b.pricingRevision='obsolete';assert.throws(()=>h.dispatch(b),/precios o promociones cambiaron/);assert.equal(h.files.size,0);assert.equal(h.tables.reservas.length,0);
 h.tables.categorias_disfraces.push({id:'heads',name:'Cabezones',area:'disfraces'});h.tables.disfraces.push({id:'head',name:'Cabeza',area:'disfraces',categoryId:'heads',category:'Cabezones',mode:'alquiler',active:true,stock:5});
 const forged=body(h,'web',{items:[{name:'Cabeza',category:'adulto',quantity:2,productId:'head',catalogCategoryId:'heads',catalogCategory:'Cabezones'}]});assert.throws(()=>h.dispatch(forged),/tipo del disfraz/);assert.equal(h.files.size,0);
});
test('caja y constancia limitan cobros al total descontado y no suman garantía como ingreso',()=>{
 const h=localHarness(),b=body(h,'local',{items:[{...fixture().items[0],quantity:2}]});h.dispatch(b);const r=h.tables.reservas[0];r.status='confirmed';
 h.tables.movimientos.push({id:'cobro',requestId:r.id,kind:'alquiler',amount:30000,date:'2026-10-29',cost:0,voided:false},{id:'garantia',requestId:r.id,kind:'garantia',amount:120000,date:'2026-10-29',cost:0,voided:false});
 const balance=h.ctx.receiptBalance_(r);assert.equal(balance.total,60000);assert.equal(balance.balance,30000);assert.equal(balance.guarantee,120000);assert.equal(h.ctx.receiptSnapshot_(r).pricing.total,60000);
 assert.throws(()=>h.dispatch({action:'movement',token:h.token,data:{id:'12345678-1234-1234-1234-123456789012',kind:'alquiler',area:'disfraces',date:'2026-10-29',amount:30001,cost:0,note:'Ensayo',requestId:r.id}}),/supera el total/);
});
test('mails cliente/local conservan detalle y nunca incluyen adjuntos',()=>{
 const h=localHarness(),sent=[];h.settings.MAIL_MODE='test';h.settings.BUSINESS_EMAIL='business@example.invalid';h.ctx.MailApp={getRemainingDailyQuota:()=>100,sendEmail:m=>sent.push(m)};
 h.dispatch(body(h,'web',{items:[{...fixture().items[0],quantity:2}]}));assert.equal(sent.length,2);
 for(const mail of sent){assert.match(mail.body,/Subtotal:.*120\.000/s);assert.match(mail.body,/Promo 2x1 adultos:.*60\.000/s);assert.match(mail.body,/Total del alquiler:.*60\.000/s);assert.match(mail.body,/Garantía.*120\.000/s);assert.equal(mail.attachments,undefined);}
});
test('constancia con ajuste administrativo distingue cálculo original y total ajustado en el mail',()=>{
 const h=receiptsHarness();h.settings.MAIL_MODE='test';const r=h.tables.reservas[0];r.managementData={...structuredClone(r.data),total:62000};h.dispatch(h.issue);assert.ok(h.sent.length>0);for(const mail of h.sent){assert.match(mail.body,/Cálculo original del alquiler/);assert.match(mail.body,/Total ajustado por administración:.*62\.000/);}
});
