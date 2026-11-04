import fs from 'node:fs';
import vm from 'node:vm';
import {gzipSync,gunzipSync} from 'node:zlib';
import {catalogHarness} from './catalog-access-harness.mjs';
export function publicHarness(){
 const h=catalogHarness(),c=h.ctx;let scriptLocks=0,userLocks=0;
 c.Utilities.newBlob=(value,type)=>({getContentType:()=>type,getBytes:()=>Array.from(Buffer.from(typeof value==='string'?value:Buffer.from(value),'utf8')),getDataAsString:()=>Buffer.from(value).toString('utf8')});
 c.Utilities.gzip=blob=>c.Utilities.newBlob([...gzipSync(Buffer.from(blob.getBytes()))]);
 c.Utilities.ungzip=blob=>{if(blob.getContentType()!=='application/x-gzip')throw Error('GZIP MIME required');return c.Utilities.newBlob([...gunzipSync(Buffer.from(blob.getBytes()))]);};
 c.Utilities.sleep=()=>{};
 c.LockService={getUserLock:()=>({tryLock:()=>{userLocks++;return true},releaseLock(){}})};
 c.lock_=fn=>{scriptLocks++;return fn()};c.reply_=(_e,result)=>result;
 vm.runInContext(fs.readFileSync('backend/PublicCatalog.gs','utf8'),c);
 const post=b=>c.doPost({postData:{contents:JSON.stringify(b)}});
 return {...h,post,locks:()=>({scriptLocks,userLocks})};
}
