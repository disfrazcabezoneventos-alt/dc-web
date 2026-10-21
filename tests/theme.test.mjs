import test from 'node:test';
import assert from 'node:assert/strict';
import {readSiteTheme} from '../lib/theme.ts';

test('el frontend acepta la respuesta pública de la versión instalada y la corregida',()=>{
 assert.equal(readSiteTheme('halloween'),'halloween');
 assert.equal(readSiteTheme({theme:'halloween'}),'halloween');
 assert.equal(readSiteTheme({theme:'default'}),'default');
 assert.equal(readSiteTheme('desconocido'),null);
 assert.equal(readSiteTheme({theme:'desconocido'}),null);
});
