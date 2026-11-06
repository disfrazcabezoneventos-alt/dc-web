import ids from '@/generated/product-page-ids.json';
import type {Product} from './catalog';
import {siteUrl} from './page-metadata';
const builtIds=new Set(ids as string[]);
export function legacyProductPath(p:Pick<Product,'area'|'id'>){return '/'+p.area+'/#producto='+encodeURIComponent(p.id)}
export function publicProductPath(p:Pick<Product,'area'|'id'>){return builtIds.has(p.id)?'/p/'+encodeURIComponent(p.id)+'/':legacyProductPath(p)}
export function publicProductUrl(p:Pick<Product,'area'|'id'>){return siteUrl+publicProductPath(p)}
