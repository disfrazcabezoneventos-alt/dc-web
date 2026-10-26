'use client';
import Link from 'next/link';
import {CakeSlice,Gift,PartyPopper,ShoppingBag} from 'lucide-react';
import {Category,Product} from '@/lib/catalog';
import {cotillonChildren,cotillonSectionIds,cotillonTaxonomy} from '@/lib/cotillon-taxonomy';

type Props={
 categories:Category[];products:Product[];group:string;sectionId:string;innerId:string;sectionAll:boolean;
 onGroup:(group:string)=>void;onSection:(id:string)=>void;onInner:(id:string)=>void;onSectionAll:()=>void;onAll:()=>void;
};

export default function CotillonNavigation({categories,products,group,sectionId,innerId,sectionAll,onGroup,onSection,onInner,onSectionAll,onAll}:Props){
 const icons=[PartyPopper,CakeSlice,Gift,ShoppingBag];
 const visible=categories.filter(c=>c.area==='cotillon'&&c.group&&c.storefront!==false);
 const sections=visible.filter(c=>c.group===group&&!c.parentId);
 const section=sections.find(c=>c.id===sectionId);
 const inner=visible.find(c=>c.id===innerId&&c.parentId===sectionId);
 const children=section&&group==='COTILLÓN'?cotillonChildren(visible,section.id):[];
 const matches=(product:Product,ids:string[])=>ids.some(id=>[product.categoryId,...(product.categoryIds||[])].includes(id));
 const count=(ids:string[])=>products.filter(p=>matches(p,ids)).length;
 const countGroup=(name:string)=>products.filter(p=>p.catalogGroups?.includes(name)||visible.some(c=>c.group===name&&matches(p,[c.id]))).length;
 const back=inner?()=>onSection(sectionId):section?()=>onGroup(group):group?onAll:null;
 return <div className="cotillon-navigation">
  <nav className="cotillon-breadcrumb" aria-label="Ruta del catálogo">
   <Link href="/">Inicio</Link><span aria-hidden="true">›</span>
   {group?<><button type="button" onClick={onAll}>Mercadería</button><span aria-hidden="true">›</span><button type="button" onClick={()=>onGroup(group)} aria-current={!section?'page':undefined}>{group==='COTILLÓN'?'Cotillón':group}</button></>:<span aria-current="page">Cotillón / Mercadería</span>}
   {section&&<><span aria-hidden="true">›</span><button type="button" onClick={()=>onSection(section.id)} aria-current={!inner?'page':undefined}>{section.name}</button></>}
   {inner&&<><span aria-hidden="true">›</span><span aria-current="page">{inner.name}</span></>}
  </nav>
  <div className="cotillon-navigation-top"><span className="eyebrow">{inner?inner.name:section?section.name:group||'EXPLORÁ POR RUBRO'}</span><div className="cotillon-navigation-actions">{back&&<button type="button" onClick={back}>← Volver al nivel anterior</button>}{group&&<button type="button" onClick={onAll}>Ver todos los productos</button>}</div></div>
  {!group&&<div className="cotillon-category-grid">{cotillonTaxonomy.map((item,index)=>{const Icon=icons[index];return <button type="button" className={'cotillon-category-card tone-'+index} key={item.name} onClick={()=>onGroup(item.name)}><Icon size={24}/><strong>{item.name}</strong><small>{item.subcategories.length} subcategorías · {countGroup(item.name)} productos</small></button>})}</div>}
  {group&&!section&&<><h3 className="cotillon-subheading">Elegí una subcategoría</h3><div className="cotillon-subcategory-grid">{sections.map(c=>{const ids=group==='COTILLÓN'?cotillonSectionIds(visible,c.id):[c.id];return <button type="button" key={c.id} onClick={()=>onSection(c.id)}>{c.name}<small>{count(ids)}</small></button>})}</div><p className="cotillon-hint">También podés explorar todos los productos de {group==='COTILLÓN'?'Cotillón':group.toLocaleLowerCase('es')}, incluidos los que aún no tienen subcategoría.</p></>}
  {section&&group==='COTILLÓN'&&<><div className="cotillon-level-head"><h3 className="cotillon-subheading">{section.name} · elegí una categoría interna</h3><button type="button" className={'cotillon-section-all '+(sectionAll?'active':'')} onClick={onSectionAll}>Ver todos los productos de {section.name} <small>{count(cotillonSectionIds(visible,section.id))}</small></button></div><div className="cotillon-subcategory-grid">{children.map(c=><button type="button" className={innerId===c.id?'active':''} key={c.id} onClick={()=>onInner(c.id)}>{c.name}<small>{count([c.id])}</small></button>)}</div>{!innerId&&!sectionAll&&<p className="cotillon-hint">Elegí una categoría interna o mirá todos los productos de {section.name}. Los que aún no tengan categoría interna siguen disponibles aquí.</p>}</>}
 </div>;
}
