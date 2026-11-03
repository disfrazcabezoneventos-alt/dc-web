'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/api';
export default function SearchDemand({token}:{token:string}){
 const [items,setItems]=useState<{query:string;count:number;lastAt:string}[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 async function load(){setLoading(true);setError('');try{setItems(await api('searchDemand',{},token))}catch{setError('No pudimos leer las búsquedas. Verificá que esté instalada la actualización de Apps Script.')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[token]);
 return <section className="panel"><h2>Lo que buscan y no tenemos</h2><p>Consultas sin resultados, agrupadas por texto y ordenadas por cantidad. No contienen cuentas ni datos del visitante.</p><button className="button" disabled={loading} onClick={()=>void load()}>Actualizar búsquedas</button>{loading&&<p role="status">Cargando búsquedas…</p>}{error&&<p role="alert">{error}</p>}<div className="table-scroll"><table><thead><tr><th>Búsqueda</th><th>Cantidad</th><th>Última búsqueda</th></tr></thead><tbody>{items.map(row=><tr key={row.query}><td>{row.query}</td><td>{row.count}</td><td>{new Date(row.lastAt).toLocaleString('es-AR')}</td></tr>)}</tbody></table></div>{!loading&&!error&&!items.length&&<p>Todavía no hay búsquedas sin resultados.</p>}</section>;
}
