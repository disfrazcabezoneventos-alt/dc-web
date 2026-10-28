import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

function harness(){
 const tables=Object.fromEntries(['disfraces','cotillon','categorias_disfraces','categorias_cotillon','reservas','movimientos','cancelaciones','notifications'].map(k=>[k,[]]));
 tables.cotillon.push({id:'pending-product',area:'cotillon',stock:5,active:true});
 tables.movimientos.push({id:'pending-movement',area:'cotillon',productId:'pending-product',stockPending:{before:5,after:4}});
 const properties={ADMIN_USER:'admin',ADMIN_PASSWORD:'correct-test-password'},cache=new Map();
 const writes=[],order=[];
 const context=vm.createContext({console,Date,JSON,Map,Set,
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k],setProperty:(k,v)=>{writes.push('property');properties[k]=v;}})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>{writes.push('cache');cache.set(k,v);},remove:k=>{writes.push('cache');cache.delete(k);}})},
  Utilities:{getUuid:()=>crypto.randomUUID(),Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_a,value)=>[...crypto.createHash('sha256').update(value).digest()]},
  SpreadsheetApp:{flush(){}},
  DriveApp:{getFileById:()=>({getBlob:()=>({getBytes:()=>[],getContentType:()=> 'image/png'})})}
 });
 vm.runInContext(fs.readFileSync('backend/Code.gs','utf8'),context);
 context.rows_=name=>structuredClone(tables[name]);
 context.put_=(name,p)=>{writes.push(name);const i=tables[name].findIndex(x=>x.id===p.id);if(i<0)tables[name].push(structuredClone(p));else tables[name][i]=structuredClone(p);return p;};
 context.sheet_=name=>({getLastRow:()=>tables[name].length+1,getRange:()=>({setValues:rows=>{writes.push(name);rows.forEach(r=>tables[name].push(JSON.parse(r[1])));}})});
 const session=context.session_,recover=context.recoverStock_,ensure=context.ensureCotillonDepth3_;
 context.session_=token=>{order.push('session');return session(token);};
 context.recoverStock_=()=>{order.push('recover');return recover();};
 context.ensureCotillonDepth3_=()=>{order.push('ensure');return ensure();};
 context.lock_=fn=>fn();context.ContentService={MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})};
 const token='valid-admin-token-01234567890123456789';cache.set('session:'+context.hash_(token),'admin');
 return {context,tables,properties,writes,order,token};
}
const adminActions=['admin','logout','setSiteTheme','setHalloweenCampaign','saveCategory','mapLegacyCategory','deleteCategory','saveProduct','deleteProduct','uploadImage','status','movement','voidMovement','resolveCancel','bankSettings','unknown-action'];
for(const action of adminActions)for(const token of [undefined,'short','expired-token-012345678901234567890']){
 test(`${action}: token ${token===undefined?'ausente':token==='short'?'inválido':'vencido'} no escribe`,()=>{
  const h=harness(),before=JSON.stringify(h.tables),settings=JSON.stringify(h.properties);
  assert.throws(()=>h.context.dispatch_({action,token}),/Sesión/);
  assert.deepEqual(h.writes,[]);assert.equal(JSON.stringify(h.tables),before);assert.equal(JSON.stringify(h.properties),settings);
  assert.deepEqual(h.order,['session']);
 });
}
for(const action of ['siteTheme','catalog','catalogData'])test(`${action}: lectura pública no repara stock ni migra categorías`,()=>{
 const h=harness(),before=JSON.stringify(h.tables);h.context.dispatch_({action});
 assert.deepEqual(h.writes,[]);assert.deepEqual(h.order,[]);assert.equal(JSON.stringify(h.tables),before);
});
test('doPost sin token devuelve error y no escribe con stock y migraciones pendientes',()=>{
 const h=harness(),r=JSON.parse(h.context.doPost({postData:{contents:'{"action":"admin"}'},parameter:{}}).text);
 assert.equal(r.ok,false);assert.match(r.error,/Sesión/);assert.deepEqual(h.writes,[]);
});
test('admin válido autentica antes de recuperar stock y crear categorías',()=>{
 const h=harness();h.context.dispatch_({action:'admin',token:h.token});
 assert.deepEqual(h.order,['session','recover','ensure']);assert.equal(h.tables.cotillon[0].stock,4);
 assert.equal(h.tables.movimientos[0].stockPending,undefined);assert.equal(h.properties.COTILLON_DEPTH3_V1,'ready');
 assert.ok(h.tables.categorias_cotillon.length>0);
});
test('login conserva sus escrituras de caché, sin mantenimiento de tablas',()=>{
 const h=harness();assert.throws(()=>h.context.dispatch_({action:'login',username:'admin',password:'bad'}),/incorrectos/);
 assert.ok(h.writes.every(x=>x==='cache'));assert.deepEqual(h.order,[]);
 const result=h.context.dispatch_({action:'login',username:'admin',password:'correct-test-password'});
 assert.ok(result.token);assert.ok(h.writes.every(x=>x==='cache'));assert.equal(h.tables.cotillon[0].stock,5);
});
for(const action of ['request','file','correct'])test(`${action}: acceso privado incorrecto no escribe`,()=>{
 const h=harness();h.tables.reservas.push({id:'r',accessHash:h.context.hash_('correct-private-access')});
 assert.throws(()=>h.context.dispatch_({action,id:'r',access:'wrong',slot:'signature'}),/Acceso/);assert.deepEqual(h.writes,[]);assert.deepEqual(h.order,[]);
});
