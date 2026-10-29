import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

export async function setupAdmin(page){
 const token='test-admin-token-01234567890123456789';
 const categories=[{id:'ninos',area:'disfraces',name:'Niños'},{id:'halloween-d',area:'disfraces',name:'Halloween'},{id:'adultos',area:'disfraces',name:'Hombres'},{id:'fiestas',area:'cotillon',name:'Fiestas',group:'COTILLÓN',storefront:true},{id:'mascaras',area:'cotillon',name:'Máscaras',group:'COTILLÓN',parentId:'fiestas',storefront:true},{id:'halloween-c',area:'cotillon',name:'Halloween',group:'FECHAS ESPECIALES',storefront:true}];
 const costumes=Array.from({length:60},(_,i)=>({id:'d'+i,area:'disfraces',name:'Disfraz de prueba '+String(i).padStart(3,'0'),mode:'venta',price:10000,rentPrice:0,stock:3,active:i%2===0,description:'',image:'/catalog/spider.jpg',thumbnail:'/catalog/spider.jpg',categoryId:i%2===0?'halloween-d':'adultos',categoryIds:[i%2===0?'halloween-d':'adultos'],category:i%2===0?'Halloween':'Hombres'}));
 Object.assign(costumes[0],{name:'Súper Héroe Niño',mode:'alquiler',price:0,rentPrice:60000,categoryId:'ninos',categoryIds:['ninos','halloween-d'],category:'Niños',custom:{keep:true}});
 Object.assign(costumes[2],{name:'Disfraz sin categoría',mode:'ambos',price:25000,rentPrice:40000,categoryId:'',categoryIds:[],category:''});
 Object.assign(costumes[4],{name:'Disfraz nuevo a pedido',mode:'venta',saleCondition:'Nuevo a pedido',orderLimit:10,stock:0});
 const cotillon=Array.from({length:1200},(_,i)=>({id:'c'+i,area:'cotillon',name:(i===0?'Máscara de fiesta':'Cotillón de prueba '+String(i).padStart(4,'0')),mode:'venta',price:1500,rentPrice:0,priceKnown:i!==1,stockUnknown:i===1,stock:8,active:i%2===0,description:'',image:'/catalog/globos.jpg',thumbnail:'/catalog/globos.jpg',categoryId:i%3===0?'mascaras':i%3===1?'halloween-c':'',categoryIds:i%3===0?['mascaras']:i%3===1?['halloween-c']:[],category:i%3===0?'Máscaras':i%3===1?'Halloween':''}));
 const tables={disfraces:costumes,cotillon,categorias_disfraces:categories.filter(c=>c.area==='disfraces'),categorias_cotillon:categories.filter(c=>c.area==='cotillon'),reservas:[],movimientos:[],cancelaciones:[],notifications:[]};
 const settings={COTILLON_STRUCTURE_V1:'ready',COTILLON_DEPTH3_V1:'ready',MAIL_MODE:'disabled',SITE_THEME:'default'};
 const state={tables,settings,received:[],delay:0,failNext:false,writes:[]};
 const context=vm.createContext({console,Date,JSON,Map,Set,
  PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key]||'',setProperty:(key,value)=>settings[key]=value})},
  CacheService:{getScriptCache:()=>({get:key=>key==='session:'+crypto.createHash('sha256').update(token).digest('hex')?'admin':null})},
  Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_a,value)=>[...crypto.createHash('sha256').update(value).digest()]}
 });
 vm.runInContext(fs.readFileSync('backend/Code.gs','utf8'),context);
 context.rows_=name=>structuredClone(tables[name]);
 context.put_=(name,product)=>{const at=tables[name].findIndex(p=>p.id===product.id);if(at<0)throw Error('Test: alta no permitida');tables[name][at]=structuredClone(product);state.writes.push({name,id:product.id});return product;};
 await page.addInitScript(token=>sessionStorage.setItem('dc-admin',token),token);
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||''),payload=JSON.parse(fields.get('payload')||'{}');
  let result;
  try{
   if(payload.action==='quickUpdate'){
    state.received.push(structuredClone(payload));
    if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));
    if(state.failNext){state.failNext=false;throw Error('Fallo de prueba: no se guardó');}
   }
   result={ok:true,data:context.dispatch_(payload)};
  }catch(error){result={ok:false,error:error.message};}
  const message={type:'dc-apps-result',id:fields.get('bridgeId'),result};
  await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><script>parent.postMessage(${JSON.stringify(message).replace(/</g,'\\u003c')},${JSON.stringify(fields.get('origin'))})</script>`});
 });
 await page.goto('/admin/');
 return state;
}
