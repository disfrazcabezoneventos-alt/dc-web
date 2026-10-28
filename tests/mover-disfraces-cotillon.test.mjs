import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root=join(import.meta.dirname,'..');
const raw=readFileSync(join(root,'backend','mover-disfraces-cotillon-2026-10-28.json'));
const script=readFileSync(join(root,'backend','MoverDisfracesCotillon20261028.gs'),'utf8');
const manifest=JSON.parse(raw.toString('utf8'));

test('SHA-256 del JSON coincide con la constante del importador',()=>{
 const constant=script.match(/const MOVER28_SHA256='([a-f0-9]{64})'/)?.[1];
 assert.ok(constant);
 assert.equal(createHash('sha256').update(raw).digest('hex'),constant);
});

test('la version corregida tiene 74 niño, 31 adulto y 12 en revision',()=>{
 assert.equal(manifest.moves.length,105);
 assert.equal(manifest.review.length,12);
 assert.equal(manifest.moves.filter(p=>p.destination==='niño').length,74);
 assert.equal(manifest.moves.filter(p=>p.destination==='adulto').length,31);
 assert.equal(new Set([...manifest.moves,...manifest.review].map(p=>p.id)).size,117);
 assert.equal(manifest.moves.filter(p=>p.priceBefore!==p.priceCorrect).length,1);
 assert.deepEqual(manifest.moves.filter(p=>p.priceBefore!==p.priceCorrect).map(p=>[p.name,p.priceCorrect]),[['Tunica Negra Niño',20000]]);
 assert.equal(Math.ceil(manifest.moves.length/15),7);
});

test('el modulo Apps Script es sintacticamente valido',()=>{
 assert.doesNotThrow(()=>new Function(script));
});
