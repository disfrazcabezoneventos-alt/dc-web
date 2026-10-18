export const BRAND = {name:'Disfraz Cabezón',owner:'Lorena Ughetti',cuit:'27-29478271-6',address:'Av. Rivadavia 3314, CABA',phone:'1149897969',email:'disfrazcabezoneventos@gmail.com'};
export const OWNER_EMAIL = 'disfrazcabezoneventos@gmail.com';
export const VERSION = 'DC-2026-10-09.1';
export const STATUS:Record<string,string>={pending:'Pendiente',correction:'A corregir',confirmed:'Confirmado',rejected:'Rechazado',refund_pending:'Reintegro pendiente',refunded:'Reintegrado',returned:'Devuelto',incident:'Con incidencia',cancel_requested:'Cancelación solicitada'};
export type Costume={name:string;category:'adulto'|'cabezon';quantity:number;catalogCategoryId?:string;catalogCategory?:string;productId?:string};
export type Rental={fullName:string;dni:string;birthDate:string;address:string;city:string;phone:string;altPhone:string;email:string;items:Costume[];pickupDate:string;returnDate:string;pickupWindow:string;returnWindow:string;specialSchedule:boolean;scheduleAgreement:string;total:number;payMode:'half'|'full';pickupBy:'self'|'other';authorizedName:string;authorizedDni:string;docType:string;docDate:string;namesMatch:boolean;adult:boolean;privacy:boolean;priorInfo:boolean;truth:boolean;terms:boolean;clarification:string;requestKey:string};
export const EMPTY:Rental={fullName:'',dni:'',birthDate:'',address:'',city:'',phone:'',altPhone:'',email:'',items:[{name:'',category:'adulto',quantity:1}],pickupDate:'',returnDate:'',pickupWindow:'',returnWindow:'',specialSchedule:false,scheduleAgreement:'',total:0,payMode:'half',pickupBy:'self',authorizedName:'',authorizedDni:'',docType:'servicio',docDate:'',namesMatch:false,adult:false,privacy:false,priorInfo:false,truth:false,terms:false,clarification:'',requestKey:''};
export const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v);
export function dateAR(s:string){if(!s)return '—';return new Date(s.length===10?s+'T12:00:00Z':s).toLocaleDateString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',year:'numeric'});}
export const phoneDigits=(s:string)=>s.replace(/\D/g,'');
export const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
export function todayAR(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function windows(date:string,kind:'pickup'|'return'){if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date+'T12:00:00Z')))return '';const d=new Date(date+'T12:00:00Z').getUTCDay();return d===0?'':d===6?'10:00 a 12:00':kind==='pickup'?'16:00 a 20:00':'10:00 a 14:00';}
export const deposit=(r:Rental)=>r.items.reduce((n,i)=>n+(i.category==='adulto'?60000:100000)*i.quantity,0);
export const paid=(r:Rental)=>Math.round(r.total*(r.payMode==='full'?1:0.5)*100)/100;
export function validate(r:Rental,step:number,now=todayAR()):Record<string,string>{
 const e:Record<string,string>={};const req=(k:keyof Rental,msg:string)=>{if(typeof r[k]!=='string'||!(r[k] as string).trim())e[k]=msg;};
 if(step>=0){req('fullName','Ingresá tu nombre y apellido.'); if(r.fullName?.trim().split(/\s+/).length<2)e.fullName='Escribí nombre y apellido completos.';
 if(!/^\d{7,8}$/.test(r.dni??''))e.dni='Ingresá 7 u 8 números, sin puntos.';
 req('birthDate','Indicá tu fecha de nacimiento.'); if(r.birthDate){const born=new Date(r.birthDate+'T12:00:00Z');const t=new Date(now+'T12:00:00Z');const age=t.getUTCFullYear()-born.getUTCFullYear()-((t.getUTCMonth()<born.getUTCMonth()||(t.getUTCMonth()===born.getUTCMonth()&&t.getUTCDate()<born.getUTCDate()))?1:0);if(!Number.isFinite(age)||age<18||age>115)e.birthDate='El contratante debe tener al menos 18 años.';}
 req('address','Ingresá tu domicilio actual completo.');req('city','Ingresá localidad y provincia.');
 for(const k of ['phone','altPhone'] as const){const p=phoneDigits(r[k]??'');if(p.length<10||p.length>15)e[k]='Ingresá código de área y número (10 a 15 dígitos).';}
 if(phoneDigits(r.phone??'').slice(-10)===phoneDigits(r.altPhone??'').slice(-10))e.altPhone='Usá un teléfono alternativo diferente al principal.';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email??''))e.email='Ingresá un correo válido.';
 if(!r.adult)e.adult='Confirmá que sos mayor de edad.';if(!r.privacy)e.privacy='Aceptá el tratamiento de datos para gestionar el alquiler.';
 }
 if(step>=1){if(!Array.isArray(r.items)||!r.items.length||r.items.length>15)e.items='Agregá entre 1 y 15 trajes.';else r.items.forEach((i,n)=>{if(!i.name?.trim()||!['adulto','cabezon'].includes(i.category)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>20)e['item'+n]='Completá personaje, categoría y cantidad.';});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.pickupDate??'')||isNaN(Date.parse(r.pickupDate+'T12:00:00Z'))||r.pickupDate<now)e.pickupDate='Elegí una fecha de retiro desde hoy.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.returnDate??'')||isNaN(Date.parse(r.returnDate+'T12:00:00Z'))||r.returnDate<r.pickupDate)e.returnDate='La devolución debe ser igual o posterior al retiro.';
 if(!r.pickupWindow)e.pickupWindow='Elegí el horario de retiro.';if(!r.returnWindow)e.returnWindow='Elegí el horario de devolución.';
 if(r.specialSchedule){if(!r.scheduleAgreement?.trim())e.scheduleAgreement='Indicá la excepción ya autorizada por Disfraz Cabezón.';}else{if(r.pickupWindow!==windows(r.pickupDate,'pickup')||!windows(r.pickupDate,'pickup'))e.pickupWindow='Para este día hace falta una excepción previamente autorizada.';if(r.returnWindow!==windows(r.returnDate,'return')||!windows(r.returnDate,'return'))e.returnWindow='Para este día hace falta una excepción previamente autorizada.';}
 if(!Number.isFinite(r.total)||r.total<=0||r.total>100000000)e.total='Ingresá el total del alquiler acordado por WhatsApp.';
 if(!['half','full'].includes(r.payMode))e.payMode='Elegí la modalidad de pago.';
 if(!['self','other'].includes(r.pickupBy))e.pickupBy='Indicá quién retira.';
 if(r.pickupBy==='other'){req('authorizedName','Ingresá nombre completo de quien retira.');if(!/^\d{7,8}$/.test(r.authorizedDni??''))e.authorizedDni='Ingresá el DNI de quien retira.';}
 if(!r.priorInfo)e.priorInfo='Confirmá la información recibida por WhatsApp.';
 }
 if(step>=2){if(!['servicio','sueldo','extracto','licencia','otro'].includes(r.docType))e.docType='Elegí el comprobante de domicilio.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.docDate??''))e.docDate=r.docType==='licencia'?'Indicá el vencimiento de tu licencia.':'Indicá la fecha de emisión.';
 else if(r.docType==='licencia'&&r.docDate<now)e.docDate='La licencia debe estar vigente.';else if(r.docType!=='licencia'&&(r.docDate.slice(0,7)!==now.slice(0,7)||r.docDate>now))e.docDate='El documento debe ser del mes en curso y no tener fecha futura.';
 if(!r.namesMatch)e.namesMatch='Confirmá que el nombre y domicilio coinciden.';}
 if(step>=4){if(!r.terms)e.terms='Aceptá los términos y condiciones.';if(!r.truth)e.truth='Aceptá la declaración de veracidad.';if(norm(r.clarification??'')!==norm(r.fullName??''))e.clarification='La aclaración debe coincidir con el nombre del contratante.';}
 return e;
}
