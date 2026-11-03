import Catalog from '@/components/Catalog';
export const metadata={title:'Buscar en la tienda',robots:{index:false,follow:true},alternates:{canonical:'/buscar/'}};
export default function SearchPage(){return <main><div className="page-title"><span className="eyebrow">DISFRACES Y COTILLÓN</span><h1>Encontrá tu próxima idea.</h1></div><Catalog searchPage/></main>;}
