import {terms} from '@/lib/terms';
import {pageMetadata} from '@/lib/page-metadata';
export const metadata=pageMetadata('Condiciones y privacidad','Leé las condiciones de alquiler y el aviso de privacidad de Disfraz Cabezón.','/condiciones/');
export default function Page(){return <main className="legal section"><span className="eyebrow">INFORMACIÓN PARA TU ALQUILER</span><h1>Condiciones y privacidad</h1><p>Estas son las condiciones del formulario de reserva. Leelas antes de enviar tu solicitud.</p>{terms.map((t,i)=><section key={t.title} id={/privacidad|datos/i.test(t.title)?'privacidad':undefined}><h2>{i+1}. {t.title}</h2><p>{t.body}</p></section>)}<a href="/Contrato_de_Alquiler_Disfraz_Cabezon.pdf" download>Descargar modelo de contrato</a></main>}
