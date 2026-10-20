import type {Product} from './catalog';

export const cotillonTaxonomy = [
 {name:'COTILLÓN',subcategories:['Fiestas','Cumpleaños infantil']},
 {name:'REPOSTERÍA',subcategories:['Golosinas','Comestibles','Accesorios']},
 {name:'FECHAS ESPECIALES',subcategories:['Navidad','Halloween','Pascua','San Valentín','Patrios','Baby Shower y revelación de género','Bautismo, comunión, 1 año','Egresados, UPD y recibidas','Primavera','Mundial','Despedida de soltera','Otros...']},
 {name:'DESCARTABLES',subcategories:['Bandejas','Cubiertos','Servilletas','Platos','Vasos / Copas / Jarras','Cajas','Sobres / Bolsas','Sorbetes','Hilos y cintas']}
] as const;

export type CotillonGroup=typeof cotillonTaxonomy[number]['name'];
export function cotillonGroup(name:string){return cotillonTaxonomy.find(group=>group.name===name)}

export function filterCotillonProducts(products:Product[],group:string,subcategoryId:string,query:string):Product[]{
 const needle=query.trim().toLocaleLowerCase();
 return products.filter(p=>{
  const names=p.categoryNames?.length?p.categoryNames:[p.category];
  if(!(p.name+' '+p.description+' '+names.join(' ')).toLocaleLowerCase().includes(needle))return false;
  if(needle||!group)return true;
  if(!subcategoryId)return false;
  return [p.categoryId,...(p.categoryIds||[])].includes(subcategoryId);
 });
}
