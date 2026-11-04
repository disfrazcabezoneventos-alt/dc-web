import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/page-metadata';
export const dynamic='force-static';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin/','/constancia/','/solicitud/','/reserva-local/','/buscar/']},sitemap:siteUrl+'/sitemap.xml'};}
