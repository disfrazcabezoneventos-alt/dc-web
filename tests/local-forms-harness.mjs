import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

export function localHarness(){
 const tables=Object.fromEntries(['disfraces','cotillon','categorias_disfraces','categorias_cotillon','reservas','movimientos','cancelaciones','notifications'].map(k=>[k,[]]));
 const settings={ADMIN_USER:'admin',ADMIN_PASSWORD:'test-password-12345',MAIL_MODE:'disabled',COTILLON_STRUCTURE_V1:'ready',COTILLON_DEPTH3_V1:'ready',LOCAL_FORMS_ENABLED:'yes',FORM_NOTIFICATIONS_SINCE:'2026-10-29T00:00:00Z'};
 const cache=new Map(),files=new Map();let reads=0;
 const ctx=vm.createContext({console,Date,Intl,JSON,
  Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:()=> '2026-10-29',Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256',SHA_1:'sha1'},computeDigest:(algo,data)=>Array.from(crypto.createHash(algo).update(typeof data==='string'?data:Buffer.from(data)).digest()),base64Decode:s=>Array.from(Buffer.from(s,'base64')),base64Encode:b=>Buffer.from(b).toString('base64')},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>settings[k],setProperty:(k,v)=>settings[k]=v,setProperties:values=>Object.assign(settings,values)})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  DriveApp:{getFileById:id=>({setTrashed:()=>files.delete(id),getBlob:()=>({getBytes:()=>files.get(id).bytes,getContentType:()=>files.get(id).type})})},
 });
 vm.runInContext(['Validation.gs','Code.gs','LocalForms.gs'].map(p=>fs.readFileSync('backend/'+p,'utf8')).join('\n'),ctx);
 ctx.rows_=name=>{reads++;return structuredClone(tables[name])};
 ctx.put_=(name,obj)=>{const index=tables[name].findIndex(row=>row.id===obj.id);if(index<0)tables[name].push(structuredClone(obj));else tables[name][index]=structuredClone(obj);return obj};
 ctx.saveFiles_=checked=>Object.fromEntries(Object.entries(checked).map(([slot,file])=>{const id=crypto.randomUUID();files.set(id,file);return [slot,{id,type:file.type,hash:file.hash}]}));
 const token=ctx.dispatch_({action:'login',username:'admin',password:settings.ADMIN_PASSWORD}).token;
 const dispatch=body=>ctx.dispatch_(body);
 return {ctx,tables,settings,files,token,dispatch,reads:()=>reads};
}
export const fixture=()=>({fullName:'Cliente Local',dni:'12345678',birthDate:'1990-01-01',address:'Prueba 123',city:'CABA',phone:'1100000000',altPhone:'1100000001',email:'test@example.invalid',items:[{name:'Personaje prueba',category:'adulto',catalogCategory:'Sin categoría',catalogCategoryId:'',productId:'',quantity:1}],pickupDate:'2026-10-29',returnDate:'2026-10-30',pickupWindow:'16:00 a 20:00',returnWindow:'10:00 a 14:00',specialSchedule:false,scheduleAgreement:'',total:60000,payMode:'full',pickupBy:'self',authorizedName:'',authorizedDni:'',docType:'',docDate:'',namesMatch:true,adult:true,privacy:true,priorInfo:true,truth:true,terms:true,clarification:'Cliente Local',requestKey:crypto.randomUUID()});
export const png={base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',type:'image/png'};
export function submission(h,data=fixture()){
 return {action:'submitLocal',data,access:'a'.repeat(72),pricingRevision:h.dispatch({action:'localConfig'}).prices.revision,files:{dniFront:png,dniBack:png,signature:png}};
}
