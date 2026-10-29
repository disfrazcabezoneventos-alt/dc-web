import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

function setup(mode='alquiler',area='disfraces'){
 const token='test-admin-token-01234567890123456789',writes=[];
 const product={id:'p1',area,name:'Disfraz sin descripción',description:'',categoryId:'ninos',categoryIds:['ninos','halloween'],category:'Niños',mode,stock:3,price:mode==='alquiler'?0:10000,rentPrice:mode==='venta'?0:60000,active:true,image:'https://res.cloudinary.com/test/foto.jpg',thumbnail:'https://res.cloudinary.com/test/thumb.jpg',sourceId:'original',custom:{keep:true},priceKnown:false,stockUnknown:true};
 const tables={disfraces:[],cotillon:[],movimientos:[]};tables[area].push(product);
 const ctx=vm.createContext({console,Date,JSON,Map,Set,
  PropertiesService:{getScriptProperties:()=>({getProperty:()=>'',setProperty:()=>writes.push('properties')})},
  CacheService:{getScriptCache:()=>({get:key=>key==='session:'+crypto.createHash('sha256').update(token).digest('hex')?'admin':null,put:()=>writes.push('cache')})},
  Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_a,value)=>[...crypto.createHash('sha256').update(value).digest()]}
 });
 vm.runInContext(fs.readFileSync('backend/Code.gs','utf8'),ctx);
 ctx.rows_=name=>structuredClone(tables[name]||[]);
 ctx.put_=(name,p)=>{writes.push(name);const i=tables[name].findIndex(x=>x.id===p.id);tables[name][i]=structuredClone(p);return p;};
 ctx.recoverStock_=()=>{throw Error('No ejecutar mantenimiento en quickUpdate');};
 ctx.ensureCotillonDepth3_=()=>{throw Error('No migrar categorías en quickUpdate');};
 const update=cambios=>ctx.dispatch_({action:'quickUpdate',token,area,id:'p1',cambios});
 return {ctx,tables,token,area,product,writes,update};
}
test('actualiza SOLO campos permitidos sin descripción y conserva Niños + Halloween',()=>{
 const h=setup(),before=structuredClone(h.product),saved=h.update({active:false,stock:0,rentPrice:62000.55});
 assert.deepEqual(JSON.parse(JSON.stringify(saved)),{...before,active:false,stock:0,rentPrice:62000.55});
 assert.deepEqual(h.tables.disfraces[0].categoryIds,['ninos','halloween']);assert.equal(h.tables.disfraces[0].description,'');assert.deepEqual(h.writes,['disfraces']);
});
test('tampoco exige que exista la propiedad description',()=>{
 const h=setup();delete h.product.description;h.update({active:false});assert.equal('description' in h.tables.disfraces[0],false);
});
for(const mode of ['venta','alquiler','ambos'])test('precios de la modalidad '+mode,()=>{
 const h=setup(mode),changes=mode==='venta'?{price:0}:mode==='alquiler'?{rentPrice:0}:{price:12000,rentPrice:60000};
 const saved=h.update(changes);for(const [key,value] of Object.entries(changes))assert.equal(saved[key],value);
});
test('Cotillón cambia precio/stock/estado sin cambiar priceKnown ni stockUnknown',()=>{
 const h=setup('venta','cotillon'),before=structuredClone(h.product);h.update({price:123.456,stock:100000,active:false});
 assert.deepEqual(h.tables.cotillon[0],{...before,price:123.46,stock:100000,active:false});
});
for(const token of [undefined,'','short','expired-admin-token-01234567890123456789'])test('rechaza sesión '+String(token)+' sin ninguna escritura',()=>{
 const h=setup(),before=JSON.stringify(h.tables);assert.throws(()=>h.ctx.dispatch_({action:'quickUpdate',token,area:h.area,id:'p1',cambios:{stock:1}}),/Sesión/);
 assert.equal(JSON.stringify(h.tables),before);assert.deepEqual(h.writes,[]);
});
const invalid=[null,[],{},'bad',{active:'false'},{active:0},{active:null},...[-1,1.5,100001,NaN,Infinity,'1',true,null].map(stock=>({stock})),...[-1,100000001,NaN,Infinity,'100',true,null].map(rentPrice=>({rentPrice})),{price:0},{active:false,name:'otro'},{categoryIds:['other']},{description:'new'},{image:''},{id:'other'},JSON.parse('{"__proto__":{"active":false}}')];
invalid.forEach((changes,index)=>test('rechaza cambios inválidos '+index+' sin escritura parcial',()=>{
 const h=setup(),before=JSON.stringify(h.tables);assert.throws(()=>h.update(changes));assert.equal(JSON.stringify(h.tables),before);assert.deepEqual(h.writes,[]);
}));
for(const payload of [{area:'other',id:'p1'},{area:'cotillon',id:'p1'},{area:'disfraces',id:'missing'},{area:'disfraces',id:''}])test('rechaza área o producto inexistente '+JSON.stringify(payload),()=>{
 const h=setup();assert.throws(()=>h.ctx.dispatch_({action:'quickUpdate',token:h.token,cambios:{active:false},...payload}));assert.deepEqual(h.writes,[]);
});
test('rechaza alquiler para venta y price de alquiler, también en Cotillón',()=>{
 let h=setup('venta');assert.throws(()=>h.update({rentPrice:1}),/modalidad/);assert.deepEqual(h.writes,[]);
 h=setup('venta','cotillon');assert.throws(()=>h.update({rentPrice:1}),/modalidad/);assert.deepEqual(h.writes,[]);
});
test('stockPending bloquea solo editar stock y no ejecuta recuperación ni borra el pendiente',()=>{
 const h=setup();h.tables.movimientos.push({id:'movement',area:'disfraces',productId:'p1',stockPending:{before:3,after:2}});
 assert.throws(()=>h.update({stock:9}),/pendiente/);assert.deepEqual(h.writes,[]);h.update({active:false});assert.equal(h.tables.movimientos[0].stockPending.after,2);
});
test('H011: deshabilitar Cotillón no lo elimina de la respuesta pública del catálogo',()=>{
 const h=setup('venta','cotillon');h.update({active:false});h.ctx.recoverStock_=()=>{};h.ctx.ensureCotillonDepth3_=()=>{};
 const result=h.ctx.dispatch_({action:'catalogData'});
 assert.equal(result.products.length,1);assert.equal(result.products[0].active,false);assert.equal(result.products[0].id,'p1');
});
