/* Alquiler: configuración y cálculo del servidor. No ejecuta migraciones ni importadores. */
// Manual setup for the future installation. Safe to repeat; never enables a disabled promo.
function prepararPromocionesAlquiler_(){
 return lock_(()=>{
  if(!config_('RENTAL_PROMOTIONS_V1'))props_().setProperty('RENTAL_PROMOTIONS_V1',JSON.stringify(RentalPricing.DEFAULT_PROMOTIONS.map(p=>({...p,updatedAt:now_()}))));
  return rentalConfig_();
 });
}
function rentalPrices_(){
 const read=(key,fallback)=>{const raw=config_(key);return raw?amount_(Number(raw)):fallback;};
 const adulto=read('LOCAL_PRICE_ADULTO',60000),cabezon=read('LOCAL_PRICE_CABEZON',75000);
 need_(adulto>0&&cabezon>0,'Revisá Precios disfraces.');
 return {adulto,cabezon,revision:hash_(JSON.stringify({adulto,cabezon}))};
}
function rentalPromotions_(){
 const raw=config_('RENTAL_PROMOTIONS_V1');
 const list=raw?JSON.parse(raw):JSON.parse(JSON.stringify(RentalPricing.DEFAULT_PROMOTIONS));
 return RentalPricing.validatePromotions(list);
}
function rentalConfig_(){
 const {adulto,cabezon}=rentalPrices_(),promotions=rentalPromotions_(),prices={adulto,cabezon};
 return {version:2,prices,promotions,revision:hash_(JSON.stringify({prices,promotions}))};
}
function rentalPromotionsDispatch_(b){
 if(b.action==='rentalConfig')return {data:rentalConfig_()}; // Read only; defaults do not write properties.
 if(b.action!=='saveRentalPromotion')return null;
 session_(b.token); // Admin only, even when catalog roles are disabled. No maintenance before auth.
 const current=rentalConfig_();need_(b.revision===current.revision,'Otra sesión cambió precios o promociones. Recargá antes de guardar.');
 const p=b.promotion;
 need_(p&&typeof p==='object'&&!Array.isArray(p),'Promoción inválida.');
 const allowed=['id','name','category','take','pay','active','updatedAt'];
 need_(Object.keys(p).every(k=>allowed.includes(k)),'Campos de promoción inválidos.');
 const promotion={id:p.id,name:typeof p.name==='string'?p.name.trim():p.name,category:p.category,take:p.take,pay:p.pay,active:p.active,updatedAt:now_()};
 const list=current.promotions.filter(x=>x.id!==p.id).concat([promotion]);
 RentalPricing.validatePromotions(list);
 const raw=JSON.stringify(list);need_(raw.length<8000,'Demasiadas promociones para guardar.');
 props_().setProperty('RENTAL_PROMOTIONS_V1',raw);
 return {data:rentalConfig_()};
}
function rentalSubmission_(b){
 const config=rentalConfig_(),submitted=JSON.parse(JSON.stringify(b.data));
 if(b.pricingRevision!==undefined)need_((b.pricingRevision===config.revision||b.pricingRevision===rentalPrices_().revision),'Los precios o promociones cambiaron. Actualizá el resumen y volvé a firmar.');
 // The catalog, not a browser-controlled type, determines the tariff and eligibility.
 need_(Array.isArray(submitted.items),'Personajes inválidos.');
 const products=products_('disfraces');
 submitted.items.forEach(item=>{
  need_(item&&['adulto','cabezon'].includes(item.category),'Tipo de traje inválido.');
  const product=item.productId?products.find(p=>p.id===item.productId):null;
  if(item.productId)need_(product&&product.active&&product.mode!=='venta'&&(typeof catalogPublicProduct_!=='function'||catalogPublicProduct_(product)),'El disfraz elegido cambió. Volvé a seleccionarlo.');
  const category=product?product.category:item.catalogCategory;
  if(product||category&&category!=='Sin categoría')need_(item.category===(categoryKey_(category)==='cabezones'?'cabezon':'adulto'),'El tipo del disfraz no coincide con el catálogo. Volvé a seleccionarlo.');
 });
 const calculationItems=RentalPricing.rentalPricingItems(submitted.items,products);
 const calculation=RentalPricing.calculateRental(calculationItems,config.prices,config.promotions);
 const declaredTotal=typeof submitted.total==='number'&&Number.isFinite(submitted.total)?submitted.total:null;
 const snapshot={...calculation,configRevision:config.revision,calculatedAt:now_(),declaredTotal,legacy:b.pricingRevision!==config.revision};
 // Never trust an incoming total, guarantee, priceSnapshot or pricing object.
 submitted.total=calculation.total;submitted.pricing=snapshot;
 return {data:submitted,snapshot,config};
}
function rentalSubmissionHash_(data){return hash_(JSON.stringify(data));}
function rentalDuplicate_(previous,b,source){
 need_((previous.source==='local'?'local':'web')===source&&equal_(previous.accessHash,hash_(b.access)),'Acceso inválido: esta solicitud ya fue recibida con otros datos o en otro formulario.');
 const matches=previous.submittedDataHash?equal_(previous.submittedDataHash,rentalSubmissionHash_(b.data)):JSON.stringify(previous.data)===JSON.stringify(b.data);
 need_(matches,'Esta solicitud ya fue recibida con otros datos. Consultá al local antes de volver a enviar.');
 return {id:previous.id,code:previous.code,mailStatus:previous.mailStatus,duplicate:true,total:previous.data.total,pricing:previous.pricingSnapshot};
}
function rentalSnapshotText_(snapshot){return snapshot?RentalPricing.rentalPricingText(snapshot,money):'';}
