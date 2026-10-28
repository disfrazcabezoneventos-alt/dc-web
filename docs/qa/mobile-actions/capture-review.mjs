import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const {chromium,expect}=createRequire(new URL('../../../package.json',import.meta.url))('@playwright/test');
import {mkdir,writeFile} from 'node:fs/promises';
import {server} from './serve-static.mjs';
const phase=process.argv[2]||'after';
const evidence=fileURLToPath(new URL('.',import.meta.url));
await mkdir(evidence,{recursive:true});
await new Promise(resolve=>server.listen(3017,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const categories=[{id:'halloween',area:'cotillon',name:'Halloween',group:'FECHAS ESPECIALES',storefront:true},{id:'personajes',area:'disfraces',name:'Personajes'}];
const products=Array.from({length:8},(_,i)=>({id:'party-'+i,area:'cotillon',name:['Máscara de fiesta','Sombrero de fiesta','Guirnalda de colores','Globos de cumpleaños'][i%4]+' '+(i+1),category:'Halloween',categoryId:'halloween',categoryIds:['halloween'],catalogGroups:['FECHAS ESPECIALES'],mode:'venta',price:1500+i*500,priceKnown:true,stock:5,rentPrice:0,image:'',description:'Producto de prueba local',active:true}));
products.push({...products[0],id:'costume-1',area:'disfraces',name:'Disfraz de prueba',category:'Personajes',categoryId:'personajes',categoryIds:['personajes'],catalogGroups:[],mode:'ambos',rentPrice:1000,saleCondition:'Nuevo inmediato'});
const results=[];
try{
 for(const [width,height] of [[360,640],[390,844],[412,915]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[],requests=[],unexpected=[],failedResponses=[];
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin==='http://127.0.0.1:3017')return route.continue();
   if(url.href==='https://script.google.com/macros/s/mock/exec'){
    const fields=new URLSearchParams(req.postData()||''),payload=JSON.parse(fields.get('payload')||'{}');
    requests.push(payload.action);
    const data=payload.action==='catalogData'?{products,categories,cotillonImportReady:true}:payload.action==='siteTheme'?{siteTheme:'halloween'}:null;
    if(data===null)unexpected.push(payload.action);
    const result=data===null?{ok:false,error:'Acción no autorizada en revisión local'}:{ok:true,data};
    const message={type:'dc-apps-result',id:fields.get('bridgeId'),result};
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<!doctype html><script>parent.postMessage('+JSON.stringify(message)+','+JSON.stringify(fields.get('origin'))+')</script>'});
   }
   if(url.hostname==='fonts.googleapis.com')return route.fulfill({status:200,contentType:'text/css',body:''});
   unexpected.push(req.url());return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failedResponses.push({url:r.url(),status:r.status()})});
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>localStorage.setItem('dc-site-theme','halloween'));
  const result={viewport:width+'x'+height,phase,errors,requests,unexpected,failedResponses,steps:[]};
  try{
   await page.goto('http://127.0.0.1:3017/cotillon/');
   const add=page.getByRole('button',{name:'Agregar al carrito',exact:true});
   await expect(add).toHaveCount(8);
   await page.screenshot({path:evidence+'/'+phase+'-'+width+'-header.png'});
   await add.nth(1).evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().bottom-innerHeight+32,behavior:'instant'}));
   await page.screenshot({path:evidence+'/'+phase+'-'+width+'-catalog.png'});
   result.overlaps=await page.evaluate(()=>{
    const shortcuts=Array.from(document.querySelectorAll('.floating-cart,.floating-wa'));
    const targets=Array.from(document.querySelectorAll('.product-quick,.product-info strong,.site-footer a,.site-footer small'));
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    return shortcuts.flatMap(a=>targets.filter(b=>overlap(a.getBoundingClientRect(),b.getBoundingClientRect())).map(b=>({shortcut:a.className,target:b.textContent.trim()})));
   });
   await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
   await page.screenshot({path:evidence+'/'+phase+'-'+width+'-footer.png'});
   await add.first().click();
   await page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/}).click();
   const dialog=page.getByRole('dialog',{name:'Carrito de cotillón'});
   await expect(dialog.getByRole('heading',{name:products[0].name,exact:true})).toBeVisible();
   result.steps.push('Agregar al carrito: 1 unidad');
   await dialog.getByRole('button',{name:'Agregar una unidad de '+products[0].name,exact:true}).click();
   await expect(dialog.getByRole('link',{name:/Enviar pedido por WhatsApp/})).toHaveAttribute('href',/2%20%C3%97/);
   result.steps.push('Aumentar: 2 unidades y total $3.000 en enlace de WhatsApp');
   await dialog.getByRole('button',{name:'Quitar una unidad de '+products[0].name,exact:true}).click();
   result.steps.push('Reducir: 1 unidad');
   await dialog.getByRole('button',{name:'Eliminar',exact:true}).click();
   await expect(dialog.getByText('Tu carrito está vacío.')).toBeVisible();
   result.steps.push('Vaciar mediante Eliminar: carrito vacío');
   await dialog.getByRole('button',{name:'Seguir explorando',exact:true}).click();
   await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
   await page.locator('.site-header nav').getByRole('link',{name:'Disfraces',exact:true}).click();
   await page.getByRole('button',{name:'Ver detalle de Disfraz de prueba',exact:true}).click();
   await page.getByRole('link',{name:/Quiero alquilar/}).click();
   await expect(page).toHaveURL(/\/reservas\/\?producto=costume-1/);
   await expect(page.locator('.rental-product-note')).toContainText('Disfraz de prueba');
   await expect(page.getByRole('heading',{name:'Empecemos por tus datos.'})).toBeVisible();
   await expect(page.getByLabel('Nombre y apellido')).toBeVisible();
   result.steps.push('Reservar disfraz: producto conservado y formulario Tus datos accesible');
   if(phase==='after')await page.screenshot({path:evidence+'/after-'+width+'-reservation.png',fullPage:true});
   result.reservationOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   result.status='passed';
  }catch(e){result.status='failed';result.failure=e.stack;await page.screenshot({path:evidence+'/'+phase+'-'+width+'-failure.png',fullPage:true})}
  results.push(result);console.log(JSON.stringify(result));
  await context.close();
 }
 await writeFile(evidence+'/'+phase+'-review.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
if(results.some(r=>r.status!=='passed'||r.errors.length||r.unexpected.length))process.exitCode=1;
