import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {publicHarness} from './public-catalog-test-backend.mjs';
function setup(){const h=publicHarness();vm.runInContext(fs.readFileSync('backend/SiteInfo.gs','utf8')+'\n'+fs.readFileSync('backend/CatalogPages.gs','utf8'),h.ctx);return h}
const blank={googleRating:null,googleReviewCount:null,photos:[],rappiUrl:''};
test('Google: initial owner supplied values, public no lock/no writes, and cache includes configuration',()=>{
 const h=setup(),before=JSON.stringify(h.settings),data=h.post({action:'siteInfo'}).data;
 assert.equal(data.googleRating,4.7);assert.equal(data.googleReviewCount,717);assert.equal(data.googleUpdatedAt,'2026-11-05');assert.equal(JSON.stringify(h.settings),before);assert.equal(h.locks().scriptLocks,0);
 assert.equal(h.post({action:'catalogData'}).data.siteInfo.googleReviewCount,717);
});
test('Google settings require authenticated admin, including when roles are disabled',()=>{
 for(const enabled of [true,false]){const h=setup();h.createEditor();const editor=h.loginEditor();if(!enabled)delete h.settings.CATALOG_ROLES_ENABLED;const before=JSON.stringify(h.settings);for(const token of [undefined,'bad',editor])assert.equal(h.post({action:'saveSiteInfo',token,info:blank}).ok,false);assert.equal(JSON.stringify(h.settings),before)}
});
test('Google settings reject malformed values/extra keys/photos/URLs before writing',()=>{
 const h=setup(),before=JSON.stringify(h.settings);
 for(const patch of [{photos:Array(4).fill({image:'https://res.cloudinary.com/demo/image/upload/'+('x'.repeat(1400)),thumbnail:'https://res.cloudinary.com/demo/image/upload/'+('y'.repeat(1400)),alt:'Foto'})},{googleRating:5.1},{googleRating:'4.7'},{googleRating:-1},{googleReviewCount:1.2},{googleReviewCount:-1},{googleReviewCount:'717'},{googleUpdatedAt:'2000-01-01'},{photos:Array(5).fill({})},{photos:[{image:'javascript:alert(1)',thumbnail:'',alt:''}]},{rappiUrl:'https://evil.invalid/'},{rappiUrl:'https://rappi.com.ar.evil.invalid/tiendas/test'}])assert.equal(h.post({action:'saveSiteInfo',token:h.admin,info:{...blank,...patch}}).ok,false,JSON.stringify(patch));assert.equal(JSON.stringify(h.settings),before);
});
test('Google: saves/clears values, invalidates catalog and keeps update date on photo-only edits',()=>{
 const h=setup();h.ctx.today_=()=> '2026-11-05';h.ctx.now_=()=> '2026-11-06T01:00:00Z';let version=h.ctx.publicCatalogVersion_();const save=info=>h.post({action:'saveSiteInfo',token:h.admin,info});
 assert.equal(save({...blank,googleRating:4.8,googleReviewCount:718}).ok,true);assert.notEqual(h.ctx.publicCatalogVersion_(),version);let data=h.post({action:'catalogData'}).data.siteInfo;assert.equal(data.googleRating,4.8);const date=data.googleUpdatedAt;assert.equal(date,'2026-11-05');
 const image='https://res.cloudinary.com/demo/image/upload/local.jpg';assert.equal(save({...blank,googleRating:4.8,googleReviewCount:718,photos:[{image,thumbnail:image,alt:'Frente del local'}]}).ok,true);assert.equal(h.ctx.siteInfo_().googleUpdatedAt,date);assert.equal(h.ctx.siteInfo_().photos[0].alt,'Frente del local');assert.equal(h.settings.CATALOG_PAGES_DIRTY_REVISION,undefined);
 assert.equal(save(blank).ok,true);assert.equal(h.ctx.siteInfo_().googleUpdatedAt,null);assert.equal(h.post({action:'catalogData'}).data.siteInfo.googleReviewCount,null);
});
test('Google display hides incomplete rating; locale, date and QR source share exact place',()=>{
 const lib={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/site-info.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(lib);
 assert.equal(lib.ratingLabel(lib.INITIAL_SITE_INFO),'★ 4,7 en Google · 717 opiniones');for(const field of ['googleRating','googleReviewCount','googleUpdatedAt'])assert.equal(lib.ratingLabel({...lib.INITIAL_SITE_INFO,[field]:null}),null);
 assert.equal(lib.REVIEW_URL,'https://search.google.com/local/writereview?placeid=ChIJS7DHjj3KvJURGUymDvR0_PE');const raw=Buffer.from(lib.GOOGLE_PLACE_ID,'base64url');assert.equal(raw.readBigUInt64LE(raw.length-8).toString(),'17436940448838339609');
});
