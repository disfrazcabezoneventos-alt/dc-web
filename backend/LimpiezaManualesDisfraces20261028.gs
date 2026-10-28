/* Añadir como archivo NUEVO. Depende de Code.gs y DisfracesIncremental20261028.gs,
 * sin modificarlos. Requiere el servicio avanzado Google Sheets API.
 * Ninguna función se ejecuta automáticamente ni desde doGet/doPost.
 */
const LM28_BRANCH='codex/limpieza-manuales-disfraces-20261028';
const LM28_FILE='backend/limpieza-manuales-disfraces-2026-10-28.json';
const LM28_SHA256='f03c991454f29e2a3b852a965eae8e2fd4f8b9bd15069efc7df0622cee27ca21';
const LM28_BATCH='limpieza-manuales-disfraces-2026-10-28';

function lm28Source_(mode){
 const ref=mode==='test'?LM28_BRANCH:'main';
 const root='https://raw.githubusercontent.com/disfrazcabezoneventos-alt/dc-web/'+ref+'/';
 const response=UrlFetchApp.fetch(root+LM28_FILE,{muteHttpExceptions:true});
 need_(response.getResponseCode()===200,'No se pudo leer el plan.');
 const raw=response.getContentText('UTF-8');
 need_(hash_(raw)===LM28_SHA256,'Cambió el SHA-256 del plan.');
 const source=JSON.parse(raw),original=disfraces28Source_('production');
 need_(source.version===1&&source.batch===LM28_BATCH&&source.sourceSha256===DISFRACES_20261028_SHA256,'Plan incompatible.');
 need_(source.delete.length===5&&new Set(source.delete.map(p=>p.id)).size===5,'Bajas inválidas.');
 need_(source.add.length===2&&source.add[0].sourceId==='154'&&source.add[1].sourceId==='427','Altas inválidas.');
 source.add.forEach(p=>need_(JSON.stringify(p)===JSON.stringify(original.products.find(x=>x.sourceId===p.sourceId)),'El alta difiere del PR #11.'));
 return {source,root};
}
function lm28Sheet_(ss,name){const s=ss.getSheetByName(name);need_(s,'Falta la pestaña '+name);return s;}
function lm28Rows_(ss,name){
 const sheet=lm28Sheet_(ss,name),count=sheet.getLastRow();
 need_(count>=1,'Falta el encabezado de '+name);
 const values=sheet.getRange(1,1,count,Math.max(2,sheet.getLastColumn())).getValues();
 need_(values[0][0]==='id'&&values[0][1]==='registro_json','Encabezado inesperado en '+name);
 const ids=new Set();
 const rows=values.slice(1).map((cells,index)=>{
  need_(cells[0]&&typeof cells[1]==='string','Fila vacía o inválida en '+name);
  const product=JSON.parse(cells[1]);
  need_(product.id===cells[0]&&!ids.has(product.id),'ID inconsistente o duplicado en '+name);ids.add(product.id);
  return {row:index+2,cells,product};
 });
 return {sheet,values,rows,digest:hash_(JSON.stringify(values))};
}
function lm28Audit_(ss,source){
 const names=source.delete.map(p=>categoryKey_(p.name));
 const ids=source.delete.map(p=>p.id.toLowerCase());
 const hits=[];
 ['reservas','movimientos','cancelaciones'].forEach(name=>{
  const table=lm28Rows_(ss,name);
  table.rows.forEach(({row,cells,product:p})=>{
   const text=categoryKey_(JSON.stringify(cells));
   const byId=ids.some(id=>text.includes(id));
   const byName=names.some(n=>new RegExp('(^|[^a-z0-9])'+n+'($|[^a-z0-9])').test(text));
   if(byId||byName)hits.push({tab:name,row,id:p.id,code:p.code||'',status:p.status||'',pickupDate:p.data?.pickupDate||'',returnDate:p.data?.returnDate||'',byId,byName});
  });
 });
 // No se infiere que una referencia sea de prueba por su nombre o estado.
 // Ante CUALQUIER referencia, se exige revisión humana y se frena.
 return hits;
}
function lm28Product_(p,categories){
 const selected=p.categories.map(slug=>DISFRACES_20261028_CATEGORY[slug]).filter(Boolean);
 const linked=selected.map(name=>categories.find(c=>c.area==='disfraces'&&c.name===name));
 need_(linked.every(Boolean),'Falta una categoría del catálogo.');
 const categoryIds=[...new Set(linked.map(c=>c.id))];
 return {id:'catalogo-disfraz-'+p.sourceId,area:'disfraces',sourceId:p.sourceId,name:p.name,
  description:'',categoryId:categoryIds[0]||'',categoryIds,category:selected[0]||'',originalCategories:p.categories,
  mode:'alquiler',price:0,rentPrice:p.rentPrice,insuranceDeposit:p.insurance,tariff:p.tariff,stock:p.stock,
  image:'',thumbnail:'',active:false,photoWidth:p.photoWidth,photoReview:'Pendiente',sourcePhotoPath:p.photoPath,
  photoStatus:p.sourceId==='427'?'pendiente de foto nueva':'pendiente de carga',
  importBatch:LM28_BATCH,importBaseline:{name:p.name,rentPrice:p.rentPrice,stock:p.stock,categoryIds,active:false}};
}
function lm28Plan_(ss,source){
 const table=lm28Rows_(ss,'disfraces'),hits=lm28Audit_(ss,source);
 need_(!hits.length,'Hay referencias; frenar y revisar: '+JSON.stringify(hits));
 const categories=lm28Rows_(ss,'categorias_disfraces').rows.map(r=>r.product);
 const products=source.add.map(p=>lm28Product_(p,categories));
 const manual=table.rows.filter(r=>source.delete.some(p=>p.id===r.product.id));
 const existing=table.rows.filter(r=>products.some(p=>p.id===r.product.id||p.sourceId===r.product.sourceId));
 if(!manual.length&&existing.length===2){
  products.forEach(p=>{
   const found=existing.find(r=>r.product.id===p.id)?.product;
   need_(found&&found.importBatch===LM28_BATCH&&found.name===p.name&&found.stock===p.stock&&found.rentPrice===p.rentPrice&&found.insuranceDeposit===p.insuranceDeposit,'Alta existente modificada; revisar.');
   need_(p.sourceId!=='427'||(!found.active&&!found.image&&!found.thumbnail),'Woody debe seguir pendiente de foto nueva.');
  });
  return {...table,products,manual,done:true};
 }
 need_(manual.length===5&&!existing.length,'Estado parcial o altas preexistentes: frenar y revisar.');
 source.delete.forEach((p,index)=>{
  const row=manual.find(r=>r.product.id===p.id);
  need_(row.row===index+2&&row.product.name===p.name&&hash_(row.cells[1])===p.recordSha256,'Cambió una de las cinco fichas manuales.');
 });
 // No eliminar otros productos con nombres parecidos ni convertir referencias.
 products.forEach(p=>need_(!table.rows.some(r=>!manual.includes(r)&&categoryKey_(r.product.name)===categoryKey_(p.name)),'Ya existe otra ficha con ese nombre.'));
 return {...table,products,manual,done:false};
}
function lm28Requests_(plan,products){
 const sheetId=plan.sheet.getSheetId();
 return [{appendCells:{sheetId,rows:products.map(p=>({values:[{userEnteredValue:{stringValue:p.id}},{userEnteredValue:{stringValue:JSON.stringify(p)}}]})),fields:'userEnteredValue'}},
  ...plan.manual.slice().sort((a,b)=>b.row-a.row).map(r=>({deleteDimension:{range:{sheetId,dimension:'ROWS',startIndex:r.row-1,endIndex:r.row}}}))];
}
function lm28Backup_(ss,mode,plan){
 const name='disfraces_respaldo_limpieza_20261028_'+mode;
 let backup=ss.getSheetByName(name);
 if(!backup)backup=plan.sheet.copyTo(ss).setName(name);
 SpreadsheetApp.flush();
 const saved=lm28Rows_(ss,name);
 need_(saved.digest===plan.digest,'El respaldo no coincide exactamente con disfraces. No se aplica nada.');
 return name;
}
function lm28Target_(mode){
 const production=config_('SPREADSHEET_ID'),id=mode==='test'?config_('LM28_TEST_ID'):production;
 need_(id&&production,'Faltan IDs de hoja.');
 if(mode==='test')need_(id!==production,'La copia apunta a producción.');
 else need_(mode==='production'&&config_('LM28_APPROVED')===LM28_SHA256&&config_('LM28_COPY_PASSED')===LM28_SHA256,'Falta OK explícito y ensayo aprobado para este SHA-256.');
 return SpreadsheetApp.openById(id);
}
function lm28Preview_(mode){
 const ss=lm28Target_(mode),{source}=lm28Source_(mode),plan=lm28Plan_(ss,source);
 const result={estado:plan.done?'ya aplicado':'pendiente',bajas:plan.manual.map(r=>({id:r.product.id,nombre:r.product.name})),altas:plan.products.map(p=>({id:p.id,nombre:p.name,stock:p.stock,alquiler:p.rentPrice,seguro:p.insuranceDeposit})),referencias:0};
 console.log(JSON.stringify(result));return result;
}
function lm28Apply_(mode){return lock_(()=>{
 const ss=lm28Target_(mode),{source,root}=lm28Source_(mode),plan=lm28Plan_(ss,source);
 if(plan.done)return {estado:'ya aplicado',bajas:0,altas:0};
 const response=UrlFetchApp.fetch(root+'backend/manual-cleanup-assets/154-scream.jpg',{muteHttpExceptions:true});
 need_(response.getResponseCode()===200,'No se pudo leer la foto original de Scream.');
 const blob=response.getBlob().setName(source.add[0].photoPath);
 need_(hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,blob.getBytes()))===source.add[0].photoSha256,'Cambió la foto de Scream.');
 const backup=lm28Backup_(ss,mode,plan);
 const products=plan.products.map(p=>({...p}));
 if(mode==='production'){
  // Reutiliza la subida firmada y miniatura del PR #11. Nunca la foto manual.
  const photo=disfraces28Photo_({...source.add[0],photoBatch:'replacement'},new Map([['replacement',[blob]]]));
  products[0]={...products[0],...photo,active:true,photoStatus:'cargada del catálogo'};
 }
 // Nueva lectura después de respaldo y subida; evitar aplicar sobre un estado que cambió.
 const fresh=lm28Plan_(ss,source);
 need_(fresh.digest===plan.digest,'La hoja cambió durante la preparación; frenar.');
 // Batch atómico: cinco borrados físicos y dos altas, o ninguna modificación.
 Sheets.Spreadsheets.batchUpdate({requests:lm28Requests_(fresh,products)},ss.getId());
 SpreadsheetApp.flush();
 const after=lm28Plan_(ss,source);need_(after.done,'No se verificó el resultado.');
 if(mode==='test')props_().setProperty('LM28_COPY_PASSED',LM28_SHA256);
 const result={estado:'aplicado',bajas:5,altas:2,respaldo:backup,Scream:mode==='test'?'inactivo: ensayo sin Cloudinary':'activo',Woody:'inactivo: pendiente de foto nueva'};
 console.log(JSON.stringify(result));return result;
});}
function previsualizarLimpiezaManuales28Copia(){return lm28Preview_('test');}
function probarLimpiezaManuales28Copia(){return lm28Apply_('test');}
function previsualizarLimpiezaManuales28Produccion(){return lm28Preview_('production');}
function aplicarLimpiezaManuales28Produccion(){return lm28Apply_('production');}
