import fs from 'node:fs';import ts from 'typescript';
const model=fs.readFileSync('lib/model.ts','utf8').replace(/export /g,'');
const conditions=fs.readFileSync('lib/terms.ts','utf8').replace('export const terms','const TERMS');
const output=ts.transpileModule(model+'\n'+conditions,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None}}).outputText;
fs.writeFileSync('backend/Validation.gs','// Generado desde lib/model.ts y lib/terms.ts. No editar por separado.\n'+output);
