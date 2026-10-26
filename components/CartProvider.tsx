'use client';

import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import type {Dispatch,ReactNode,SetStateAction} from 'react';
import {ShoppingBag} from 'lucide-react';
import {catalogData,demo} from '@/lib/api';
import {Product,purchaseLimit,seed} from '@/lib/catalog';
import {CART_KEY,CartItem,normalizeCart,parseStoredCart} from '@/lib/cotillon-cart';
import CotillonCart from './CotillonCart';

type CartContextValue={
 items:CartItem[];
 setItems:Dispatch<SetStateAction<CartItem[]>>;
 openCart:()=>void;
 closeCart:()=>void;
 provideProducts:(products:Product[])=>void;
};
const CartContext=createContext<CartContextValue|null>(null);

export function useCotillonCart(){
 const value=useContext(CartContext);
 if(!value)throw new Error('El carrito debe estar dentro de CartProvider.');
 return value;
}

export default function CartProvider({children}:{children:ReactNode}){
 const [items,setItems]=useState<CartItem[]>([]);
 const [ready,setReady]=useState(false);
 const [storageError,setStorageError]=useState(false);
 const [open,setOpen]=useState(false);
 const [products,setProducts]=useState<Product[]|null>(demo?seed.filter(p=>p.area==='cotillon'):null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');

 useEffect(()=>{
  try{setItems(parseStoredCart(localStorage.getItem(CART_KEY)))}catch{setStorageError(true)}
  setReady(true);
  const onStorage=(event:StorageEvent)=>{
   if(event.key===CART_KEY){setItems(parseStoredCart(event.newValue));setStorageError(false)}
  };
  window.addEventListener('storage',onStorage);
  return()=>window.removeEventListener('storage',onStorage);
 },[]);
 useEffect(()=>{
  if(!ready)return;
  try{localStorage.setItem(CART_KEY,JSON.stringify(items));setStorageError(false)}catch{setStorageError(true)}
 },[items,ready]);

 const provideProducts=useCallback((next:Product[])=>setProducts(next.filter(p=>p.area==='cotillon')),[]);
 const refresh=useCallback(async()=>{
  if(demo){setProducts(seed.filter(p=>p.area==='cotillon'));return}
  setLoading(true);setError('');
  try{
   const data=await catalogData(true);
   if(data.cotillonImportReady===false)throw new Error('El catálogo de Cotillón todavía no está disponible. Conservamos tu selección.');
   setProducts(data.products.filter(p=>p.area==='cotillon'));
  }catch(cause){setError((cause as Error).message)}
  finally{setLoading(false)}
 },[]);
 const openCart=useCallback(()=>{setOpen(true);void refresh()},[refresh]);
 const closeCart=useCallback(()=>setOpen(false),[]);
 const valid=useMemo(()=>products?normalizeCart(items,products):[],[items,products]);
 const changed=!!products&&(
  valid.length!==items.length||valid.some((item,index)=>{
   const original=items[index],product=products.find(p=>p.id===item.id);
   return !original||original.id!==item.id||original.option!==item.option||original.quantity!==item.quantity||
    (item.unitPrice!==undefined&&product?.priceKnown!==false&&item.unitPrice!==product?.price)||
    (item.priceKnown!==undefined&&item.priceKnown!==(product?.priceKnown!==false));
  })
 );
 const acknowledge=()=>setItems(valid.map(item=>{
  const product=products?.find(p=>p.id===item.id);
  return {...item,...(product?{unitPrice:product.price,priceKnown:product.priceKnown!==false}:{})};
 }));
 const changeQuantity=(product:Product,quantity:number,option='')=>setItems(current=>{
  const base=normalizeCart(current,products||[]);
  const other=base.filter(item=>item.id===product.id&&(item.option||'')!==option).reduce((sum,item)=>sum+item.quantity,0);
  const max=purchaseLimit(product);
  const next=Math.max(0,Math.min(max-other,quantity));
  const matches=(item:CartItem)=>item.id===product.id&&(item.option||'')===option;
  if(!next)return base.filter(item=>!matches(item));
  const updated={id:product.id,quantity:next,...(option?{option}:{}),unitPrice:product.price,priceKnown:product.priceKnown!==false};
  return base.some(matches)?base.map(item=>matches(item)?updated:item):[...base,updated];
 });
 const context=useMemo(()=>({items,setItems,openCart,closeCart,provideProducts}),[items,openCart,closeCart,provideProducts]);
 const count=items.reduce((sum,item)=>sum+item.quantity,0);

 return <CartContext.Provider value={context}>
  {children}
  {ready&&<button type="button" className="floating-cart" onClick={openCart} aria-label={'Abrir carrito de cotillón, '+count+' productos'}><ShoppingBag size={21}/><span>Carrito</span><strong aria-hidden="true">{count}</strong></button>}
  <span className="sr-only" role="status" aria-live="polite">{ready?`${count} productos en el carrito de cotillón`:''}</span>
  {open&&<CotillonCart items={valid} products={products||[]} onChange={changeQuantity} onClose={closeCart} loading={loading} error={error} pendingCount={items.length} changed={changed} onAcknowledge={acknowledge} onRetry={()=>void refresh()} storageError={storageError}/>}
 </CartContext.Provider>;
}
