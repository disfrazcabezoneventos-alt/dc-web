import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import {catalogHarness} from './catalog-access-harness.mjs';

test('passwordMatches verifica el costo del registro, incluidos registros anteriores al cambio de constante',()=>{
 const h=catalogHarness(),password=crypto.randomBytes(24).toString('base64url'),salt=crypto.randomBytes(32).toString('hex');
 const original=h.ctx.DcPasswords,calls=[];
 h.ctx.DcPasswords={derive:(p,s,n)=>{calls.push(n);return 'test-result'}};
 for(const iterations of [100000,210000,600000,1000000])assert.equal(h.ctx.passwordMatches_(password,{algorithm:'pbkdf2-sha256',iterations,salt,hash:'test-result'}),true);
 assert.deepEqual(calls,[100000,210000,600000,1000000]);calls.length=0;
 for(const iterations of [99999,1000001,210000.5,'210000',null,NaN,Infinity])assert.equal(h.ctx.passwordMatches_(password,{algorithm:'pbkdf2-sha256',iterations,salt,hash:'test-result'}),false);
 assert.equal(calls.length,0);h.ctx.DcPasswords=original;
 const hash=crypto.pbkdf2Sync(password,Buffer.from(salt,'hex'),210000,32,'sha256').toString('hex');
 assert.equal(h.ctx.passwordMatches_(password,{algorithm:'pbkdf2-sha256',iterations:210000,salt,hash}),true);
 assert.equal(h.ctx.passwordMatches_(crypto.randomBytes(24).toString('hex'),{algorithm:'pbkdf2-sha256',iterations:210000,salt,hash}),false);
});

test('ejecutarMedirHash devuelve ms y solo registra costo/tiempo, sin escribir ni registrar secretos',()=>{
 const h=catalogHarness(),before=JSON.stringify(h.settings),tables=JSON.stringify(h.tables),logs=[];
 vm.runInContext(fs.readFileSync('backend/MantenimientoTemporal.gs','utf8'),h.ctx);
 h.ctx.console={log:(...x)=>logs.push(x),warn:(...x)=>logs.push(x),error:(...x)=>logs.push(x)};
 h.ctx.Logger={log:(...x)=>logs.push(x)};let calls=0;
 h.ctx.DcPasswords={derive:(password,salt,iterations)=>{calls++;assert.ok(password.startsWith('ensayo-'));assert.notEqual(password,h.settings.ADMIN_PASSWORD);assert.match(salt,/^[a-f0-9]{64}$/);assert.equal(iterations,600000);return crypto.randomBytes(32).toString('hex')}};
 const ms=h.ctx.ejecutarMedirHash();assert.ok(Number.isInteger(ms)&&ms>=0);assert.equal(calls,1);assert.deepEqual(logs,[[JSON.stringify({iterations:600000,ms})]]);assert.equal(JSON.stringify(h.settings),before);assert.equal(JSON.stringify(h.tables),tables);
});
