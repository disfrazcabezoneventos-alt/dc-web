import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {productShareImage} from '../lib/product-share-image.mjs';
const site='https://disfrazcabezon.com.ar';
const decode=value=>value.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const compact=value=>Array.from(value||'').filter(char=>char.trim()!=='').join('');
export function checkProductHtml(product,html,sitemap){
 const meta=Object.fromEntries([...html.matchAll(/<meta (?:name|property)="([^"]+)" content="([^"]*)"/g)].map(m=>[m[1],decode(m[2])])),issues=[];
 const url=site+'/p/'+product.id+'/',image=productShareImage(product.image||'',site)?.url||'';
 if(meta['og:url']!==url||!sitemap.includes('<loc>'+url+'</loc>'))issues.push('URL/sitemap');
 if(!meta['og:title']?.includes(product.name)||meta.description!==meta['og:description'])issues.push('título/descripción');
 if((meta['og:image']||'')!==image||(meta['twitter:image']||'')!==image)issues.push('foto');
 const known=product.mode!=='venta'||product.priceKnown!==false,amount=product.mode==='venta'?product.price:product.rentPrice;
 if(known){
  if(meta['product:price:amount']!==String(amount)||meta['product:price:currency']!=='ARS')issues.push('importe/moneda');
  const price=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(amount);
  if(!compact(meta['og:description']).includes(compact(price)))issues.push('precio fuera de descripción');
 }else if(meta['product:price:amount']!==undefined||!meta['og:description']?.includes('Precio a consultar'))issues.push('precio desconocido');
 // Check both plain JSON and React's escaped JSON in the exported HTML.
 const quote=String.fromCharCode(92,34);
 for(const field of ['stock','insuranceDeposit','tariff'])if(html.includes('"'+field+'":')||html.includes(quote+field+quote+':'))issues.push('campo interno: '+field);
 return issues;
}
function main(){
 const {products}=JSON.parse(fs.readFileSync('generated/catalog-public.json')),sitemap=fs.readFileSync('out/sitemap.xml','utf8'),issues=[];
 for(const product of products){
  const file=path.join('out/p',product.id,'index.html');
  if(!fs.existsSync(file)){issues.push([product.id,'archivo ausente']);continue}
  for(const issue of checkProductHtml(product,fs.readFileSync(file,'utf8'),sitemap))issues.push([product.id,issue]);
 }
 const folders=fs.readdirSync('out/p',{withFileTypes:true}).filter(d=>d.isDirectory());if(folders.length!==products.length)issues.push(['rutas','cantidad incorrecta']);
 const locations=[...sitemap.matchAll(new RegExp('<loc>([^<]+)</loc>','g'))].map(m=>m[1]);
 if(locations.length!==products.length+7||new Set(locations).size!==locations.length)issues.push(['sitemap','cantidad/duplicados']);
 for(const route of ['admin','constancia','solicitud','reserva-local','buscar'])if(locations.includes(site+'/'+route+'/'))issues.push(['sitemap','ruta privada: '+route]);
 if(issues.length)throw Error('Falló la auditoría de fichas públicas: '+JSON.stringify(issues.slice(0,10)));
 console.log('Auditoría: '+products.length+' fichas, '+locations.length+' URLs en sitemap; fotos, precios y campos públicos correctos.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url)))main();
