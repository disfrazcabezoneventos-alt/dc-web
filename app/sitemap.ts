import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/page-metadata';
export const dynamic='force-static';
export default function sitemap():MetadataRoute.Sitemap{return ['/','/disfraces/','/cotillon/','/reservas/','/comprar/','/condiciones/','/arrepentimiento/'].map(path=>({url:siteUrl+path}));}
