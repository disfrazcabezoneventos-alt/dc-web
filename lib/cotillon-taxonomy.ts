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
 return [category.group||'Anterior',parent?.name,category.name].filter(Boolean).join(' › ');
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
  if(!subcategoryId)return false;
  const ids=[p.categoryId,...(p.categoryIds||[])];
  if(group!=='COTILLÓN')return ids.includes(subcategoryId);
  if(innerId)return ids.includes(innerId);
  if(showSectionAll)return cotillonSectionIds(categories,subcategoryId).some(id=>ids.includes(id));
  return false;
 });
}
