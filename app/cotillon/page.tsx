import Catalog from '@/components/Catalog';
import {pageMetadata} from '@/lib/page-metadata';
export const metadata=pageMetadata('Cotillón y mercadería','Explorá cotillón, repostería, fechas especiales y descartables. Armá tu carrito y enviá el pedido listo por WhatsApp.','/cotillon/');
export default function Page(){return <main><div className="page-title peach cotillon-landing"><span className="eyebrow">COTILLÓN · VENTA</span><h1>Que se note <em>la celebración.</em></h1><p>Cotillón, repostería, fechas especiales y descartables para cada momento.</p></div><Catalog area="cotillon"/></main>}
