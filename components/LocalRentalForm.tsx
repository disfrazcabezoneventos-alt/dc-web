'use client';
import {useEffect,useRef,useState} from 'react';
import {api,catalogData,demo,fileData} from '@/lib/api';
import {Product,Category,seed,seedCategories} from '@/lib/catalog';
import {Rental,EMPTY,Costume,todayAR,dateAR,money,windows,deposit} from '@/lib/model';
import {DEFAULT_RENTAL_PRICES,RentalPrices,localTotal,localSchedule,validateLocal} from '@/lib/local-rental';
import {localTerms} from '@/lib/local-terms';
import {rentalStockErrors} from '@/lib/rental-stock';
import {useModalFocus} from './useModalFocus';
import Signature from './Signature';
import Upload from './Upload';

const steps=['Tus datos','Tu alquiler','DNI','Firma'];
export default function LocalRentalForm(){
 const [r,setR]=useState<Rental>({...EMPTY,items:[{name:'',category:'adulto',quantity:1}],docType:'',docDate:''});
 const [step,setStep]=useState(0),[today,setToday]=useState(''),[prices,setPrices]=useState<RentalPrices>(DEFAULT_RENTAL_PRICES);
 const [products,setProducts]=useState<Product[]>([]),[categories,setCategories]=useState<Category[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 const [files,setFiles]=useState<Record<string,File|null>>({dniFront:null,dniBack:null}),[signature,setSignature]=useState<string|null>(null);
 const [termsOpen,setTermsOpen]=useState(false),[result,setResult]=useState<any>(null);
 const access=useRef(''),sending=useRef(false),top=useRef<HTMLElement>(null);
 const termsRef=useModalFocus<HTMLDivElement>(termsOpen,()=>setTermsOpen(false));
 const data=localSchedule({...r,total:localTotal(r.items,prices)},today||todayAR());
 async function load(){
  setLoading(true);setError('');
  try{
   const [catalog,config]=demo?[{products:seed,categories:seedCategories},{version:1,prices:DEFAULT_RENTAL_PRICES}]:await Promise.all([catalogData(true),api('localConfig')]);
   if(config?.version!==1||!config.prices||config.prices.adulto<=0||config.prices.cabezon<=0)throw new Error('Falta habilitar el formulario local en Apps Script.');
   setProducts(catalog.products.filter((p:Product)=>p.area==='disfraces'&&p.active&&p.mode!=='venta'&&p.stock>0));
   setCategories(catalog.categories.filter((c:Category)=>c.area==='disfraces'));
   setPrices(config.prices);setSignature(null);setR(x=>({...x,terms:false}));
  }catch(e){setError('No pudimos cargar el formulario local. '+(e as Error).message)}finally{setLoading(false)}
 }
 useEffect(()=>{
  const key=crypto.randomUUID();access.current=crypto.randomUUID()+crypto.randomUUID();
  sessionStorage.setItem('dc-submit-'+key,access.current);setR(x=>({...x,requestKey:key}));
  const syncDate=()=>setToday(todayAR());syncDate();const timer=setInterval(syncDate,30000);void load();
  return()=>clearInterval(timer);
 },[]);
 useEffect(()=>{if(today)setR(x=>localSchedule(x,today))},[today]);
 function set<K extends keyof Rental>(key:K,value:Rental[K]){setR(x=>localSchedule({...x,[key]:value},today));setErrors({});}
 function item(n:number,patch:Partial<Costume>){set('items',r.items.map((i,j)=>j===n?{...i,...patch}:i));}
 function go(n:number){setStep(n);setErrors({});setError('');top.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 function issues(s:number){
  const found=validateLocal(data,s,today||todayAR());
  if(s>=1){data.items.forEach((i,n)=>{if(!i.catalogCategory)found['item'+n]='Elegí una categoría.'});Object.assign(found,rentalStockErrors(data.items,products))}
  if(s>=2)for(const key of ['dniFront','dniBack'])if(!files[key])found[key]='Adjuntá esta foto del DNI.';
  if(s>=3&&!signature)found.signature='Dibujá tu firma para enviar.';
  return found;
 }
 async function submit(){
  const found=issues(step);setErrors(found);if(Object.keys(found).length)return;
  if(step<3){go(step+1);return}
  if(demo){setError('Vista de demostración: el envío está deshabilitado.');return}
  if(sending.current)return;sending.current=true;setBusy(true);setError('');
  try{
   const attachments:Record<string,unknown>={};
   for(const [key,file]of Object.entries(files))if(file)attachments[key]=await fileData(file);
   attachments.signature=await fileData(await(await fetch(signature!)).blob());
   const response=await api('submitLocal',{data,files:attachments,access:access.current,pricingRevision:prices.revision});
   setResult({...response,portal:location.origin+'/solicitud/#id='+encodeURIComponent(response.id)+'&acceso='+encodeURIComponent(access.current)});
   window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){setError((e as Error).message)}finally{setBusy(false);sending.current=false}
 }
 const field=(key:keyof Rental,label:string,type='text',extra:Record<string,unknown>={})=><label key={key}>{label}<input name={key} type={type} value={String(r[key])} onChange={e=>set(key,e.target.value as never)} aria-invalid={!!errors[key]} {...extra}/>{errors[key]&&<span className="field-error">{errors[key]}</span>}</label>;
 const check=(key:keyof Rental,label:string)=><label className="checkbox" key={key}><input type="checkbox" checked={!!r[key]} onChange={e=>set(key,e.target.checked as never)}/><span>{label}{errors[key]&&<span className="field-error">{errors[key]}</span>}</span></label>;
 if(result)return <main className="section narrow local-form"><section className="panel"><span className="eyebrow">FORMULARIO LOCAL</span><h1>¡Recibimos tu formulario!</h1><h2>{result.code}</h2><p>El equipo ya puede revisar tus datos. El formulario no acredita un pago ni confirma la entrega.</p><a className="button dark" href={result.portal}>Ver mi solicitud y contrato</a><p>{result.mailStatus==='sent'?'Enviamos el aviso al correo indicado.':'Guardá el enlace privado. Consultá al equipo por tu copia si el correo no llega.'}</p></section></main>;
 return <main ref={top} className="section narrow local-form">
  <span className="eyebrow">SOLICITUD EN EL LOCAL</span><h1>Tu alquiler,<br/>en pocos pasos.</h1><p>Completá tus datos, fotografiá tu DNI y firmá.</p>
  {demo&&<p className="demo-note">Vista de demostración. No se envían datos ni archivos.</p>}
  <ol className="local-steps" aria-label="Pasos del formulario local">{steps.map((label,n)=><li key={label} aria-current={step===n?'step':undefined}>{n+1}. {label}</li>)}</ol>
  {loading?<p role="status">Cargando precios y disfraces…</p>:<form className="panel form-stack" onSubmit={e=>{e.preventDefault();void submit()}}>
   <fieldset disabled={busy||!!error&&products.length===0} className="local-fields"><legend>Paso {step+1}: {steps[step]}</legend>
   {step===0&&<><div className="field-grid">{field('fullName','Nombre y apellido')}{field('dni','Número de DNI','text',{inputMode:'numeric',maxLength:8})}{field('birthDate','Fecha de nacimiento','date')}{field('email','Correo electrónico','email')}{field('address','Calle, número, piso y departamento')}{field('city','Localidad y provincia')}{field('phone','Tu teléfono / WhatsApp','tel')}{field('altPhone','Teléfono alternativo','tel')}</div>{check('adult','Declaro que tengo 18 años o más y soy quien contrata el alquiler.')}{check('privacy','Acepto el tratamiento de mis datos para verificar mi identidad y gestionar el alquiler.')}<button className="text-button" type="button" onClick={()=>setTermsOpen(true)}>Leer condiciones y privacidad</button></>}
   {step===1&&<>
    {r.items.map((i,n)=><fieldset className="local-costume" key={n}><legend>Traje {n+1}</legend><div className="field-grid">
     <label>Categoría del disfraz {n+1}<select value={i.catalogCategoryId||''} onChange={e=>{const c=categories.find(c=>c.id===e.target.value);item(n,{catalogCategoryId:c?.id||'',catalogCategory:c?.name||'',productId:'',name:'',category:c?.name==='Cabezones'?'cabezon':'adulto'})}}><option value="">Elegí una categoría</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     <label>Disfraz del catálogo {n+1}<select value={i.productId||''} onChange={e=>{const p=products.find(p=>p.id===e.target.value);item(n,{productId:p?.id||'',name:p?.name||'',category:p?(p.category==='Cabezones'?'cabezon':'adulto'):i.category})}}><option value="">Otro / indicado por el local</option>{products.filter(p=>p.categoryId===i.catalogCategoryId&&i.catalogCategoryId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
     <label>Personaje {n+1}<input maxLength={150} value={i.name} onChange={e=>item(n,{name:e.target.value,productId:''})}/></label>
     <label>Tipo de traje {n+1}<select disabled={!!i.productId||i.catalogCategory==='Cabezones'} value={i.category} onChange={e=>item(n,{category:e.target.value as Costume['category']})}><option value="adulto">Disfraz adulto</option><option value="cabezon">Disfraz cabezón</option></select></label>
     <label>Cantidad {n+1}<input type="number" min={1} max={20} value={i.quantity} onChange={e=>item(n,{quantity:Number(e.target.value)})}/></label><p>Precio por traje: <strong>{money(prices[i.category])}</strong></p>
    </div>{errors['item'+n]&&<p className="field-error">{errors['item'+n]}</p>}{r.items.length>1&&<button type="button" className="text-button" onClick={()=>set('items',r.items.filter((_,j)=>j!==n))}>Quitar traje {n+1}</button>}</fieldset>)}
    <button className="button" type="button" disabled={r.items.length>=15} onClick={()=>set('items',[...r.items,{name:'',category:'adulto',quantity:1}])}>Agregar otro traje</button>
    <div className="field-grid">{field('pickupDate','Fecha de retiro','date',{min:today})}{field('returnDate','Fecha de devolución','date',{min:r.pickupDate||today})}</div>
    <div className="local-fixed-hours"><p>Retiro: <strong>{data.pickupWindow?data.pickupWindow+' h':r.pickupDate?'El local está cerrado ese día':'Elegí la fecha'}</strong></p><p>Devolución: <strong>{data.returnWindow?data.returnWindow+' h':r.returnDate?'El local está cerrado ese día':'Elegí la fecha'}</strong></p><small>Horarios fijos. Lunes a viernes: retiro 16 a 20 h, devolución 10 a 14 h. Sábado: 10 a 12 h. Domingo cerrado.</small></div>
    <p className="local-total" aria-live="polite">Total del alquiler: <strong>{money(data.total)}</strong></p><small>La tarifa se calcula por tipo y cantidad. La garantía de {money(deposit(data))} se gestiona por separado.</small>
    <div className="radio-cards"><label><input type="radio" name="local-pay-mode" checked={data.payMode==='half'} disabled={r.pickupDate===today} onChange={()=>set('payMode','half')}/>Seña del 50%</label><label><input type="radio" name="local-pay-mode" checked={data.payMode==='full'} onChange={()=>set('payMode','full')}/>Alquiler completo</label></div>{r.pickupDate===today&&<p>Como retirás hoy, corresponde alquiler completo.</p>}
    <p>Modalidad acordada; el cobro se gestiona en el local. No tenés que adjuntar un pago.</p>
    <label>¿Quién retira?<select value={r.pickupBy} onChange={e=>set('pickupBy',e.target.value as Rental['pickupBy'])}><option value="self">Retiro yo</option><option value="other">Otra persona</option></select></label>{r.pickupBy==='other'&&<div className="field-grid">{field('authorizedName','Nombre de quien retira')}{field('authorizedDni','DNI de quien retira','text',{inputMode:'numeric',maxLength:8})}</div>}
    {check('priorInfo','Recibí en el local la información de precios, fechas, horarios, garantía, devolución y condiciones.')}
    <button type="button" className="text-button" onClick={()=>void load()}>Actualizar tarifas y catálogo</button>
   </>}
   {step===2&&<><p>Fotografiá ambos lados del DNI. Tapá el número de trámite. No necesitás comprobante de domicilio.</p><div className="field-grid uploads">{['dniFront','dniBack'].map(key=><Upload key={key} id={'local-'+key} label={key==='dniFront'?'DNI · frente':'DNI · dorso'} help="JPG, PNG o WEBP · Hasta 8 MB" imagesOnly file={files[key]} error={errors[key]} onChange={f=>setFiles(x=>({...x,[key]:f}))}/>)}</div>{check('namesMatch','Confirmo que ambas fotos del DNI corresponden a mi identidad.')}</>}
   {step===3&&<><div className="final-summary"><p><strong>{r.fullName}</strong> · DNI {r.dni}</p><p>{r.items.map(i=>i.quantity+' × '+i.name+' ('+(i.category==='cabezon'?'Cabezón':'Adulto')+')').join(', ')}</p><p>Retiro: {dateAR(r.pickupDate)} · {data.pickupWindow} h<br/>Devolución: {dateAR(r.returnDate)} · {data.returnWindow} h</p><p>Alquiler: {money(data.total)} · {data.payMode==='full'?'Completo':'Seña del 50%'} · Cobro a gestionar en el local.</p></div><Signature onChange={setSignature}/>{errors.signature&&<p className="field-error">{errors.signature}</p>}{field('clarification','Aclaración de firma')}{check('truth','Declaro que mis datos y las fotos del DNI son auténticos, actuales y propios. Mi firma comprende esta solicitud y la autorización de retiro indicada.')}{check('terms','Acepto los términos y condiciones del alquiler presencial.')}<button type="button" className="text-button" onClick={()=>setTermsOpen(true)}>Leer términos y condiciones</button></>}
   </fieldset>
   {Object.keys(errors).length>0&&<div className="error-banner" role="alert">{[...new Set(Object.values(errors))].map(text=><p key={text}>{text}</p>)}</div>}
   <div className="actions">{step>0&&<button type="button" className="button" disabled={busy} onClick={()=>go(step-1)}>Anterior</button>}<button className="button dark" disabled={busy||!products.length||demo&&step===3}>{busy?'Enviando…':step===3?'Firmar y enviar formulario':'Continuar'}</button></div>
  </form>}
  {error&&<p className="error-banner" role="alert">{error}</p>}{!loading&&error&&<button className="button" onClick={()=>{go(Math.min(step,1));void load()}}>Reintentar y actualizar</button>}
  {termsOpen&&<div className="modal-overlay"><div className="terms-modal" role="dialog" aria-modal="true" aria-label="Condiciones del formulario local" ref={termsRef} tabIndex={-1}><div className="modal-title"><h2>Condiciones del alquiler presencial</h2><button type="button" className="button" onClick={()=>setTermsOpen(false)}>Cerrar</button></div><div className="modal-body">{localTerms.map((term,n)=><section key={term.title}><h3>{n+1}. {term.title}</h3><p>{term.body}</p></section>)}</div><div className="modal-actions"><button type="button" className="button dark" onClick={()=>{set('terms',true);setTermsOpen(false)}}>Aceptar condiciones</button></div></div></div>}
 </main>;
}
