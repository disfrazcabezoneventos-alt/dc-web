import {Product,purchaseLimit} from './catalog';
import {money} from './model';

export type CartItem={id:string;quantity:number};
export const CART_KEY='dc-cotillon-cart-v1';

export function cartProduct(product:Product){return product.area==='cotillon'&&product.active&&product.mode==='venta'&&purchaseLimit(product)>0;}

export function normalizeCart(value:unknown,products:Product[]):CartItem[]{
 if(!Array.isArray(value))return [];
 const byId=new Map(products.filter(cartProduct).map(p=>[p.id,p]));
 const seen=new Set<string>();
 return value.flatMap((entry:unknown)=>{
  if(!entry||typeof entry!=='object')return [];
  const {id,quantity}=entry as Record<string,unknown>;
  if(typeof id!=='string'||seen.has(id)||!byId.has(id)||!Number.isInteger(quantity)||Number(quantity)<1)return [];
  seen.add(id);
  return [{id,quantity:Math.min(Number(quantity),purchaseLimit(byId.get(id)!))}];
 });
}

export function cartMessage(items:CartItem[],products:Product[]):string{
 const lookup=new Map(products.map(p=>[p.id,p]));
 const lines=items.flatMap(item=>{const product=lookup.get(item.id);if(!product||!cartProduct(product))return [];
  const qty=Math.min(item.quantity,purchaseLimit(product));
  return [{product,qty}];
 });
 const priced=lines.filter(({product})=>product.priceKnown!==false);
 const total=priced.reduce((sum,{product,qty})=>sum+product.price*qty,0);
 const detail=lines.map(({product,qty},index)=>{
  const price=product.priceKnown===false?'precio a consultar':`${money(product.price)} c/u · subtotal ${money(product.price*qty)}`;
  return `${index+1}. ${qty} × ${product.name} (${product.category}) — ${price}`;
 }).join('\n');
 return `¡Hola! Quiero consultar por este pedido de cotillón:\n\n${detail}\n\n${priced.length?`Total publicado de los productos con precio: ${money(total)}.\n`:''}Por favor, confirmen disponibilidad, precios finales y forma de entrega. ¡Gracias!`;
}
