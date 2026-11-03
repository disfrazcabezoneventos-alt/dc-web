import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {catalogHarness} from './catalog-access-harness.mjs';
const source=fs.readFileSync(new URL('../scripts/apps-script-ensayo/EnsayoPublicacionDirecta.gs',import.meta.url),'utf8');
function setup(){const h=catalogHarness();h.settings.MAIL_MODE='disabled';h.settings.COTILLON_DEPTH3_V1='ready';h.ctx.ensayoSheet_=()=>h.ss;h.ctx.ScriptApp={getService:()=>({getUrl:()=>null})};h.ctx.console={log(){}};vm.runInContext(source,h.ctx);return h;}
test('ensayo de publicación crea ambos tipos, publica borradores y restaura productos, categorías y cuentas',()=>{
 const h=setup(),before=JSON.stringify({products:[h.tables.disfraces,h.tables.cotillon],categories:[h.tables.categorias_disfraces,h.tables.categorias_cotillon],settings:h.settings});
 const result=h.ctx.ejecutarEnsayoPublicacionDirecta();assert.equal(result.ok,true);assert.equal(result.committedEditorEvents,6);assert.equal(result.publishedDrafts,2);
 assert.equal(JSON.stringify({products:[h.tables.disfraces,h.tables.cotillon],categories:[h.tables.categorias_disfraces,h.tables.categorias_cotillon],settings:h.settings}),before);
});
test('ensayo se niega a escribir con correo activo, despliegue o mantenimiento pendiente',()=>{
 for(const mode of ['mail','deploy','pending']){const h=setup();if(mode==='mail')h.settings.MAIL_MODE='production';if(mode==='deploy')h.ctx.ScriptApp.getService=()=>({getUrl:()=> 'https://example.invalid/exec'});if(mode==='pending')h.tables.movimientos.push({stockPending:{before:1,after:0}});const before=JSON.stringify(h.tables);assert.throws(()=>h.ctx.ejecutarEnsayoPublicacionDirecta());assert.equal(JSON.stringify(h.tables),before);assert.equal(h.writes.length,0);}
});
