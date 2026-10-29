import type {Area,Category,Product} from './catalog';

export type QuickChanges=Partial<Pick<Product,'active'|'stock'|'price'|'rentPrice'>>;
export type AdminProductFilters={query:string;status:'all'|'enabled'|'disabled';category:string;page:number};
export const ADMIN_PAGE_SIZE=50;
export const emptyAdminFilters=():AdminProductFilters=>({query:'',status:'all',category:'',page:1});
export const normalizeAdminSearch=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-AR').trim();

export function adminCategoryIds(product:Product,categories:Category[]):string[]{
 const available=categories.filter(c=>c.area===product.area);
 const ids=[...new Set([product.categoryId,...(product.categoryIds||[])].filter((id):id is string=>!!id))].filter(id=>available.some(c=>c.id===id));
 if(!product.categoryId){const fallback=available.find(c=>normalizeAdminSearch(c.name)===normalizeAdminSearch(product.category));if(fallback&&!ids.includes(fallback.id))ids.unshift(fallback.id);}
 return ids;
}
export function adminCategoryPath(category:Category,categories:Category[]):string{
 const parent=category.parentId?categories.find(c=>c.id===category.parentId&&c.area===category.area):null;
 return [category.group,parent?.name,category.name].filter(Boolean).join(' › ');
}
export function adminPrimaryCategory(product:Product,categories:Category[]):string{
 const ids=adminCategoryIds(product,categories),primary=categories.find(c=>c.area===product.area&&c.id===ids[0]);
 return primary?(product.area==='cotillon'?adminCategoryPath(primary,categories):primary.name):'Sin categoría';
}
export function filterAdminProducts(products:Product[],categories:Category[],area:Area,filters:AdminProductFilters):Product[]{
 const query=normalizeAdminSearch(filters.query),available=categories.filter(c=>c.area===area);
 const selected=new Set<string>();
 if(filters.category.startsWith('category:')){
  selected.add(filters.category.slice(9));
  // Incluir subcategorías internas cuando se elige su categoría superior.
  let changed=true;while(changed){changed=false;for(const c of available)if(c.parentId&&selected.has(c.parentId)&&!selected.has(c.id)){selected.add(c.id);changed=true;}}
 }
 return products.filter(p=>{
  if(p.area!==area||filters.status==='enabled'&&!p.active||filters.status==='disabled'&&p.active)return false;
  const ids=adminCategoryIds(p,available);
  if(filters.category==='uncategorized'&&ids.length)return false;
  if(filters.category.startsWith('category:')&&!ids.some(id=>selected.has(id)))return false;
  if(filters.category.startsWith('group:')){const group=filters.category.slice(6);if(!(p.catalogGroups||[]).includes(group)&&!ids.some(id=>available.find(c=>c.id===id)?.group===group))return false;}
  const labels=ids.map(id=>adminCategoryPath(available.find(c=>c.id===id)!,available));
  return !query||normalizeAdminSearch([p.name,p.category,...p.categoryNames||[],...labels,p.id,p.sourceId||''].join(' ')).includes(query);
 });
}
export function parseQuickNumber(value:string,field:'stock'|'price'|'rentPrice'):number{
 if(!value.trim())throw new Error('Ingresá un número.');
 const number=Number(value);
 if(!Number.isFinite(number)||number<0||number>(field==='stock'?100000:100000000)||field==='stock'&&!Number.isInteger(number))throw new Error(field==='stock'?'Stock: entero entre 0 y 100000.':'Precio: número entre 0 y 100000000.');
 return field==='stock'?number:Math.round(number*100)/100;
}
