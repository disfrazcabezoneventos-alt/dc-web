'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import type {Area,Category,Product} from '@/lib/catalog';
import {purchaseLimit} from '@/lib/catalog';
import {thumbnailUrl} from '@/lib/thumbnail';
import {ADMIN_PAGE_SIZE,adminCategoryPath,adminPrimaryCategory,filterAdminProducts,parseQuickNumber} from '@/lib/admin-products';
import type {AdminProductFilters,QuickChanges} from '@/lib/admin-products';
import styles from './AdminProducts.module.css';

type Props={area:Area;products:Product[];categories:Category[];filters:AdminProductFilters;onFilters:(filters:AdminProductFilters)=>void;busy:boolean;onQuickUpdate:(product:Product,changes:QuickChanges)=>Promise<void>;onEdit:(product:Product)=>void;onClone?:(product:Product)=>void;onDelete:(product:Product)=>void};

export default function AdminProducts({area,products,categories,filters,onFilters,busy,onQuickUpdate,onEdit,onClone,onDelete}:Props){
 const [pending,setPending]=useState<Set<string>>(new Set());
 const inFlight=useRef(new Set<string>());
 const areaProducts=useMemo(()=>products.filter(p=>p.area===area),[products,area]);
 const available=useMemo(()=>categories.filter(c=>c.area===area).sort((a,b)=>adminCategoryPath(a,categories).localeCompare(adminCategoryPath(b,categories),'es')),[categories,area]);
 const groups=[...new Set(available.map(c=>c.group).filter((g):g is string=>!!g))];
 const filtered=useMemo(()=>filterAdminProducts(areaProducts,available,area,filters),[areaProducts,available,area,filters]);
 const pages=Math.max(1,Math.ceil(filtered.length/ADMIN_PAGE_SIZE)),page=Math.min(filters.page,pages),offset=(page-1)*ADMIN_PAGE_SIZE;
 const visible=filtered.slice(offset,offset+ADMIN_PAGE_SIZE);
 const change=(patch:Partial<AdminProductFilters>)=>onFilters({...filters,...patch,page:1});
 async function save(product:Product,changes:QuickChanges){
  const key=product.area+':'+product.id;if(inFlight.current.has(key)||busy)return;
  inFlight.current.add(key);setPending(new Set(inFlight.current));
  try{await onQuickUpdate(product,changes);}catch{/* El padre revierte y conserva el aviso aunque una fila salga del filtro. */}
  finally{inFlight.current.delete(key);setPending(new Set(inFlight.current));}
 }
 return <section className={styles.list} aria-label={'Productos de '+(area==='disfraces'?'Disfraces':'Cotillón')}>
  <div className={styles.filters}>
   <label>Estado<select value={filters.status} onChange={e=>change({status:e.target.value as AdminProductFilters['status']})}><option value="all">Todos</option><option value="enabled">Habilitados</option><option value="disabled">Deshabilitados</option></select></label>
   <label>Categoría<select value={filters.category} onChange={e=>change({category:e.target.value})}><option value="">Todas las categorías</option><option value="uncategorized">Sin categoría</option>
    {groups.map(group=><optgroup key={group} label={group}><option value={'group:'+group}>Todo {group}</option>{available.filter(c=>c.group===group).map(c=><option key={c.id} value={'category:'+c.id}>{adminCategoryPath(c,available)}</option>)}</optgroup>)}
    {available.filter(c=>!c.group).map(c=><option key={c.id} value={'category:'+c.id}>{c.name}</option>)}
   </select></label>
   <label className={styles.search}>Buscar {area==='disfraces'?'en Disfraces':'en Cotillón'}<input type="search" autoComplete="off" placeholder="Nombre, categoría o ID…" value={filters.query} onChange={e=>change({query:e.target.value})}/></label>
   {(filters.query||filters.category||filters.status!=='all')&&<button type="button" className="button" onClick={()=>onFilters({query:'',status:'all',category:'',page:1})}>Limpiar filtros</button>}
  </div>
  <p className={styles.count} role="status">Mostrando {visible.length} de {areaProducts.length} productos{filtered.length!==areaProducts.length&&<span> · {filtered.length} coinciden con los filtros</span>}</p>
  {area==='cotillon'&&<p className={styles.storeNote}>En la tienda, los productos deshabilitados siguen visibles como agotados; no se pueden agregar al carrito.</p>}
  <div className={styles.tableWrap}><table className={styles.table}><thead><tr>{['Foto','Nombre','Categoría principal','Precio','Stock','Estado','Acciones'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
   {!visible.length&&<tr><td colSpan={7} className={styles.empty}>No encontramos productos con esos filtros.</td></tr>}
   {visible.map(product=><ProductRow key={product.area+':'+product.id} product={product} categories={available} busy={busy||pending.has(product.area+':'+product.id)} save={changes=>save(product,changes)} edit={()=>onEdit(product)} clone={onClone?()=>onClone(product):undefined} remove={()=>onDelete(product)}/>)}
  </tbody></table></div>
  <nav className={styles.pagination} aria-label="Páginas de productos"><button type="button" className="button" disabled={page<=1} onClick={()=>onFilters({...filters,page:page-1})}>Anterior</button><span>Página {page} de {pages}{filtered.length>0&&<small>Resultados {offset+1}–{offset+visible.length} de {filtered.length}</small>}</span><button type="button" className="button" disabled={page>=pages} onClick={()=>onFilters({...filters,page:page+1})}>Siguiente</button></nav>
 </section>;
}

function ProductRow({product:p,categories,busy,save,edit,clone,remove}:{product:Product;categories:Category[];busy:boolean;save:(changes:QuickChanges)=>Promise<void>;edit:()=>void;clone?:()=>void;remove:()=>void}){
 return <tr className={styles.row} aria-label={p.name} aria-busy={busy}>
  <td className={styles.photoCell}>{p.image?<img src={thumbnailUrl(p.image,p.thumbnail)} alt={'Foto de '+p.name} width={54} height={54} loading="lazy" decoding="async"/>:<span className={styles.placeholder}>Sin foto</span>}</td>
  <td className={styles.nameCell}><strong>{p.name}</strong><small>{p.mode==='ambos'?'Alquiler y venta':p.mode==='alquiler'?'Alquiler':'Venta'}{p.mode!=='alquiler'&&p.saleCondition?' · '+p.saleCondition:''}</small></td>
  <td data-label="Categoría principal" className={styles.categoryCell}>{adminPrimaryCategory(p,categories)}</td>
  <td data-label="Precio" className={styles.priceCell}>
   {p.mode!=='alquiler'&&<InlineNumber product={p} field="price" label="Venta" value={p.price} disabled={busy} save={save}/>}
   {p.mode!=='venta'&&<InlineNumber product={p} field="rentPrice" label="Alquiler" value={p.rentPrice} disabled={busy} save={save}/>}
   {p.area==='cotillon'&&p.priceKnown===false&&<small>La tienda sigue mostrando «Precio a consultar». Cambialo desde Editar.</small>}
  </td>
  <td data-label="Stock" className={styles.stockCell}><InlineNumber product={p} field="stock" label="Unidades" value={p.stock} disabled={busy} save={save}/>{p.stockUnknown&&<small>La disponibilidad sigue a confirmar. Cambialo desde Editar.</small>}{p.saleCondition==='Nuevo a pedido'&&<small>Stock físico. Límite a pedido: {purchaseLimit(p)} (se cambia en Editar).</small>}</td>
  <td data-label="Estado" className={styles.stateCell}><div className={styles.state}><button className={styles.switch} role="switch" aria-checked={p.active} aria-label={'Estado de '+p.name} type="button" disabled={busy} onClick={()=>void save({active:!p.active})}><span className={styles.track} data-enabled={p.active}><span/></span></button><span>{p.active?'Habilitado':'Deshabilitado'}</span></div>{busy&&<small role="status">Guardando…</small>}</td>
  <td data-label="Acciones" className={styles.actionsCell}><div className={styles.actions}><button type="button" disabled={busy} onClick={edit}>Editar</button>{clone&&<button type="button" disabled={busy} onClick={clone}>Clonar producto</button>}<button type="button" disabled={busy} onClick={remove}>Eliminar</button></div></td>
 </tr>;
}

function InlineNumber({product,field,label,value,disabled,save}:{product:Product;field:'price'|'rentPrice'|'stock';label:string;value:number;disabled:boolean;save:(changes:QuickChanges)=>Promise<void>}){
 const [draft,setDraft]=useState(String(value)),[error,setError]=useState('');
 useEffect(()=>{setDraft(String(value));setError('');},[value]);
 return <form className={styles.numberForm} noValidate onSubmit={event=>{event.preventDefault();if(disabled)return;try{const number=parseQuickNumber(draft,field);setError('');void save({[field]:number});}catch(error){setError((error as Error).message);}}}>
  <label><span>{label}</span><input aria-label={`${label} de ${product.name}`} type="number" min={0} max={field==='stock'?100000:100000000} step={field==='stock'?1:0.01} value={draft} disabled={disabled} aria-invalid={!!error} onChange={e=>{setDraft(e.target.value);setError('');}}/></label>
  <button className={styles.save} type="submit" aria-label={`Guardar ${label.toLowerCase()} de ${product.name}`} disabled={disabled||draft===String(value)}>Guardar</button>
  {error&&<span className={styles.fieldError} role="alert">{error}</span>}
 </form>;
}
