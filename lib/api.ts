import type {Category,Product} from './catalog';
const configuredEndpoint=process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';
const retiredDeployment='https://script.google.com/macros/s/AKfycbzg5m5PsnI33gaB2QpyWqqqlSp4fBBJoPV36tbe6QfA2wW81IZd98A44sAT0ZnmRZRz/exec';
const activeDeployment='https://script.google.com/macros/s/AKfycbynyGN99GuijF2x9NWz-cEDIUa7_0tKhi21c09YqSfeLnklND5bVIcMp2aKqFvzUPlZ/exec';
// Render todavía conserva la URL de la implementación retirada. Permite migrar
// el frontend sin interrumpir el catálogo mientras se corrige la variable allí.
export const endpoint = configuredEndpoint===retiredDeployment?activeDeployment:configuredEndpoint;
export const demo = !endpoint;
const CATALOG_CACHE_KEY='dc-public-catalog-v1';
const CATALOG_CACHE_MS=60000;
type CatalogResponse={products:Product[];categories:Category[];campaign?:{halloween:boolean};cotillonImportReady?:boolean};
let pendingCatalog:Promise<CatalogResponse>|null=null;
export async function api(action:string, data:Record<string,unknown>={}, token=''):Promise<any> {
  if(!endpoint) throw new Error('Modo demostración: configurá NEXT_PUBLIC_APPS_SCRIPT_URL para guardar datos reales.');
  // Un formulario dirigido a un iframe permite recibir la respuesta de Apps Script
  // mediante postMessage. fetch() queda bloqueado por CORS en un sitio estático.
  const result=await new Promise<{ok:boolean;data?:any;error?:string}>((resolve,reject)=>{
    const id=crypto.randomUUID(), frame=document.createElement('iframe'), form=document.createElement('form');
    frame.name='dc-apps-'+id;
    frame.hidden=true;
    frame.tabIndex=-1;
    frame.setAttribute('aria-hidden','true');
    form.action=endpoint;
    form.method='POST';
    form.target=frame.name;
    form.style.display='none';
    const field=(name:string,value:string)=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.append(input)};
    field('transport','frame');
    field('bridgeId',id);
    field('origin',location.origin);
    field('payload',JSON.stringify({action,...data,token}));
    let done=false;
    const finish=(error?:Error,value?:{ok:boolean;data?:any;error?:string})=>{
      if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',receive);form.remove();frame.remove();
      if(error)reject(error);else resolve(value!);
    };
    const receive=(event:MessageEvent)=>{
      const origin=event.origin;
      if(origin!=='https://script.google.com'&&!/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(origin))return;
      if(event.data?.type!=='dc-apps-result'||event.data.id!==id)return;
      finish(undefined,event.data.result);
    };
    const publicRead=['catalogData','catalog','siteTheme'].includes(action);
    const timer=setTimeout(()=>finish(new Error(publicRead?'No se pudo conectar con Apps Script. Revisá que la implementación web esté activa y que la URL configurada en Render sea la misma.':'Apps Script tardó demasiado en responder. Si estabas guardando datos, revisá el panel antes de repetir la operación.')),publicRead?30000:120000);
    window.addEventListener('message',receive);
    document.body.append(frame,form);
    form.submit();
  });
  if(!result.ok) throw new Error(result.error||'No se pudo completar la operación.');
  if(!['catalogData','catalog','siteTheme'].includes(action))try{sessionStorage.removeItem(CATALOG_CACHE_KEY)}catch{}
  return result.data;
}
export async function fileData(file:Blob){
 if(file.size>8*1024*1024)throw new Error('Cada archivo admite hasta 8 MB.');
 return new Promise<{base64:string;type:string}>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({base64:String(reader.result).split(',')[1],type:file.type});reader.onerror=reject;reader.readAsDataURL(file);});
}
export async function rentalApi(action:string,form:FormData){
 const data=JSON.parse(String(form.get('data')));const files:Record<string,unknown>={};
 for(const [key,value] of form.entries())if(value instanceof Blob)files[key]=await fileData(value);
 return api(action,{data,files,access:sessionStorage.getItem('dc-submit-'+data.requestKey)||''});
}
export function legacyCategories(products:Product[]):Category[]{const list:Category[]=[];products.forEach(p=>{if(p.category&&p.category!=='Sin categoría'&&!list.some(c=>c.area===p.area&&c.name===p.category))list.push({id:'legacy:'+p.area+':'+p.category,area:p.area,name:p.category})});return list;}
export async function catalogData(forceFresh=false):Promise<CatalogResponse>{
 if(!forceFresh)try{const cached=JSON.parse(sessionStorage.getItem(CATALOG_CACHE_KEY)||'null');if(cached&&Date.now()-cached.at<CATALOG_CACHE_MS&&Array.isArray(cached.data?.products)&&Array.isArray(cached.data?.categories))return cached.data}catch{}
 if(pendingCatalog)return pendingCatalog;
 pendingCatalog=(async()=>{
  let data:CatalogResponse;
  try{data=await api('catalogData')}catch(e){if(!/Acción desconocida|Sesión vencida/.test((e as Error).message))throw e;const products=await api('catalog') as Product[];data={products,categories:legacyCategories(products)}}
  try{sessionStorage.setItem(CATALOG_CACHE_KEY,JSON.stringify({at:Date.now(),data}))}catch{}
  return data;
 })();
 try{return await pendingCatalog}finally{pendingCatalog=null}
}
export function whatsapp(message='¡Hola! Quiero consultar por disfraces y cotillón.'){return 'https://wa.me/5491149897969?text='+encodeURIComponent(message);}
