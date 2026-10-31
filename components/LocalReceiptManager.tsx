'use client';
import {useEffect,useRef,useState} from 'react';
import {api} from '@/lib/api';
import {todayAR} from '@/lib/model';
import {LocalReceipt,receiptMailLabels,receiptMoney,receiptWhatsapp} from '@/lib/receipt';
import {downloadReceipt} from '@/lib/receipt-pdf';
import LocalReceiptCard from './LocalReceiptCard';
type Info={balance:{total:number;paid:number;balance:number;guarantee:number};receipts:LocalReceipt[];pending:{id:string;amount:number;guarantee:number;date:string}[];status:string;revision:number};
export default function LocalReceiptManager({id,token,ready,dirty,parentBusy,onBusy,onChanged}:{id:string;token:string;ready:boolean;dirty:boolean;parentBusy:boolean;onBusy:(busy:boolean)=>void;onChanged:()=>Promise<unknown>}){
 const [info,setInfo]=useState<Info|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[verified,setVerified]=useState(false);
 const [amount,setAmount]=useState('0'),[guarantee,setGuarantee]=useState('0'),[date,setDate]=useState(todayAR),[method,setMethod]=useState('Efectivo');
 const operation=useRef<string>(''),sendIds=useRef<Record<string,string>>({});
 async function load(){setError('');try{setInfo(await api('localReceiptInfo',{id},token))}catch(e){setError((e as Error).message)}}
 useEffect(()=>{if(ready)void load()},[id,token,ready]);
 async function run(work:()=>Promise<void>){setBusy(true);onBusy(true);setError('');setNotice('');try{await work()}catch(e){setError((e as Error).message)}finally{setBusy(false);onBusy(false)}}
 async function issue(resumeId?:string){await run(async()=>{
  if(!info)return;
  if(!resumeId&&!verified)throw new Error('Verificá los disfraces y los importes antes de confirmar.');
  if(!operation.current)operation.current=crypto.randomUUID();
  const result=await api('issueLocalReceipt',{id,operationId:resumeId||operation.current,resume:!!resumeId,revision:info.revision,payment:{amount:Number(amount),guarantee:Number(guarantee),date,method}},token);
  setInfo(result);operation.current='';setAmount('0');setGuarantee('0');setVerified(false);setNotice('Constancia emitida. Revisá el estado del correo y compartila por WhatsApp si lo necesitás.');await onChanged();
 })}
 async function send(c:LocalReceipt){
  if(!confirm('¿Enviar esta constancia a '+c.email+'? Si ya la recibió, le llegará otra copia.'))return;
  await run(async()=>{const sendId=sendIds.current[c.id]||crypto.randomUUID();sendIds.current[c.id]=sendId;setInfo(await api('sendLocalReceipt',{id,receiptId:c.id,sendId},token));delete sendIds.current[c.id];setNotice('Solicitud de envío procesada. Consultá el estado del correo.');});
 }
 if(!ready)return <section className="panel"><h3>Constancia para el cliente</h3><p>Para habilitarla, actualizá Apps Script con LocalReceipts.gs y ejecutá prepararConstanciasLocales siguiendo la guía de instalación.</p></section>;
 return <section className="local-receipts"><h3>Constancia para el cliente</h3><p>Confirmá la reserva y registrá solo el dinero que recibís ahora. Los cobros anteriores de Caja se incluyen automáticamente.</p>{dirty&&<p className="notice">Guardá los cambios del formulario y volvé a abrirlo antes de emitir una constancia.</p>}{error&&<p className="error-banner" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}<fieldset disabled={dirty||parentBusy||busy}><legend>Reserva y cobros</legend>{!info?<button type="button" className="button" onClick={()=>void load()}>Cargar constancias</button>:<>
 <div className="receipt-summary"><p>Total: <strong>{receiptMoney(info.balance.total)}</strong></p><p>Cobrado por alquiler: <strong>{receiptMoney(info.balance.paid)}</strong></p><p>Saldo: <strong>{receiptMoney(info.balance.balance)}</strong></p><p>Seguro / garantía recibido: <strong>{receiptMoney(info.balance.guarantee)}</strong></p></div>
 {info.pending.map(p=><div className="notice" key={p.id}><p>Hay una operación pendiente: alquiler {receiptMoney(p.amount)} y seguro {receiptMoney(p.guarantee)}. Completala para conservar un único registro de cada cobro.</p><button type="button" className="button dark" onClick={()=>void issue(p.id)}>Completar operación pendiente</button></div>)}
 {!info.pending.length&&['pending','confirmed'].includes(info.status)&&<><div className="field-grid"><label>Cobro de alquiler recibido ahora<input type="number" min="0" max={info.balance.balance} step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Seguro / garantía recibido ahora<input type="number" min="0" max="100000000" step="0.01" value={guarantee} onChange={e=>setGuarantee(e.target.value)}/></label><label>Fecha del cobro<input type="date" max={todayAR()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Medio de pago<select value={method} onChange={e=>setMethod(e.target.value)}>{['Efectivo','Transferencia','Tarjeta','Otro'].map(m=><option key={m}>{m}</option>)}</select></label></div><p>Si ya cargaste el cobro en Caja, dejá los importes de esta operación en cero.</p><label className="checkbox"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/>Verifiqué los disfraces, las fechas y el dinero efectivamente recibido.</label><button className="button dark" type="button" disabled={!verified||amount===''||guarantee===''} onClick={()=>void issue()}>Confirmar reserva y enviar constancia</button></>}
 <button type="button" className="button" onClick={()=>void load()}>Actualizar cobros y constancias</button>
 {info.receipts.map(c=><article key={c.id}><LocalReceiptCard receipt={c}/><p><strong>{receiptMailLabels[c.mailStatus||'pending']||c.mailStatus}</strong><br/>Correo: {c.email}</p><div className="actions"><button type="button" className="button" onClick={()=>void run(()=>downloadReceipt(c))}>Descargar constancia PDF</button><button type="button" className="button" disabled={c.outdated} onClick={()=>void send(c)}>Reenviar por correo</button><button type="button" className="button" disabled={c.outdated} onClick={()=>{try{window.open(receiptWhatsapp(c),'_blank','noopener,noreferrer');setError('');setNotice('Se abrió WhatsApp con el mensaje preparado. Tocá Enviar para compartirlo.')}catch(e){setError((e as Error).message)}}}>Enviar por WhatsApp</button><button type="button" className="button" disabled={c.outdated} onClick={()=>void run(async()=>{await navigator.clipboard.writeText(c.url!);setNotice('Enlace privado copiado.');})}>Copiar enlace privado</button></div></article>)}
 </>}</fieldset></section>;
}
