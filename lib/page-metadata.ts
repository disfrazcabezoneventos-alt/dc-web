import type {Metadata} from 'next';

export const siteUrl='https://dc-web-8ai4.onrender.com';

export function pageMetadata(title:string,description:string,path:string):Metadata{
 return {
  title,description,
  alternates:{canonical:path},
  openGraph:{title:title+' | Disfraz Cabezón',description,url:path,type:'website',locale:'es_AR',siteName:'Disfraz Cabezón',images:[{url:'/brand-logo.png',width:1254,height:1254,alt:'Disfraz Cabezón'}]},
  twitter:{card:'summary',title:title+' | Disfraz Cabezón',description,images:['/brand-logo.png']},
 };
}
