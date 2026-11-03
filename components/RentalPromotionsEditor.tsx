'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/api';
import {DEMO_RENTAL_CONFIG,RentalConfig,RentalPromotion} from '@/lib/rental-pricing';

export default function RentalPromotionsEditor({token}:{token:string}){
 const [config,setConfig]=useState<RentalConfig|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [editing,setEditing]=useState<RentalPromotion|null>(null);
 async function load(){setError('');try{setConfig(token==='demo'?DEMO_RENTAL_CONFIG:await api('rentalConfig'))}catch(e){setError((e as Error).message)}}
 useEffect(()=>{void load()},[token]);
 async function save(promotion:RentalPromotion){
  if(!config)return;setBusy(true);setError('');setNotice('');
  try{if(token==='demo')throw new Error('La demostración no guarda cambios.');setConfig(await api('saveRentalPromotion',{promotion,revision:config.revision},token));setEditing(null);setNotice('Promoción guardada. Afecta las reservas nuevas de la web y del local.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <section className="panel rental-promotions-editor"><h2>Promociones</h2><p>Los cambios afectan a las reservas nuevas de la web y del local. Las reservas recibidas conservan su cálculo. La garantía no cambia.</p>
  {!config&&!error&&<p role="status">Cargando promociones…</p>}
  {config?.promotions.map(p=><article className="promotion-admin-row" key={p.id}><div><strong>{p.name}</strong><p>{p.category==='adulto'?'Adultos':'Cabezones'} · Llevá {p.take} y pagá {p.pay}</p><small>Modificada: {new Date(p.updatedAt).toLocaleString('es-AR')}</small></div><div className="actions"><button type="button" role="switch" aria-checked={p.active} aria-label={'Activar '+p.name} className="button" disabled={busy} onClick={()=>void save({...p,active:!p.active})}>{p.active?'Activa':'Inactiva'}</button><button className="button" type="button" disabled={busy} onClick={()=>{setEditing({...p});setNotice('')}}>Editar {p.name}</button></div></article>)}
  {editing&&<form className="form-stack" onSubmit={e=>{e.preventDefault();void save(editing)}}><h3>{config?.promotions.some(p=>p.id===editing.id)?'Editar promoción':'Nueva promoción'}</h3><div className="field-grid"><label>Nombre visible<input required maxLength={120} value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><label>Categoría de promoción<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value as RentalPromotion['category']})}><option value="adulto">Adultos</option><option value="cabezon">Cabezones</option></select></label><label>Lleva N<input required type="number" min={2} max={100} step={1} value={editing.take} onChange={e=>setEditing({...editing,take:Number(e.target.value)})}/></label><label>Paga M<input required type="number" min={1} max={Math.max(1,editing.take-1)} step={1} value={editing.pay} onChange={e=>setEditing({...editing,pay:Number(e.target.value)})}/></label></div><label className="checkbox"><input type="checkbox" checked={editing.active} onChange={e=>setEditing({...editing,active:e.target.checked})}/>Activa</label><p>Solo una promoción activa por categoría; las promociones no se acumulan.</p><div className="actions"><button disabled={busy} className="button dark">Guardar promoción</button><button disabled={busy} type="button" className="button" onClick={()=>setEditing(null)}>Cancelar</button></div></form>}
  <div className="actions"><button type="button" className="button dark" disabled={busy||!config} onClick={()=>setEditing({id:crypto.randomUUID(),name:'',category:'adulto',take:2,pay:1,active:false,updatedAt:''})}>Nueva promoción</button><button type="button" className="button" disabled={busy} onClick={()=>void load()}>Recargar promociones</button></div>
  {error&&<p role="alert" className="error-banner">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
