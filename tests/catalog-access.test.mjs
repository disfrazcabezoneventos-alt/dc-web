import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {catalogHarness} from './catalog-access-harness.mjs';

test('cuentas: hash con sal PBKDF2 compatible con Node, y migración del admin sin tocar catálogo',()=>{
 const h=catalogHarness({enabled:false}),before=JSON.stringify(h.tables.disfraces),password=h.settings.ADMIN_PASSWORD;
 h.ctx.prepararRolesCatalogo_();assert.equal(h.settings.ADMIN_PASSWORD,undefined);
 const record=JSON.parse(h.settings.ADMIN_PASSWORD_RECORD);assert.equal(record.iterations,600000);
 assert.equal(record.hash,crypto.pbkdf2Sync(password,Buffer.from(record.salt,'hex'),600000,32,'sha256').toString('hex'));
 assert.ok(!JSON.stringify(h.settings).includes(password));assert.equal(JSON.stringify(h.tables.disfraces),before);
 assert.throws(()=>h.ctx.dispatch_({action:'admin',token:h.admin}),/Sesión/);
 assert.ok(h.ctx.dispatch_({action:'login',username:h.settings.ADMIN_USER,password}).token);
});
test('Editor: cuenta individual, datos mínimos y rechazo de TODAS las acciones administrativas antes de escribir',()=>{
 const h=catalogHarness();const user=h.createEditor();h.editor=h.loginEditor();
 assert.equal(user.role,'editor');assert.equal(user.password,undefined);
 const data=h.ctx.dispatch_({action:'admin',token:h.editor});assert.deepEqual(Object.keys(data).sort(),['categories','products','role','user']);
 assert.ok(!JSON.stringify(data).includes(h.password));
 const forbidden=['saveCategory','deleteCategory','mapLegacyCategory','deleteProduct','setSiteTheme','setHalloweenCampaign','status','movement','voidMovement','resolveCancel','bankSettings','incomingForms','incomingRequest','incomingNotifications','dismissFormNotifications','saveRentalPrices','updateIncomingForm','deleteIncomingForm','incomingFile','localReceiptInfo','issueLocalReceipt','sendLocalReceipt','catalogUsers','createCatalogUser','setCatalogUserActive','resetCatalogUserPassword','productHistory','recoverProductHistory','restoreProductPhoto','publishProduct','bank','submit','submitLocal','localConfig','request','file','correct','cancel','viewLocalReceipt','unknown-action'];
 for(const action of forbidden){const before=JSON.stringify(h.tables),settings=JSON.stringify(h.settings);h.writes.length=0;assert.throws(()=>h.ctx.dispatch_({action,token:h.editor,id:h.product.id,product:h.product,area:'disfraces'}),/permiso/,action);assert.equal(JSON.stringify(h.tables),before,action);assert.equal(JSON.stringify(h.settings),settings,action);assert.equal(h.writes.length,0,action);}
});
test('Editor: campos permitidos, H001 categorías secundarias, H002 descripción vacía, historial y restricciones de stock/fotos',()=>{
 const h=catalogHarness();h.createEditor();h.editor=h.loginEditor();
 const p=h.editorProduct();const edited=h.ctx.dispatch_({action:'saveProduct',token:h.editor,product:{...p,name:'Nombre editado',description:'',price:1500,rentPrice:1100},operationId:crypto.randomUUID()});
 assert.deepEqual([...edited.categoryIds],['d-primary','d-secondary']);assert.equal(edited.description,'');assert.equal(edited.stock,4);assert.equal(edited.custom.preserve,true);
 const history=h.tables.historial_cambios.at(-1);assert.equal(history.actor.id,h.ctx.catalogIdentity_(h.editor).id);assert.equal(history.actor.role,'editor');assert.equal(history.changes.name.before,'Producto de ensayo');
 for(const patch of [{stock:3},{active:false},{image:''},{mode:'venta'},{publicationState:'published'},{custom:{forged:true}},{orderLimit:99}])assert.throws(()=>h.ctx.dispatch_({action:'saveProduct',token:h.editor,product:{...h.editorProduct(),...patch}}));
 for(const cambios of [{stock:0},{price:1},{rentPrice:2},{active:false,stock:1}])assert.throws(()=>h.ctx.dispatch_({action:'quickUpdate',token:h.editor,area:'disfraces',id:h.product.id,cambios}),/solo puede/);
 const toggled=h.ctx.dispatch_({action:'quickUpdate',token:h.editor,area:'disfraces',id:h.product.id,cambios:{active:false}});assert.equal(toggled.active,false);assert.equal(toggled.stock,4);
 assert.equal(h.tables.historial_cambios.at(-1).changes.active.after,false);
});
test('Editor crea borrador invisible incluso en Cotillón; solo Admin lo publica y queda auditado',()=>{
 const h=catalogHarness();h.createEditor();const token=h.loginEditor();
 for(const area of ['cotillon','disfraces']){
  const p={area,name:'Borrador de ensayo',description:'',mode:'venta',stock:0,active:false,price:1200,rentPrice:0,image:h.product.image,categoryId:area==='disfraces'?'d-primary':'c-primary'};
  const op=crypto.randomUUID(),draft=h.ctx.dispatch_({action:'saveProduct',token,product:p,operationId:op});assert.equal(draft.publicationState,'draft');
  assert.ok(!h.ctx.dispatch_({action:'catalogData'}).products.some(p=>p.id===draft.id));assert.ok(!h.ctx.dispatch_({action:'catalog'}).some(p=>p.id===draft.id));
  assert.throws(()=>h.ctx.dispatch_({action:'quickUpdate',token,area,id:draft.id,cambios:{active:true}}),/administrador/);
  assert.throws(()=>h.ctx.dispatch_({action:'publishProduct',token,area,id:draft.id}),/permiso/);
  const published=h.ctx.dispatch_({action:'publishProduct',token:h.admin,area,id:draft.id,revision:h.ctx.hash_(JSON.stringify(h.tables[area].find(p=>p.id===draft.id)))});
  assert.equal(published.publicationState,'published');assert.equal(published.active,true);assert.equal(h.tables.historial_cambios.at(-1).action,'publish');assert.ok(h.ctx.dispatch_({action:'catalog'}).some(p=>p.id===draft.id));
 }
});
test('reset y desactivación revocan sesiones del Editor; credenciales/version del Admin también',()=>{
 const h=catalogHarness(),user=h.createEditor(),first=h.loginEditor(),second=h.loginEditor();
 h.ctx.dispatch_({action:'resetCatalogUserPassword',token:h.admin,id:user.id,password:crypto.randomBytes(24).toString('base64url')});
 for(const token of [first,second])assert.throws(()=>h.ctx.dispatch_({action:'admin',token}),/Sesión/);
 assert.throws(()=>h.loginEditor(),/incorrectos/);
 h.ctx.dispatch_({action:'resetCatalogUserPassword',token:h.admin,id:user.id,password:h.password});const third=h.loginEditor();
 h.ctx.dispatch_({action:'setCatalogUserActive',token:h.admin,id:user.id,active:false});assert.throws(()=>h.ctx.dispatch_({action:'admin',token:third}),/Sesión/);assert.throws(()=>h.loginEditor(),/incorrectos/);
 h.settings.ADMIN_SESSION_VERSION=crypto.randomUUID();assert.throws(()=>h.ctx.dispatch_({action:'admin',token:h.admin}),/Sesión/);
});
test('Admin: H001/H002, reemplazo/restauración de foto y cambios relacionados auditados',()=>{
 const h=catalogHarness(),image='https://res.cloudinary.com/demo/image/upload/reemplazo-ensayo.jpg';
 const p=h.ctx.dispatch_({action:'saveProduct',token:h.admin,product:{...h.product,image,description:''}});assert.deepEqual([...p.categoryIds],['d-primary','d-secondary']);
 const photo=h.tables.historial_cambios.at(-1);assert.equal(photo.changes.image.before,h.product.image);
 const restored=h.ctx.dispatch_({action:'restoreProductPhoto',token:h.admin,area:p.area,id:p.id,historyId:photo.id,revision:h.ctx.hash_(JSON.stringify(h.tables.disfraces[0]))});assert.equal(restored.image,h.product.image);
 h.ctx.dispatch_({action:'saveCategory',token:h.admin,area:'disfraces',id:'d-primary',name:'Categoría renombrada'});assert.equal(h.tables.historial_cambios.at(-1).changes.category.after,'Categoría renombrada');
});
test('sin sesión ni origen permitido no hay mantenimiento ni escrituras; se rechazan sesiones viejas',()=>{
 const h=catalogHarness();h.tables.movimientos.push({id:'pending',area:'disfraces',productId:h.product.id,stockPending:{before:4,after:3}});delete h.settings.COTILLON_DEPTH3_V1;
 for(const action of ['catalog','catalogData','siteTheme']){const before=JSON.stringify(h.tables);h.ctx.dispatch_({action});assert.equal(JSON.stringify(h.tables),before);}
 for(const action of ['admin','saveProduct','quickUpdate','catalogUsers','productHistory','unknown']){const before=JSON.stringify(h.tables);assert.throws(()=>h.ctx.dispatch_({action}),/Sesión/);assert.equal(JSON.stringify(h.tables),before);}
 for(const origin of ['https://disfrazcabezon.com.ar','https://www.disfrazcabezon.com.ar','https://dc-web-8ai4.onrender.com'])assert.equal(h.ctx.frameOrigin_({parameter:{origin}}),origin);
 assert.throws(()=>h.ctx.frameOrigin_({parameter:{origin:'https://disfrazcabezon.com.ar.attacker.example'}}),/Origen/);
});

test('historial recupera una interrupción antes o después del producto sin perder el antes/después',()=>{
 for(const failAfter of [false,true]){
  const h=catalogHarness(),direct=h.ctx.putDirect_;
  h.ctx.putDirect_=(table,row)=>{if((!failAfter&&table==='disfraces')||(failAfter&&table==='historial_cambios'&&row.status==='committed'))throw Error('Interrupción de ensayo');return direct(table,row);};
  assert.throws(()=>h.ctx.dispatch_({action:'saveProduct',token:h.admin,product:{...h.product,name:'Nombre nuevo'}}),/Interrupción/);
  assert.equal(h.tables.historial_cambios[0].status,'pending');
  h.ctx.putDirect_=direct;const result=h.ctx.dispatch_({action:'recoverProductHistory',token:h.admin});assert.equal(result.recovered,1);assert.equal(h.tables.historial_cambios[0].status,'committed');assert.equal(h.tables.disfraces[0].name,'Nombre nuevo');assert.equal(h.tables.historial_cambios.length,1);
 }
});

test('historial pagina sin omitir registros con la misma fecha; H001 también conserva secundarios si el cliente omite la lista',()=>{
 const h=catalogHarness();h.tables.categorias_disfraces.push({id:'d-third',area:'disfraces',name:'Tercera categoría'});
 const input={...h.product,categoryId:'d-third'};delete input.categoryIds;
 const edited=h.ctx.dispatch_({action:'saveProduct',token:h.admin,product:input});assert.deepEqual([...edited.categoryIds],['d-third','d-secondary']);
 const original=h.tables.historial_cambios[0];h.tables.historial_cambios=Array.from({length:205},(_,i)=>({...original,id:String(i).padStart(4,'0'),at:'2026-11-01T00:00:00.000Z'}));
 const seen=[];let cursor;do{const page=h.ctx.dispatch_({action:'productHistory',token:h.admin,cursor});seen.push(...page.entries.map(e=>e.id));cursor=page.nextCursor;}while(cursor);
 assert.equal(seen.length,205);assert.equal(new Set(seen).size,205);
});

test('credenciales del Admin y origen/bridge inválidos revocan o rechazan sin escribir',()=>{
 for(const key of ['ADMIN_USER','ADMIN_PASSWORD','ADMIN_SESSION_VERSION','ADMIN_PASSWORD_RECORD']){
  const h=catalogHarness();h.settings[key]=crypto.randomBytes(24).toString('hex');assert.throws(()=>h.ctx.dispatch_({action:'admin',token:h.admin}),/Sesión/);
 }
 const h=catalogHarness(),before=JSON.stringify(h.tables);
 for(const parameter of [{transport:'frame',origin:'https://attacker.example',bridgeId:crypto.randomUUID()},{transport:'frame',origin:h.settings.SITE_URL,bridgeId:'invalid'}]){
  parameter.payload=JSON.stringify({action:'quickUpdate',token:h.admin,area:'disfraces',id:h.product.id,cambios:{stock:1}});
  assert.throws(()=>h.ctx.doPost({parameter,postData:{contents:parameter.payload}}));assert.equal(JSON.stringify(h.tables),before);
 }
});

test('crear no puede sobrescribir un producto existente reutilizando operationId; reintentos propios no duplican',()=>{
 const h=catalogHarness();h.createEditor();const editor=h.loginEditor(),id=crypto.randomUUID();
 h.tables.disfraces.push({...h.product,id,name:'Producto existente con UUID'});
 const input={area:'disfraces',name:'Borrador nuevo',description:'',mode:'venta',price:1,rentPrice:0,stock:0,active:false,image:h.product.image};
 for(const token of [editor,h.admin]){
  const before=JSON.stringify(h.tables);h.writes.length=0;
  assert.throws(()=>h.ctx.dispatch_({action:'saveProduct',token,product:input,operationId:id}),/Ya existe/);
  assert.equal(JSON.stringify(h.tables),before);assert.equal(h.writes.length,0);
 }
 const operationId=crypto.randomUUID(),first=h.ctx.dispatch_({action:'saveProduct',token:editor,product:input,operationId});
 const before=JSON.stringify(h.tables),second=h.ctx.dispatch_({action:'saveProduct',token:editor,product:input,operationId});
 assert.equal(second.id,first.id);assert.equal(JSON.stringify(h.tables),before);
});
