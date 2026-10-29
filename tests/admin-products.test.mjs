import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const exports={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/admin-products.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(exports);
const {filterAdminProducts,emptyAdminFilters,adminPrimaryCategory,parseQuickNumber,ADMIN_PAGE_SIZE}=exports;
const categories=[{id:'n',area:'disfraces',name:'Niños'},{id:'h',area:'disfraces',name:'Halloween'},{id:'party',area:'cotillon',name:'Fiestas',group:'COTILLÓN'},{id:'mask',area:'cotillon',name:'Máscaras',group:'COTILLÓN',parentId:'party'},{id:'cake',area:'cotillon',name:'Accesorios',group:'REPOSTERÍA'}];
const products=[{id:'r1',area:'disfraces',name:'Súper HÉROE',sourceId:'Origen-ABC',categoryId:'n',categoryIds:['n','h'],category:'Niños',active:true},{id:'r2',area:'disfraces',name:'Otro disfraz',category:'',categoryIds:[],active:false},{id:'c1',area:'cotillon',name:'Máscara',categoryId:'mask',categoryIds:['mask'],category:'COTILLÓN › Fiestas › Máscaras',active:true},{id:'c2',area:'cotillon',name:'Molde',categoryId:'cake',category:'Accesorios',active:false}];
const filter=(patch={},area='disfraces',items=products)=>filterAdminProducts(items,categories,area,{...emptyAdminFilters(),...patch});
test('busca sin tildes/mayúsculas por nombre, categoría e ID de origen',()=>{
 for(const query of ['SUPER heroe','ninos','HALLOWEEN','origen-abc'])assert.deepEqual(filter({query}).map(p=>p.id),['r1']);
 assert.deepEqual(filter({query:'mascaras'},'cotillon').map(p=>p.id),['c1']);
});
test('combina estado, categoría secundaria y búsqueda sin cruzar áreas',()=>{
 assert.deepEqual(filter({status:'enabled',category:'category:h',query:'heroe'}).map(p=>p.id),['r1']);
 assert.deepEqual(filter({status:'disabled'}).map(p=>p.id),['r2']);assert.deepEqual(filter({status:'disabled',query:'heroe'}),[]);
});
test('Sin categoría y respaldo por nombre para registros heredados',()=>{
 assert.deepEqual(filter({category:'uncategorized'}).map(p=>p.id),['r2']);
 assert.equal(adminPrimaryCategory(products[0],categories),'Niños');assert.equal(adminPrimaryCategory(products[1],categories),'Sin categoría');
 assert.deepEqual(filter({category:'category:n'},'disfraces',[{id:'old',area:'disfraces',category:'Niños',name:'viejo',active:true}]).map(p=>p.id),['old']);
});
test('Cotillón filtra grupo, padre y subcategoría interna',()=>{
 for(const category of ['group:COTILLÓN','category:party','category:mask'])assert.deepEqual(filter({category},'cotillon').map(p=>p.id),['c1']);
 assert.equal(adminPrimaryCategory(products[2],categories),'COTILLÓN › Fiestas › Máscaras');
});
test('la lista soporta 1200 datos y fija páginas de 50 sin modificar el origen',()=>{
 const items=Array.from({length:1200},(_,i)=>({...products[0],id:'p'+i})),before=JSON.stringify(items);assert.equal(filter({},'disfraces',items).length,1200);assert.equal(ADMIN_PAGE_SIZE,50);assert.equal(JSON.stringify(items),before);
});
test('valida cero, decimales de precio y enteros de stock',()=>{
 assert.equal(parseQuickNumber('0','stock'),0);assert.equal(parseQuickNumber('12.345','price'),12.35);assert.equal(parseQuickNumber('100000','stock'),100000);
 for(const value of ['',' ','-1','1.5','100001','NaN','Infinity','foo'])assert.throws(()=>parseQuickNumber(value,'stock'));
 for(const value of ['','-1','100000001','Infinity','NaN'])assert.throws(()=>parseQuickNumber(value,'price'));
});
