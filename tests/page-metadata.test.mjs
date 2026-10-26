import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=ts.transpileModule(fs.readFileSync('lib/page-metadata.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};
new Function('exports',source)(exports);

test('cada página pública tiene URL canónica y datos de WhatsApp completos',()=>{
 const metadata=exports.pageMetadata('Cotillón','Productos para tu fiesta','/cotillon/');
 assert.equal(metadata.title,'Cotillón');
 assert.equal(metadata.alternates.canonical,'/cotillon/');
 assert.equal(metadata.openGraph.url,'/cotillon/');
 assert.equal(metadata.openGraph.description,'Productos para tu fiesta');
 assert.equal(metadata.openGraph.images[0].url,'/brand-logo.png');
 assert.equal(metadata.twitter.card,'summary');
 assert.equal(exports.siteUrl,'https://dc-web-8ai4.onrender.com');
});
