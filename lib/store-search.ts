import type {Category,Product} from './catalog';
// Editar aquí: cada grupo representa formas equivalentes de buscar lo mismo.
export const searchSynonyms=[['hombre araña','spiderman','spider man'],['princesa','princesas'],['cotillon','cotillón'],['mujer maravilla','wonder woman'],['hombre murciélago','batman'],['banderín','guirnalda'],['aladin','aladdin'],["d'artagnan",'dartagnan','dartañan','dartanian'],['tinker bell','tinkerbell','campanita'],['cruella','cruela'],['bellatrix','belatrix'],['teletubby','teletubie'],['tung tung sahur','tung tung shaur'],['mario bros','mario bross']] as const;
export function normalizeSearch(text:string){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function expandSearchText(text:string){const normalized=normalizeSearch(text),compact=normalized.replace(/ /g,'');return normalized+' '+searchSynonyms.filter(group=>group.some(alias=>compact.includes(normalizeSearch(alias).replace(/ /g,'')))).flat().map(normalizeSearch).join(' ');}
export function matchesStoreSearch(product:Product,query:string,categories:Category[]=[]){
 const words=normalizeSearch(query).split(' ').filter(Boolean);
 if(query.trim()&&!words.length)return false;
 const names=categories.filter(c=>c.area===product.area&&[product.categoryId,...product.categoryIds||[]].includes(c.id)).map(c=>c.name);
 const text=expandSearchText([product.name,product.description,product.category,...product.categoryNames||[],...names].join(' ')).replace(/ /g,'');
 return words.every(word=>{const forms=[word];if(word.length>=4){if(word.endsWith('s'))forms.push(word.slice(0,-1));if(word.endsWith('es'))forms.push(word.slice(0,-2));}return forms.some(form=>text.includes(form));});
}
export function searchProducts(products:Product[],query:string,categories:Category[]=[]){return products.filter(p=>(!p.publicationState||p.publicationState==='published')&&p.active&&matchesStoreSearch(p,query,categories));}
export function productSearchHref(p:Product){return '/'+p.area+'/#producto='+encodeURIComponent(p.id);}
