import {catalogHarness} from './catalog-access-harness.mjs';
import fs from 'node:fs';
export async function setupSearch(page,theme='default',legacy=true){
 const h=catalogHarness();h.settings.SITE_THEME=theme;h.settings.COTILLON_EXCEL_2026_STATE='ready';h.settings.SEARCH_MISS_LOG_ENABLED='yes';
 h.tables.disfraces=[{...h.product,id:'spider',name:'Spider-Man rojo',description:'Máscara infantil'},{...h.product,id:'princess',name:'Princesas del reino'},...Array.from({length:7},(_,i)=>({...h.product,id:'hero-'+i,name:'Héroe '+i})),{...h.product,id:'hidden',name:'Producto secreto',publicationState:'draft'}];
 h.tables.cotillon=[{...h.product,id:'mask',area:'cotillon',mode:'venta',name:'Máscara roja',category:'Otros',categoryId:'c-primary',categoryIds:['c-primary'],active:true,stock:0}];
 const logs=[];let sheet=null;h.ctx.SpreadsheetApp={openById:()=>({getSheetByName:()=>sheet,insertSheet:()=>sheet={appendRow:r=>logs.push(r),setFrozenRows(){},getLastRow:()=>logs.length,getRange:()=>({getValues:()=>logs.slice(1)})}})};
 let catalogCalls=0;const missAttempts=[];
 await page.addInitScript(theme=>localStorage.setItem('dc-site-theme',theme),theme);
 await page.route('https://res.cloudinary.com/**',r=>r.fulfill({contentType:'image/png',body:fs.readFileSync('public/brand-logo.png')}));
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||''),body=JSON.parse(fields.get('payload'));if(body.action==='catalogData')catalogCalls++;
  let result;if(body.action==='recordSearchMiss')missAttempts.push(body.query);try{if(legacy&&body.action==='recordSearchMiss')throw new Error('Acción desconocida');result={ok:true,data:h.ctx.dispatch_(body)}}catch(e){result={ok:false,error:e.message}}
  await route.fulfill({contentType:'text/html; charset=utf-8',body:`<script>parent.postMessage(${JSON.stringify({type:'dc-apps-result',id:fields.get('bridgeId'),result}).replace(/</g,'\\u003c')},${JSON.stringify(fields.get('origin'))})</script>`});
 });return {h,logs,missAttempts,catalogCalls:()=>catalogCalls};
}
