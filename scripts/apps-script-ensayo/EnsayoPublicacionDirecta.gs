/* SOLO en el proyecto ENSAYO autorizado, sin despliegues. Nunca en producción.
 * Requiere EnsayoCategoria.gs, roles preparados y MAIL_MODE=disabled.
 * Crea y elimina únicamente fichas y una cuenta ficticias propias del ensayo.
 * Conserva los eventos de auditoría de esas operaciones en la copia.
 */
function ejecutarEnsayoPublicacionDirecta(){
 const ss=ensayoSheet_();need_(config_('MAIL_MODE')==='disabled','Deshabilitá el correo en la copia.');
 need_(!ScriptApp.getService().getUrl(),'El proyecto de ensayo no debe estar desplegado.');
 need_(catalogRolesReady_(),'Los roles deben estar preparados en la copia.');
 need_(config_('COTILLON_DEPTH3_V1')==='ready'&&!rows_('movimientos').some(m=>m.stockPending),'La copia tiene mantenimiento pendiente.');
 const props=props_(),propertiesSnapshot=()=>JSON.stringify(Object.entries(props.getProperties()).sort(([a],[b])=>a.localeCompare(b))),beforeProps=propertiesSnapshot(),cache=CacheService.getScriptCache();
 const originals=Object.fromEntries(CATEGORY_AREAS.map(area=>[area,hash_(JSON.stringify(rows_(area)))]));
 const categories=hash_(JSON.stringify(CATEGORY_AREAS.flatMap(categories_)));
 const adminToken=Utilities.getUuid()+Utilities.getUuid(),key='session:'+hash_(adminToken);
 cache.put(key,adminSessionVersion_(),600);
 const ids=[],started=Date.now();let user,editorToken;
 const run=(action,body={},token=editorToken)=>lock_(()=>dispatch_({action,...body,token}));
 const rejects=fn=>{let rejected=false;try{fn()}catch(_){rejected=true}need_(rejected,'Se aceptó una operación prohibida.');};
 let result;
 try{
  const username='qa-publicacion-'+Utilities.getUuid().slice(0,8),password=Utilities.getUuid()+Utilities.getUuid();
  user=run('createCatalogUser',{username,password},adminToken);
  editorToken=lock_(()=>dispatch_({action:'login',username,password})).token;
  for(const area of CATEGORY_AREAS){
   const source=rows_(area).find(p=>/^https:\/\/res\.cloudinary\.com\//.test(p.image||''));need_(source,'Falta una foto existente en la copia.');
   const input={area,name:'ENSAYO publicación directa',description:'',mode:area==='disfraces'?'alquiler':'venta',price:1,rentPrice:1,stock:0,active:true,publicationState:'published',image:source.image};
   for(const patch of [{stock:1},{image:''}])rejects(()=>run('saveProduct',{product:{...input,...patch}}));
   const directId=Utilities.getUuid();ids.push({area,id:directId});
   const direct=run('saveProduct',{product:input,operationId:directId});
   need_(direct.active&&direct.publicationState==='published'&&direct.stock===0,'Creación directa incorrecta.');
   const draftId=Utilities.getUuid();ids.push({area,id:draftId});
   const draft=run('saveProduct',{product:{...input,active:false,publicationState:'draft'},operationId:draftId});
   const visible=dispatch_({action:'catalogData'}).products;
   need_(visible.some(p=>p.id===direct.id)&&!visible.some(p=>p.id===draft.id),'Visibilidad incorrecta.');
   rejects(()=>run('publishProduct',{area,id:draft.id,revision:'vencida'}));
   rejects(()=>run('quickUpdate',{area,id:direct.id,cambios:{stock:99}}));
   const published=run('publishProduct',{area,id:draft.id,revision:hash_(JSON.stringify(rows_(area).find(p=>p.id===draft.id))),stock:99,image:''});
   need_(JSON.stringify(published)===JSON.stringify({...draft,active:true,publicationState:'published'}),'Publicar cambió otros datos.');
  }
  for(const action of ['deleteProduct','catalogUsers','productHistory','bankSettings','saveCategory','incomingForms','movement'])rejects(()=>run(action));
  const events=rows_('historial_cambios').filter(h=>h.actor.id===user.id);
  need_(events.length===6&&events.every(h=>h.status==='committed'),'Auditoría incompleta.');
  result={ok:true,areas:2,createdPublished:2,publishedDrafts:2,committedEditorEvents:6,restrictedActionsRejected:true};
 }finally{
  try{for(const p of ids)if(rows_(p.area).some(row=>row.id===p.id))run('deleteProduct',p,adminToken);}
  finally{if(user)props.deleteProperty('CATALOG_USER_'+user.id);if(editorToken)cache.remove('session:'+hash_(editorToken));cache.remove(key);}
 }
 need_(CATEGORY_AREAS.every(area=>hash_(JSON.stringify(rows_(area)))===originals[area]),'Cambió algún producto original de la copia.');
 need_(hash_(JSON.stringify(CATEGORY_AREAS.flatMap(categories_)))===categories,'Cambiaron categorías.');
 need_(propertiesSnapshot()===beforeProps,'Cambiaron propiedades del ensayo.');
 result.originalProductsUnchanged=true;result.categoriesUnchanged=true;result.accountsUnchanged=true;result.ms=Date.now()-started;
 console.log(JSON.stringify(result));return result;
}
