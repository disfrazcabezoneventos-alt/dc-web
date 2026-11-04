import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gzipSync,gunzipSync} from 'node:zlib';
import crypto from 'node:crypto';
import {catalogHarness} from './catalog-access-harness.mjs';
import {publicHarness as setup} from './public-catalog-test-backend.mjs';
test('public reads bypass the write lock; warm catalog does not read Sheets',()=>{
 const h=setup();for(const action of ['catalogData','catalog','siteTheme','localConfig','rentalConfig'])assert.equal(h.post({action}).ok,true);
 assert.equal(h.locks().scriptLocks,0);const reads=h.reads();h.post({action:'catalogData'});assert.equal(h.reads(),reads);assert.equal(h.locks().userLocks,1);
});
test('projection retains availability/categories/promos and excludes all internal fields',()=>{
 const h=setup();Object.assign(h.tables.disfraces[0],{insuranceDeposit:65000,tariff:'Premium',notes:'PRIVATE',sourceId:'import',custom:{secret:true}});
 const p=h.post({action:'catalogData'}).data.products.find(p=>p.id===h.product.id);
 assert.equal('stock' in p,false);assert.equal(p.available,true);assert.equal(p.purchaseMax,4);assert.equal(p.categoryIds.length,2);for(const key of ['insuranceDeposit','tariff','notes','sourceId','custom'])assert.equal(key in p,false);
 assert.equal(h.post({action:'catalogData'}).data.rentalConfig.version,2);
});
test('chunked UTF8 cache survives non-ASCII data and treats evicted/corrupt blocks as a miss',()=>{
 const h=setup(),c=h.ctx,m=new Map(),cache={get:k=>m.get(k),put:(k,v)=>{assert.ok(Buffer.byteLength(v)<100000);m.set(k,v)}};
 const v=c.publicCatalogVersion_(),data={text:crypto.randomBytes(180000).toString('base64')+'ñ🎃'.repeat(20000)};c.publicCatalogStore_(cache,v,data);assert.equal(c.publicCatalogCached_(cache,v).text,data.text);
 const key=[...m.keys()].find(k=>!k.endsWith(':manifest'));m.delete(key);assert.equal(c.publicCatalogCached_(cache,v),null);c.publicCatalogStore_(cache,v,data);m.set(v+':manifest','bad');assert.equal(c.publicCatalogCached_(cache,v),null);
});
test('cache invalidation follows successful writes but unauthorized requests do not write properties',()=>{
 const h=setup();h.post({action:'catalogData'});const old=h.ctx.publicCatalogVersion_(),settings=JSON.stringify(h.settings);
 assert.equal(h.post({action:'setSiteTheme',theme:'halloween'}).ok,false);assert.equal(JSON.stringify(h.settings),settings);
 assert.equal(h.post({action:'setSiteTheme',theme:'halloween',token:h.admin}).ok,true);assert.notEqual(h.ctx.publicCatalogVersion_(),old);assert.equal(h.locks().scriptLocks,2);
});
test('prices/promos/properties change the cache namespace without trusting cached submission data',()=>{
 const h=setup(),old=h.ctx.publicCatalogVersion_();h.settings.LOCAL_PRICE_ADULTO='61000';assert.notEqual(h.ctx.publicCatalogVersion_(),old);
 h.post({action:'catalogData'});h.tables.disfraces[0].active=false;
 assert.throws(()=>h.ctx.rentalSubmission_({data:{items:[{productId:h.product.id,category:'adulto',quantity:1}]}}),/cambió/);
});

test('inactive cotillon is excluded; active zero stock remains sold out; public maximum is capped at 10',()=>{const h=setup();h.tables.cotillon.push({...h.product,id:'hidden',area:'cotillon',active:false});h.tables.cotillon[0].stock=314;h.tables.disfraces[0].stock=0;const data=h.post({action:'catalogData'}).data;assert.equal(data.products.some(p=>p.id==='hidden'),false);const c=data.products.find(p=>p.area==='cotillon');assert.equal(c.purchaseMax,10);assert.equal('stock' in c,false);const d=data.products.find(p=>p.area==='disfraces');assert.equal(d.available,false);assert.equal(d.purchaseMax,0);});

test('a cold follower reuses the elected builder snapshot instead of rebuilding',()=>{
 const h=setup(),c=h.ctx,cache=c.CacheService.getScriptCache(),version=c.publicCatalogVersion_();let builds=0,sleeps=0;
 c.LockService.getUserLock=()=>({tryLock:()=>false,releaseLock(){throw Error('Not the builder')}});
 c.publicCatalogBuild_=()=>{builds++;throw Error('Follower must not build')};
 c.Utilities.sleep=()=>{if(++sleeps===1)c.publicCatalogStore_(cache,version,{catalogVersion:2,snapshotId:'elected-builder',products:[]})};
 const result=h.post({action:'catalogData'});assert.equal(result.ok,true);assert.equal(result.data.snapshotId,'elected-builder');assert.equal(builds,0);assert.equal(h.locks().scriptLocks,0);
});
test('warm cache keeps its snapshot identity and invalidation creates a new one',()=>{
 const h=setup(),a=h.post({action:'catalogData'}).data,b=h.post({action:'catalogData'}).data;
 assert.equal(a.snapshotId,b.snapshotId);h.ctx.publicCatalogInvalidate_();const c=h.post({action:'catalogData'}).data;assert.notEqual(c.snapshotId,a.snapshotId);
});
