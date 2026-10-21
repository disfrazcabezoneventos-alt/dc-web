import {Product,purchaseLimit} from './catalog';
import {money} from './model';

export type CartItem={id:string;quantity:number;option?:string};
export const CART_KEY='dc-cotillon-cart-v1';

export function cartProduct(product:Product){return product.area==='cotillon'&&product.active&&product.mode==='venta'&&purchaseLimit(product)>0;}
export function requiresChoice(product:Product){return /\b(varios? (?:colores?|modelos?|tonos?|talles?)|colores? a elecci[oó]n|modelos? a elecci[oó]n|talles? a elecci[oó]n|surtidos?|a elecci[oó]n)\b/i.test(product.name+' '+product.description);}

export function normalizeCart(value:unknown,products:Product[]):CartItem[]{
 if(!Array.isArray(value))return [];
 const byId=new Map(products.filter(cartProduct).map(p=>[p.id,p]));
 const seen=new Set<string>();
 const used=new Map<string,number>();
 return value.flatMap((entry:unknown)=>{
  if(!entry||typeof entry!=='object')return [];
  const {id,quantity,option}=entry as Record<string,unknown>;
  const chosen=typeof option==='string'?option.replace(/[\r\n\t]+/g,' ').trim().slice(0,100):'';
  const key=id+'\u0000'+chosen;
  if(typeof id!=='string'||seen.has(key)||!byId.has(id)||!Number.isInteger(quantity)||Number(quantity)<1)return [];
  seen.add(key);
  const available=purchaseLimit(byId.get(id)!)-(used.get(id)||0);
  const accepted=Math.min(Number(quantity),available);
  if(accepted<1)return [];
  used.set(id,(used.get(id)||0)+accepted);
  return [{id,quantity:accepted,...(chosen?{option:chosen}:{})}];
 });
}

export function cartMessage(items:CartItem[],products:Product[]):string{
 const lookup=new Map(products.map(p=>[p.id,p]));
 const lines=items.flatMap(item=>{const product=lookup.get(item.id);if(!product||!cartProduct(product))return [];
  const qty=Math.min(item.quantity,purchaseLimit(product));
  return [{product,qty,option:item.option||''}];
 });
 const priced=lines.filter(({product})=>product.priceKnown!==false);
 const total=priced.reduce((sum,{product,qty})=>sum+product.price*qty,0);
 const detail=lines.map(({product,qty,option},index)=>{
  const price=product.priceKnown===false?'precio a consultar':`${money(product.price)} c/u · subtotal ${money(product.price*qty)}`;
  return `${index+1}. ${qty} × ${product.name}${option?' · '+option:''} (${product.category}) — ${price}`;
 }).join('\n');
 return `¡Hola! Quiero consultar por este pedido de cotillón:\n\n${detail}\n\n${priced.length?`Total publicado de los productos con precio: ${money(total)}.\n`:''}Por favor, confirmen disponibilidad, precios finales y forma de entrega. ¡Gracias!`;
}
