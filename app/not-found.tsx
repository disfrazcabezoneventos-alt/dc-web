import Link from 'next/link';

export default function NotFound(){
 return <main className="section narrow empty-state">
  <span className="eyebrow">PÁGINA NO ENCONTRADA</span>
  <h1>Esta página no está disponible.</h1>
  <p>Podés volver al inicio o seguir explorando los productos.</p>
  <div className="actions"><Link className="button dark" href="/">Ir al inicio</Link><Link className="button" href="/cotillon/">Ver cotillón</Link></div>
 </main>;
}
