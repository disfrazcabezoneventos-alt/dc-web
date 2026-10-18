import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=ts.transpileModule(fs.readFileSync('lib/rental-stock.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};
new Function('exports',source)(exports);
const {rentalStockErrors}=exports;

test('suma las unidades del mismo disfraz en varias filas antes de avanzar',()=>{
 const items=[{productId:'scream',quantity:2},{productId:'scream',quantity:2}];
 const errors=rentalStockErrors(items,[{id:'scream',name:'Scream',stock:2}]);
 assert.match(errors.item0,/Solo hay 2 unidad/);
 assert.match(errors.item1,/Solo hay 2 unidad/);
});

test('permite filas dentro del stock y trajes acordados fuera del catálogo',()=>{
 const items=[{productId:'scream',quantity:1},{productId:'scream',quantity:1},{name:'Especial',quantity:5}];
 assert.deepEqual(rentalStockErrors(items,[{id:'scream',name:'Scream',stock:2}]),{});
});
