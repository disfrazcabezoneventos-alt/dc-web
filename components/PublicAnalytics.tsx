'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import Script from 'next/script';

const publicPaths=new Set(['/', '/disfraces', '/cotillon', '/buscar', '/reservas', '/comprar', '/condiciones', '/arrepentimiento']);
const isPublic=(path:string)=>publicPaths.has(path.replace(/\/+$/,'')||'/');

export default function PublicAnalytics(){
 const pathname=usePathname();
 useEffect(()=>{
  // A loaded beacon survives SPA navigation. Cross this boundary with a new
  // document so private pages never inherit its listeners or measurements.
  const crossBoundary=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
   if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
   const destination=new URL(link.href,window.location.href);
   if(destination.origin!==location.origin||isPublic(destination.pathname)===isPublic(location.pathname))return;
   event.preventDefault();event.stopPropagation();
   window.location.assign(destination.href);
  };
  document.addEventListener('click',crossBoundary,true);
  return ()=>document.removeEventListener('click',crossBoundary,true);
 },[]);
 if(!pathname||!isPublic(pathname))return null;
 return <Script id="dc-cloudflare-web-analytics" type="module" src="https://static.cloudflareinsights.com/beacon.min.js" strategy="lazyOnload" data-cf-beacon='{"token":"423aece803a247f5aa622735d0e5c158"}'/>;
}
