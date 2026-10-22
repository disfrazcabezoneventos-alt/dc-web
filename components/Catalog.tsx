'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,Search,ShoppingBag,SlidersHorizontal} from 'lucide-react';
import {catalogData,demo,whatsapp} from '@/lib/api';
import {Category,Product,purchaseLimit,seed,seedCategories} from '@/lib/catalog';
import {CART_KEY,CartItem,cartProduct,normalizeCart,requiresChoice} from '@/lib/cotillon-cart';
import {money} from '@/lib/model';
import {catalogImageUrl} from '@/lib/thumbnail';
import CotillonCart from './CotillonCart';
import CotillonNavigation from './CotillonNavigation';
import {filterCotillonProducts,resolveCotillonCatalog} from '@/lib/cotillon-taxonomy';

export default function Catalog({area,featured=false}:{area?:Product['area'];featured?:boolean}){
 const [products,setProducts]=useState<Product[]>(demo?seed:[]);
 const [categories,setCategories]=useState<Category[]>(demo?seedCategories:[]);
 const [loading,setLoading]=useState(!demo),[error,setError]=useState('');
 const [campaignHalloween,setCampaignHalloween]=useState(true);
 const [cotillonImportReady,setCotillonImportReady]=useState(demo);
 const [query,setQuery]=useState(''),[category,setCategory]=useState('Todos'),[mode,setMode]=useState('todos');
 const [mainCategory,setMainCategory]=useState(''),[subCategory,setSubCategory]=useState(''),[innerCategory,setInnerCategory]=useState(''),[sectionAll,setSectionAll]=useState(false);
 const [selected,setSelected]=useState<Product|null>(null),[detailQuantity,setDetailQuantity]=useState(1),[optionNote,setOptionNote]=useState('');
 const [cart,setCart]=useState<CartItem[]>([]),[cartReady,setCartReady]=useState(false),[cartOpen,setCartOpen]=useState(false);
 const [visible,setVisible]=useState(36),[notice,setNotice]=useState('');
 const dialogRef=useRef<HTMLDialogElement>(null);
 const publicProducts=useMemo(()=>resolveCotillonCatalog(cotillonImportReady?products:products.filter(p=>p.area!=='cotillon'),categories),[products,categories,cotillonImportReady]);

 useEffect(()=>{if(!demo)catalogData().then(data=>{setProducts(data.products);setCategories(data.categories);setCampaignHalloween(data.campaign?.halloween!==false);setCotillonImportReady(data.cotillonImportReady===true)}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 useEffect(()=>{if(loading||error||cartReady)return;try{setCart(normalizeCart(JSON.parse(localStorage.getItem(CART_KEY)||'[]'),publicProducts))}catch{setCart([])}setCartReady(true)},[loading,error,cartReady,publicProducts]);
 useEffect(()=>{if(cartReady)localStorage.setItem(CART_KEY,JSON.stringify(cart))},[cart,cartReady]);
 useEffect(()=>{if(!cotillonImportReady&&area==='cotillon')localStorage.removeItem(CART_KEY)},[area,cotillonImportReady]);
 useEffect(()=>{if(!selected)return;const dialog=dialogRef.current;if(dialog&&!dialog.open)dialog.showModal();const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setSelected(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[selected]);
 useEffect(()=>setVisible(36),[query,category,mode,mainCategory,subCategory,innerCategory,sectionAll]);

 const pool=publicProducts.filter(p=>p.active&&(!area||p.area===area));
 const categoryNames=area==='disfraces'?categories.filter(c=>c.area===area).map(c=>c.name):[];
 if(pool.some(p=>!p.categoryId&&p.category==='Sin categoría'))categoryNames.push('Sin categoría');
 const filtered=area==='cotillon'?filterCotillonProducts(pool,categories,mainCategory,subCategory,innerCategory,sectionAll,query):pool.filter(p=>{
  const names=p.categoryNames?.length?p.categoryNames:[p.category];
  return (category==='Todos'||names.includes(category))&&(mode==='todos'||p.mode===mode||p.mode==='ambos')&&(p.name+' '+p.description+' '+names.join(' ')).toLocaleLowerCase().includes(query.toLocaleLowerCase());
 });
 const halloweenId=categories.find(c=>c.area==='cotillon'&&c.group==='FECHAS ESPECIALES'&&c.name==='Halloween')?.id;
 const halloweenProducts=halloweenId?pool.filter(p=>p.area==='cotillon'&&[p.categoryId,...p.categoryIds||[]].includes(halloweenId)):[];
 const showCampaign=area==='cotillon'&&!featured&&campaignHalloween&&!query&&!mainCategory&&halloweenProducts.length>0;
 const sorted=showCampaign?[...filtered.filter(p=>halloweenProducts.some(h=>h.id===p.id)),...filtered.filter(p=>!halloweenProducts.some(h=>h.id===p.id))]:filtered;
 const campaignPicks=halloweenProducts.filter(p=>p.image).slice(0,3);
 const cartCount=cart.reduce((n,item)=>n+item.quantity,0);

 function changeQuantity(product:Product,quantity:number,option=''){
  setCart(current=>{
   const other=current.filter(item=>item.id===product.id&&(item.option||'')!==option).reduce((sum,item)=>sum+item.quantity,0);
   const next=Math.max(0,Math.min(purchaseLimit(product)-other,quantity));
   return next?current.some(item=>item.id===product.id&&(item.option||'')===option)?current.map(item=>item.id===product.id&&(item.option||'')===option?{...item,quantity:next}:item):[...current,{id:product.id,quantity:next,...(option?{option}:{})}]:current.filter(item=>item.id!==product.id||(item.option||'')!==option);
  });
 }
 function addToCart(product:Product,quantity=1){
  const option=requiresChoice(product)?optionNote.trim():'';
  if(requiresChoice(product)&&!option){setNotice('Indicá el color, modelo o talle elegido para agregar este producto.');return}
  const used=cart.filter(item=>item.id===product.id).reduce((sum,item)=>sum+item.quantity,0);
  if(used>=purchaseLimit(product)){setNotice('Ya agregaste la cantidad máxima disponible de '+product.name+'.');return}
  const existing=cart.find(item=>item.id===product.id&&(item.option||'')===option)?.quantity||0;
  changeQuantity(product,existing+quantity,option);
  setSelected(null);
  setNotice(product.name+' se agregó al carrito.');
 }
 function openProduct(product:Product){setNotice('');setDetailQuantity(1);setOptionNote('');setSelected(product)}
 function chooseHalloween(){setMainCategory('FECHAS ESPECIALES');setSubCategory(halloweenId||'');setInnerCategory('');setSectionAll(false);setQuery('');setTimeout(()=>document.querySelector('.product-grid')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}),0)}

 if(!cotillonImportReady&&area==='cotillon')return <section className="section catalog cotillon-catalog" id="catalogo"><div className="empty-state" role="status"><h2>Estamos renovando Cotillón.</h2><p>Retiramos las publicaciones anteriores para preparar el nuevo catálogo. Pronto vas a poder elegir tus productos acá.</p><a className="button" href="/disfraces/">Ver disfraces</a></div></section>;

 return <section className={'section catalog'+(area==='cotillon'?' cotillon-catalog':'')} id="catalogo">
  {area!=='cotillon'&&<div className="section-heading"><div><span className="eyebrow">{featured?'UN POCO DE INSPIRACIÓN':'ENCONTRÁ ESO QUE BUSCÁS'}</span><h2>{featured?'Hay fiesta para todos.':'Elegí tu próxima versión.'}</h2></div>{featured&&<a className="text-link" href="/disfraces/">Explorar disfraces <ArrowUpRight size={20}/></a>}</div>}
  {demo&&<p className="demo-note">Vista de demostración · Productos y precios de ejemplo. Se reemplazan al conectar Google Sheets.</p>}
  {notice&&<p className="notice catalog-notice" role="status">{notice} {area==='cotillon'&&<button className="text-link" onClick={()=>setCartOpen(true)}>Ver carrito →</button>}</p>}
  {!featured&&<>
   <div className="catalog-controls"><label className="search"><Search size={19}/><input aria-label="Buscar productos" placeholder="Buscá un producto o una idea…" value={query} onChange={e=>setQuery(e.target.value)}/></label>{area==='cotillon'?<button className="button dark cart-trigger" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/> Carrito <span>{cartCount}</span></button>:<label className="select-filter"><SlidersHorizontal size={18}/><select aria-label="Modalidad" value={mode} onChange={e=>setMode(e.target.value)}><option value="todos">Alquiler y venta</option><option value="alquiler">Para alquilar</option><option value="venta">Para comprar</option></select></label>}</div>
   {area==='cotillon'&&<CotillonNavigation categories={categories} products={pool} group={mainCategory} sectionId={subCategory} innerId={innerCategory} sectionAll={sectionAll} onGroup={g=>{setMainCategory(g);setSubCategory('');setInnerCategory('');setSectionAll(false);setQuery('')}} onSection={id=>{setSubCategory(id);setInnerCategory('');setSectionAll(mainCategory==='COTILLÓN');setQuery('')}} onInner={id=>{setInnerCategory(id);setSectionAll(false);setQuery('')}} onSectionAll={()=>{setInnerCategory('');setSectionAll(true);setQuery('')}} onAll={()=>{setMainCategory('');setSubCategory('');setInnerCategory('');setSectionAll(false);setQuery('')}}/>}
   {showCampaign&&<div className="campaign-highlight"><div className="campaign-highlight-copy"><span className="eyebrow">LA TEMPORADA COBRA VIDA</span><h2>Halloween está acá.</h2><p>Encontrá máscaras y detalles para una noche inolvidable.</p><button className="button campaign-cta" onClick={chooseHalloween}>Explorar Halloween <ArrowUpRight size={17}/></button></div><div className="campaign-picks">{campaignPicks.map(p=><button type="button" key={p.id} onClick={()=>openProduct(p)} aria-label={'Ver '+p.name}><img src={catalogImageUrl(p.image)} alt="" loading="eager"/><span>{p.name}</span></button>)}</div></div>}
   {area==='cotillon'&&query.trim()&&<p className="cotillon-search-note">Buscando en todos los productos de Cotillón, incluso los pendientes de clasificar.</p>}
   {area!=='cotillon'&&<div className="filter-chips">{['Todos',...new Set(categoryNames)].map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>}
  </>}
  {loading&&<div className="loading-state" role="status"><span className="spinner" aria-hidden="true"/>Cargando {area==='cotillon'?'cotillón':area==='disfraces'?'disfraces':'productos'}…</div>}
  {error&&<p className="error-banner" role="alert">{error} <button onClick={()=>location.reload()}>Reintentar</button></p>}
  <div className="product-grid">{(featured?sorted.slice(0,4):sorted.slice(0,visible)).map(p=><article className="product-card" key={p.id}><button className="product-open" type="button" onClick={()=>openProduct(p)} aria-label={'Ver detalle de '+p.name}><div className="product-photo">{p.image?<img src={catalogImageUrl(p.image)} alt="" loading="lazy" decoding="async" onLoad={e=>{e.currentTarget.style.maxWidth=e.currentTarget.naturalWidth+'px';e.currentTarget.style.maxHeight=e.currentTarget.naturalHeight+'px'}}/>:<span className="photo-placeholder">Foto próximamente</span>}{p.area==='disfraces'&&<span className="product-tag">{p.mode==='ambos'?'ALQUILER + VENTA':p.mode.toUpperCase()}</span>}</div><div className="product-info"><span>{p.category}{p.stock===0&&!p.stockUnknown&&!(p.area==='disfraces'&&p.saleCondition==='Nuevo a pedido'&&p.mode!=='alquiler')?' · Sin stock':''}</span><h3>{p.name}</h3>{p.area==='disfraces'&&p.mode!=='alquiler'&&p.saleCondition&&<span className="sale-condition-chip">{p.saleCondition}</span>}<p>{p.area==='cotillon'&&p.priceKnown===false?'Precio a consultar':<>{p.mode==='alquiler'||p.mode==='ambos'?'Alquiler desde ':''}<strong>{money(p.mode==='venta'?p.price:p.rentPrice)}</strong></>}</p></div></button>{p.area==='cotillon'&&!featured&&<button className="product-quick" type="button" onClick={()=>cartProduct(p)?requiresChoice(p)?openProduct(p):addToCart(p):openProduct(p)}>{cartProduct(p)?requiresChoice(p)?'Elegir opciones':'Agregar al carrito':'Ver detalle'} <ArrowUpRight size={15}/></button>}</article>)}</div>
  {!featured&&sorted.length>visible&&<button className="button catalog-more" onClick={()=>setVisible(n=>n+36)}>Ver más productos</button>}
  {!loading&&!error&&!filtered.length&&<div className="empty-state"><h3>No encontramos productos.</h3><p>Probá otra búsqueda o explorá todos los rubros.</p><button className="button" onClick={()=>{setQuery('');setMainCategory('');setSubCategory('');setInnerCategory('');setSectionAll(false);setCategory('Todos')}}>Ver todos los productos</button></div>}
  {selected&&<dialog ref={dialogRef} className="product-dialog" onCancel={()=>setSelected(null)}><div><button className="close-dialog" onClick={()=>setSelected(null)} autoFocus aria-label="Cerrar detalle">✕</button>{selected.image?<img src={selected.image} alt={selected.name}/>:<div className="photo-placeholder dialog-photo">Foto próximamente</div>}<span className="eyebrow">{selected.categoryNames?.join(' · ')||selected.category}</span><h2>{selected.name}</h2><p>{selected.description}</p>{selected.mode!=='venta'&&<p>Alquiler desde: <strong>{money(selected.rentPrice)}</strong></p>}{selected.mode!=='alquiler'&&<p>Venta: <strong>{selected.area==='cotillon'&&selected.priceKnown===false?'Precio a consultar':money(selected.price)}</strong></p>}{selected.area==='disfraces'&&selected.mode!=='alquiler'&&selected.saleCondition&&<p>Condición de venta: <strong>{selected.saleCondition}</strong>{selected.saleCondition==='Nuevo a pedido'&&<> · Entrega estimada: {selected.deliveryTime||'aproximadamente 1 mes'}. Te pediremos tus medidas por WhatsApp.</>}</p>}<p>{selected.area==='cotillon'&&selected.stockUnknown?'Disponibilidad a confirmar con el local.':selected.area==='disfraces'&&selected.saleCondition==='Nuevo a pedido'?`Se confecciona a pedido. Máximo ${purchaseLimit(selected)} unidades por consulta.`:selected.stock>0?selected.area==='cotillon'?`Hasta ${selected.stock} unidades disponibles para consultar.`:selected.mode==='venta'?'Consultá disponibilidad de talle.':'Consultá disponibilidad para tu fecha y talle.':'Actualmente sin stock. Podés consultar alternativas.'}</p><div className="catalog-choices">{selected.area==='cotillon'&&cartProduct(selected)?<>{requiresChoice(selected)&&<label className="cart-option">Color, modelo o talle que querés<input type="text" maxLength={100} value={optionNote} onChange={e=>setOptionNote(e.target.value)} placeholder="Escribí tu elección para el pedido" required/></label>}<label className="cart-detail-quantity">Cantidad<input type="number" min="1" max={purchaseLimit(selected)} value={detailQuantity} onChange={e=>setDetailQuantity(Math.max(1,Math.min(purchaseLimit(selected),Number(e.target.value)||1)))}/></label><button className="button dark" disabled={requiresChoice(selected)&&!optionNote.trim()} onClick={()=>addToCart(selected,detailQuantity)}><ShoppingBag size={18}/> Agregar al carrito</button></>:<>{selected.mode!=='venta'&&selected.stock>0&&<a className="button dark" href={'/reservas/?producto='+encodeURIComponent(selected.id)}>Quiero alquilar <ArrowUpRight size={18}/></a>}{selected.mode!=='alquiler'&&selected.area==='disfraces'&&purchaseLimit(selected)>0&&<a className="button dark" href={'/comprar/?producto='+encodeURIComponent(selected.id)}>Quiero comprar <ArrowUpRight size={18}/></a>}</>}</div><a className="text-link" href={whatsapp('¡Hola! Quiero consultar por '+selected.name+'.')} target="_blank" rel="noreferrer">Consultar por WhatsApp →</a></div></dialog>}
  {cartOpen&&<CotillonCart items={cart} products={publicProducts} onChange={changeQuantity} onClose={()=>setCartOpen(false)}/>}
 </section>;
}
