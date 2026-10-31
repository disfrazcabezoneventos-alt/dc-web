export type ReceiptSnapshot={code:string;fullName:string;items:{name:string;quantity:number;category:string}[];pickupDate:string;returnDate:string;pickupWindow:string;returnWindow:string;total:number;paid:number;balance:number;guarantee:number;payments:{id:string;date:string;amount:number;kind:string;method:string}[]};
export type LocalReceipt={id:string;issuedAt:string;snapshot:ReceiptSnapshot;outdated:boolean;url?:string;email?:string;phone?:string;mailStatus?:string;attempts?:{id:string;status:string;at:string;mode:string}[]};
export const receiptMailLabels:Record<string,string>={pending:'Envío pendiente',sending:'Envío sin confirmar: revisar antes de reenviar',sent:'Correo aceptado para envío (revisar recepción)',test:'Prueba enviada solo al negocio',review:'Envío incierto: consultar al cliente antes de reenviar',retry:'Sin cuota de correo: reintentar más tarde',disabled:'Correo deshabilitado'};
export const receiptMoney=(n:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2}).format(n);
export function receiptWhatsapp(receipt:LocalReceipt){
 let phone=String(receipt.phone||'').replace(/\D/g,'');
 if(phone.startsWith('00'))phone=phone.slice(2);
 const nationalMobile=/^0?(\d{2,4})15(\d{6,8})$/.exec(phone);
 if(!phone.startsWith('54')&&nationalMobile&&nationalMobile[1].length+nationalMobile[2].length===10)phone=nationalMobile[1]+nationalMobile[2];
 if(phone.length===11&&phone.startsWith('0'))phone=phone.slice(1);
 if(phone.length===10)phone='549'+phone;
 else if(phone.startsWith('54')&&phone.length===12)phone='549'+phone.slice(2);
 if(!/^\d{10,15}$/.test(phone)||!receipt.url)throw new Error('Revisá el número de WhatsApp con código de país y de área.');
 const s=receipt.snapshot;
 return 'https://wa.me/'+phone+'?text='+encodeURIComponent('Hola '+s.fullName+', tu reserva '+s.code+' en Disfraz Cabezón está confirmada.\n'+s.items.map(i=>i.quantity+' × '+i.name).join('\n')+'\nTotal: '+receiptMoney(s.total)+' · Abonado: '+receiptMoney(s.paid)+' · Saldo: '+receiptMoney(s.balance)+'\nSeguro / garantía recibido por separado: '+receiptMoney(s.guarantee)+'\nTu constancia para consultar y descargar: '+receipt.url);
}
