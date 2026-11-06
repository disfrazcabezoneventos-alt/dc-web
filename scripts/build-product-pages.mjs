import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const retired='https://script.google.com/macros/s/AKfycbzg5m5PsnI33gaB2QpyWqqqlSp4fBBJoPV36tbe6QfA2wW81IZd98A44sAT0ZnmRZRz/exec';
const active='https://script.google.com/macros/s/AKfycbynyGN99GuijF2x9NWz-cEDIUa7_0tKhi21c09YqSfeLnklND5bVIcMp2aKqFvzUPlZ/exec';
export function publicPageSnapshot(data){
 if(!data||!Array.isArray(data.products))throw Error('La copia del catálogo público no es válida.');
 const fields=['id','area','name','description','price','rentPrice','mode','category','categoryId','categoryIds','categoryNames','image','thumbnail','saleCondition','deliveryTime','orderLimit','priceKnown','stockUnknown','active','available','purchaseMax'];
 const ids=new Set(),products=data.products.filter(p=>p.active&&(!p.publicationState||p.publicationState==='published')).map(p=>{
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(p.id)||ids.has(p.id)||!['disfraces','cotillon'].includes(p.area)||typeof p.name!=='string'||!p.name.trim())throw Error('Identificador o producto inválido en el catálogo público.');
  if(!Number.isFinite(p.price)||p.price<0||!Number.isFinite(p.rentPrice)||p.rentPrice<0)throw Error('Precio inválido en el catálogo público.');
  ids.add(p.id);return Object.fromEntries(fields.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));
 });
 if(!products.length)throw Error('El catálogo está vacío: se cancela el build para no retirar todas las fichas.');
 return {products,categories:data.categories||[],rentalConfig:data.rentalConfig||null};
}
async function main(){
 let data;const fixture=process.env.PRODUCT_CATALOG_FILE;
 if(fixture)data=JSON.parse(await fs.readFile(fixture,'utf8'));
 else{
  const configured=process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
  if(!configured||configured==='https://script.google.com/macros/s/mock/exec'){
   data=JSON.parse(await fs.readFile('tests/fixtures/product-pages.json','utf8'));console.log('Modo demostración: fichas ficticias, sin acceso a producción.');
  }else{
  const response=await fetch(configured===retired?active:configured,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'catalogData'}),signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error('No se pudo leer el catálogo público (HTTP '+response.status+').');
  const result=await response.json();if(!result.ok)throw Error('Apps Script no devolvió el catálogo público.');data=result.data;
  }
 }
 const snapshot=publicPageSnapshot(data);await fs.mkdir('generated',{recursive:true});
 await fs.writeFile('generated/catalog-public.json',JSON.stringify(snapshot));
 await fs.writeFile('generated/product-page-ids.json',JSON.stringify(snapshot.products.map(p=>p.id)));
 console.log('Fichas públicas para este build: '+snapshot.products.length+'. Sin datos internos ni stock exacto.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url)))await main();
