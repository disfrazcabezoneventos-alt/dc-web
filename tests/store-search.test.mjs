import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync('lib/store-search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const search={};new Function('exports',source)(search);
const product={id:'test',area:'disfraces',name:'Spider-Man rojo',description:'Máscara infantil',category:'Héroes',active:true};
test('H005: sin tildes, guiones, espacios, palabras en distinto orden y sinónimos compartidos',()=>{
 for(const q of ['spiderman','SPIDER MAN','rojo hombre araña','infantil mascara','heroes rojo','spider-man','man spider','spider','araña'])assert.ok(search.matchesStoreSearch(product,q),q);
 assert.ok(search.matchesStoreSearch({...product,name:'Princesas'},'princesa'));
 assert.ok(search.matchesStoreSearch({...product,categoryIds:['secondary']},'fiesta',[{id:'secondary',area:'disfraces',name:'Fiesta'}]));
 assert.equal(search.matchesStoreSearch(product,'rojo azul'),false);assert.equal(search.matchesStoreSearch(product,'🎈'),false);
});
test('público excluye borradores e inactivos de Disfraces, conserva agotados de Cotillón',()=>{
 const list=[product,{...product,id:'draft',publicationState:'draft'},{...product,id:'off',active:false},{...product,id:'sold',area:'cotillon',active:false}];
 assert.deepEqual(search.searchProducts(list,'rojo').map(p=>p.id),['test','sold']);
 assert.equal(search.productSearchHref({...product,id:'id con /'}),'/disfraces/#producto=id%20con%20%2F');
});
