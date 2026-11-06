import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync('lib/store-search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const search={};new Function('exports',source)(search);
const product={id:'test',area:'disfraces',name:'Spider-Man rojo',description:'Máscara infantil',category:'Héroes',active:true};
test('H005: sin tildes, guiones, espacios, palabras en distinto orden y sinónimos compartidos',()=>{
 for(const q of ['spiderman','SPIDER MAN','rojo hombre araña','infantil mascara','heroes rojo','spider-man','man spider','spider','araña'])assert.ok(search.matchesStoreSearch(product,q),q);
 assert.ok(search.matchesStoreSearch({...product,name:'Princesas'},'princesa'));
 assert.ok(search.matchesStoreSearch({...product,categoryIds:['secondary']},'fiesta',[{id:'secondary',area:'disfraces',name:'Fiesta'}]));
 assert.equal(search.matchesStoreSearch(product,'rojo azul'),false);assert.equal(search.matchesStoreSearch(product,'🎈'),false);
});
test('público excluye borradores e inactivos de Disfraces, oculta inactivos de Cotillón',()=>{
 const list=[product,{...product,id:'draft',publicationState:'draft'},{...product,id:'off',active:false},{...product,id:'sold',area:'cotillon',active:false}];
 assert.deepEqual(search.searchProducts(list,'rojo').map(p=>p.id),['test']);
 assert.equal(search.productSearchHref({...product,id:'id con /'}),'/disfraces/#producto=id%20con%20%2F');
});
test('plurales por palabra y sinónimos nuevos en ambas direcciones',()=>{
 for(const [query,name] of [['globos','Globo'],['pelucas','Peluca'],['papeles rojos','Papel rojo'],['flores','Flor'],['mujer maravilla','Wonder Woman'],['wonder woman','Mujer Maravilla'],['hombre murciélago','Batman'],['batman','Hombre Murciélago'],['banderín','Guirnalda'],['guirnalda','Banderín'],['banderines','Guirnalda']])assert.ok(search.matchesStoreSearch({...product,name,category:'',description:''},query),query+' / '+name);
 assert.equal(search.matchesStoreSearch({...product,name:'Ga',category:'',description:''},'gas'),false);
});

test('Tanda 2: nombres corregidos conservan las variantes de búsqueda en ambos sentidos',()=>{
 const groups=[['Aladdín','Aladín'],["D’Artagnan",'Dartanian','Dartañán'],['Tinker Bell','Campanita'],['Cruella','Cruela'],['Bellatrix','Belatrix'],['Teletubby','Teletubie'],['Tung Tung Sahur','Tung Tung Shaur'],['Mario Bros.','Mario Bross']];
 for(const group of groups)for(const name of group)for(const query of group)assert.ok(search.matchesStoreSearch({...product,name,category:'',description:''},query),`${query} / ${name}`);
 assert.ok(search.matchesStoreSearch({...product,name:'Aladdín Verde',category:'',description:''},'ALADIN VERDE'));
 assert.equal(search.matchesStoreSearch({...product,name:'Aladdín Verde',category:'',description:''},'aladin azul'),false);
 assert.equal(search.matchesStoreSearch({...product,name:'Barney',category:'',description:''},'aladin'),false);
});

test('Tanda 3: ocho grupos nuevos en ambas direcciones, sin mezclar productos ajenos',()=>{
 for(const group of [['doctor','médico'],['policía','policia','cana'],['enfermera','enfermero'],['bombero','bombera'],['pirata','corsario'],['zombie','zombi'],['calabaza','zapallo'],['cumpleaños','cumple']])for(const name of group)for(const query of group)assert.ok(search.matchesStoreSearch({...product,name,category:'',description:''},query),name+' / '+query);assert.equal(search.matchesStoreSearch({...product,name:'Princesa',category:'',description:''},'médico'),false);
});

test('el alias cana no convierte Mexicana, Americana o Canasta en policías',()=>{for(const name of ['Servilletas Calavera Mexicana','Americana','Canasta'])assert.equal(search.matchesStoreSearch({...product,name,description:'',category:''},'policía'),false,name);assert.ok(search.matchesStoreSearch({...product,name:'Gorro de cana',description:'',category:''},'policía'));});
