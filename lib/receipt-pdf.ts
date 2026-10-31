import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {BRAND,dateAR} from './model';
import {LocalReceipt,receiptMoney} from './receipt';

export async function receiptPdf(receipt:LocalReceipt){
 const doc=await PDFDocument.create(),normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 doc.setTitle('Constancia de reserva - '+receipt.snapshot.code);doc.setAuthor(BRAND.name);
 let page=doc.addPage([595.28,841.89]),y=800;
 const safe=(s:string)=>s.replace(/[^\x20-\x7e\xa0-\xff\n]/g,'-');
 function line(value:string,size=10,heavy=false){
  const font=heavy?bold:normal;
  for(const paragraph of safe(value).split('\n')){
   let text='';
   const flush=()=>{if(y<64){page=doc.addPage([595.28,841.89]);y=800;}page.drawText(text,{x:36,y,size,font,color:rgb(.1,.1,.1)});y-=size*1.4;text='';};
   for(let word of paragraph.split(/\s+/)){
    if(text&&font.widthOfTextAtSize(text+' '+word,size)>523)flush();
    while(font.widthOfTextAtSize(word,size)>523){let n=word.length-1;while(font.widthOfTextAtSize(word.slice(0,n),size)>523)n--;text=word.slice(0,n);flush();word=word.slice(n);}
    text+=(text?' ':'')+word;
   }
   flush();
  }
 }
 const title=(s:string)=>{y-=12;line(s,11,true);y-=3;};
 const s=receipt.snapshot;
 line(BRAND.name.toUpperCase(),18,true);line('CONSTANCIA DE RESERVA Y COBROS',13,true);
 line(BRAND.owner+' | CUIT '+BRAND.cuit,9);line(BRAND.address+' | WhatsApp '+BRAND.phone,9);
 title(s.code);line('Cliente: '+s.fullName);line('Emitida: '+new Date(receipt.issuedAt).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'}),9);
 if(receipt.outdated){title('ATENCIÓN: HUBO CAMBIOS DESPUÉS DE ESTA EMISIÓN');line('Esta copia conserva los datos de la fecha de emisión. Consultá al local por la constancia actualizada.',9);}
 title('DISFRACES RESERVADOS');s.items.forEach(i=>line(i.quantity+' x '+i.name+' | '+i.category));
 title('RETIRO Y DEVOLUCIÓN');line('Retiro: '+dateAR(s.pickupDate)+' | '+s.pickupWindow+' h');line('Devolución: '+dateAR(s.returnDate)+' | '+s.returnWindow+' h');
 title('IMPORTES DEL ALQUILER');line('Total: '+receiptMoney(s.total),12,true);line('Abonado: '+receiptMoney(s.paid),12,true);line('Saldo pendiente: '+receiptMoney(s.balance),12,true);
 title('SEGURO / GARANTÍA - SEPARADO DEL ALQUILER');line('Recibido: '+receiptMoney(s.guarantee));line('Este importe no se descuenta del saldo del alquiler.',9);
 title('COBROS REGISTRADOS A LA EMISIÓN');
 if(!s.payments.length)line('Sin cobros registrados. La reserva se confirmó sin un pago registrado.',9);
 s.payments.forEach(p=>line(dateAR(p.date)+' | '+(p.kind==='garantia'?'Seguro / garantía':'Alquiler')+' | '+receiptMoney(p.amount)+' | '+p.method,9));
 title('TU CONSTANCIA');line('Los importes corresponden a los cobros registrados por el local al emitir esta copia. Conservá el contrato para consultar las condiciones y tu enlace privado para futuras consultas.',9);
 line('Contacto: '+BRAND.email,9);line('Referencia: '+receipt.id,8);
 const pages=doc.getPages();pages.forEach((p,i)=>p.drawText('Disfraz Cabezón | '+s.code+' | '+(i+1)+' / '+pages.length,{x:36,y:30,size:8,font:normal}));
 return doc.save();
}
export async function downloadReceipt(receipt:LocalReceipt){
 const bytes=await receiptPdf(receipt),url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
 const a=document.createElement('a');a.href=url;a.download=receipt.snapshot.code+'-constancia.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
