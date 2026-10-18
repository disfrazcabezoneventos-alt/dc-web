export const endpoint = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';
export const demo = !endpoint;
export async function api(action:string, data:Record<string,unknown>={}, token=''):Promise<any> {
  if(!endpoint) throw new Error('Modo demostración: configurá NEXT_PUBLIC_APPS_SCRIPT_URL para guardar datos reales.');
  const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...data,token}),redirect:'follow',signal:AbortSignal.timeout(120000)});
  if(!response.ok) throw new Error('No se pudo conectar con Apps Script. Intentá nuevamente.');
  let result;try{result=await response.json();}catch{throw new Error('Apps Script no devolvió JSON. Revisá que la implementación sea pública y termine en /exec.');}
  if(!result.ok) throw new Error(result.error||'No se pudo completar la operación.');
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
export function whatsapp(message='¡Hola! Quiero consultar por disfraces y cotillón.'){return 'https://wa.me/5491149897969?text='+encodeURIComponent(message);}
