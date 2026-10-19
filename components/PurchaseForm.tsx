'use client';
import {useEffect,useRef,useState} from 'react';
import {catalogData,demo,whatsapp} from '@/lib/api';
import {Product,purchaseLimit,seed} from '@/lib/catalog';
import {money} from '@/lib/model';
import {thumbnailUrl} from '@/lib/thumbnail';

const madeToOrder=(product?:Product)=>product?.area==='disfraces'&&product.saleCondition==='Nuevo a pedido';

export default function PurchaseForm(){
 const[products,setProducts]=useState<Product[]>(demo?seed:[]);
 const[productId,setProductId]=useState(''),[pending,setPending]=useState<Product|null>(null);
 const[quantity,setQuantity]=useState(1),[name,setName]=useState(''),[note,setNote]=useState('');
 const[error,setError]=useState(''),[loading,setLoading]=useState(!demo),[loadFailed,setLoadFailed]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);

 function chooseProduct(id:string,list=products){
  const product=list.find(p=>p.id===id&&p.active&&p.area==='disfraces'&&p.mode!=='alquiler');
  setQuantity(1);
  setError('');
  if(madeToOrder(product)){setProductId('');setPending(product||null)}
  else{setPending(null);setProductId(product?.id||'')}
 }
 useEffect(()=>{
  const wanted=new URLSearchParams(location.search).get('producto')||'';
  if(demo){chooseProduct(wanted,seed);return}
  catalogData().then(data=>{setProducts(data.products);chooseProduct(wanted,data.products)}).catch(e=>{setError(e.message);setLoadFailed(true)}).finally(()=>setLoading(false));
 },[]);
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(pending&&!dialog.open)dialog.showModal();
  if(!pending&&dialog.open)dialog.close();
 },[pending]);

 const purchasable=products.filter(p=>p.active&&p.area==='disfraces'&&p.mode!=='alquiler');
 const selected=purchasable.find(p=>p.id===productId);
 const available=selected?purchaseLimit(selected):0;
 const canSend=!!selected&&available>0&&Number.isInteger(quantity)&&quantity>=1&&quantity<=available;

 function send(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!selected||!canSend){setError('Elegí una cantidad dentro del límite indicado para este producto.');return}
  const condition=selected.area==='disfraces'&&selected.saleCondition?' Condición de venta: '+selected.saleCondition+'.':'';
  const measures=madeToOrder(selected)?' Entiendo que la entrega puede demorar '+(selected.deliveryTime||'aproximadamente 1 mes')+'. Por favor, indíquenme qué medidas tengo que enviar para confeccionarlo.':'';
  const message='¡Hola! Quiero consultar para comprar '+quantity+' × '+selected.name+' ('+(selected.area==='cotillon'?'Cotillón':'Disfraces')+', '+selected.category+'). Precio publicado: '+money(selected.price)+' por unidad.'+condition+measures+' Mi nombre es '+name.trim()+'.'+(note.trim()?' Consulta: '+note.trim():'');
  window.location.href=whatsapp(message);
 }

 return <main className="section narrow">
  <span className="eyebrow">CONSULTA DE COMPRA</span>
  <h1>Ese detalle ya<br/><em>te está esperando.</em></h1>
  <p>Completá los datos del disfraz. Al continuar, abriremos WhatsApp con tu consulta lista. Para comprar varios artículos de cotillón, usá el <a className="text-link" href="/cotillon/">carrito de cotillón →</a>.</p>
  {loading&&<div className="loading-state" role="status"><span className="spinner" aria-hidden="true"/>Cargando productos…</div>}
  {error&&<p className="error-banner" role="alert">{error}</p>}
  {!loading&&!loadFailed&&<form className="panel form-stack" onSubmit={send}>
   <label>Producto
    <select required value={productId} onChange={e=>chooseProduct(e.target.value)}>
     <option value="">Elegí un producto</option>
     {purchasable.map(p=><option key={p.id} value={p.id} disabled={purchaseLimit(p)<1}>{p.name} · {p.category}{purchaseLimit(p)<1?' · Sin stock':''}</option>)}
    </select>
   </label>
   {selected&&<div className="rental-product-note product-note-with-image">
    {selected.image&&<img src={thumbnailUrl(selected.image,selected.thumbnail)} alt={selected.name} width={72} height={72} decoding="async"/>}
    <span><strong>{selected.name}</strong><br/>{selected.category} · {money(selected.price)} por unidad<br/>
     {selected.area==='disfraces'&&selected.saleCondition&&<>Condición: <strong>{selected.saleCondition}</strong><br/></>}
     {madeToOrder(selected)&&<>Entrega estimada: {selected.deliveryTime||'aproximadamente 1 mes'}. Pediremos tus medidas por WhatsApp.<br/></>}
     {madeToOrder(selected)?`Máximo por consulta: ${available}`:available>0?`Unidades disponibles: ${available}`:'Sin unidades disponibles para consultar'}
    </span>
   </div>}
   <div className="field-grid">
    <label>Tu nombre<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Cantidad<input required type="number" min={1} max={selected?available:undefined} step={1} value={quantity} disabled={!selected||available<1} onChange={e=>setQuantity(Math.min(available,Math.max(1,Number(e.target.value)||1)))}/></label>
   </div>
   <label>Comentario opcional<textarea maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Color, talle o fecha que necesitás"/></label>
   <button className="button dark" disabled={!canSend}>Consultar compra por WhatsApp</button>
   <small>Esta consulta no confirma una compra ni realiza un pago. El local verificará {madeToOrder(selected)?'la capacidad de confección':'el stock'} antes de cerrar la venta.</small>
  </form>}
  <dialog ref={dialogRef} className="sale-condition-dialog" aria-labelledby="sale-condition-title" onCancel={e=>{e.preventDefault();setPending(null)}} onClick={e=>{if(e.target===e.currentTarget)setPending(null)}}>
   <div className="sale-condition-content">
    <span className="eyebrow">ANTES DE CONTINUAR</span>
    <h2 id="sale-condition-title">Este disfraz se hace a pedido.</h2>
    <p>La entrega de <strong>{pending?.name}</strong> puede demorar <strong>{pending?.deliveryTime||'aproximadamente 1 mes'}</strong>.</p>
    <p>Para confeccionarlo, te pediremos las medidas por WhatsApp. El local confirmará el plazo y el precio antes de tomar el pedido.</p>
    <div className="actions"><button className="button dark" type="button" onClick={()=>{setProductId(pending?.id||'');setPending(null)}}>Entiendo, continuar</button><button className="button" type="button" onClick={()=>setPending(null)}>Elegir otro</button></div>
   </div>
  </dialog>
 </main>;
}
