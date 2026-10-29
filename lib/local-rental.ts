import {Rental, Costume, validate, norm, todayAR, windows} from './model';

export type RentalPrices = {adulto:number;cabezon:number;revision:string};
export const DEFAULT_RENTAL_PRICES:RentalPrices={adulto:60000,cabezon:75000,revision:'default'};
export const LOCAL_TERMS_VERSION='DC-LOCAL-2026-10-29.1';
export const FORM_STATES={reserved:'Reserva',dispatched:'Despachado',finished:'Finalizado'};
export type FormState=keyof typeof FORM_STATES;
export type FormSource='web'|'local';

export function localTotal(items:Costume[],prices:RentalPrices){
 return Math.round(items.reduce((sum,item)=>sum+(prices[item.category]||0)*item.quantity,0)*100)/100;
}
export function localSchedule(r:Rental,now=todayAR()):Rental{
 return {...r,pickupWindow:windows(r.pickupDate,'pickup'),returnWindow:windows(r.returnDate,'return'),specialSchedule:false,scheduleAgreement:'',payMode:r.pickupDate===now?'full':r.payMode};
}
/** The online validator and its document/payment requirements remain unchanged. */
export function validateLocal(r:Rental,step:number,now=todayAR()):Record<string,string>{
 const errors=validate(r,Math.min(step,1),now);
 if(errors.priorInfo)errors.priorInfo='Confirmá la información recibida en el local.';
 if(step>=1&&r.pickupDate===now&&r.payMode!=='full')errors.payMode='El retiro de hoy requiere alquiler completo.';
 if(step>=1&&(r.specialSchedule||r.pickupWindow!==windows(r.pickupDate,'pickup')||r.returnWindow!==windows(r.returnDate,'return')))errors.pickupWindow='Los horarios son fijos según la fecha elegida.';
 if(step>=2&&!r.namesMatch)errors.namesMatch='Confirmá que el DNI corresponde al contratante.';
 if(step>=3){
  if(!r.terms)errors.terms='Aceptá los términos y condiciones.';
  if(!r.truth)errors.truth='Aceptá la declaración de veracidad.';
  if(norm(r.clarification)!==norm(r.fullName))errors.clarification='La aclaración debe coincidir con el nombre del contratante.';
 }
 return errors;
}
