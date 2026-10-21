export type Area='disfraces'|'cotillon';
export type Category={id:string;area:Area;name:string;storefront?:boolean;group?:string;parentId?:string;mappedToCategoryId?:string};
import {cotillonTaxonomy,cotillonInnerCategories} from './cotillon-taxonomy';
export const saleConditions=['Nuevo a pedido','Nuevo Inmediato','Usado inmediato'] as const;
export type SaleCondition=typeof saleConditions[number];
export type Product={id:string;area:Area;name:string;categoryId?:string;categoryIds?:string[];categoryNames?:string[];catalogGroups?:string[];category:string;mode:'alquiler'|'venta'|'ambos';saleCondition?:SaleCondition|'';deliveryTime?:string;orderLimit?:number;price:number;priceKnown?:boolean;stockUnknown?:boolean;rentPrice:number;stock:number;image:string;thumbnail?:string;description:string;active:boolean;sourceId?:string;sourceImage?:string};
export function purchaseLimit(product:Product):number {
 if(product.area==='cotillon'&&product.stockUnknown)return 99;
 if(product.area==='disfraces'&&product.saleCondition==='Nuevo a pedido'){
  const limit=product.orderLimit??(product.stock>0?product.stock:1);
  return Number.isInteger(limit)&&limit>0?limit:1;
 }
 return Number.isInteger(product.stock)&&product.stock>0?product.stock:0;
}
export const suggestedCostumeCategories=['Hombres','Cabezones','Mujeres','Personajes','Profesiones','Superheroes y Princesas','Halloween','Históricos','Otros'];
export const cotillonCategoryNames=cotillonTaxonomy.flatMap(group=>group.subcategories);
export const seedCategories:Category[]=[...suggestedCostumeCategories.map((name,i)=>({id:'demo-disfraces-'+i,area:'disfraces' as const,name})),...['Infantiles','Princesas','Superhéroes'].map((name,i)=>({id:'demo-extra-'+i,area:'disfraces' as const,name})),...cotillonTaxonomy.flatMap((group,i)=>group.subcategories.map((name,j)=>({id:'demo-cotillon-'+i+'-'+j,area:'cotillon' as const,name,group:group.name,storefront:true}))),...cotillonInnerCategories.flatMap((branch,i)=>branch.names.map((name,j)=>({id:'demo-cotillon-inner-'+i+'-'+j,area:'cotillon' as const,name,group:'COTILLÓN',parentId:'demo-cotillon-0-'+i,storefront:true})))];
const image=(name:string)=>'/catalog/'+name;
export const seed:Product[]=[
 {id:'demo-1',area:'disfraces',name:'Spider, una aventura increíble',category:'Infantiles',mode:'ambos',saleCondition:'Nuevo a pedido',deliveryTime:'aproximadamente 1 mes',orderLimit:5,price:32000,rentPrice:18000,stock:3,image:image('spider.jpg'),description:'Un personaje para inventar mil aventuras. Consultá talles y disponibilidad.',active:true},
 {id:'demo-2',area:'disfraces',name:'Lady Bug, lista para la acción',category:'Infantiles',mode:'venta',saleCondition:'Nuevo Inmediato',price:28500,rentPrice:0,stock:4,image:image('ladybug.jpg'),description:'Para cumpleaños, juegos y días extraordinarios. Consultá talles.',active:true},
 {id:'demo-3',area:'disfraces',name:'Blancanieves de cuento',category:'Princesas',mode:'ambos',price:35000,rentPrice:20000,stock:2,image:image('blancanieves.jpg'),description:'Un clásico para crear tu propia historia. Consultá los accesorios incluidos.',active:true},
 {id:'demo-4',area:'disfraces',name:'Robin, compañero de aventuras',category:'Superhéroes',mode:'alquiler',price:0,rentPrice:18000,stock:2,image:image('robin.jpg'),description:'Transformá tu próxima fiesta. Disponibilidad sujeta a confirmación.',active:true},
 {id:'demo-5',area:'cotillon',name:'Globos feliz cumpleaños',category:'Decoración',categoryId:'demo-cotillon-inner-1-2',mode:'venta',price:8500,rentPrice:0,stock:15,image:image('globos.jpg'),description:'Ejemplo visual de producto. Consultá colores disponibles.',active:true},
 {id:'demo-6',area:'cotillon',name:'Cortina de lluvia metalizada',category:'Halloween',categoryId:'demo-cotillon-2-1',mode:'venta',price:4500,rentPrice:0,stock:20,image:image('cortina.jpg'),description:'Ejemplo visual de producto. Colores a elección.',active:true},
 {id:'demo-7',area:'cotillon',name:'Bonete holográfico',category:'Sombreros cascos',categoryId:'demo-cotillon-inner-0-6',mode:'venta',price:1900,rentPrice:0,stock:30,image:image('bonete.jpg'),description:'Ejemplo visual de producto.',active:true},
 {id:'demo-8',area:'cotillon',name:'Lanzapapel de celebración',category:'Egresados, UPD y recibidas',categoryId:'demo-cotillon-2-7',mode:'venta',price:5200,rentPrice:0,stock:12,image:image('papel.jpg'),description:'Ejemplo visual de producto.',active:true}
];
