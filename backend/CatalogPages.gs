/* Solo instalación manual tras revisar el PR. URL del hook en Script Properties. */
function markCatalogPagesDirty_(){props_().setProperty('CATALOG_PAGES_DIRTY_REVISION',Utilities.getUuid());}
function prepararPaginasCatalogo_(){
 need_(/^https:\/\/api\.render\.com\/deploy\/srv-[a-z0-9]+\?key=[a-z0-9_-]+$/i.test(config_('RENDER_CATALOG_DEPLOY_HOOK')),'Configurá el deploy hook privado de Render.');
 const name='rebuildCatalogPagesNightly_';
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()===name))ScriptApp.newTrigger(name).timeBased().atHour(3).nearMinute(0).everyDays(1).inTimezone('America/Argentina/Buenos_Aires').create();
 return {ready:true,timeZone:'America/Argentina/Buenos_Aires',hour:3};
}
function rebuildCatalogPagesNightly_(){
 const lock=LockService.getScriptLock();need_(lock.tryLock(30000),'No se pudo coordinar la actualización del catálogo.');
 let revision,day,hook;
 try{
  const p=props_();revision=config_('CATALOG_PAGES_DIRTY_REVISION');day=Utilities.formatDate(new Date(),'America/Argentina/Buenos_Aires','yyyy-MM-dd');
  if(!revision||revision===config_('CATALOG_PAGES_LAST_TRIGGERED_REVISION')||config_('CATALOG_PAGES_LAST_TRIGGERED_DAY')===day)return {triggered:false};
  const claim=Number(config_('CATALOG_PAGES_INFLIGHT_AT'));if(claim&&Date.now()-claim<600000)return {triggered:false};
  hook=config_('RENDER_CATALOG_DEPLOY_HOOK');need_(/^https:\/\/api\.render\.com\/deploy\/srv-[a-z0-9]+\?key=[a-z0-9_-]+$/i.test(hook),'Falta configurar el deploy hook privado.');
  p.setProperty('CATALOG_PAGES_INFLIGHT_AT',String(Date.now()));
 }finally{lock.releaseLock();}
 try{
  const response=UrlFetchApp.fetch(hook,{method:'post',muteHttpExceptions:true,followRedirects:false}),status=response.getResponseCode();
  need_(status>=200&&status<300,'Render no aceptó el build del catálogo (HTTP '+status+').');
  need_(lock.tryLock(30000),'Falta registrar la actualización.');try{props_().setProperty('CATALOG_PAGES_LAST_TRIGGERED_REVISION',revision);props_().setProperty('CATALOG_PAGES_LAST_TRIGGERED_DAY',day);}finally{lock.releaseLock();}
  return {triggered:true};
 }catch(_){throw new Error('No se pudo solicitar el build a Render. Revisá el hook y reintentá; los cambios siguen pendientes.');}
 finally{props_().deleteProperty('CATALOG_PAGES_INFLIGHT_AT');}
}
function reintentarPaginasCatalogo_(){props_().deleteProperty('CATALOG_PAGES_LAST_TRIGGERED_DAY');markCatalogPagesDirty_();return rebuildCatalogPagesNightly_();}
