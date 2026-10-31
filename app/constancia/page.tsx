'use client';
import {useEffect,useRef,useState} from 'react';
import {api} from '@/lib/api';
import {LocalReceipt} from '@/lib/receipt';
import {downloadReceipt} from '@/lib/receipt-pdf';
import LocalReceiptCard from '@/components/LocalReceiptCard';
export default function Page(){
 const [receipt,setReceipt]=useState<LocalReceipt|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const request=useRef(0);
 async function load(){const current=++request.current;setBusy(true);setError('');setReceipt(null);try{const p=new URLSearchParams(location.hash.slice(1));if(!p.get('id')||!p.get('acceso'))throw new Error('Abrí el enlace privado completo que recibiste del local.');const result=await api('viewLocalReceipt',{id:p.get('id'),access:p.get('acceso')});if(current===request.current)setReceipt(result);}catch(e){if(current===request.current)setError((e as Error).message)}finally{if(current===request.current)setBusy(false)}}
 useEffect(()=>{const refresh=()=>void load();refresh();window.addEventListener('hashchange',refresh);return()=>{request.current++;window.removeEventListener('hashchange',refresh)}},[]);
 return <main className="section narrow"><h1>Tu constancia de reserva</h1>{error&&<p className="error-banner" role="alert">{error}</p>}{busy&&<p role="status">Procesando…</p>}{receipt&&<><LocalReceiptCard receipt={receipt}/><div className="actions"><button className="button dark" disabled={busy} onClick={async()=>{setBusy(true);try{await downloadReceipt(receipt)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>Descargar constancia PDF</button><button className="button" disabled={busy} onClick={()=>void load()}>Actualizar</button></div></>}<p>Disfraz Cabezón · Av. Rivadavia 3314, CABA · WhatsApp 11 4989-7969</p></main>;
}
