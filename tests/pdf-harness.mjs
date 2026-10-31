import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import * as pdfLib from 'pdf-lib';
export function pdfModules(){
 const cache=new Map();
 function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file);
  const result={};cache.set(file,result);
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('exports','require',js)(result,id=>id==='pdf-lib'?pdfLib:load(path.resolve(path.dirname(file),id+'.ts')));
  return result;
 }
 return {pdf:load('lib/pdf.ts'),receipt:load('lib/receipt.ts'),receiptPdf:load('lib/receipt-pdf.ts'),stats:load('lib/stats.ts'),local:load('lib/local-pdf.ts'),terms:load('lib/local-terms.ts').localTerms,webTerms:load('lib/terms.ts').terms};
}
