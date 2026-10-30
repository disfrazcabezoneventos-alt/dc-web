import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {BRAND,Rental,dateAR,money,deposit,norm} from './model';
import {localTerms} from './local-terms';

type Condition={title:string;body:string};
const summaries:Record<string,[string,string]>={
 'Proveedor y comunicaciones':['Acuerdo','Los datos, trajes, fechas e importes registrados integran el acuerdo al confirmarse la reserva.'],
 'Solicitud, revisión y confirmación':['Confirmación','El envío no acredita pagos ni entrega. El local verifica identidad, disponibilidad y condiciones antes de confirmar o despachar.'],
 'Identidad y documentación obligatoria':['Identidad','Contratante mayor de 18 años, datos y DNI auténticos. Se conservan frente y dorso del DNI; no se exige comprobante de domicilio.'],
 'Trajes, precio y seña':['Alquiler','Tarifa aceptada por tipo y cantidad. Retiro en el día: alquiler completo; fechas futuras: 50% o 100%. La garantía es separada.'],
 'Saldo de reservas con pago parcial':['Precio y saldo','El 100% congela el precio. Con pago parcial se descuenta lo abonado del precio vigente previamente informado, respetando los derechos del consumidor.'],
 'Datos de cobro y comprobante':['Cobros','El pago se verifica y registra por separado en el local. La modalidad elegida en este formulario no acredita un pago.'],
 'Depósito de garantía':['Garantía','Depósito reembolsable en efectivo al retirar. Se revisan las piezas frente al cliente y se devuelve al restituirlas completas y en condiciones.'],
 'Fechas, horarios y período incluido':['Horarios','Retiro: L-V 16-20 h; sáb. 10-12 h. Devolución: L-V 10-14 h; sáb. 10-12 h. Viernes a lunes integra el período base. Excepciones con autorización previa.'],
 'Retiro por otra persona':['Autorizados','Retira el contratante o la persona indicada con nombre y DNI. Cambios y mensajería requieren autorización previa e identificación.'],
 'Entrega, cuidado y limpieza':['Cuidado','Se registran piezas y estado. Limpieza habitual incluida; consultar antes de lavar. No se cobran desgaste normal, defectos previos ni limpieza habitual como daños.'],
 'Incidencias y liquidación de la garantía':['Daños y faltantes','Se documentan daños, faltantes o suciedad excesiva. Puede retenerse provisoriamente la garantía; en 24 h se detallan cargos justificados y se reintegra el remanente, sin pérdida automática.'],
 'Extensiones y devoluciones fuera de término':['Día extra','50% del alquiler por traje involucrado. Importe, nuevo plazo y excepciones deben confirmarse. Avisar no equivale a autorización ni a pérdida automática de la garantía.'],
 'Reprogramaciones':['Reprogramación','Con 7 días de aviso, autorización y disponibilidad, dentro de 2 meses: nuevo precio + 50%, menos pagos previos; garantía separada. No limita derechos legales.'],
 'Información previa y cancelaciones':['Información y cancelación','Información recibida en el local; las condiciones particulares se conservan. Cancelaciones por los canales del negocio, sin renuncia a derechos legales.'],
 'Privacidad y uso de la documentación':['Datos personales','Uso para gestionar el alquiler y obligaciones legales, con acceso restringido y sin publicidad. Acceso, rectificación o supresión: correo del negocio.'],
 'Declaración, firma electrónica y copias':['Firma y copia','Datos y DNI propios. La firma electrónica comprende la solicitud y la autorización de retiro. Se conserva el original con sus condiciones y se puede solicitar copia completa.'],
 'Derecho de arrepentimiento':['Derechos','En contrataciones a distancia, revocación en 10 días en los casos legalmente aplicables, sin gastos. Comunicación por WhatsApp o correo. Se mantienen los derechos legales.'],
};

// Only summarize text that exactly matches the known accepted version. Unknown
// or historical wording is kept verbatim; it must never inherit a stale summary.
export function localPrintConditions(conditions:Condition[]):string[]{
 return conditions.map((term,index)=>{
  const known=localTerms.find(t=>t.title===term.title&&t.body===term.body),summary=known&&summaries[term.title];
  return `${index+1}. ${summary?summary[0]+': '+summary[1]:term.title+': '+term.body}`;
 });
}

export async function localContractPdf(r:Rental,code:string,createdAt:string,signature:ArrayBuffer,conditions:Condition[],hash:string,version:string){
 const doc=await PDFDocument.create();
 doc.setTitle('Contrato local - una hoja - '+code);doc.setAuthor(BRAND.name);doc.setCreationDate(new Date(createdAt));
 const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),sig=await doc.embedPng(signature);
 const page=doc.addPage([595.28,841.89]),left=32,width=531.28,ink=rgb(.08,.08,.08),border=rgb(.65,.65,.65);
 const safe=(value:string)=>String(value??'').replace(/[^\x20-\x7E\xA0-\xFF\n]/g,'-');
 const paragraphs=localPrintConditions(conditions);
 function lines(text:string,w:number,size:number,heavy=false){
  const font=heavy?bold:regular,result:string[]=[];
  for(const paragraph of safe(text).split('\n')){
   let line='';
   for(let word of paragraph.split(/\s+/)){
    if(!word)continue;
    if(line&&font.widthOfTextAtSize(line+' '+word,size)>w){result.push(line);line='';}
    while(font.widthOfTextAtSize(word,size)>w){let cut=word.length-1;while(cut>1&&font.widthOfTextAtSize(word.slice(0,cut),size)>w)cut--;result.push(word.slice(0,cut));word=word.slice(cut);}
    line=line?line+' '+word:word;
   }
   if(line)result.push(line);
  }
  return result.length?result:[''];
 }
 function layout(size:number,draw=false){
  let y=808;
  const text=(value:string,x:number,top:number,w:number,fontSize=size,heavy=false)=>{
   const wrapped=lines(value,w,fontSize,heavy),leading=fontSize*1.23;
   if(draw)wrapped.forEach((line,i)=>page.drawText(line,{x,y:top-fontSize-i*leading,size:fontSize,font:heavy?bold:regular,color:ink}));
   return wrapped.length*leading;
  };
  const row=(values:string[],widths:number[],fontSize=size,heavy=false)=>{
   let x=left,h=0;values.forEach((value,i)=>{h=Math.max(h,text(value,x,y,widths[i]-8,fontSize,heavy));x+=widths[i];});y-=h+3;
  };
  const rule=()=>{if(draw)page.drawLine({start:{x:left,y},end:{x:left+width,y},thickness:.55,color:border});y-=7;};
  const heading=(value:string)=>{y-=3;row([value],[width],9.3,true);};
  row([BRAND.name.toUpperCase(),'CONTRATO DE ALQUILER - LOCAL'],[235,width-235],12,true);
  row([code,'Formulario: '+new Date(createdAt).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})],[235,width-235],8);
  row([BRAND.owner+' | CUIT '+BRAND.cuit+' | '+BRAND.address],[width],7.7);
  row(['WhatsApp '+BRAND.phone+' | '+BRAND.email],[width],7.7);rule();
  heading('DATOS DEL CLIENTE');
  row(['Locatario: '+r.fullName,'DNI: '+r.dni+' | Nac.: '+dateAR(r.birthDate)],[315,width-315]);
  row(['Domicilio: '+r.address+' - '+r.city],[width]);
  row(['Teléfono: '+r.phone+' | Alternativo: '+r.altPhone,'Correo: '+r.email],[267,width-267]);
  row([r.pickupBy==='other'?'Retiro autorizado: '+r.authorizedName+' | DNI '+r.authorizedDni:'Retira personalmente el contratante.'],[width]);
  heading('RETIRO Y DEVOLUCIÓN');
  row(['Retiro: '+dateAR(r.pickupDate)+' | '+r.pickupWindow+' h','Devolución: '+dateAR(r.returnDate)+' | '+r.returnWindow+' h'],[width/2,width/2],size,true);
  if(r.specialSchedule&&r.scheduleAgreement)row(['Acuerdo de horario: '+r.scheduleAgreement],[width]);
  heading('DISFRACES Y ACCESORIOS');
  const columns=[257,85,35,width-377],headers=['PRODUCTO','CATEGORÍA','CANT.','PARTES / INDICACIONES'];
  const tableRow=(values:string[],header=false)=>{
   const fontSize=header?7:size,leading=fontSize*1.23;
   const wrapped=values.map((value,i)=>lines(value,columns[i]-10,fontSize,header));
   const h=Math.max(header?17:16,...wrapped.map(v=>v.length*leading+7));
   if(draw){
    page.drawRectangle({x:left,y:y-h,width,height:h,borderWidth:.5,borderColor:border,...(header?{color:rgb(.94,.94,.94)}:{})});
    let x=left;
    wrapped.forEach((value,i)=>{value.forEach((line,n)=>page.drawText(line,{x:x+5,y:y-fontSize-3-n*leading,size:fontSize,font:header?bold:regular,color:ink}));x+=columns[i];if(i<columns.length-1)page.drawLine({start:{x,y},end:{x,y:y-h},thickness:.5,color:border});});
   }
   y-=h;
  };
  tableRow(headers,true);
  r.items.forEach(i=>{
   const category=i.category==='adulto'?'Adulto':'Cabezón',detail=i.catalogCategory||'';
   tableRow([i.name,category+(detail&&!['adulto','adultos','cabezon','cabezones'].includes(norm(detail))?' / '+detail:''),String(i.quantity),'']);
  });
  y-=7;
  row(['Alquiler: '+money(r.total),'Garantía: '+money(deposit(r)),'Modalidad: '+(r.payMode==='full'?'100%':'50%')],[width/3,width/3,width/3],size,true);
  row(['Cobros a verificar y registrar en el local. Este formulario no acredita pagos.'],[width],7.8);
  const yes=(value:boolean)=>value?'Sí':'No';
  row(['Mayor de edad: '+yes(r.adult)+' | Datos auténticos: '+yes(r.truth)+' | DNI propio: '+yes(r.namesMatch)+' | Información previa: '+yes(r.priorInfo)+' | Privacidad: '+yes(r.privacy)+' | Condiciones: '+yes(r.terms)],[width],7.3);
  heading('CONDICIONES Y PAUTAS - RESUMEN DEL TEXTO ACEPTADO');
  const columnWidth=(width-16)/2,leading=size*1.23,blocks=paragraphs.map(value=>lines(value,columnWidth,size)),heights=blocks.map(b=>b.length*leading+4);
  let split=blocks.length,best=Infinity;
  for(let i=1;i<blocks.length;i++){const a=heights.slice(0,i).reduce((s,h)=>s+h,0),b=heights.slice(i).reduce((s,h)=>s+h,0);if(Math.max(a,b)<best){best=Math.max(a,b);split=i;}}
  const column=(start:number,end:number,x:number)=>{
   let top=y;
   for(let i=start;i<end;i++){if(draw)blocks[i].forEach((line,n)=>page.drawText(line,{x,y:top-size-n*leading,size,font:regular,color:ink}));top-=heights[i];}
   return top;
  };
  y=Math.min(column(0,split,left),column(split,blocks.length,left+columnWidth+16))-4;
  rule();
  row(['FIRMA ELECTRÓNICA DEL CONTRATANTE'],[width],8.5,true);
  const signatureTop=y,scale=Math.min(195/sig.width,46/sig.height);
  if(draw)page.drawImage(sig,{x:left+8,y:signatureTop-46,width:sig.width*scale,height:sig.height*scale});
  const clarificationHeight=text('Aclaración: '+r.clarification+'\nDNI: '+r.dni,left+236,signatureTop,width-236,size);
  y-=Math.max(49,clarificationHeight)+3;
  row(['Copia resumida de los datos originales firmados. Condiciones completas y documentación conservadas en el registro privado. La reserva se confirma por separado.'],[width],7.1);
  return y;
 }
 const size=[9,8.5,8,7.5].find(size=>layout(size)>=51);
 if(!size)throw new Error('Hay demasiados datos para una hoja legible. Descargá el original completo de este formulario.');
 layout(size,true);
 page.drawLine({start:{x:left,y:42},end:{x:left+width,y:42},thickness:.5,color:border});
 page.drawText(safe(code+' | '+version+' | Copia resumida - 1 / 1'),{x:left,y:30,size:7,font:regular,color:ink});
 page.drawText(safe('SHA-256 original: '+hash),{x:left,y:18,size:6.6,font:regular,color:ink});
 return doc.save();
}
