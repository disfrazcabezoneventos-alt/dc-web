export type RentalCategory='adulto'|'cabezon';
export type RentalPromotion={id:string;name:string;category:RentalCategory;take:number;pay:number;active:boolean;updatedAt:string};
export type RentalTariffs={adulto:number;cabezon:number};
export type RentalConfig={version:2;prices:RentalTariffs;promotions:RentalPromotion[];revision:string};
export type PricingItem={category:RentalCategory;quantity:number;catalogCategory?:string};
export type PricingLine={category:RentalCategory;quantity:number;eligibleQuantity:number;unitPrice:number;subtotal:number;free:number;discount:number;total:number;promotion:RentalPromotion|null};
export type RentalCalculation={version:1;prices:RentalTariffs;lines:PricingLine[];subtotal:number;discount:number;total:number;guarantee:number;free:number;promotions:RentalPromotion[]};
export const DEFAULT_PROMOTIONS:RentalPromotion[]=[
 {id:'adulto-2x1',name:'2x1 en disfraces de adulto',category:'adulto',take:2,pay:1,active:true,updatedAt:'2026-11-03T00:00:00-03:00'},
 {id:'cabezon-3x2',name:'3x2 en cabezones',category:'cabezon',take:3,pay:2,active:true,updatedAt:'2026-11-03T00:00:00-03:00'}
];
export const DEMO_RENTAL_CONFIG:RentalConfig={version:2,prices:{adulto:60000,cabezon:75000},promotions:DEFAULT_PROMOTIONS,revision:'demo'};
const pricingNorm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function childCategory(name:string){return /\b(ninos?|ninas?|infantiles?|infantil)\b/.test(pricingNorm(name));}
/** Resolve child eligibility from the catalog, including secondary categories. */
export function rentalPricingItems<T extends PricingItem & {productId?:string}>(items:T[],products:{id:string;category:string;categoryNames?:string[]}[]):T[]{
 return items.map(item=>{const p=item.productId?products.find(p=>p.id===item.productId):null;
  return p?{...item,catalogCategory:[p.category,...p.categoryNames||[]].some(childCategory)?'Niños':p.category}:item;
 });
}
/** Same primary-category rule as the forms; children and sale never get badges. */
export function productRentalCategory(p:{area:string;mode:string;category:string;categoryNames?:string[]}):RentalCategory|null{
 if(p.area!=='disfraces'||p.mode==='venta'||[p.category,...p.categoryNames||[]].some(childCategory))return null;
 return pricingNorm(p.category)==='cabezones'?'cabezon':'adulto';
}
export function promotionFor(category:RentalCategory|null,promotions:RentalPromotion[]){return category?promotions.find(p=>p.active&&p.category===category)||null:null;}
export function validatePromotions(promotions:RentalPromotion[]){
 if(!Array.isArray(promotions)||promotions.length>30)throw new Error('Como máximo 30 promociones.');
 const ids=new Set<string>(),active=new Set<string>();
 for(const p of promotions){
  if(!p||typeof p.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>120||!['adulto','cabezon'].includes(p.category)||typeof p.active!=='boolean'||!Number.isInteger(p.take)||p.take<2||p.take>100||!Number.isInteger(p.pay)||p.pay<1||p.pay>=p.take)throw new Error('Promoción inválida: nombre, categoría y regla lleva N / paga M (1 ≤ M < N ≤ 100).');
  ids.add(p.id);if(p.active){if(active.has(p.category))throw new Error('Solo puede haber una promoción activa por categoría.');active.add(p.category);}
 }
 return promotions;
}
/** Integer cents; one non-stacking promotion per category; guarantee counts every suit. */
export function calculateRental(items:PricingItem[],prices:RentalTariffs,promotions:RentalPromotion[]):RentalCalculation{
 validatePromotions(promotions);
 const cents=(n:number)=>Math.round(n*100);
 for(const k of ['adulto','cabezon'] as const)if(typeof prices[k]!=='number'||!Number.isFinite(prices[k])||prices[k]<=0||prices[k]>100000000)throw new Error('Tarifa inválida.');
 if(!Array.isArray(items)||items.length>15||items.some(i=>!i||!['adulto','cabezon'].includes(i.category)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>20))throw new Error('Cantidades inválidas.');
 const lines:PricingLine[]=(['adulto','cabezon'] as const).map(category=>{
  const selected=items.filter(i=>i.category===category),quantity=selected.reduce((n,i)=>n+i.quantity,0),eligibleQuantity=selected.filter(i=>!childCategory(i.catalogCategory||'')).reduce((n,i)=>n+i.quantity,0);
  const promotion=promotionFor(category,promotions),free=promotion?Math.floor(eligibleQuantity/promotion.take)*(promotion.take-promotion.pay):0,unit=cents(prices[category]);
  return {category,quantity,eligibleQuantity,unitPrice:unit/100,subtotal:unit*quantity/100,free,discount:unit*free/100,total:unit*(quantity-free)/100,promotion:promotion&&free?{...promotion}:null};
 });
 const sum=(k:'subtotal'|'discount'|'total')=>lines.reduce((n,l)=>n+cents(l[k]),0)/100;
 const result:RentalCalculation={version:1,prices:{adulto:cents(prices.adulto)/100,cabezon:cents(prices.cabezon)/100},lines,subtotal:sum('subtotal'),discount:sum('discount'),total:sum('total'),guarantee:lines.reduce((n,l)=>n+l.quantity*(l.category==='adulto'?60000:100000),0),free:lines.reduce((n,l)=>n+l.free,0),promotions:lines.flatMap(l=>l.promotion?[l.promotion]:[])};
 if(result.subtotal>100000000)throw new Error('El alquiler supera el importe permitido.');
 return result;
}
export function promotionNudges(calculation:RentalCalculation,promotions:RentalPromotion[]){
 return calculation.lines.flatMap(l=>{const p=promotionFor(l.category,promotions);if(!p||!l.eligibleQuantity||l.eligibleQuantity%p.take!==p.take-1)return [];
  if(p.take===2&&p.pay===1&&l.category==='adulto')return ['Sumá otro disfraz de adulto y te sale gratis 🎉'];
  if(p.take===3&&p.pay===2&&l.category==='cabezon')return ['Con un cabezón más, el tercero no lo pagás'];
  return ['Sumá un '+(l.category==='adulto'?'disfraz de adulto':'cabezón')+' más para completar '+p.name+'.'];
 });
}
export function rentalPricingText(c:RentalCalculation,format:(n:number)=>string){
 return ['Subtotal: '+format(c.subtotal),...c.lines.filter(l=>l.promotion).map(l=>'Promo '+l.promotion!.take+'x'+l.promotion!.pay+' '+(l.category==='adulto'?'adultos':'cabezones')+': −'+format(l.discount)),'Total del alquiler: '+format(c.total),'Garantía (se devuelve al finalizar): '+format(c.guarantee)].join('\n');
}
