'use client';
import {useEffect,useState} from 'react';
import {catalogData,demo,whatsapp} from '@/lib/api';
import {Product,seed} from '@/lib/catalog';
import {money} from '@/lib/model';

export default function PurchaseForm(){
 const[products,setProducts]=useState<Product[]>(demo?seed:[]),[productId,setProductId]=useState(''),[quantity,setQuantity]=useState(1),[name,setName]=useState(''),[note,setNote]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(!demo);
 useEffect(()=>{const wanted=new URLSearchParams(location.search).get('producto')||'';if(demo){setProductId(wanted);return;}catalogData().then(data=>{setProducts(data.products);setProductId(wanted)}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 const purchasable=products.filter(p=>p.active&&p.mode!=='alquiler');const selected=purchasable.find(p=>p.id===productId);
 return <main className="section narrow"><span className="eyebrow">CONSULTA DE COMPRA</span><h1>Ese detalle ya<br/><em>te está esperando.</em></h1><p>Completá los datos del producto. Al continuar, abriremos WhatsApp con tu consulta lista. El local confirmará disponibilidad y precio antes de cerrar la compra.</p>
 {loading&&<p role="status">Cargando productos…</p>}{error&&<p className="error-banner" role="alert">{error}</p>}
 {!loading&&!error&&<form className="panel form-stack" onSubmit={e=>{e.preventDefault();if(!selected)return;const message='¡Hola! Quiero consultar para comprar '+quantity+' × '+selected.name+' ('+(selected.area==='cotillon'?'Cotillón':'Disfraces')+', '+selected.category+'). Precio publicado: '+money(selected.price)+' por unidad. Mi nombre es '+name.trim()+'.'+(note.trim()?' Consulta: '+note.trim():'');window.location.href=whatsapp(message)}}><label>Producto<select required value={productId} onChange={e=>setProductId(e.target.value)}><option value="">Elegí un producto</option>{purchasable.map(p=><option key={p.id} value={p.id}>{p.name} · {p.category}</option>)}</select></label>{selected&&<div className="rental-product-note"><strong>{selected.name}</strong><br/>{selected.category} · {money(selected.price)} por unidad{selected.stock===0?' · Sin stock publicado':''}</div>}<div className="field-grid"><label>Tu nombre<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>Cantidad<input required type="number" min="1" max="100" step="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label></div><label>Comentario opcional<textarea maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Color, talle o fecha que necesitás"/></label><button className="button dark" disabled={!selected}>Consultar compra por WhatsApp</button><small>Esta consulta no confirma una compra ni realiza un pago.</small></form>}
 </main>;
}
