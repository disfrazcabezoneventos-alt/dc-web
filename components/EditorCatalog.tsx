'use client';
import SecuritySettings from './SecuritySettings';
import {useState} from 'react';
import {api,fileData} from '@/lib/api';
import {Product,Category,Area} from '@/lib/catalog';
import {emptyAdminFilters} from '@/lib/admin-products';
import CatalogProductForm from './CatalogProductForm';
import AdminProducts from './AdminProducts';
type Data={user:{username:string};products:Product[];categories:Category[]};
export default function EditorCatalog({token,initial,logout}:{token:string;initial:Data;logout:()=>void}){
 const [security,setSecurity]=useState(false);
 const [data,setData]=useState(initial),[area,setArea]=useState<Area>('disfraces'),[edit,setEdit]=useState<Product|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [filters,setFilters]=useState({disfraces:emptyAdminFilters(),cotillon:emptyAdminFilters()});
 const [operation,setOperation]=useState(()=>crypto.randomUUID());
 async function refresh(){const next=await api('admin',{},token);if(next.role!=='editor')throw new Error('El acceso cambió. Volvé a iniciar sesión.');setData(next);}
 async function run(work:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await work()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <main className="section admin editor-catalog"><div className="section-heading"><div><span className="eyebrow">EQUIPO · EDITOR DE CATÁLOGO</span><h1>Tu catálogo.</h1><p>Sesión de {data.user.username}</p></div><button className="button" onClick={logout}>Cerrar sesión</button></div>
 <button className="button" onClick={()=>setSecurity(!security)}>Seguridad de mi cuenta</button>{security&&<SecuritySettings token={token} onLogout={logout} onAuthenticated={t=>{sessionStorage.setItem('dc-admin',t);location.reload()}}/>}
 <div className="admin-tabs">{(['disfraces','cotillon'] as const).map(a=><button className={a===area?'active':''} key={a} onClick={()=>{setArea(a);setEdit(null);setError('')}}>{a==='disfraces'?'Disfraces':'Cotillón'}</button>)}</div>
 {error&&<p role="alert" className="error-banner">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
 <div className="section-heading"><h2>{area==='disfraces'?'Disfraces':'Cotillón'}</h2><button className="button dark" disabled={busy} onClick={()=>{setEdit({id:'',area,name:'',description:'',category:'',categoryId:'',categoryIds:[],mode:'venta',saleCondition:area==='disfraces'?'Nuevo Inmediato':'',price:0,rentPrice:0,stock:0,active:true,image:'',thumbnail:'',publicationState:'published'});setOperation(crypto.randomUUID())}}>+ Agregar producto</button></div>
 {edit&&<CatalogProductForm editor product={edit} categories={data.categories} busy={busy} change={setEdit} cancel={()=>setEdit(null)} upload={async file=>api('uploadImage',{file:await fileData(file)},token)} save={()=>void run(async()=>{await api('saveProduct',{product:edit,operationId:operation},token);await refresh();setNotice(edit.id?'Producto actualizado.':'Producto creado y publicado.');setEdit(null);setOperation(crypto.randomUUID());})}/>}
 <AdminProducts editor area={area} products={data.products} categories={data.categories} filters={filters[area]} onFilters={f=>setFilters({...filters,[area]:f})} busy={busy} onEdit={p=>{setEdit(structuredClone(p));setOperation(crypto.randomUUID())}} onPublish={p=>void run(async()=>{await api('publishProduct',{area:p.area,id:p.id,revision:p.revision,operationId:crypto.randomUUID()},token);await refresh();setNotice('Borrador publicado.');})} onQuickUpdate={async(p,changes)=>{await run(async()=>{await api('quickUpdate',{area:p.area,id:p.id,cambios:changes,revision:p.revision,operationId:crypto.randomUUID()},token);await refresh();setNotice('Estado actualizado.');});}}/>
 </main>;
}
