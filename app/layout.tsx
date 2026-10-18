import type {Metadata} from 'next';
import Shell from '@/components/Shell';
import './globals.css';
export const metadata:Metadata={title:{default:'Disfraz Cabezón · Tu próxima gran historia',template:'%s | Disfraz Cabezón'},description:'Alquiler y venta de disfraces, cotillón y reservas. Encontrá todo para tu próxima fiesta en Av. Rivadavia 3314, CABA.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es-AR"><body><Shell>{children}</Shell></body></html>}
