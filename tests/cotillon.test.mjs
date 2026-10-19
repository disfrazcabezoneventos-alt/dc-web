import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';

function loadTS(file,dependencies={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require',code)(module.exports,id=>dependencies[id]);return module.exports;}
const model=loadTS('lib/model.ts');
const catalog=loadTS('lib/catalog.ts');
const cart=loadTS('lib/cotillon-cart.ts',{'./catalog':catalog,'./model':model});
const product=(id,more={})=>({id,area:'cotillon',name:'Producto '+id,category:'Halloween',mode:'venta',price:1000,stock:4,image:'',description:'',active:true,...more});

test('carrito acepta sólo cotillón activo, limita cantidad y deduplica',()=>{
 const products=[product('a'),product('b',{stockUnknown:true,stock:0}),product('c',{area:'disfraces'}),product('d',{stock:0})];
 const result=cart.normalizeCart([{id:'a',quantity:40},{id:'a',quantity:2},{id:'b',quantity:120},{id:'c',quantity:1},{id:'d',quantity:1},{id:'inexistente',quantity:1}],products);
 assert.deepEqual(result,[{id:'a',quantity:4},{id:'b',quantity:99}]);
});

test('mensaje de WhatsApp llega detallado con cantidades y precios a consultar',()=>{
 const products=[product('a',{name:'Máscara',price:1500}),product('b',{name:'Adorno',priceKnown:false,stockUnknown:true,stock:0})];
 const message=cart.cartMessage([{id:'a',quantity:2},{id:'b',quantity:3}],products);
 assert.match(message,/2 × Máscara/);
 assert.match(message,/3 × Adorno/);
 assert.match(message,/3\.000/);
 assert.match(message,/precio a consultar/);
 assert.match(message,/confirmen disponibilidad/);
});

test('snapshot contiene sólo ocho rubros y conserva faltantes sin inventar datos',()=>{
 const snapshot=JSON.parse(fs.readFileSync('backend/import-cotillon.json','utf8'));
 assert.equal(snapshot.categories.length,8);
 assert.equal(snapshot.products.length,635);
 const keys=new Set(snapshot.categories.map(c=>c.key));
 assert.equal(keys.size,8);
 assert.equal(new Set(snapshot.products.map(p=>p.sourceId)).size,635);
 assert.ok(snapshot.products.every(p=>p.categoryKeys.length>0&&p.categoryKeys.every(k=>keys.has(k))));
 assert.ok(snapshot.products.every(p=>!p.categoryKeys.includes('disfraces-ninos')&&!p.categoryKeys.includes('disfraces-adultos')));
 assert.ok(snapshot.products.some(p=>p.price===null));
 assert.ok(snapshot.products.some(p=>p.stock===null));
});

test('Apps Script importa una vez y vincula Halloween sin duplicar productos',()=>{
 const snapshot=fs.readFileSync('backend/import-cotillon.json','utf8');
 const tables={cotillon:[{id:'existente',name:'Espuma',categoryId:'categoria-vieja',category:'cotillon',area:'cotillon',stock:10}],categorias_cotillon:[{id:'categoria-vieja',name:'cotillon',area:'cotillon'}]};
 const context=vm.createContext({console,JSON,Date,Utilities:{getUuid:()=>crypto.randomUUID()},UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>snapshot})},SpreadsheetApp:{flush:()=>{}}});
 vm.runInContext(fs.readFileSync('backend/Code.gs','utf8'),context);
 context.prepararConfiguracion=()=>{};
 context.lock_=fn=>fn();
 context.rows_=name=>structuredClone(tables[name]||[]);
 context.put_=(name,object)=>{const index=tables[name].findIndex(row=>row.id===object.id);if(index<0)tables[name].push(structuredClone(object));else tables[name][index]=structuredClone(object);return object};
 context.sheet_=()=>({getLastRow:()=>tables.cotillon.length+1,getRange:()=>({setValues:values=>values.forEach(([,row])=>tables.cotillon.push(JSON.parse(row)))})});
 const first=context.importarCotillonAnterior();
 assert.equal(first.agregados,635);
 assert.equal(tables.categorias_cotillon.length,9);
 assert.equal(tables.categorias_cotillon.find(c=>c.id==='categoria-vieja').storefront,false);
 assert.equal(tables.cotillon.length,636);
 assert.ok(tables.cotillon.some(p=>p.name==='Espuma'));
 assert.equal(tables.cotillon.filter(p=>p.stockUnknown).length,598);
 assert.equal(tables.cotillon.filter(p=>p.priceKnown===false).length,132);
 assert.ok(tables.cotillon.some(p=>p.categoryIds?.length===2));
 assert.equal(context.importarCotillonAnterior().agregados,0);
});

test('migración de fotos firma la subida y recibe imagen más miniatura',()=>{
 const source=fs.readFileSync('backend/Code.gs','utf8');
 let submitted;
 const context=vm.createContext({Date,JSON,Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_1:'sha1'},computeDigest:(_algo,text)=>Array.from(crypto.createHash('sha1').update(text).digest())},UrlFetchApp:{fetch:(_url,options)=>{submitted=options.payload;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({secure_url:'https://res.cloudinary.com/demo/image/upload/foto.jpg',eager:[{secure_url:'https://res.cloudinary.com/demo/image/upload/c_limit,h_160,w_160/foto.jpg'}]})}}}});
 vm.runInContext(source,context);
 context.config_=key=>({'CLOUDINARY_CLOUD_NAME':'demo','CLOUDINARY_API_KEY':'public','CLOUDINARY_API_SECRET':'private'})[key];
 const result=context.subirFotoCotillon_('https://ajgiwtpbwhfffoimqkwj.supabase.co/storage/v1/object/public/catalogo/foto.jpg','abc');
 assert.match(result.image,/res\.cloudinary\.com/);
 assert.match(result.thumbnail,/c_limit,h_160,w_160/);
 assert.equal(submitted.public_id,'anterior-abc');
 assert.match(submitted.signature,/^[a-f0-9]{40}$/);
});
