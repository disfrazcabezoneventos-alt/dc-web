import Catalog from '@/components/Catalog';
import {pageMetadata} from '@/lib/page-metadata';
export const metadata=pageMetadata('Disfraces en alquiler y venta','Elegí un disfraz para alquilar o comprar. Encontrá personajes para chicos y grandes y consultá disponibilidad.','/disfraces/');
export default function Page(){return <main><div className="page-title lilac"><span className="eyebrow">DISFRACES · ALQUILER Y VENTA</span><h1>Un personaje.<br/><em>Mil historias.</em></h1><p>Para chicos, grandes y todos los que nunca dejaron de jugar.</p></div><Catalog area="disfraces"/></main>}
