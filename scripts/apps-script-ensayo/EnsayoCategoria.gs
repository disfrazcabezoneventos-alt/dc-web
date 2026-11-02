/* SOLO en proyecto de ENSAYO sin despliegues. Nunca instalar en producción.
 * Copiar junto con Code.gs, CatalogAccess.gs, AuthCrypto.gs y Validation.gs.
 * Configurar SPREADSHEET_ID de la copia y PR32_ENSAYO=yes en ese proyecto.
 */
function ensayoSheet_(){
 need_(config_('PR32_ENSAYO')==='yes','Falta PR32_ENSAYO=yes en el proyecto de ensayo.');
 const ss=SpreadsheetApp.openById(config_('SPREADSHEET_ID'));
 need_(ss.getName().startsWith('ENSAYO '),'Solo se admite una copia identificada como ENSAYO.');return ss;
}
function ejecutarEnsayoCategoria(){
 const ss=ensayoSheet_();need_(!rows_('movimientos').some(m=>m.stockPending),'La copia tiene movimientos pendientes: no ejecutar mantenimiento sobre ellos.');
 const props=props_();props.setProperty('ADMIN_USER','admin-ensayo');props.setProperty('CATALOG_ROLES_ENABLED','yes');props.setProperty('COTILLON_DEPTH3_V1','ready');
 if(!ss.getSheetByName('historial_cambios'))ss.insertSheet('historial_cambios').appendRow(['id','registro_json']);
 const category={id:'qa-category-'+Utilities.getUuid(),area:'disfraces',name:'ENSAYO categoría '+Utilities.getUuid().slice(0,8)};
 putDirect_('categorias_disfraces',category);
 const count=120,ids=new Set(),fixtures=Array.from({length:count},(_,i)=>{
  const p={id:'qa-product-'+Utilities.getUuid(),area:'disfraces',name:'ENSAYO producto '+i,description:'',categoryId:category.id,categoryIds:[category.id],category:category.name,mode:'alquiler',price:0,rentPrice:1,stock:1,active:false,image:'',publicationState:'draft'};
  ids.add(p.id);return [p.id,JSON.stringify(p)];
 });
 const sheet=sheet_('disfraces');sheet.getRange(sheet.getLastRow()+1,1,count,2).setValues(fixtures);SpreadsheetApp.flush();
 const token=Utilities.getUuid()+Utilities.getUuid(),cache=CacheService.getScriptCache(),key='session:'+hash_(token);
 cache.put(key,adminSessionVersion_(),600);
 const originalWrite=catalogBulkWrite_,writes={products:0,history:0,categories:0};
 catalogBulkWrite_=function(state,updates){if(updates.size){if(state.name==='disfraces')writes.products++;if(state.name==='historial_cambios')writes.history++;if(state.name==='categorias_disfraces')writes.categories++;}return originalWrite(state,updates)};
 let ms;
 try{const start=Date.now();lock_(()=>dispatch_({action:'saveCategory',token,area:'disfraces',id:category.id,name:category.name+' renombrada'}));ms=Date.now()-start;}
 finally{catalogBulkWrite_=originalWrite;cache.remove(key);}
 const events=rows_('historial_cambios').filter(h=>h.action==='category_bulk'&&h.products.some(p=>ids.has(p.id)));
 need_(events.flatMap(h=>h.products).length===count&&events.every(h=>h.status==='committed'),'El historial no quedó completo. Revisar el ensayo.');
 need_(rows_('disfraces').filter(p=>ids.has(p.id)&&p.category===category.name+' renombrada').length===count,'Renombrado incompleto.');
 const result={products:count,ms,committedEvents:events.length,historyProducts:events.flatMap(h=>h.products).length,writes};
 props.setProperty('PR32_CATEGORY_RESULT',JSON.stringify(result));console.log(JSON.stringify(result));return result;
}
function ejecutarProbarActivador(){
 ensayoSheet_();need_(!config_('PR32_TRIGGER_ID'),'La prueba de activador ya está preparada.');
 const t=ScriptApp.newTrigger('verificarActivadorPrivado_').timeBased().after(60000).create();
 props_().setProperty('PR32_TRIGGER_ID',t.getUniqueId());return {scheduled:true};
}
function verificarActivadorPrivado_(event){
 ensayoSheet_();need_(event&&String(event.triggerUid)===config_('PR32_TRIGGER_ID'),'Solo el disparador de ensayo puede confirmar esta prueba.');
 props_().setProperty('PR32_PRIVATE_TRIGGER_OK',now_());console.log('Activador privado de ensayo ejecutado.');
}
