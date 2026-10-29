import fs from 'node:fs';import ts from 'typescript';
const model=fs.readFileSync('lib/model.ts','utf8').replace(/export /g,'');
const conditions=fs.readFileSync('lib/terms.ts','utf8').replace('export const terms','const TERMS');
const localModel=fs.readFileSync('lib/local-rental.ts','utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
const localConditions=fs.readFileSync('lib/local-terms.ts','utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'').replace('terms.map','TERMS.map');
const output=ts.transpileModule(model+'\n'+conditions+'\n'+localModel+'\n'+localConditions,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None}}).outputText;
fs.writeFileSync('backend/Validation.gs','// Generado desde lib/model.ts, terms.ts, local-rental.ts y local-terms.ts. No editar por separado.\n'+output);
