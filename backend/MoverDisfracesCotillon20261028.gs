/* Movimiento controlado Cotillón -> Disfraces. Se pega como archivo .gs separado.
 * Ninguna función de este módulo es una API web. Ejecutar manualmente desde Apps Script.
 */
const MOVER28_FILE='backend/mover-disfraces-cotillon-2026-10-28.json';
const MOVER28_SHA256='d95bb41f8423400c9b7e66ab4cdff32ec537452a80c1d303726f644f151174b1';
const MOVER28_BRANCH='codex/mover-disfraces-cotillon-20261028';
const MOVER28_BATCH='mover-disfraces-cotillon-2026-10-28';
const MOVER28_TEST_IDS=['bb202e08-8358-46da-b5cb-5d4f57980303','af47db49-984f-46bd-b7f8-3d831e89e828','898a77f0-b030-441d-bd48-27fb0dece9d4','62bc26b2-6533-4d4d-8adb-be01d01b72bd','e147abcd-cc6a-46ee-857f-95f41acf74d6'];

function mover28Fuente_(mode){
 const base='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/';
 let response;
 for(const ref of mode==='test'?[MOVER28_BRANCH,'main']:['main']){
  response=UrlFetchApp.fetch(base+ref+'/'+MOVER28_FILE,{muteHttpExceptions:true,followRedirects:true});
  if(response.getResponseCode()===200)break;
 }
 need_(response.getResponseCode()===200,'No se pudo leer el manifiesto. No se escribió nada.');
 const raw=response.getContentText('UTF-8');
 need_(hash_(raw)===MOVER28_SHA256,'El SHA-256 del manifiesto no coincide. No se escribió nada.');
 const data=JSON.parse(raw),seen=new Set(),allowed=new Set(['Niños','Hombres','Mujeres','Personajes','Profesiones','Superheroes y Princesas','Halloween','Históricos','Otros']);
 need_(data.version===1&&data.batch===MOVER28_BATCH&&data.moves?.length===105&&data.review?.length===12,'Manifiesto incompleto.');
 let children=0,adults=0;
 data.moves.forEach(m=>{
  need_(/^excel-\d+$/.test(m.id)&&m.id==='excel-'+m.sourceId&&!seen.has(m.id),'ID inválido o duplicado.');seen.add(m.id);
  need_(typeof m.name==='string'&&m.name.length>0&&m.name.length<=150&&allowed.has(m.category),'Nombre o categoría inválidos.');
  need_(Number.isFinite(m.priceBefore)&&m.priceBefore>=0&&Number.isFinite(m.priceCorrect)&&m.priceCorrect>0&&/^[a-f0-9]{64}$/.test(m.sourceSha256),'Precio o hash inválido.');
  if(m.destination==='niño'){need_(m.category==='Niños','Destino niño inconsistente.');children++;}
  else {need_(m.destination==='adulto'&&m.category!=='Niños','Destino adulto inconsistente.');adults++;}
 });
 data.review.forEach(r=>{need_(/^excel-\d+$/.test(r.id)&&!seen.has(r.id),'ID de revisión inválido.');seen.add(r.id);});
 need_(children===74&&adults===31&&seen.size===117,'Conteos del CSV corregido inconsistentes.');
 return data;
}
function mover28Id_(mode){
 const id=mode==='test'?config_('MOVER28_COPIA_ID'):config_('SPREADSHEET_ID');
 need_(id&&id!==''&&id!==undefined,'Falta el ID de la planilla.');
 if(mode==='test')need_(id!==config_('SPREADSHEET_ID'),'La copia apunta a producción.');
 return id;
}
function mover28Hoja_(ss,name){const s=ss.getSheetByName(name);need_(s,'Falta la pestaña '+name);return s;}
function mover28Filas_(s){
 if(s.getLastRow()<2)return [];
 return s.getRange(2,1,s.getLastRow()-1,2).getValues().map((cells,i)=>{
  const p=JSON.parse(cells[1]);need_(p.id===cells[0],'ID inconsistente en '+s.getName()+' fila '+(i+2));
  return {row:i+2,id:cells[0],raw:cells[1],product:p};
 });
}
function mover28Referencias_(ss,ids){
 const found=[];
 ['reservas','movimientos'].forEach(name=>mover28Filas_(mover28Hoja_(ss,name)).forEach(item=>{
  const matches=[];
  const walk=value=>{if(typeof value==='string'&&ids.has(value))matches.push(value);else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.keys(value).forEach(k=>walk(value[k]));};
  walk(item.product);
  if(matches.length)found.push({pestana:name,fila:item.row,ids:[...new Set(matches)]});
 }));
 return found;
}
function mover28Plan_(mode){
 const id=mover28Id_(mode),ss=SpreadsheetApp.openById(id),data=mover28Fuente_(mode);
 const cot=mover28Hoja_(ss,'cotillon'),dis=mover28Hoja_(ss,'disfraces'),cat=mover28Hoja_(ss,'categorias_disfraces');
 const source=mover28Filas_(cot),target=mover28Filas_(dis),cats=mover28Filas_(cat);
 const bySource=new Map(source.map(r=>[r.id,r])),byTarget=new Map(target.map(r=>[r.id,r]));
 need_(bySource.size===source.length&&byTarget.size===target.length,'Hay IDs duplicados en las pestañas.');
 const categoryByName=new Map(cats.map(r=>[r.product.name,r.product]));
 const names=new Set(cats.map(r=>categoryKey_(r.product.name)));
 need_(names.size===cats.length,'Hay nombres de categoría duplicados.');
 need_(cats.every(r=>r.product.area==='disfraces'),'Hay una categoría de otra área en categorias_disfraces.');
 const sourceIds=new Map();
 target.forEach(r=>{if(r.product.sourceId){need_(!sourceIds.has(r.product.sourceId),'ID de origen duplicado en Disfraces.');sourceIds.set(r.product.sourceId,r.id);}});
 data.moves.forEach(m=>need_(m.category==='Niños'||categoryByName.has(m.category),'Falta la categoría '+m.category));
 const ids=new Set(data.moves.map(m=>m.id)),references=mover28Referencias_(ss,ids);
 const conflicts=[],pending=[],both=[],done=[];
 data.review.forEach(r=>{if(!bySource.has(r.id)||byTarget.has(r.id))conflicts.push('REVISAR cambió de hoja: '+r.id);});
 data.moves.forEach(m=>{
  const a=bySource.get(m.id),b=byTarget.get(m.id),category=categoryByName.get(m.category);
  if(!a&&!b){conflicts.push('Falta en ambas hojas: '+m.id);return;}
  if(sourceIds.has(m.sourceId)&&sourceIds.get(m.sourceId)!==m.id)conflicts.push('ID de origen ya usado en Disfraces: '+m.id);
  if(a){
   if(hash_(a.raw)!==m.sourceSha256)conflicts.push('Editado después de la auditoría: '+m.id);
   if(a.product.sourceId!==m.sourceId||a.product.name!==m.name||a.product.area!=='cotillon'||a.product.mode!=='venta'||a.product.price!==m.priceBefore)conflicts.push('Fuente inconsistente: '+m.id);
  }
  if(b){
   const p=b.product;
   if(p.sourceId!==m.sourceId||p.name!==m.name||p.area!=='disfraces'||p.category!==m.category||p.price!==m.priceCorrect||category&&p.categoryId!==category.id)conflicts.push('Destino en conflicto: '+m.id);
   else if(a){const expected=mover28Transformar_(a.product,m,category);if(JSON.stringify(expected)!==b.raw)conflicts.push('Destino editado durante el movimiento: '+m.id);}
  }
  if(a&&b)both.push(m);else if(a)pending.push(m);else done.push(m);
 });
 const summary={planilla:id,porMover:pending.length,interrumpidos:both.length,yaMovidos:done.length,enRevision:data.review.length,referencias:references,conflictos:conflicts,categoriaNinos:!!categoryByName.get('Niños')};
 return {ss,cot,dis,cat,data,bySource,byTarget,categoryByName,summary,pending,both};
}
function mover28Transformar_(p,m,category){
 need_(category,'No existe la categoría '+m.category);
 return {...p,area:'disfraces',categoryId:category.id,categoryIds:[category.id],category:category.name,catalogGroups:[],price:m.priceCorrect};
}
function previsualizarMovimientoDisfracesCopia(){const result=mover28Plan_('test').summary;console.log(JSON.stringify(result));return result;}
function previsualizarMovimientoDisfracesProduccion(){const result=mover28Plan_('production').summary;console.log(JSON.stringify(result));return result;}
function mover28Respaldar_(plan,mode){
 const key='MOVER28_RESPALDO_'+mode.toUpperCase(),saved=config_(key),prefix='mover28_'+mode+'_';
 if(saved){const names=JSON.parse(saved);['cotillon','disfraces','categorias_disfraces'].forEach(n=>need_(plan.ss.getSheetByName(names[n]),'Falta el respaldo '+names[n]));return names;}
 ['cotillon','disfraces','categorias_disfraces'].forEach(n=>need_(!plan.ss.getSheetByName(prefix+n),'Ya existe un respaldo parcial: '+n+'. Revisalo antes de continuar.'));
 const names={};['cotillon','disfraces','categorias_disfraces'].forEach(n=>{names[n]=prefix+n;mover28Hoja_(plan.ss,n).copyTo(plan.ss).setName(names[n]);});
 SpreadsheetApp.flush();props_().setProperty(key,JSON.stringify(names));return names;
}
function mover28Ejecutar_(mode){return lock_(()=>{
 const plan=mover28Plan_(mode),s=plan.summary;
 need_(!s.referencias.length,'Hay reservas o movimientos que referencian productos; revisar antes de mover. '+JSON.stringify(s.referencias).slice(0,500));
 need_(!s.conflictos.length,'Hay conflictos; no se escribió nada: '+s.conflictos.slice(0,5).join('; '));
 if(mode==='production'){
  need_(config_('MOVER28_APROBADO_SHA256')===MOVER28_SHA256,'Falta aprobación explícita para este manifiesto.');
  const manual=mover28Filas_(plan.dis);need_(!manual.some(r=>MOVER28_TEST_IDS.includes(r.id)),'Primero deben retirarse las cinco fichas de prueba de Disfraces.');
 }
 const chosen=[...plan.both,...plan.pending].slice(0,15);
 if(!chosen.length){console.log(JSON.stringify(s));return s;}
 const backup=mover28Respaldar_(plan,mode);
 if(chosen.some(m=>m.category==='Niños')&&!plan.categoryByName.has('Niños')){
  const created={id:Utilities.getUuid(),area:'disfraces',name:'Niños'};
  plan.cat.getRange(plan.cat.getLastRow()+1,1,1,2).setValues([[created.id,JSON.stringify(created)]]);
  SpreadsheetApp.flush();plan.categoryByName.set('Niños',created);
 }
 const additions=[],deletions=[];let recovered=0;
 chosen.forEach(m=>{
  const source=plan.bySource.get(m.id),target=plan.byTarget.get(m.id);
  need_(source,'Falta la fuente '+m.id);
  const product=mover28Transformar_(source.product,m,plan.categoryByName.get(m.category));
  const raw=JSON.stringify(product);
  if(target){need_(target.raw===raw,'Destino editado: '+m.id);recovered++;}
  else additions.push([m.id,raw]);
  deletions.push(source.row);
 });
 if(additions.length){plan.dis.getRange(plan.dis.getLastRow()+1,1,additions.length,2).setValues(additions);SpreadsheetApp.flush();}
 deletions.sort((a,b)=>b-a).forEach(row=>plan.cot.deleteRow(row));SpreadsheetApp.flush();
 const result={procesados:chosen.length,movidosNuevos:additions.length,reanudados:recovered,pendientes:105-s.yaMovidos-chosen.length,respaldo:backup};console.log(JSON.stringify(result));return result;
});}
function probarLoteMovimientoDisfracesCopia(){return mover28Ejecutar_('test');}
function aplicarLoteMovimientoDisfracesProduccion(){return mover28Ejecutar_('production');}
