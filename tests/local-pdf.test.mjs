import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {pdfModules} from './pdf-harness.mjs';
import {fixture,png} from './local-forms-harness.mjs';
const {pdf,local,terms,webTerms}=pdfModules();
const signature=Buffer.from(png.base64,'base64');
const create=(r,source='local',conditions=terms,layout='compact')=>pdf.contractPdf(r,'LOCAL-PRUEBA','2026-10-30T12:00:00Z',signature,conditions,'a'.repeat(64),'DC-LOCAL-2026-10-29.1',source,layout);

test('PDF local: una hoja A4 con firma y varias categorías; conserva todos los datos originales',async()=>{
 for(const count of [1,3,8]){
  const r=fixture();r.items=Array.from({length:count},(_,n)=>({name:'Personaje de prueba '+(n+1),category:n%2?'cabezon':'adulto',quantity:n+1,catalogCategory:n%2?'Cabezones':'Halloween'}));
  r.fullName='María Ángeles Pérez de la Cruz';r.clarification=r.fullName;
  r.pickupBy='other';r.authorizedName='José Luis Gómez';r.authorizedDni='23456789';
  const before=structuredClone(r),doc=await PDFDocument.load(await create(r));
  assert.equal(doc.getPageCount(),1);assert.ok(Math.abs(doc.getPage(0).getWidth()-595.28)<.01);assert.ok(Math.abs(doc.getPage(0).getHeight()-841.89)<.01);
  assert.match(doc.getTitle(),/una hoja/);assert.deepEqual(r,before);
 }
});

test('PDF local: nombres largos y palabras sin espacios se ajustan sin recortar campos',async()=>{
 const r=fixture();r.fullName='Cliente '+('Apellido '.repeat(10));r.clarification=r.fullName;r.email='correo.'+'x'.repeat(75)+'@example.invalid';r.address='Dirección de prueba extensa '.repeat(5);
 r.items=[{name:'Personaje '+'MUYLARGO'.repeat(16),category:'adulto',quantity:2,catalogCategory:'Profesiones'}];
 assert.equal((await PDFDocument.load(await create(r))).getPageCount(),1);
});

test('PDF: el original completo sigue disponible y el formulario web conserva el documento extenso',async()=>{
 assert.ok((await PDFDocument.load(await create(fixture(),'local',terms,'full'))).getPageCount()>=3);
 assert.ok((await PDFDocument.load(await create(fixture(),'web',webTerms))).getPageCount()>=3);
});

test('PDF local: el resumen solo se usa para el texto exacto conocido, nunca para condiciones diferentes',()=>{
 assert.match(local.localPrintConditions(terms).join('\n'),/Día extra: 50%/);
 const custom={title:'Reprogramaciones',body:'Condición particular distinta que debe conservarse completa.'};
 assert.equal(local.localPrintConditions([custom])[0],'1. Reprogramaciones: '+custom.body);
 const unknown={title:'Acuerdo particular',body:'Texto íntegro de la condición especial.'};
 assert.equal(local.localPrintConditions([unknown])[0],'1. Acuerdo particular: '+unknown.body);
});

test('PDF local: un caso extremo ofrece el original completo en lugar de imprimir texto ilegible',async()=>{
 const r=fixture();r.items=Array.from({length:100},(_,n)=>({name:'Disfraz de prueba '+n,category:'adulto',quantity:1}));
 await assert.rejects(()=>create(r),/original completo/);
 assert.ok((await PDFDocument.load(await create(r,'local',terms,'full'))).getPageCount()>1);
});
