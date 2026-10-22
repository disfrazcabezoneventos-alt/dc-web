import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';

function loadTS(file,dependencies={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require',code)(module.exports,id=>dependencies[id]);return module.exports;}
const model=loadTS('lib/model.ts');
const taxonomy=loadTS('lib/cotillon-taxonomy.ts');
const catalog=loadTS('lib/catalog.ts',{'./cotillon-taxonomy':taxonomy});
const cart=loadTS('lib/cotillon-cart.ts',{'./catalog':catalog,'./model':model});
const product=(id,more={})=>({id,area:'cotillon',name:'Producto '+id,category:'Halloween',mode:'venta',price:1000,stock:4,image:'',description:'',active:true,...more});

test('las cuatro categorías y sus 26 subcategorías coinciden con Apps Script',()=>{
 const groups=taxonomy.cotillonTaxonomy;
 assert.deepEqual(groups.map(g=>g.name),['COTILLÓN','REPOSTERÍA','FECHAS ESPECIALES','DESCARTABLES']);
 assert.deepEqual(groups.map(g=>g.subcategories.length),[2,3,12,9]);
 assert.equal(new Set(groups.flatMap(g=>g.subcategories)).size,26);
 const context=vm.createContext({});vm.runInContext(fs.readFileSync('backend/Code.gs','utf8'),context);
 const backendGroups=vm.runInContext('COTILLON_GROUPS',context);
 assert.deepEqual(JSON.parse(JSON.stringify(backendGroups)),Object.fromEntries(groups.map(g=>[g.name,g.subcategories])));
 const backendInner=vm.runInContext('COTILLON_INNER',context);
 assert.deepEqual(JSON.parse(JSON.stringify(backendInner)),Object.fromEntries(taxonomy.cotillonInnerCategories.map(branch=>[branch.parent,branch.names])));
 assert.deepEqual(taxonomy.cotillonInnerCategories.map(branch=>branch.names.length),[14,4]);
});

test('la navegación conserva los productos sin clasificar en Todos y en la búsqueda',()=>{
 const categories=[{id:'fiestas',area:'cotillon',name:'Fiestas',group:'COTILLÓN'},{id:'anteojos',area:'cotillon',name:'Anteojos',group:'COTILLÓN',parentId:'fiestas'},{id:'sombreros',area:'cotillon',name:'Sombreros cascos',group:'COTILLÓN',parentId:'fiestas'}];
 const items=[product('anteojos',{categoryId:'anteojos',categoryIds:['anteojos'],name:'Anteojo rojo'}),product('sombrero',{categoryId:'sombreros',categoryIds:['sombreros'],name:'Sombrero estrella'}),product('pendiente',{categoryId:'fiestas',categoryIds:['fiestas'],name:'Producto sin nivel 3'})];
 assert.equal(taxonomy.filterCotillonProducts(items,categories,'','','',false,'').length,3);
 assert.equal(taxonomy.filterCotillonProducts(items,categories,'COTILLÓN','fiestas','',false,'').length,0);
 assert.deepEqual(taxonomy.filterCotillonProducts(items,categories,'COTILLÓN','fiestas','anteojos',false,'').map(p=>p.id),['anteojos']);
 assert.deepEqual(taxonomy.filterCotillonProducts(items,categories,'COTILLÓN','fiestas','',true,'').map(p=>p.id),['anteojos','sombrero','pendiente']);
 assert.deepEqual(taxonomy.filterCotillonProducts(items,categories,'COTILLÓN','fiestas','anteojos',false,'sombrero').map(p=>p.id),['sombrero']);
});

test('un producto asignado sólo a Descartables aparece en ese grupo y en Todos',()=>{
 const item=product('mantel',{name:'Mantel Friselina',category:'Descartables',categoryId:'',categoryIds:[],catalogGroups:['DESCARTABLES']});
 const resolved=taxonomy.resolveCotillonCatalog([item],[]);
 assert.equal(resolved[0].category,'Descartables');
 assert.deepEqual(resolved[0].catalogGroups,['DESCARTABLES']);
 assert.equal(taxonomy.filterCotillonProducts(resolved,[],'DESCARTABLES','','',false,'').length,1);
 assert.equal(taxonomy.filterCotillonProducts(resolved,[],'','','',false,'mantel').length,1);
});

test('catálogo real heredado: Freddy aparece en Máscaras y Halloween sin alterar su registro',()=>{
 const categories=[
  {id:'old-access',area:'cotillon',name:'Accesorios disfraz',storefront:false},
  {id:'old-pastry',area:'cotillon',name:'Repostería',storefront:false},
  {id:'old-patrios',area:'cotillon',name:'Fiestas patrias',storefront:false},
  {id:'fiestas',area:'cotillon',name:'Fiestas',group:'COTILLÓN',storefront:true},
  {id:'masks',area:'cotillon',name:'Máscaras y antifaces',group:'COTILLÓN',parentId:'fiestas',storefront:true},
  {id:'pastry-access',area:'cotillon',name:'Accesorios',group:'REPOSTERÍA',storefront:true},
  {id:'patrios',area:'cotillon',name:'Patrios',group:'FECHAS ESPECIALES',storefront:true},
  {id:'halloween',area:'cotillon',name:'Halloween',group:'FECHAS ESPECIALES',storefront:true}
 ];
 const items=[product('freddy',{name:'Careta De Freddy Krugger',category:'Anterior › Accesorios disfraz',categoryId:'old-access',categoryIds:['old-access','halloween']}),product('molde',{name:'Molde Silicona Budin 24cm X1',categoryId:'old-pastry',categoryIds:['old-pastry']}),product('harry',{name:'Gorro Seleccionador Harry Potter',categoryId:'old-patrios',categoryIds:['old-patrios']})];
 const original=structuredClone(items),resolved=taxonomy.resolveCotillonCatalog(items,categories);
 assert.deepEqual(items,original);
 assert.equal(resolved[0].category,'COTILLÓN › Fiestas › Máscaras y antifaces');
 assert.ok(resolved[0].categoryIds.includes('halloween'));
 assert.deepEqual(taxonomy.filterCotillonProducts(resolved,categories,'COTILLÓN','fiestas','masks',false,'').map(p=>p.id),['freddy']);
 assert.equal(resolved.filter(p=>p.catalogGroups.includes('COTILLÓN')).length,1);
 assert.equal(resolved[1].category,'REPOSTERÍA › Accesorios');
 assert.ok(!resolved[2].categoryIds.includes('patrios'));
 assert.ok(resolved.every(p=>!p.category.includes('Anterior')));
 const manuallyAssigned=taxonomy.resolveCotillonCatalog([{...items[0],categoryId:'halloween'}],categories)[0];
 assert.equal(manuallyAssigned.category,'FECHAS ESPECIALES › Halloween');
});

test('carrito acepta sólo cotillón activo, limita cantidad y deduplica',()=>{
 const products=[product('a'),product('b',{stockUnknown:true,stock:0}),product('c',{area:'disfraces'}),product('d',{stock:0})];
 const result=cart.normalizeCart([{id:'a',quantity:40},{id:'a',quantity:2},{id:'b',quantity:120},{id:'c',quantity:1},{id:'d',quantity:1},{id:'inexistente',quantity:1}],products);
 assert.deepEqual(result,[{id:'a',quantity:4},{id:'b',quantity:99}]);
});

test('opciones distintas conservan el detalle y comparten el límite de stock',()=>{
 const p=product('colores',{name:'Gorro varios colores',stock:3});
 assert.equal(cart.requiresChoice(p),true);
 const lines=cart.normalizeCart([{id:p.id,quantity:2,option:'Rojo'},{id:p.id,quantity:2,option:'Azul'}],[p]);
 assert.deepEqual(lines,[{id:p.id,quantity:2,option:'Rojo'},{id:p.id,quantity:1,option:'Azul'}]);
 const message=cart.cartMessage(lines,[p]);
 assert.match(message,/Rojo/);
 assert.match(message,/Azul/);
 assert.match(message,/3\.000/);
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

test('nueva jerarquía conserva productos y permite clasificar categorías anteriores sin reescribirlos',()=>{
 const categories=[{id:'old-reposteria',area:'cotillon',name:'Repostería',storefront:true},{id:'old-halloween',area:'cotillon',name:'Halloween',storefront:true},{id:'old-cotillon',area:'cotillon',name:'cotillon',storefront:true}];
 const products=[{id:'p1',area:'cotillon',name:'Molde',categoryId:'old-reposteria',category:'Repostería',categoryIds:['old-reposteria'],price:100,stock:5,image:'https://res.cloudinary.com/demo/image/upload/molde.jpg',active:true},{id:'p2',area:'cotillon',name:'Máscara',categoryId:'old-halloween',category:'Halloween',categoryIds:['old-halloween'],price:200,stock:2,active:true}];
 const original=structuredClone(products),settings={};
 const tables={categorias_cotillon:categories,cotillon:products};
 const context=vm.createContext({console,JSON,Date,Utilities:{getUuid:()=>crypto.randomUUID()},PropertiesService:{getScriptProperties:()=>({getProperty:key=>settings[key],setProperty:(key,value)=>settings[key]=value})},SpreadsheetApp:{flush:()=>{}}});
 vm.runInContext(fs.readFileSync('backend/Code.gs','utf8'),context);
 context.rows_=name=>structuredClone(tables[name]||[]);
 context.put_=(name,item)=>{const index=tables[name].findIndex(row=>row.id===item.id);if(index<0)tables[name].push(structuredClone(item));else tables[name][index]=structuredClone(item);return item};
 context.sheet_=()=>({getLastRow:()=>tables.categorias_cotillon.length+1,getRange:()=>({setValues:values=>values.forEach(([,raw])=>tables.categorias_cotillon.push(JSON.parse(raw)))})});
 context.recoverStock_=()=>{};context.session_=()=>{};
 context.ensureCotillonDepth3_();
 assert.equal(settings.COTILLON_STRUCTURE_V1,'ready');
 assert.equal(settings.COTILLON_DEPTH3_V1,'ready');
 assert.equal(tables.categorias_cotillon.filter(c=>c.group).length,44);
 const fiestas=tables.categorias_cotillon.find(c=>c.name==='Fiestas'&&c.group==='COTILLÓN');
 const infantil=tables.categorias_cotillon.find(c=>c.name==='Cumpleaños infantil'&&c.group==='COTILLÓN');
 assert.equal(tables.categorias_cotillon.filter(c=>c.parentId===fiestas.id).length,14);
 assert.equal(tables.categorias_cotillon.filter(c=>c.parentId===infantil.id).length,4);
 assert.notEqual(tables.categorias_cotillon.find(c=>c.name==='Accesorios'&&c.group==='REPOSTERÍA').id,tables.categorias_cotillon.find(c=>c.name==='Accesorios'&&c.parentId===fiestas.id).id);
 assert.equal(tables.categorias_cotillon.find(c=>c.id==='old-halloween').group,'FECHAS ESPECIALES');
 assert.equal(tables.categorias_cotillon.find(c=>c.id==='old-reposteria').storefront,false);
 assert.deepEqual(products,original);
 context.ensureCotillonDepth3_();assert.equal(tables.categorias_cotillon.length,46);
 const target=tables.categorias_cotillon.find(c=>c.name==='Accesorios'&&c.group==='REPOSTERÍA');
 const result=context.dispatch_({action:'mapLegacyCategory',id:'old-reposteria',targetId:target.id,token:'test'});
 assert.equal(result.affected,1);
 const listed=context.products_('cotillon').find(p=>p.id==='p1');
 assert.equal(listed.category,'REPOSTERÍA › Accesorios');assert.ok(listed.categoryIds.includes(target.id));
 assert.deepEqual(products,original);
 const leaf=tables.categorias_cotillon.find(c=>c.name==='Anteojos'&&c.parentId===fiestas.id);
 context.dispatch_({action:'saveCategory',area:'cotillon',id:leaf.id,name:'Anteojos de fiesta',group:'COTILLÓN',parentId:fiestas.id,storefront:true,token:'test'});
 assert.equal(tables.categorias_cotillon.find(c=>c.id===leaf.id).name,'Anteojos de fiesta');
 assert.deepEqual(products,original);
 assert.throws(()=>context.dispatch_({action:'deleteCategory',area:'cotillon',id:fiestas.id,strategy:'uncategorized',expectedCount:0,token:'test'}),/subcategorías internas/);
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
