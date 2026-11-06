'use client';
import {useEffect,useRef,useState} from 'react';
import {Instagram,MapPin,Clock,ArrowUpRight} from 'lucide-react';
import Link from 'next/link';
import {MAP_URL,REVIEW_URL,SOCIALS,PAYMENT_TEXT,RENTAL_SHIPPING,PARTY_SHIPPING,DEPOSIT_RETURN} from '@/lib/site-info';
import {whatsapp} from '@/lib/api';
import {terms} from '@/lib/terms';
import {useSiteInfo} from './SiteInfoProvider';
import GoogleRating from './GoogleRating';
export function SocialLinks(){return <div className="visit-socials"><a href={SOCIALS.instagram} target="_blank" rel="noreferrer"><Instagram size={19} aria-hidden="true"/>Instagram</a><a href={SOCIALS.tiktok} target="_blank" rel="noreferrer"><svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v12a4 4 0 1 1-4-4M14 3c0 4 3 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>TikTok</a></div>}
export function LazyMap(){const ref=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false);useEffect(()=>{if(!ref.current||!('IntersectionObserver' in window))return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{rootMargin:'0px'});observer.observe(ref.current);return()=>observer.disconnect()},[]);return <div ref={ref} className="visit-map">{visible?<iframe title="Mapa de Disfraz Cabezón, Av. Rivadavia 3314" src="https://maps.google.com/maps?hl=es&q=Av.%20Rivadavia%203314%2C%20CABA&z=17&output=embed" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>:<button type="button" onClick={()=>setVisible(true)}><MapPin aria-hidden="true"/>Cargar mapa de Av. Rivadavia 3314</button>}</div>}
const faq=[
 ['¿Cómo reservo un disfraz?','Solicitud, revisión y confirmación'],
 ['¿Qué necesito para retirar?','Retiro por otra persona'],
 ['¿Cuánto es la garantía y cuándo se devuelve?','Depósito de garantía'],
 ['¿Qué pasa si devuelvo tarde?','Extensiones y devoluciones fuera de término'],
 ['¿Qué promociones hay?','Trajes, precio y seña']
];
function answer(title:string){return terms.find(t=>t.title===title)?.body||''}
export default function VisitUs({compact=false}:{compact?:boolean}){
 const info=useSiteInfo();return <section className={'visit-us'+(compact?' visit-compact':' section')} aria-label={compact?'Visitanos, información del local':'Visitanos'} id={compact?'como-llegar':'visitanos'}>
 <div className="visit-heading"><span className="eyebrow">VENÍ A CONOCERNOS</span><h2>{compact?'Visitanos':'Tu próxima fiesta empieza acá.'}</h2>{!compact&&<p>Un local, muchas ideas. Pasá por Disfraz Cabezón.</p>}</div>
 <div className="visit-grid"><div className="visit-info"><h3><MapPin size={21} aria-hidden="true"/>Av. Rivadavia 3314, CABA</h3><p><Clock size={18} aria-hidden="true"/>Lunes a viernes: 10:00 a 14:00 y 16:00 a 20:00<br/>Sábados: 10:00 a 17:00<br/>Domingos: cerrado</p><div className="visit-links"><a className="button dark" href={MAP_URL} target="_blank" rel="noreferrer">Cómo llegar <ArrowUpRight size={16}/></a><a className="text-link" href={whatsapp()} target="_blank" rel="noreferrer">WhatsApp · 11 4989-7969</a></div><GoogleRating/><div className="visit-reviews"><a href={MAP_URL} target="_blank" rel="noreferrer">Ver opiniones en Google ↗</a><a href={REVIEW_URL} target="_blank" rel="noreferrer">Dejanos tu opinión ↗</a></div><SocialLinks/></div><LazyMap/></div>
 {!compact&&info.photos.length>0&&<div className="visit-photos" aria-label="Fotos del local">{info.photos.map((photo,i)=><img key={photo.image} src={photo.image} alt={photo.alt||'El local de Disfraz Cabezón, foto '+(i+1)} width="600" height="450" loading="lazy" decoding="async"/>)}</div>}
 <div className="visit-practical"><div><h3>Medios de pago</h3><p>{PAYMENT_TEXT}</p></div><div><h3>Envíos de Cotillón</h3><p>{PARTY_SHIPPING}</p>{info.rappiUrl&&<a className="text-link" href={info.rappiUrl} target="_blank" rel="noreferrer">Comprar en Rappi ↗</a>}</div></div>
 <details className="visit-delivery" open={!compact}><summary>Envíos de Disfraces y garantía</summary><p>{RENTAL_SHIPPING}</p><p>{DEPOSIT_RETURN}</p></details>
 {!compact&&<div className="visit-faq"><h3>Antes de la fiesta</h3>{faq.map(([question,title])=><details key={question}><summary>{question}</summary><p>{answer(title)}</p></details>)}<details><summary>¿Qué formas de pago aceptan?</summary><p>{PAYMENT_TEXT}</p></details><details><summary>¿Cómo coordino el envío?</summary><p>{RENTAL_SHIPPING}</p><p>{PARTY_SHIPPING}</p></details><Link className="text-link" href="/condiciones/">Leé todas las condiciones y la privacidad →</Link></div>}
 </section>;
}
