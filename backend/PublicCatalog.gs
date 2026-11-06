/* Public read model v1. No credentials, source records or rental calculation use this cache. */
const PUBLIC_CATALOG_FIELDS_=['id','area','name','description','price','rentPrice','mode','category','categoryId','categoryIds','categoryNames','catalogGroups','image','thumbnail','saleCondition','deliveryTime','orderLimit','priceKnown','stockUnknown','active'];
function publicReadAction_(b){return ['catalogData','catalog','siteTheme','localConfig','rentalConfig','siteInfo'].includes(b.action);}
function publicCatalogInvalidate_(options){props_().setProperty('PUBLIC_CATALOG_REVISION',Utilities.getUuid());if(options?.pages!==false&&typeof markCatalogPagesDirty_==='function')markCatalogPagesDirty_();}
function publicCatalogVersion_(){const p=props_().getProperties();return 'pc3gzip:'+hash_(JSON.stringify(['SPREADSHEET_ID','PUBLIC_CATALOG_REVISION','RENTAL_PROMOTIONS_V1','LOCAL_PRICE_ADULTO','LOCAL_PRICE_CABEZON','SITE_THEME','CAMPAIGN_HALLOWEEN','COTILLON_EXCEL_2026_STATE','SITE_PUBLIC_INFO_V1'].map(k=>p[k]||'')));}
function publicCatalogBuild_(){
 const products=CATEGORY_AREAS.flatMap(a=>products_(a).filter(p=>(typeof catalogPublicProduct_!=='function'||catalogPublicProduct_(p))&&p.active)).map(p=>({...Object.fromEntries(PUBLIC_CATALOG_FIELDS_.filter(k=>p[k]!==undefined).map(k=>[k,p[k]])),available:p.stock>0,purchaseMax:Math.min(10,Math.max(0,Number(p.stock)||0))}));
 const fields=['id','area','name','storefront','group','parentId','mappedToCategoryId'];
 return {siteInfo:typeof siteInfo_==='function'?siteInfo_():null,catalogVersion:2,snapshotId:Utilities.getUuid(),rentalConfig:rentalConfig_(),products,categories:CATEGORY_AREAS.flatMap(categories_).map(c=>Object.fromEntries(fields.filter(k=>c[k]!==undefined).map(k=>[k,c[k]]))),campaign:siteCampaign_(),cotillonImportReady:config_('COTILLON_EXCEL_2026_STATE')==='ready'};
}
function publicCatalogCached_(cache,version){
 try{
  const raw=cache.get(version+':manifest');if(!raw)return null;
  const m=JSON.parse(raw);if(m.version!==version||!Number.isInteger(m.count)||m.count<1||m.count>100)return null;
  const keys=Array.from({length:m.count},(_,i)=>version+':'+m.generation+':'+i),blocks=typeof cache.getAll==='function'?cache.getAll(keys):null;
  let encoded='';for(let i=0;i<m.count;i++){const part=blocks?blocks[keys[i]]:cache.get(keys[i]);if(part===null||part===undefined)return null;encoded+=part;}
  if(hash_(encoded)!==m.hash)return null;
  return JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(encoded),'application/x-gzip','catalog.gz')).getDataAsString('UTF-8'));
 }catch(_){return null;}
}
function publicCatalogStore_(cache,version,data){
 // ASCII base64 chunks remain below the 100 KB/key limit even with non-ASCII descriptions.
 const encoded=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(data))).getBytes()),generation=Utilities.getUuid(),count=Math.ceil(encoded.length/80000);
 if(count>100)return;
 const parts={};for(let i=0;i<count;i++)parts[version+':'+generation+':'+i]=encoded.slice(i*80000,(i+1)*80000);
 if(typeof cache.putAll==='function')cache.putAll(parts,300);else Object.keys(parts).forEach(key=>cache.put(key,parts[key],300));
 // Publish manifest last; a partial/evicted snapshot is always a miss, never partial JSON.
 if(publicCatalogVersion_()===version)cache.put(version+':manifest',JSON.stringify({version,generation,count,hash:hash_(encoded)}),300);
}
function publicCatalog_(){
 const version=publicCatalogVersion_(),cache=CacheService.getScriptCache();let hit=publicCatalogCached_(cache,version);if(hit)return hit;
 // Separate builder coordination: never acquire the writers' ScriptLock.
 // tryLock(0) cannot queue behind reservations/admin. Followers reuse the builder's snapshot.
 const builder=LockService.getUserLock();
 if(builder.tryLock(0)){
  try{hit=publicCatalogCached_(cache,version);if(hit)return hit;const data=publicCatalogBuild_();try{publicCatalogStore_(cache,version,data)}catch(_){}return data;}finally{builder.releaseLock();}
 }
 for(let i=0;i<120;i++){
  Utilities.sleep(100);if(publicCatalogVersion_()!==version)return publicCatalog_();
  hit=publicCatalogCached_(cache,version);if(hit)return hit;
 }
 // CacheService is best effort. If evicted/unavailable, preserve availability by reading Sheets.
 // This bounded fallback may duplicate a build; it does not throw "sistema ocupado".
 return publicCatalogBuild_();
}
function publicRead_(b){
 if(b.action==='siteInfo')return siteInfo_();
 if(b.action==='siteTheme')return {theme:siteTheme_()};
 if(b.action==='rentalConfig')return rentalConfig_();
 if(b.action==='localConfig'){need_(config_('LOCAL_FORMS_ENABLED')==='yes','Primero ejecutá prepararFormulariosLocales_ y publicá Apps Script.');return {version:1,prices:rentalPrices_(),rentalConfig:rentalConfig_()};}
 const data=publicCatalog_();return b.action==='catalog'?data.products:data;
}
function catalogMutation_(action){return ['saveProduct','quickUpdate','deleteProduct','publishProduct','restoreProductPhoto','undoRentalCatalogCorrection','saveCategory','deleteCategory','renameCategory','moveCategory','saveRentalPromotion','saveRentalPrices','setSiteTheme','setHalloweenCampaign'].includes(action)||/Category|Categor/.test(action);}
