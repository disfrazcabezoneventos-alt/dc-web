import type {Product} from './catalog';
import type {Costume} from './model';

/** Catch repeated selections of the same costume before the customer uploads documents. */
export function rentalStockErrors(items:Costume[],products:Product[]):Record<string,string>{
 const errors:Record<string,string>={};
 const totals=new Map<string,number>();
 items.forEach(item=>{
  if(item.productId)totals.set(item.productId,(totals.get(item.productId)||0)+item.quantity);
 });
 totals.forEach((quantity,id)=>{
  const product=products.find(p=>p.id===id);
  if(product&&quantity>product.stock){
   items.forEach((item,index)=>{
    if(item.productId===id)errors['item'+index]=`Solo hay ${product.stock} unidad(es) de ${product.name} para alquilar entre todos los trajes elegidos.`;
   });
  }
 });
 return errors;
}
