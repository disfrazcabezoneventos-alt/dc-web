'use client';
import {useEffect} from 'react';
import {api,demo,whatsapp} from '@/lib/api';
import Link from 'next/link';
export function useSearchMiss(query:string,enabled:boolean){
 useEffect(()=>{if(demo||!enabled||query.trim().length<2)return;const timer=setTimeout(()=>{const key='dc-search-miss:'+query.trim().toLowerCase();try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'yes')}catch{return}void api('recordSearchMiss',{query:query.trim()}).catch(()=>{/* No interrumpir la búsqueda si falta instalar el backend. */})},1500);return()=>clearTimeout(timer)},[query,enabled]);
}
export function SearchEmpty({query,log=true}:{query:string;log?:boolean}){
 useSearchMiss(query,log);
 return <div className="empty-state"><h3>No encontramos esa idea todavía.</h3><p>Escribinos y te ayudamos a encontrar una alternativa.</p><div className="actions"><a className="button dark" href={whatsapp('Hola, busco: '+query.trim())} target="_blank" rel="noreferrer">Consultar por WhatsApp</a><Link className="button" href="/disfraces/">Disfraces</Link><Link className="button" href="/cotillon/">Cotillón</Link></div></div>;
}
