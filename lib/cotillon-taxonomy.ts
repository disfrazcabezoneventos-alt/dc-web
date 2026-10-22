import type {Category,Product} from './catalog';

export const cotillonTaxonomy = [
 {name:'COTILLÓN',subcategories:['Fiestas','Cumpleaños infantil']},
 {name:'REPOSTERÍA',subcategories:['Golosinas','Comestibles','Accesorios']},
 {name:'FECHAS ESPECIALES',subcategories:['Navidad','Halloween','Pascua','San Valentín','Patrios','Baby Shower y revelación de género','Bautismo, comunión, 1 año','Egresados, UPD y recibidas','Primavera','Mundial','Despedida de soltera','Otros...']},
 {name:'DESCARTABLES',subcategories:['Bandejas','Cubiertos','Servilletas','Platos','Vasos / Copas / Jarras','Cajas','Sobres / Bolsas','Sorbetes','Hilos y cintas']}
] as const;

export type CotillonGroup=typeof cotillonTaxonomy[number]['name'];
export function cotillonGroup(name:string){return cotillonTaxonomy.find(group=>group.name===name)}

export const cotillonInnerCategories = [
 {parent:'Fiestas',names:['Carnaval carioca','Anteojos','Máscaras y antifaces','Accesorios para lanzar','Pelucas y barbas','Maquillaje pinta pelo','Sombreros cascos','Vinchas y coronas','Armas bastones escudos','Accesorios','Alas y tutús','Guantes y medias','Capas','Corbatas moños cinturones y tiradores']},
 {parent:'Cumpleaños infantil',names:['Personajes','Adorno para torta','Decoración','Bolsas y piñatas']}
] as const;

export function categoryPath(category:Category,categories:Category[]):string {
 const parent=category.parentId?categories.find(c=>c.id===category.parentId):undefined;
 return [category.group,parent?.name,category.name].filter(Boolean).join(' › ');
}

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
const accessoryRules:[string,RegExp][]=[
 ['Máscaras y antifaces',/\b(mascara|careta|antifaz)\b/],
 ['Anteojos',/\b(anteojos?|lentes?)\b/],
 ['Pelucas y barbas',/\b(pelucas?|barbas?|bigotes?)\b/],
 ['Maquillaje pinta pelo',/\b(maquillaje|pinta pelo|glitter|strass|tattoos?|tatuajes?|sangre falsa|sangre en spray)\b/],
 ['Sombreros cascos',/\b(sombreros?|gorros?|galeras?|cascos?)\b/],
 ['Vinchas y coronas',/\b(vinchas?|coronas?)\b/],
 ['Armas bastones escudos',/\b(pistolas?|espadas?|machetes?|cuchillos?|bastones?|baculos?|escudos?|hachas?|tridentes?|granadas?|garfios?|latigos?)\b/],
 ['Alas y tutús',/\b(alas?|tutus?)\b/],
 ['Guantes y medias',/\b(guantes?|medias?)\b/],
 ['Capas',/\b(capas?)\b/],
 ['Corbatas moños cinturones y tiradores',/\b(corbatas?|monos?|cinturones?|tiradores?)\b/],
 ['Accesorios para lanzar',/\b(confeti|serpentinas?|lanzapapel|lluvia de papel)\b/],
 ['Carnaval carioca',/\bcarnaval carioca\b/]
];
const pastryRules:[string,RegExp][]=[
 ['Golosinas',/\b(chupetines?|caramelos?|chicles?|gomitas?|golosinas?|alfajores?|turrones?)\b/],
 ['Comestibles',/\b(premezclas?|ballina|balina|rellenos?|cacao|azucar|colorantes?|esencias?|escencias?|merengues?|chocolates?|chips|cereales?|coco rallado|dulce de leche|glase|buttercream|granella|granitas?|polvo para hornear|bicarbonato|perlas|banos? reposteria)\b/],
 ['Accesorios',/\b(moldes?|cortantes?|mangas?|picos?|estekas?|espatulas?|pirotin(?:es)?|flaneras?|jarras? medidoras?|rasquetas?|torres? (?:(?:posa|de) )?cupcakes?|wrappers?|churreros?|torteras?|boquillas?|cornets?)\b/]
];

/** Compatibility view only: never writes inferred associations back to Sheets. */
export function resolveCotillonCatalog(products:Product[],categories:Category[]):Product[]{
 const byId=new Map(categories.map(category=>[category.id,category]));
 const visible=categories.filter(c=>c.area==='cotillon'&&c.group&&c.storefront!==false);
 const find=(group:string,name:string,parentName?:string)=>visible.find(c=>c.group===group&&normalize(c.name)===normalize(name)&&(!parentName?!c.parentId:byId.get(c.parentId||'')?.name===parentName));
 return products.map(product=>{
  if(product.area!=='cotillon')return product;
  const ids=Array.from(new Set([product.categoryId,...product.categoryIds||[]].filter((id):id is string=>!!id)));
  const original=ids.map(id=>byId.get(id)).filter((c):c is Category=>!!c);
  const legacy=original.filter(c=>!c.group);
  const inferred:Category[]=[];
  const groups=new Set([...(product.catalogGroups||[]),...original.filter(c=>c.group).map(c=>c.group!)]);
  const add=(group:string,name:string,parent?:string)=>{const found=find(group,name,parent);if(found&&!ids.includes(found.id)){ids.push(found.id);inferred.push(found)}if(found)groups.add(group)};
  for(const source of legacy){
   const old=normalize(source.name),name=normalize(product.name);
   if(old==='accesorios disfraz'){
    groups.add('COTILLÓN');add('COTILLÓN','Fiestas');
    const matches=accessoryRules.filter(([,pattern])=>pattern.test(name));
    if(matches.length===1)add('COTILLÓN',matches[0][0],'Fiestas');
   }else if(old==='reposteria'){
    groups.add('REPOSTERÍA');
    if(/\b(cajas?|cajas? para torta)\b/.test(name)){add('DESCARTABLES','Cajas');continue}
    if(/\b(ba?n?dejas?)\b/.test(name)){add('DESCARTABLES','Bandejas');continue}
    if(/\b(sobres?|bolsas?)\b/.test(name)){add('DESCARTABLES','Sobres / Bolsas');continue}
    if(pastryRules[2][1].test(name)||/\b(pincel(?:es)? de silicona|cuchillo \+ pala para torta)\b/.test(name)){add('REPOSTERÍA','Accesorios');continue}
    if(pastryRules[0][1].test(name)){add('REPOSTERÍA','Golosinas');continue}
    if(pastryRules[1][1].test(name)||/\b(comestibles?|cereal(?:es)?|choco|merenguitos?|crocante|cubanitos?|banos? reposteria|sprinkles?|chocolart|redondelas? marroc)\b/.test(name))add('REPOSTERÍA','Comestibles');
   }else if(old==='fiestas patrias'){
    if(/\b(harry potter|seleccionador)\b/.test(name))continue;
    if(/\b(copa del mundo|mundial)\b/.test(name)){add('FECHAS ESPECIALES','Mundial');continue}
    add('FECHAS ESPECIALES','Patrios');
   }else if(old==='comunion y bautismo')add('FECHAS ESPECIALES','Bautismo, comunión, 1 año');
   else if(old==='egresados')add('FECHAS ESPECIALES','Egresados, UPD y recibidas');
   else if(old==='cotillon')groups.add('COTILLÓN');
  }
  const assigned=ids.map(id=>byId.get(id)).filter((c):c is Category=>!!c&&!!c.group&&c.storefront!==false);
  const explicitPrimary=byId.get(product.categoryId||'');
  const primary=explicitPrimary?.group&&explicitPrimary.storefront!==false?explicitPrimary:inferred.find(c=>!!c.parentId)||inferred.find(c=>!!c.group)||assigned.find(c=>!!c.parentId)||assigned[0];
  const paths=Array.from(new Set(assigned.map(c=>categoryPath(c,categories))));
  const displayGroup=(name:string)=>({'COTILLÓN':'Cotillón','REPOSTERÍA':'Repostería','FECHAS ESPECIALES':'Fechas especiales','DESCARTABLES':'Descartables'} as Record<string,string>)[name]||name;
  const labels=paths.length?paths:groups.size?Array.from(groups).map(displayGroup):legacy.map(c=>c.name);
  return {...product,categoryId:primary?.id||product.categoryId,categoryIds:ids,category:primary?categoryPath(primary,categories):labels[0]||'Sin categoría',categoryNames:labels,catalogGroups:Array.from(groups)};
 });
}

export function cotillonChildren(categories:Category[],parentId:string):Category[]{
 const parent=categories.find(c=>c.id===parentId);
 const order=cotillonInnerCategories.find(branch=>branch.parent===parent?.name)?.names as readonly string[]|undefined;
 return categories.filter(c=>c.area==='cotillon'&&c.parentId===parentId&&c.storefront!==false).sort((a,b)=>{
  const ai=order?.indexOf(a.name)??-1,bi=order?.indexOf(b.name)??-1;
  return (ai<0?999:ai)-(bi<0?999:bi)||a.name.localeCompare(b.name,'es');
 });
}

export function cotillonSectionIds(categories:Category[],sectionId:string):string[]{
 return [sectionId,...cotillonChildren(categories,sectionId).map(c=>c.id)];
}

export function filterCotillonProducts(products:Product[],categories:Category[],group:string,subcategoryId:string,innerId:string,showSectionAll:boolean,query:string):Product[]{
 const needle=query.trim().toLocaleLowerCase();
 return products.filter(p=>{
  const names=p.categoryNames?.length?p.categoryNames:[p.category];
  if(!(p.name+' '+p.description+' '+names.join(' ')).toLocaleLowerCase().includes(needle))return false;
  if(needle||!group)return true;
  if(!subcategoryId)return !!p.catalogGroups?.includes(group)||[p.categoryId,...p.categoryIds||[]].some(id=>categories.find(c=>c.id===id)?.group===group);
  const ids=[p.categoryId,...(p.categoryIds||[])];
  if(group!=='COTILLÓN')return ids.includes(subcategoryId);
  if(innerId)return ids.includes(innerId);
  if(showSectionAll)return cotillonSectionIds(categories,subcategoryId).some(id=>ids.includes(id));
  return false;
 });
}
