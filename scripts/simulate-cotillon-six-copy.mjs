// Read local test-copy data, run the actual Apps Script in a VM, never call Google/Cloudinary.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {setup} from '../tests/cotillon-six-harness.mjs';
const input=JSON.parse(fs.readFileSync(process.argv[2]||'tmp/cotillon-six-input.json','utf8'));
const h=setup(input),before=JSON.stringify(input.rows),categories=JSON.stringify(input.categories);
const digest=text=>crypto.createHash('sha256').update(text).digest('hex');
assert.equal(h.context.previsualizarCotillon6Copia().altas,6);
assert.equal(h.events.length,0);
const batch=h.context.probarLoteCotillon6Copia(),repeat=h.context.probarLoteCotillon6Copia();
assert.equal(batch.procesados,6);assert.equal(repeat.procesados,0);
assert.equal(JSON.stringify(h.sheets.get('cotillon').rows.slice(0,input.rows.length)),before);
assert.equal(JSON.stringify(h.sheets.get('cotillon_respaldo_seis_20261028_test').rows),before);
assert.equal(JSON.stringify(h.sheets.get('categorias_cotillon').rows),categories);
const addedRows=h.sheets.get('cotillon').rows.slice(input.rows.length);
assert.ok(addedRows.every(r=>JSON.parse(r[1]).active===false));
console.log(JSON.stringify({beforeProducts:input.rows.length-1,afterProducts:h.products().length,addedRows,batch,repeat,beforeSha256:digest(before),categoriesSha256:digest(categories),backupMatches:true,existingUnchanged:true,categoriesUnchanged:true}));
