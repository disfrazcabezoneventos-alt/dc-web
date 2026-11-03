/* SOLO ENSAYO, sin implementaciones. Usa la copia verificada y MAIL_MODE=disabled.
 * Requiere los 120 productos qa-product- del ensayo interrumpido y al menos 441
 * productos originales en esa copia. Nunca pegar en producción.
 */
function medirLoteEnsayo_(label,count,fn){
 const read=catalogBulkRead_,write=catalogBulkWrite_;
 const calls={areaReads:0,areaWrites:0};
 catalogBulkRead_=function(name){if(name==='disfraces')calls.areaReads++;return read(name);};
 catalogBulkWrite_=function(state,updates){if(state.name==='disfraces'&&updates.size)calls.areaWrites++;return write(state,updates);};
 // Solo se instrumentan helpers propios; el servicio de Google no se reemplaza.
 const start=Date.now();let result;
 try{result=fn();}finally{catalogBulkRead_=read;catalogBulkWrite_=write;}
 const ms=Date.now()-start,report={label,products:count,ms,areaReads:calls.areaReads,areaWrites:calls.areaWrites};
 console.log(JSON.stringify(report));need_(ms<60000,'El lote excedió 60 segundos.');
 need_(calls.areaReads===1&&calls.areaWrites===1,'El lote no usó una lectura/escritura del área.');return {report,result};
}
function ejecutarEnsayoLotes(){
 ensayoSheet_();need_(config_('MAIL_MODE')==='disabled','El correo del ensayo debe estar deshabilitado.');
 need_(!rows_('movimientos').some(m=>m.stockPending),'La copia tiene movimientos pendientes.');
 props_().setProperty('ADMIN_USER','admin-ensayo');props_().setProperty('CATALOG_ROLES_ENABLED','yes');props_().setProperty('COTILLON_DEPTH3_V1','ready');
 const token=Utilities.getUuid()+Utilities.getUuid(),cache=CacheService.getScriptCache(),key='session:'+hash_(token);
 cache.put(key,adminSessionVersion_(),600);
 const run=b=>lock_(()=>dispatch_({...b,token})),reports=[];
 try{
  const all=rows_('disfraces'),synthetic=all.filter(p=>String(p.id).startsWith('qa-product-'));
  need_(synthetic.length===120,'Se requieren los 120 productos sintéticos del ensayo previo.');
  const ids=new Set(synthetic.map(p=>p.id)),category=categories_('disfraces').find(c=>c.id===synthetic[0].categoryId);
  need_(category&&synthetic.every(p=>p.categoryId===category.id),'El lote previo no tiene una categoría única.');
  const missing=synthetic.filter(p=>p.category!==category.name).length;
  const previous=config_('PR32_BULK_RESUME_RESULT');
  need_(missing===29||missing===0&&previous,'Se esperaban las 29 fichas pendientes del ensayo anterior.');
  if(missing){
   const resume=medirLoteEnsayo_('reanudar29',29,()=>run({action:'saveCategory',area:'disfraces',id:category.id,name:category.name}));
   need_(rows_('disfraces').filter(p=>ids.has(p.id)&&p.category===category.name).length===120,'La reanudación no completó las 120 fichas.');
   props_().setProperty('PR32_BULK_RESUME_RESULT',JSON.stringify(resume.report));reports.push(resume.report);
  }else reports.push(JSON.parse(previous));
  const rename120=medirLoteEnsayo_('renombrar120',120,()=>run({action:'saveCategory',area:'disfraces',id:category.id,name:'ENSAYO lote 120 '+Utilities.getUuid().slice(0,8)}));
  need_(rows_('disfraces').filter(p=>ids.has(p.id)&&p.category===rename120.result.name).length===120,'Renombrado de 120 incompleto.');reports.push(rename120.report);

  // Los 441 originales se usan SOLO en la copia. La preparación también queda
  // en un diario compacto para poder deshacerla si se interrumpe el ensayo.
  const context=catalogBulkContext_('disfraces'),copyProducts=context.area.records.length,originals=context.area.records.filter(p=>!String(p.id).startsWith('qa-')).slice(0,441);
  need_(originals.length===441,'Se requieren al menos 441 productos originales en la copia.');
  const originalById=new Map(originals.map(p=>[p.id,JSON.stringify(p)]));
  const fixture={id:'qa-bulk-'+Utilities.getUuid(),area:'disfraces',name:'ENSAYO lote 441 '+Utilities.getUuid().slice(0,8)},actor=catalogIdentity_(token);
  const updates=new Map(originals.map(p=>[p.id,{...p,categoryId:fixture.id,category:fixture.name,categoryIds:[fixture.id,...productCategoryIds_(p)]}]));
  lock_(()=>catalogBulkChange_(context,actor,'disfraces','fixture_setup',fixture,updates,new Map([[fixture.id,fixture]])));
  const setupEntry=context.history.records.find(h=>h.categoryId===fixture.id&&h.kind==='fixture_setup');let renameEntry;
  try{
   const rename441=medirLoteEnsayo_('renombrar441',441,()=>run({action:'saveCategory',area:'disfraces',id:fixture.id,name:fixture.name+' nuevo'}));
   need_(rows_('disfraces').filter(p=>originalById.has(p.id)&&p.category===rename441.result.name).length===441,'Renombrado de 441 incompleto.');reports.push(rename441.report);
  }finally{
   renameEntry=rows_('historial_cambios').find(h=>h.categoryId===fixture.id&&h.kind==='rename');
   if(renameEntry)run({action:'recoverProductHistory',historyId:renameEntry.id,mode:'rollback'});
   run({action:'recoverProductHistory',historyId:setupEntry.id,mode:'rollback'});
  }
  need_(rows_('disfraces').filter(p=>originalById.has(p.id)&&JSON.stringify(p)===originalById.get(p.id)).length===441,'No se restauraron exactamente las 441 fichas de la copia.');

  const deletion=medirLoteEnsayo_('borrar120',120,()=>run({action:'deleteCategory',area:'disfraces',id:category.id,expectedCount:120,strategy:'uncategorized'}));
  need_(deletion.result.affected===120&&!categories_('disfraces').some(c=>c.id===category.id),'La categoría no se borró.');
  need_(rows_('disfraces').filter(p=>ids.has(p.id)&&!productCategoryIds_(p).includes(category.id)).length===120,'Borrado incompleto.');reports.push(deletion.report);
  const deletionEntry=rows_('historial_cambios').filter(h=>h.categoryId===category.id&&h.kind==='delete'&&h.status!=='rolled_back').at(-1);
  run({action:'recoverProductHistory',historyId:deletionEntry.id,mode:'rollback'});
  need_(rows_('disfraces').filter(p=>ids.has(p.id)&&p.categoryId===category.id&&p.category===rename120.result.name).length===120,'No se deshizo el borrado.');
  const result={reports,copyProducts,originalsRestored:441,deleteUndone:true,hashIterations:CATALOG_PBKDF2_ITERATIONS};
  props_().setProperty('PR32_BULK_RESULTS',JSON.stringify(result));console.log(JSON.stringify(result));return result;
 }finally{cache.remove(key);}
}
