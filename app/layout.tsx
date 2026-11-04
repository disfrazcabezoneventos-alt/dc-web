import localFont from 'next/font/local';
import type {Metadata} from 'next';
import Shell from '@/components/Shell';
import {pageMetadata,siteUrl} from '@/lib/page-metadata';
import './globals.css';
import './themes.css';
import './halloween-campaign.css';
import './catalog-refresh.css';
import './cart-access.css';
import './forms-management.css';
import './global-search.css';
import './rental-promotions.css';
const dmSans=localFont({src:'./fonts/dm-sans-latin.woff2',variable:'--font-dm',weight:'400 700',display:'swap'});
const manrope=localFont({src:'./fonts/manrope-latin.woff2',variable:'--font-manrope',weight:'400 800',display:'swap'});
const homeMetadata=pageMetadata('Disfraces y cotillón','Alquiler y venta de disfraces, cotillón y reservas. Encontrá todo para tu próxima fiesta en Av. Rivadavia 3314, CABA.','/');
export const metadata:Metadata={...homeMetadata,metadataBase:new URL(siteUrl),title:{default:'Disfraz Cabezón · Tu próxima gran historia',template:'%s | Disfraz Cabezón'}};
export default function Layout({children}:{children:React.ReactNode}){return <html className={`${dmSans.variable} ${manrope.variable}`} lang="es-AR" data-scroll-behavior="smooth" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"(function(){function art(){if(document.documentElement.dataset.theme!=='halloween'||document.querySelector('link[data-theme-art]'))return;var l=document.createElement('link');l.rel='preload';l.as='image';l.href='/halloween-wallpaper.svg';l.fetchPriority='high';l.dataset.themeArt='halloween';document.head.appendChild(l)}try{var t=localStorage.getItem('dc-site-theme');if(t==='default'||t==='halloween')document.documentElement.dataset.theme=t}catch(e){}art();new MutationObserver(art).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})})();"}}/></head><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness",name:"Disfraz Cabezón",address:{"@type":"PostalAddress",streetAddress:"Av. Rivadavia 3314",addressLocality:"CABA",addressCountry:"AR"},openingHoursSpecification:[...["Monday","Tuesday","Wednesday","Thursday","Friday"].flatMap(dayOfWeek=>[{"@type":"OpeningHoursSpecification",dayOfWeek,opens:"10:00",closes:"14:00"},{"@type":"OpeningHoursSpecification",dayOfWeek,opens:"16:00",closes:"20:00"}]),{"@type":"OpeningHoursSpecification",dayOfWeek:"Saturday",opens:"10:00",closes:"17:00"}],telephone:"+5491149897969",url:siteUrl,logo:siteUrl+"/brand-logo.webp",contactPoint:{"@type":"ContactPoint",telephone:"+5491149897969",url:"https://wa.me/5491149897969",contactType:"customer service"}})}}/><Shell>{children}</Shell></body></html>}
