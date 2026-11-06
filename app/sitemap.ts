import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/page-metadata';
import {pageProducts} from '@/lib/build-catalog';
export const dynamic='force-static';
export default function sitemap():MetadataRoute.Sitemap{return ['/','/disfraces/','/cotillon/','/reservas/','/comprar/','/condiciones/','/arrepentimiento/',...pageProducts.map(p=>'/p/'+encodeURIComponent(p.id)+'/')].map(path=>({url:siteUrl+path}));}
