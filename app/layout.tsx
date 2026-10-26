import type {Metadata} from 'next';
import Shell from '@/components/Shell';
import {pageMetadata,siteUrl} from '@/lib/page-metadata';
import './globals.css';
import './themes.css';
import './halloween-campaign.css';
import './catalog-refresh.css';
const homeMetadata=pageMetadata('Disfraces y cotillón','Alquiler y venta de disfraces, cotillón y reservas. Encontrá todo para tu próxima fiesta en Av. Rivadavia 3314, CABA.','/');
export const metadata:Metadata={...homeMetadata,metadataBase:new URL(siteUrl),title:{default:'Disfraz Cabezón · Tu próxima gran historia',template:'%s | Disfraz Cabezón'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-AR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('dc-site-theme');if(t==='default'||t==='halloween')document.documentElement.dataset.theme=t}catch(e){}"}}/></head><body><Shell>{children}</Shell></body></html>}
