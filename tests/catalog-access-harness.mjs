import crypto from 'node:crypto';
import {localHarness} from './local-forms-harness.mjs';
export function catalogHarness({enabled=true}={}){
 const h=localHarness();
 const {ctx,tables,settings}=h;
 settings.ADMIN_PASSWORD=crypto.randomBytes(24).toString('base64url');
 settings.SPREADSHEET_ID=crypto.randomUUID();settings.ADMIN_USER='admin';settings.SITE_URL='https://disfrazcabezon.com.ar';settings.EXTRA_SITE_URLS='https://www.disfrazcabezon.com.ar,https://dc-web-8ai4.onrender.com';
 tables.historial_cambios=[];
 if(enabled)settings.CATALOG_ROLES_ENABLED='yes';
 const writes=[];
 ctx.putDirect_=(table,obj)=>{writes.push(table);const rows=tables[table],i=rows.findIndex(r=>r.id===obj.id);if(i<0)rows.push(structuredClone(obj));else rows[i]=structuredClone(obj);return obj;};
 ctx.put_=h.writeHooks.put;
 ctx.removeDirect_=(table,id)=>{writes.push(table);const i=tables[table].findIndex(p=>p.id===id);if(i<0)throw new Error('Registro inexistente');tables[table].splice(i,1);};
 ctx.remove_=h.writeHooks.remove;
 ctx.lock_=fn=>fn();
 ctx.SpreadsheetApp={flush(){},openById:()=>({getSheetByName:name=>tables[name]?{}:null,insertSheet:name=>{tables[name]=[];return {appendRow(){},setFrozenRows(){}};}})};
 const admin=ctx.dispatch_({action:'login',username:settings.ADMIN_USER,password:settings.ADMIN_PASSWORD}).token;
 const password=crypto.randomBytes(24).toString('base64url');
 const categories=[{id:'d-primary',area:'disfraces',name:'Categoría de ensayo'},{id:'d-secondary',area:'disfraces',name:'Segunda categoría'},{id:'c-primary',area:'cotillon',name:'Otros',group:'COTILLÓN',storefront:true}];
 tables.categorias_disfraces=categories.filter(c=>c.area==='disfraces');tables.categorias_cotillon=categories.filter(c=>c.area==='cotillon');
 const image='https://res.cloudinary.com/demo/image/upload/catalogo-ensayo.jpg';
 const product={id:'ensayo-disfraz',area:'disfraces',name:'Producto de ensayo',description:'',mode:'ambos',saleCondition:'Nuevo Inmediato',price:1000,rentPrice:800,stock:4,active:true,image,thumbnail:'',categoryId:'d-primary',categoryIds:['d-primary','d-secondary'],category:'Categoría de ensayo',custom:{preserve:true}};
 tables.disfraces.push(product);tables.cotillon.push({...product,id:'ensayo-cotillon',area:'cotillon',mode:'venta',categoryId:'c-primary',categoryIds:['c-primary'],category:'Otros'});
 return {...h,admin,password,writes,product,loginEditor(){return ctx.dispatch_({action:'login',username:'editor-ensayo',password}).token;},createEditor(){return ctx.dispatch_({action:'createCatalogUser',token:admin,username:'editor-ensayo',password});},editorProduct(){return ctx.dispatch_({action:'admin',token:this.editor}).products.find(p=>p.id===product.id);}};
}
