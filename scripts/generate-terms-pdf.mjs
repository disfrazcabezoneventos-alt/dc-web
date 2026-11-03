import fs from 'node:fs';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const terms={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/terms.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(terms);
const model={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/model.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(model);
fs.mkdirSync('tmp/pdfs',{recursive:true});
// Immutable source: the styled model before PR37. Keep its five pages, logo, tables and blank fields.
fs.writeFileSync('tmp/pdfs/contrato-diseno-original.pdf',execFileSync('git',['show','f1c0e8a1ddfbfb2d9e0dd170eeb764bb5b9d24db:public/Contrato_de_Alquiler_Disfraz_Cabezon.pdf'],{maxBuffer:10000000}));
fs.writeFileSync('tmp/pdfs/terms.json',JSON.stringify({version:model.VERSION,terms:terms.terms}));
const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
execFileSync(process.env.PDF_PYTHON||(fs.existsSync(bundled)?bundled:'python'),['scripts/update-terms-pdf.py'],{stdio:'inherit'});
