export type Area='disfraces'|'cotillon';
export type Category={id:string;area:Area;name:string};
export const saleConditions=['Nuevo a pedido','Nuevo Inmediato','Usado inmediato'] as const;
export type SaleCondition=typeof saleConditions[number];
export type Product={id:string;area:Area;name:string;categoryId?:string;category:string;mode:'alquiler'|'venta'|'ambos';saleCondition?:SaleCondition|'';deliveryTime?:string;orderLimit?:number;price:number;rentPrice:number;stock:number;image:string;thumbnail?:string;description:string;active:boolean};
export function purchaseLimit(product:Product):number {
 if(product.area==='disfraces'&&product.saleCondition==='Nuevo a pedido'){
  const limit=product.orderLimit??(product.stock>0?product.stock:1);
  return Number.isInteger(limit)&&limit>0?limit:1;
 }
 return Number.isInteger(product.stock)&&product.stock>0?product.stock:0;
}
export const suggestedCostumeCategories=['Hombres','Cabezones','Mujeres','Personajes','Profesiones','Superheroes y Princesas','Halloween','Históricos','Otros'];
export const seedCategories:Category[]=[...suggestedCostumeCategories.map((name,i)=>({id:'demo-disfraces-'+i,area:'disfraces' as const,name})),...['Infantiles','Princesas','Superhéroes'].map((name,i)=>({id:'demo-extra-'+i,area:'disfraces' as const,name})),...['Globos','Decoración','Accesorios','Cotillón','Otros'].map((name,i)=>({id:'demo-cotillon-'+i,area:'cotillon' as const,name}))];
const image=(name:string)=>'/catalog/'+name;
export const seed:Product[]=[
 {id:'demo-1',area:'disfraces',name:'Spider, una aventura increíble',category:'Infantiles',mode:'ambos',saleCondition:'Nuevo a pedido',deliveryTime:'aproximadamente 1 mes',orderLimit:5,price:32000,rentPrice:18000,stock:3,image:image('spider.jpg'),description:'Un personaje para inventar mil aventuras. Consultá talles y disponibilidad.',active:true},
 {id:'demo-2',area:'disfraces',name:'Lady Bug, lista para la acción',category:'Infantiles',mode:'venta',saleCondition:'Nuevo Inmediato',price:28500,rentPrice:0,stock:4,image:image('ladybug.jpg'),description:'Para cumpleaños, juegos y días extraordinarios. Consultá talles.',active:true},
 {id:'demo-3',area:'disfraces',name:'Blancanieves de cuento',category:'Princesas',mode:'ambos',price:35000,rentPrice:20000,stock:2,image:image('blancanieves.jpg'),description:'Un clásico para crear tu propia historia. Consultá los accesorios incluidos.',active:true},
 {id:'demo-4',area:'disfraces',name:'Robin, compañero de aventuras',category:'Superhéroes',mode:'alquiler',price:0,rentPrice:18000,stock:2,image:image('robin.jpg'),description:'Transformá tu próxima fiesta. Disponibilidad sujeta a confirmación.',active:true},
 {id:'demo-5',area:'cotillon',name:'Globos feliz cumpleaños',category:'Globos',mode:'venta',price:8500,rentPrice:0,stock:15,image:image('globos.jpg'),description:'El comienzo de una gran celebración. Consultá colores disponibles.',active:true},
 {id:'demo-6',area:'cotillon',name:'Cortina de lluvia metalizada',category:'Decoración',mode:'venta',price:4500,rentPrice:0,stock:20,image:image('cortina.jpg'),description:'Un fondo brillante para tus mejores fotos. Colores a elección.',active:true},
 {id:'demo-7',area:'cotillon',name:'Bonete holográfico',category:'Accesorios',mode:'venta',price:1900,rentPrice:0,stock:30,image:image('bonete.jpg'),description:'Un detalle para que nadie se quede afuera de la fiesta.',active:true},
 {id:'demo-8',area:'cotillon',name:'Lanzapapel de celebración',category:'Cotillón',mode:'venta',price:5200,rentPrice:0,stock:12,image:image('papel.jpg'),description:'Dale color al gran momento. Consultá recomendaciones de uso.',active:true}
];
