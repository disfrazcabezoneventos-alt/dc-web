import type {Metadata} from 'next';
import Shell from '@/components/Shell';
import './globals.css';
import './themes.css';
import './halloween-campaign.css';
import './catalog-refresh.css';
export const metadata:Metadata={title:{default:'Disfraz Cabezón · Tu próxima gran historia',template:'%s | Disfraz Cabezón'},description:'Alquiler y venta de disfraces, cotillón y reservas. Encontrá todo para tu próxima fiesta en Av. Rivadavia 3314, CABA.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-AR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"try{var t=localStorage.getItem('dc-site-theme');if(t==='default'||t==='halloween')document.documentElement.dataset.theme=t}catch(e){}"}}/></head><body><Shell>{children}</Shell></body></html>}
