'use client';
import {useState} from 'react';
import {Product,Category,saleConditions} from '@/lib/catalog';
import {thumbnailUrl} from '@/lib/thumbnail';
import {adminCategoryPath} from '@/lib/admin-products';
type Props={product:Product;categories:Category[];editor?:boolean;busy:boolean;change:(p:Product)=>void;save:()=>void;cancel:()=>void;upload:(file:File)=>Promise<{url:string;thumbnail?:string}>};
export default function CatalogProductForm({product:p,categories,editor=false,busy,change,save,cancel,upload}:Props){
 const [uploading,setUploading]=useState(false),[error,setError]=useState('');
 const list=categories.filter(c=>c.area===p.area),locked=editor&&!!p.id;
 const set=(patch:Partial<Product>)=>change({...p,...patch});
 return <form id="product-editor" className="panel form-stack" onSubmit={e=>{e.preventDefault();setError('');if(editor&&!p.image){setError('Agregá una foto antes de guardar.');return;}save();}}>
  <h3>{p.id?'Editar producto':editor?'Nuevo borrador':'Nuevo producto'}</h3>
  {editor&&!p.id&&<p className="notice">El producto quedará en borrador. Solo el administrador puede publicarlo.</p>}
  <fieldset disabled={busy||uploading} className="catalog-form-fields"><legend>Datos del producto</legend><div className="field-grid">
   <label>Nombre<input required maxLength={150} value={p.name} onChange={e=>set({name:e.target.value})}/></label>
   <label>Descripción (opcional)<textarea maxLength={2000} value={p.description} onChange={e=>set({description:e.target.value})}/></label>
   <label>Categoría<select value={p.categoryId||''} onChange={e=>{
    const id=e.target.value,secondary=(p.categoryIds||[]).filter(value=>value!==p.categoryId);
    set({categoryId:id,categoryIds:[...new Set([id,...secondary].filter(Boolean))],category:list.find(c=>c.id===id)?.name||''});
   }}><option value="">Sin categoría</option>{list.map(c=><option key={c.id} value={c.id}>{adminCategoryPath(c,categories)}</option>)}</select></label>
   <label>Modalidad<select disabled={locked} value={p.mode} onChange={e=>set({mode:e.target.value as Product['mode'],price:e.target.value==='alquiler'?0:p.price,rentPrice:e.target.value==='venta'?0:p.rentPrice,saleCondition:e.target.value==='alquiler'?'':p.saleCondition})}><option value="venta">Venta</option>{p.area==='disfraces'&&<><option value="alquiler">Alquiler</option><option value="ambos">Alquiler y venta</option></>}</select></label>
   {p.area==='disfraces'&&p.mode!=='alquiler'&&<><label>Condición de venta<select required disabled={locked} value={p.saleCondition||''} onChange={e=>set({saleCondition:e.target.value as Product['saleCondition'],deliveryTime:e.target.value==='Nuevo a pedido'?(p.deliveryTime||'aproximadamente 1 mes'):'',orderLimit:e.target.value==='Nuevo a pedido'?(p.orderLimit||1):0,...(!editor&&e.target.value==='Nuevo a pedido'&&p.mode==='venta'?{stock:0}:{})})}><option value="">Elegí una condición</option>{saleConditions.map(c=><option key={c}>{c}</option>)}</select></label>{p.saleCondition==='Nuevo a pedido'&&<><label>Tiempo estimado de entrega<input disabled={locked} required maxLength={120} value={p.deliveryTime||''} onChange={e=>set({deliveryTime:e.target.value})}/></label><label>Máximo de unidades por consulta<input disabled={locked} type="number" required min={1} max={100000} value={p.orderLimit||1} onChange={e=>set({orderLimit:Number(e.target.value)})}/></label></>}</>}
   {p.mode!=='alquiler'&&<label>Precio de venta<input disabled={!editor&&p.area==='cotillon'&&p.priceKnown===false} type="number" min={0} step="0.01" max={100000000} required value={p.price} onChange={e=>set({price:Number(e.target.value)})}/></label>}
   {p.mode!=='venta'&&<label>Precio de alquiler<input type="number" min={0} step="0.01" max={100000000} required value={p.rentPrice} onChange={e=>set({rentPrice:Number(e.target.value)})}/></label>}
   {!editor&&<label>Unidades de stock<input disabled={p.area==='cotillon'&&p.stockUnknown===true} type="number" required min={0} max={100000} step={1} value={p.stock} onChange={e=>set({stock:Number(e.target.value)})}/></label>}
  </div>
  <fieldset className="admin-category-checks"><legend>También aparece en</legend>{list.filter(c=>c.id!==p.categoryId).map(c=><label key={c.id}><input type="checkbox" checked={(p.categoryIds||[]).includes(c.id)} onChange={e=>set({categoryIds:e.target.checked?[...new Set([...(p.categoryIds||[]),c.id])]:p.categoryIds?.filter(id=>id!==c.id)})}/>{adminCategoryPath(c,categories)}</label>)}</fieldset>
  {!editor&&p.area==='cotillon'&&<><label className="checkbox"><input type="checkbox" checked={p.priceKnown===false} onChange={e=>set({priceKnown:!e.target.checked,price:e.target.checked?0:p.price})}/>Precio a consultar</label><label className="checkbox"><input type="checkbox" checked={p.stockUnknown===true} onChange={e=>set({stockUnknown:e.target.checked,stock:e.target.checked?0:p.stock})}/>Stock a confirmar</label></>}
  <label>Foto del producto (hasta 8 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);setError('');try{const result=await upload(file);set({image:result.url,thumbnail:result.thumbnail||''});}catch(err){setError((err as Error).message)}finally{setUploading(false)}}}/></label>
  {p.image&&<img className="admin-thumbnail" src={thumbnailUrl(p.image,p.thumbnail)} alt="Foto del producto"/>}
  {!editor&&<><label>URL de Cloudinary<input type="url" value={p.image} onChange={e=>set({image:e.target.value,thumbnail:''})}/></label>{p.publicationState!=='draft'&&<label className="checkbox"><input type="checkbox" checked={p.active} onChange={e=>set({active:e.target.checked})}/>Visible en el catálogo</label>}</>}
  </fieldset>{uploading&&<p role="status">Subiendo foto y creando miniatura…</p>}{error&&<p role="alert" className="error-banner">{error}</p>}
  <div className="actions"><button className="button dark" disabled={busy||uploading}>{busy?'Guardando…':editor&&!p.id?'Guardar borrador':'Guardar producto'}</button><button className="button" type="button" disabled={busy||uploading} onClick={cancel}>Cancelar</button></div>
 </form>;
}
