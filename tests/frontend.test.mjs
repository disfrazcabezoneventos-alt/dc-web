import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=ts.transpileModule(fs.readFileSync('lib/rental-stock.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};
new Function('exports',source)(exports);
const {rentalStockErrors}=exports;

test('suma las unidades del mismo disfraz en varias filas antes de avanzar',()=>{
 const items=[{productId:'scream',quantity:2},{productId:'scream',quantity:2}];
 const errors=rentalStockErrors(items,[{id:'scream',name:'Scream',stock:2}]);
 assert.match(errors.item0,/Solo hay 2 unidad/);
 assert.match(errors.item1,/Solo hay 2 unidad/);
});

test('permite filas dentro del stock y trajes acordados fuera del catálogo',()=>{
 const items=[{productId:'scream',quantity:1},{productId:'scream',quantity:1},{name:'Especial',quantity:5}];
 assert.deepEqual(rentalStockErrors(items,[{id:'scream',name:'Scream',stock:2}]),{});
});

test('el diálogo conserva el foco, atrapa Tab, cierra con Escape y devuelve el foco',()=>{
 let effect,listener,closed=0;
 const refs=[];
 const document={activeElement:null,addEventListener:(name,fn)=>{if(name==='keydown')listener=fn},removeEventListener:(name,fn)=>{if(name==='keydown'&&listener===fn)listener=null}};
 class Element{
  constructor(){this.isConnected=true}
  focus(){document.activeElement=this}
  getClientRects(){return [1]}
 }
 const opener=new Element(),modal=new Element(),first=new Element(),last=new Element();
 modal.querySelectorAll=()=>[first,last];
 modal.contains=element=>element===modal||element===first||element===last;
 document.activeElement=opener;
 const react={useRef:value=>{const ref={current:value};refs.push(ref);return ref},useEffect:fn=>{effect=fn}};
 const hook={};
 const code=ts.transpileModule(fs.readFileSync('components/useModalFocus.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','exports','document','HTMLElement',code)(()=>react,hook,document,Element);
 const ref=hook.useModalFocus(true,()=>closed++);
 assert.equal(ref,refs[0]);
 ref.current=modal;
 const cleanup=effect();
 assert.equal(document.activeElement,modal);
 const key=(name,shiftKey=false)=>{let prevented=false;listener({key:name,shiftKey,preventDefault(){prevented=true}});return prevented};
 assert.equal(key('Tab'),true);assert.equal(document.activeElement,first);
 assert.equal(key('Tab',true),true);assert.equal(document.activeElement,last);
 assert.equal(key('Tab'),true);assert.equal(document.activeElement,first);
 assert.equal(key('Escape'),true);assert.equal(closed,1);
 cleanup();
 assert.equal(document.activeElement,opener);
 assert.equal(listener,null);
});
