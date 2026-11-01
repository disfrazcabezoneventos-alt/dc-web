// Offline Apps Script adapter. Inputs must be read back from the private copy.
// Persist the output through the connected Sheets tools ONLY to that verified copy.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {catalogHarness} from '../tests/catalog-access-harness.mjs';
const [categoriesFile,baselineFile,outputFile]=process.argv.slice(2);
if(!categoriesFile||!baselineFile||!outputFile)throw Error('Uso: node scripts/test-catalog-copy.mjs categorias.json lectura-copia.json salida-privada.json');
const categories=JSON.parse(await fs.readFile(categoriesFile,'utf8')).categories,baseline=JSON.parse(await fs.readFile(baselineFile,'utf8'));
const h=catalogHarness();
Object.assign(h.tables,structuredClone(categories),structuredClone(baseline));
assert.ok(['disfraces','cotillon'].every(a=>h.tables[a].every(p=>p.id.startsWith('qa-roles-')&&p.name.startsWith('ENSAYO'))),'Solo se permite ensayar sobre filas sintéticas identificadas.');
h.createEditor();const token=h.loginEditor();
for(const area of ['disfraces','cotillon']){
 const original=h.tables[area][0],product=h.ctx.dispatch_({action:'admin',token}).products.find(p=>p.id===original.id);
 const edited=h.ctx.dispatch_({action:'saveProduct',token,product:{...product,description:'',name:original.name+' - EDITADO',price:1500},operationId:crypto.randomUUID()});
 assert.deepEqual([...edited.categoryIds],original.categoryIds);assert.equal(edited.stock,original.stock);
 h.ctx.dispatch_({action:'quickUpdate',token,area,id:original.id,cambios:{active:false},operationId:crypto.randomUUID()});
 h.ctx.dispatch_({action:'quickUpdate',token,area,id:original.id,cambios:{active:true},operationId:crypto.randomUUID()});
 const updated=h.ctx.dispatch_({action:'admin',token}).products.find(p=>p.id===original.id);
 h.ctx.dispatch_({action:'saveProduct',token,product:{...updated,image:'https://res.cloudinary.com/demo/image/upload/foto-nueva-ensayo.jpg'},operationId:crypto.randomUUID()});
 const event=h.tables.historial_cambios.at(-1);
 h.ctx.dispatch_({action:'restoreProductPhoto',token:h.admin,area,id:original.id,historyId:event.id,revision:h.ctx.hash_(JSON.stringify(h.tables[area][0])),operationId:crypto.randomUUID()});
 assert.equal(h.tables[area][0].image,original.image);
 const draft=h.ctx.dispatch_({action:'saveProduct',token,product:{area,name:'ENSAYO BORRADOR - NO PUBLICAR EN PRODUCCION',description:'',mode:'venta',price:2000,rentPrice:0,stock:0,active:false,image:original.image,categoryId:original.categoryId,categoryIds:original.categoryIds},operationId:crypto.randomUUID()});
 assert.ok(!h.ctx.dispatch_({action:'catalogData'}).products.some(p=>p.id===draft.id));
 h.ctx.dispatch_({action:'publishProduct',token:h.admin,area,id:draft.id,revision:h.ctx.hash_(JSON.stringify(h.tables[area][1])),operationId:crypto.randomUUID()});
}
const before=JSON.stringify(h.tables);for(const action of ['movement','bankSettings','publishProduct','deleteProduct','createCatalogUser','productHistory','incomingForms','status','saveCategory'])assert.throws(()=>h.ctx.dispatch_({action,token}),/permiso/);assert.equal(JSON.stringify(h.tables),before);
await fs.writeFile(outputFile,JSON.stringify({products:{disfraces:h.tables.disfraces,cotillon:h.tables.cotillon},history:h.tables.historial_cambios,report:{fixtureProducts:4,auditEvents:h.tables.historial_cambios.length,forbiddenRequestsRejected:9,originalRowsTouched:0,execution:'Node VM with Apps Script services adapted; Sheet persistence verified separately'}},null,2));
console.log('Ensayo con filas leídas de la copia: 4 productos ficticios, '+h.tables.historial_cambios.length+' eventos; permisos, categorías, descripción, fotos y borradores verificados.');
