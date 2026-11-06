'use client';
import {useState} from 'react';
import type {Product} from '@/lib/catalog';
import {publicProductUrl} from '@/lib/product-links';
export default function ShareProduct({product}:{product:Pick<Product,'id'|'area'|'name'>}){
 const [message,setMessage]=useState('');const url=publicProductUrl(product);
 async function copy(){try{await navigator.clipboard.writeText(url);setMessage('Link copiado.')}catch{setMessage('Copiá este link: '+url)}}
 async function share(){if(navigator.share&&window.matchMedia('(max-width:760px)').matches){try{await navigator.share({title:product.name,url});setMessage('')}catch(e){if((e as Error).name!=='AbortError')await copy()}}else await copy()}
 return <div className="share-product" aria-label="Compartir producto"><button type="button" className="button share-native" onClick={share}>Compartir</button><button type="button" className="button share-copy" onClick={copy}>Copiar link</button><a className="button share-whatsapp" href={'https://wa.me/?text='+encodeURIComponent(product.name+' '+url)} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>{message&&<p role="status">{message}</p>}</div>;
}
