import test from 'node:test';
import assert from 'node:assert/strict';
import {localHarness,submission} from './local-forms-harness.mjs';

const login=h=>h.dispatch({action:'login',username:h.settings.ADMIN_USER,password:h.settings.ADMIN_PASSWORD}).token;
const notifications=(h,token)=>h.dispatch({action:'incomingNotifications',token});

test('cambiar contraseña invalida todas las sesiones anteriores y permite un nuevo ingreso',()=>{
 const h=localHarness(),second=login(h);
 assert.equal(notifications(h,h.token).notifications.length,0);
 h.settings.ADMIN_PASSWORD='new-test-password-67890';
 for(const token of [h.token,second]){
  assert.throws(()=>notifications(h,token),/Sesión vencida/);
  assert.throws(()=>h.dispatch({action:'quickUpdate',token}),/Sesión vencida/);
 }
 assert.throws(()=>h.dispatch({action:'login',username:h.settings.ADMIN_USER,password:'test-password-12345'}),/incorrectos/);
 assert.equal(notifications(h,login(h)).notifications.length,0);
});

test('cambiar usuario también revoca una sesión aunque la contraseña siga igual',()=>{
 const h=localHarness();h.settings.ADMIN_USER='otro-admin';
 assert.throws(()=>notifications(h,h.token),/Sesión vencida/);
 assert.throws(()=>h.dispatch({action:'login',username:'admin',password:h.settings.ADMIN_PASSWORD}),/incorrectos/);
 assert.equal(notifications(h,login(h)).notifications.length,0);
});

test('ADMIN_SESSION_VERSION revoca sesiones sin cambiar credenciales y no se envía al navegador',()=>{
 const h=localHarness(),oldPassword=h.settings.ADMIN_PASSWORD;
 h.settings.ADMIN_SESSION_VERSION='revision-de-accesos-1';
 assert.throws(()=>notifications(h,h.token),/Sesión vencida/);
 const result=h.dispatch({action:'login',username:h.settings.ADMIN_USER,password:oldPassword});
 assert.deepEqual(Object.keys(result),['token']);
 assert.equal(notifications(h,result.token).notifications.length,0);
 h.settings.ADMIN_SESSION_VERSION='revision-de-accesos-2';
 assert.throws(()=>notifications(h,result.token),/Sesión vencida/);
 assert.equal(h.settings.ADMIN_PASSWORD,oldPassword);
});

test('el despliegue rechaza sesiones del formato anterior y elimina su autorización en caché',()=>{
 const h=localHarness(),legacy='legacy-session-'.repeat(5),key='session:'+h.ctx.hash_(legacy);
 const cache=h.ctx.CacheService.getScriptCache();cache.put(key,'admin',21600);
 assert.throws(()=>notifications(h,legacy),/Sesión vencida/);
 assert.equal(cache.get(key),undefined);
 for(const token of [undefined,'','corto','unknown-'.repeat(8)])assert.throws(()=>notifications(h,token),/Sesión vencida/);
});

test('cerrar sesión invalida solo ese token y conserva otras sesiones válidas',()=>{
 const h=localHarness(),second=login(h);
 h.dispatch({action:'logout',token:h.token});
 assert.throws(()=>notifications(h,h.token),/Sesión vencida/);
 assert.equal(notifications(h,second).notifications.length,0);
});

test('revocar admin conserva tarifas públicas y enlaces privados de los clientes',()=>{
 const h=localHarness(),body=submission(h),created=h.dispatch(body);
 const before=structuredClone(h.tables.reservas);
 h.settings.ADMIN_PASSWORD='new-test-password-67890';
 assert.throws(()=>notifications(h,h.token),/Sesión vencida/);
 assert.equal(h.dispatch({action:'localConfig'}).prices.adulto,60000);
 assert.equal(h.dispatch({action:'request',id:created.id,access:body.access}).code,created.code);
 assert.deepEqual(h.tables.reservas,before);
});
