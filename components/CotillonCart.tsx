'use client';
import {ArrowUpRight,Minus,Plus,ShoppingBag,X} from 'lucide-react';
import {whatsapp} from '@/lib/api';
import {Product,purchaseLimit} from '@/lib/catalog';
import {CartItem,cartMessage,cartProduct} from '@/lib/cotillon-cart';
import {money} from '@/lib/model';
import {thumbnailUrl} from '@/lib/thumbnail';
import {useModalFocus} from './useModalFocus';

type Props={items:CartItem[];products:Product[];onChange:(product:Product,quantity:number,option?:string)=>void;onClose:()=>void;loading?:boolean;error?:string;pendingCount?:number;changed?:boolean;onAcknowledge?:()=>void;onRetry?:()=>void;storageError?:boolean};
export default function CotillonCart({items,products,onChange,onClose,loading=false,error='',pendingCount=0,changed=false,onAcknowledge,onRetry,storageError=false}:Props){
 const panel=useModalFocus<HTMLElement>(true,onClose);
 const lines=items.flatMap(item=>{const product=products.find(p=>p.id===item.id&&cartProduct(p));return product?[{product,quantity:item.quantity,option:item.option||''}]:[]});
 const total=lines.reduce((sum,{product,quantity})=>sum+(product.priceKnown===false?0:product.price*quantity),0);
 const unknown=lines.some(({product})=>product.priceKnown===false);
 return <div className="cart-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><aside ref={panel} tabIndex={-1} className="cart-panel" role="dialog" aria-modal="true" aria-label="Carrito de cotillón"><div className="cart-panel-head"><div><span className="eyebrow">TU PEDIDO</span><h2>Carrito de cotillón</h2></div><button className="cart-close" aria-label="Cerrar carrito" onClick={onClose}><X size={22}/></button></div>
 {storageError&&<p className="cart-alert" role="status">Tu navegador no permite guardar el carrito. Se conservará mientras mantengas esta pestaña abierta.</p>}
 {loading&&<div className="cart-empty" role="status"><span className="spinner" aria-hidden="true"/><p>Actualizando disponibilidad y precios…</p></div>}
 {error&&<div className="cart-alert" role="alert">No pudimos actualizar los productos: {error} Tu selección sigue guardada. <button type="button" onClick={onRetry}>Reintentar</button></div>}
 {!loading&&changed&&<div className="cart-alert" role="status">Cambió el precio, la cantidad disponible o algún producto dejó de estar publicado. Revisá el pedido actualizado antes de enviarlo. <button type="button" onClick={onAcknowledge}>Actualizar mi carrito</button></div>}
 {!loading&&!error&&!lines.length?<div className="cart-empty"><ShoppingBag size={38}/><h3>{pendingCount?'Los productos guardados ya no están disponibles.':'Tu carrito está vacío.'}</h3><p>{pendingCount?'Revisá la selección actualizada para continuar.':'Elegí productos de cotillón para armar tu pedido.'}</p><button className="button" onClick={onClose}>Seguir explorando</button></div>:null}
 {!loading&&lines.length>0&&<><div className="cart-items">{lines.map(({product,quantity,option})=><article className="cart-item" key={product.id+'\u0000'+option}>{product.image?<img src={thumbnailUrl(product.image,product.thumbnail)} alt="" loading="lazy"/>:<span className="cart-item-placeholder">Sin foto</span>}<div><h3>{product.name}</h3><p>{product.category}{option?' · '+option:''}</p><strong>{product.priceKnown===false?'Precio a consultar':money(product.price*quantity)}</strong><div className="cart-quantity"><button aria-label={'Quitar una unidad de '+product.name} onClick={()=>onChange(product,quantity-1,option)}><Minus size={15}/></button><span>{quantity}</span><button aria-label={'Agregar una unidad de '+product.name} disabled={quantity>=purchaseLimit(product)} onClick={()=>onChange(product,quantity+1,option)}><Plus size={15}/></button><button className="cart-remove" onClick={()=>onChange(product,0,option)}>Eliminar</button></div></div></article>)}</div><div className="cart-footer"><p><span>{unknown?'Subtotal con precio publicado':'Total publicado'}</span><strong>{unknown&&total===0?'A confirmar':money(total)}</strong></p>{unknown&&<small>Hay productos con precio a consultar; el total final se confirmará por WhatsApp.</small>}<small>El mensaje no confirma la compra ni descuenta stock.</small>{!error&&!changed?<a className="button dark cart-send" href={whatsapp(cartMessage(items,products))} target="_blank" rel="noreferrer">Enviar pedido por WhatsApp <ArrowUpRight size={18}/></a>:<p className="cart-send-disabled">Actualizá el carrito para enviar el pedido.</p>}</div></>}
 </aside></div>;
}
