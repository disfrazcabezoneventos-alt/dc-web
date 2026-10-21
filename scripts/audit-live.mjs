import fs from 'node:fs';
import ts from 'typescript';
const base = process.argv.find(arg=>arg.startsWith('https://')) || 'https://dc-web-8ai4.onrender.com';
const page = await fetch(new URL('/cotillon/', base)).then(r => r.text());
const assets = [...page.matchAll(/src="([^"]+\.js)"/g)].map(match => match[1]);
let endpoint = '';
for (const asset of assets) {
  const code = await fetch(new URL(asset, base)).then(r => r.text());
  const match = code.match(/https:\/\/script\.google\.com\/macros\/s\/[^"'\\]+?\/exec/);
  if (match) { endpoint = match[0]; break; }
}
if (!endpoint) throw new Error('No se encontró el endpoint de Apps Script en la web publicada.');
const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'catalogData'})});
const result = await response.json();
if (!result.ok) throw new Error(result.error || 'Apps Script no devolvió el catálogo.');
if (!Array.isArray(result.data?.products) || !Array.isArray(result.data?.categories)) throw new Error('Respuesta de catálogo incompleta: '+JSON.stringify({keys:Object.keys(result),dataKeys:Object.keys(result.data||{}),status:response.status}));
const {products,categories} = result.data;
if (process.argv.includes('--save-fixture')) {
  fs.writeFileSync('public/__audit-catalog.json',JSON.stringify(result.data));
  console.log('Fixture pública guardada: '+products.length+' productos.');
  process.exit(0);
}
const cotillon = products.filter(product => product.area === 'cotillon');
if (process.argv.includes('--resolved')) {
  const module={exports:{}};
  const code=ts.transpileModule(fs.readFileSync('lib/cotillon-taxonomy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('exports','require',code)(module.exports,()=>({}));
  const taxonomy=module.exports;
  const resolved=taxonomy.resolveCotillonCatalog(cotillon,categories);
  const visible=categories.filter(c=>c.area==='cotillon'&&c.group);
  const branches={};
  for(const group of taxonomy.cotillonTaxonomy)branches[group.name]={total:resolved.filter(p=>p.catalogGroups?.includes(group.name)).length,sections:visible.filter(c=>c.group===group.name&&!c.parentId).map(c=>({name:c.name,count:resolved.filter(p=>[p.categoryId,...p.categoryIds||[]].includes(c.id)||visible.some(inner=>inner.parentId===c.id&&p.categoryIds?.includes(inner.id))).length}))};
  const masks=visible.find(c=>c.name==='Máscaras y antifaces');
  const freddy=resolved.find(p=>p.name==='Careta De Freddy Krugger');
  console.log(JSON.stringify({total:resolved.length,withPhoto:resolved.filter(p=>p.image).length,withoutPhoto:resolved.filter(p=>!p.image).length,branches,masks:resolved.filter(p=>p.categoryIds?.includes(masks?.id)).length,freddy:{before:cotillon.find(p=>p.name==='Careta De Freddy Krugger')?.categoryIds,category:freddy?.category,after:freddy?.categoryIds,mask:freddy?.categoryIds?.includes(masks?.id)},sampleCategories:categories.filter(c=>c.area==='cotillon').slice(0,4),stillUnmapped:resolved.filter(p=>!p.categoryIds?.some(id=>visible.some(c=>c.id===id))).map(p=>p.name).slice(0,30)},null,2));
  process.exit(0);
}
const old = categories.filter(category => category.area === 'cotillon' && !category.group);
const counts = new Map();
for (const product of cotillon) for (const id of new Set([product.categoryId,...product.categoryIds || []])) counts.set(id,(counts.get(id)||0)+1);
if (process.argv.includes('--names')) {
  for (const category of old) {
    console.log('\n'+category.name+' ('+(counts.get(category.id)||0)+')');
    console.log(cotillon.filter(product=>product.categoryIds?.includes(category.id)).map(product=>product.name).slice(0,90).join(' | '));
  }
  process.exit(0);
}
console.log(JSON.stringify({products:cotillon.length,categories:categories.length,legacy:old.map(category=>({name:category.name,count:counts.get(category.id)||0,mapped:!!category.mappedToCategoryId})),examples:cotillon.filter(product=>/freddy|halloween/i.test(product.name)).slice(0,15).map(product=>({id:product.id,name:product.name,category:product.category,categoryIds:product.categoryIds,image:!!product.image})),visible:categories.filter(c=>c.area==='cotillon'&&c.group).map(c=>({name:c.name,group:c.group,parentId:c.parentId||'',count:counts.get(c.id)||0})).filter(c=>c.count>0)},null,2));
