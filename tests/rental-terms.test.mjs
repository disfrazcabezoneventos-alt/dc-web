import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const load=p=>{const e={};new Function('exports',ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(e);return e;};
const model=load('lib/model.ts'),{terms}=load('lib/terms.ts');
test('términos definitivos: lista, garantía completa, 2x1 y 3x2 solo alquiler y sin tarifa anterior',()=>{
 const text=terms.map(t=>t.body).join(' ');for(const value of ['$60.000','$75.000','$100.000','2x1','3x2','incluidos los bonificados','mientras estén activas'])assert.ok(text.includes(value),value);
 assert.doesNotMatch(text,/Premium|65[.,]000/);assert.match(model.VERSION,/2026-11-03\.2/);
 for(const p of ['lib/model.ts','lib/local-terms.ts','backend/Validation.gs','backend/Code.gs','backend/LocalForms.gs','backend/LocalReceipts.gs','lib/pdf.ts','lib/local-pdf.ts','lib/receipt-pdf.ts'])assert.doesNotMatch(fs.readFileSync(p,'utf8'),/Premium|65000|65[.,]000/,p);
 const local=fs.readFileSync('lib/local-terms.ts','utf8');for(const value of ['$60.000','$75.000','$100.000','2x1','3x2'])assert.ok(local.includes(value),value);
 assert.equal(model.deposit({items:[{category:'adulto',quantity:3},{category:'cabezon',quantity:2}]}),380000);
});
