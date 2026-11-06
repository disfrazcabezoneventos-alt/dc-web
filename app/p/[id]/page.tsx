import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import ProductPage from '@/components/ProductPage';
import {pageProducts,pageProduct} from '@/lib/build-catalog';
import {siteUrl} from '@/lib/page-metadata';
import {money} from '@/lib/model';
import {productShareImage} from '@/lib/product-share-image.mjs';
export const dynamicParams=false;
export function generateStaticParams(){return pageProducts.map(p=>({id:p.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params,p=pageProduct(id);if(!p)notFound();
 const price=p.mode==='venta'?p.price:p.rentPrice,priceText=p.priceKnown===false&&p.mode==='venta'?'Precio a consultar':(p.mode==='venta'?'Venta: ':'Alquiler: ')+money(price),description=(priceText+' · '+p.name+'. '+(p.description||'Consultá disponibilidad por WhatsApp. Disfraz Cabezón, Av. Rivadavia 3314, CABA.')).slice(0,300),url=siteUrl+'/p/'+encodeURIComponent(id)+'/',image=productShareImage(p.image||'',siteUrl);
 return {title:p.name,description,alternates:{canonical:url},openGraph:{title:p.name+' | Disfraz Cabezón',description,type:'website',url,locale:'es_AR',siteName:'Disfraz Cabezón',images:image?[{...image,alt:p.name}]:[]},twitter:{card:'summary_large_image',title:p.name,description,images:image?[image.url]:[]},other:p.priceKnown===false&&p.mode==='venta'?{}:{'product:price:amount':String(price),'product:price:currency':'ARS'}};
}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params,p=pageProduct(id);if(!p)notFound();return <ProductPage initial={p}/>}
