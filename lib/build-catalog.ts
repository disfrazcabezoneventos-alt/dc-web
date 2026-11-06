import snapshot from '@/generated/catalog-public.json';
import type {Product} from './catalog';
export type PublicPageProduct=Omit<Product,'stock'>;
export const pageProducts=snapshot.products as PublicPageProduct[];
export function pageProduct(id:string){return pageProducts.find(p=>p.id===id)}
