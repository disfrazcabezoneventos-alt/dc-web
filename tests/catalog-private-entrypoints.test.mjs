import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {catalogHarness} from './catalog-access-harness.mjs';

test('entrypoints privados salvo los cuatro wrappers estrictos de MantenimientoTemporal.gs',()=>{
 const allowed=new Set(['doGet','doPost']);
 const temporary=new Map([['ejecutarPrepararRoles','prepararRolesCatalogo_'],['ejecutarMigrarDisparadores','migrarDisparadoresCatalogo_'],['ejecutarRecuperarHistorial','recuperarHistorialCatalogo_'],['ejecutarMedirHash','medirHashCatalogo_']]);
 const pureValidation=new Set(['dateAR','todayAR','windows','validate','localTotal','localSchedule','validateLocal','money','phoneDigits','norm','deposit','paid']);
 for(const file of fs.readdirSync('backend').filter(f=>f.endsWith('.gs'))){
  const ast=ts.createSourceFile(file,fs.readFileSync('backend/'+file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const seen=new Set();
  for(const node of ast.statements){
   if(ts.isFunctionDeclaration(node)){
    const name=node.name.text;
    if(file==='MantenimientoTemporal.gs'){
     assert.ok(temporary.has(name),'Wrapper temporal inesperado: '+name);assert.ok(!seen.has(name));seen.add(name);
     assert.equal(node.parameters.length,0);assert.equal(node.body.statements.length,1);
     const statement=node.body.statements[0];assert.ok(ts.isReturnStatement(statement));assert.ok(ts.isCallExpression(statement.expression));
     assert.equal(statement.expression.expression.getText(ast),temporary.get(name));assert.equal(statement.expression.arguments.length,0);continue;
    }
    assert.ok(name.endsWith('_')||allowed.has(name)||file==='Validation.gs'&&pureValidation.has(name),file+': función pública inesperada '+name);
   }
   if(file==='MantenimientoTemporal.gs')assert.ok(ts.isFunctionDeclaration(node),'El archivo temporal solo puede declarar wrappers públicos.');
   if(ts.isVariableStatement(node))for(const d of node.declarationList.declarations){
    if(d.initializer&&(ts.isFunctionExpression(d.initializer)||ts.isArrowFunction(d.initializer))){const name=d.name.getText(ast);assert.ok(name.endsWith('_')||file==='Validation.gs'&&pureValidation.has(name),file+': alias público de función '+name);}
   }
  }
  if(file==='MantenimientoTemporal.gs')assert.equal(seen.size,temporary.size);
 }
});

test('disparadores conocidos migran sin ejecutar tareas; operación idempotente y tareas ajenas intactas',()=>{
 const h=catalogHarness(),old={getHandlerFunction:()=> 'procesarFotosCotillonExcel2026',getEventType:()=> 'CLOCK'},other={getHandlerFunction:()=> 'reintentarAvisosSinCuota',getEventType:()=> 'CLOCK'};
 const triggers=[old,other],created=[],deleted=[];
 h.ctx.ScriptApp={EventType:{CLOCK:'CLOCK'},getProjectTriggers:()=>triggers.slice(),newTrigger:name=>({timeBased(){return this},everyMinutes(n){assert.equal(n,5);return this},create(){created.push(name);triggers.push({getHandlerFunction:()=>name,getEventType:()=> 'CLOCK'})}}),deleteTrigger:t=>{deleted.push(t);triggers.splice(triggers.indexOf(t),1)}};
 const before=JSON.stringify(h.tables),result=h.ctx.migrarDisparadoresCatalogo_();
 assert.equal(result.migrated,1);assert.deepEqual([...result.manualReview],['reintentarAvisosSinCuota']);assert.deepEqual(created,['procesarFotosCotillonExcel2026_']);assert.deepEqual(deleted,[old]);assert.equal(JSON.stringify(h.tables),before);
 assert.equal(h.ctx.migrarDisparadoresCatalogo_().migrated,0);assert.equal(created.length,1);assert.ok(triggers.includes(other));
});

test('preparar configuración después de migrar no vuelve a guardar contraseña en texto plano',()=>{
 const h=catalogHarness();h.ctx.prepararRolesCatalogo_();
 h.settings.PRIVATE_FOLDER_ID='qa-private-folder';h.ctx.prepararConfiguracion_();
 assert.equal(h.settings.ADMIN_PASSWORD,undefined);assert.ok(h.settings.ADMIN_PASSWORD_RECORD);
});
