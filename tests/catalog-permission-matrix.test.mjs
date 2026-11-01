import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {catalogHarness} from './catalog-access-harness.mjs';
import {png} from './local-forms-harness.mjs';
const h=catalogHarness();h.createEditor();h.editor=h.loginEditor();
const forbidden=['saveCategory','deleteCategory','mapLegacyCategory','deleteProduct','setSiteTheme','setHalloweenCampaign','status','movement','voidMovement','resolveCancel','bankSettings','incomingForms','incomingRequest','incomingNotifications','dismissFormNotifications','saveRentalPrices','updateIncomingForm','deleteIncomingForm','incomingFile','localReceiptInfo','issueLocalReceipt','sendLocalReceipt','catalogUsers','createCatalogUser','setCatalogUserActive','resetCatalogUserPassword','productHistory','recoverProductHistory','restoreProductPhoto','publishProduct','bank','submit','submitLocal','localConfig','request','file','correct','cancel','viewLocalReceipt'];
for(const action of forbidden)test('Editor rechaza '+action+' sin ninguna escritura',()=>{
 const before=JSON.stringify(h.tables),props=JSON.stringify(h.settings);h.writes.length=0;
 assert.throws(()=>h.ctx.dispatch_({action,token:h.editor,id:h.product.id,area:'disfraces',product:h.product}),/permiso/);
 assert.equal(h.writes.length,0);assert.equal(JSON.stringify(h.tables),before);assert.equal(JSON.stringify(h.settings),props);
});
for(const action of forbidden)test('Administrador autoriza '+action+' en el control de API',()=>assert.equal(h.ctx.catalogApiActor_({action,token:h.admin}).role,'admin'));
for(const action of ['admin','quickUpdate','saveProduct','uploadImage','catalogUsers','productHistory','unknown-action'])test('Sin sesión rechaza '+action+' antes del mantenimiento',()=>{
 const before=JSON.stringify(h.tables);h.writes.length=0;assert.throws(()=>h.ctx.dispatch_({action}),/Sesión/);assert.equal(h.writes.length,0);assert.equal(JSON.stringify(h.tables),before);
});
test('Editor sube foto por Cloudinary sin ejecutar mantenimiento, y nunca destruye una foto',()=>{
 const requests=[];h.ctx.recoverStock_=()=>{throw new Error('No debe ejecutar mantenimiento');};
 Object.assign(h.settings,{CLOUDINARY_API_SECRET:crypto.randomBytes(32).toString('hex'),CLOUDINARY_API_KEY:crypto.randomBytes(12).toString('hex'),CLOUDINARY_CLOUD_NAME:'demo'});
 h.ctx.Utilities.newBlob=(bytes,type,name)=>({bytes,type,name});
 h.ctx.UrlFetchApp={fetch:(url,options)=>{requests.push({url,options});return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({secure_url:h.product.image,eager:[{secure_url:h.product.image}]})};}};
 const r=h.ctx.dispatch_({action:'uploadImage',token:h.editor,file:png});assert.equal(r.url,h.product.image);assert.equal(requests.length,1);assert.match(requests[0].url,/\/image\/upload$/);assert.equal(requests[0].options.payload.public_id,undefined);
});
test('Límite de intentos por usuario, sesiones antiguas y reactivación sin resucitar sesiones',()=>{
 const x=catalogHarness(),u=x.createEditor(),token=x.loginEditor();
 x.ctx.dispatch_({action:'setCatalogUserActive',token:x.admin,id:u.id,active:false});x.ctx.dispatch_({action:'setCatalogUserActive',token:x.admin,id:u.id,active:true});assert.throws(()=>x.ctx.dispatch_({action:'admin',token}),/Sesión/);
 for(let n=0;n<8;n++)try{x.ctx.dispatch_({action:'login',username:u.username,password:crypto.randomBytes(12).toString('hex')})}catch(_){}
 assert.throws(()=>x.loginEditor(),/Demasiados/);assert.ok(x.ctx.dispatch_({action:'login',username:x.settings.ADMIN_USER,password:x.settings.ADMIN_PASSWORD}).token);
 const legacy=crypto.randomBytes(32).toString('hex');x.ctx.CacheService.getScriptCache().put('session:'+x.ctx.hash_(legacy),'admin',21600);assert.throws(()=>x.ctx.dispatch_({action:'admin',token:legacy}),/Sesión/);
});
