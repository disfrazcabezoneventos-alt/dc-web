/* Configuración pública del local. No contiene secretos ni reseñas copiadas. */
function siteInfo_(){
 const raw=config_('SITE_PUBLIC_INFO_V1');
 if(!raw)return {googleRating:4.7,googleReviewCount:717,googleUpdatedAt:'2026-11-05',photos:[],rappiUrl:''};
 const data=JSON.parse(raw);return {googleRating:data.googleRating??null,googleReviewCount:data.googleReviewCount??null,googleUpdatedAt:data.googleUpdatedAt||null,photos:data.photos||[],rappiUrl:data.rappiUrl||''};
}
function siteInfoDispatch_(b,actor){
 if(b.action==='siteInfo')return {data:siteInfo_()};
 if(b.action!=='saveSiteInfo')return null;
 need_(actor&&actor.role==='admin','No tenés permiso para esta acción.');
 const p=b.info;need_(p&&typeof p==='object'&&!Array.isArray(p),'Configuración inválida.');
 need_(Object.keys(p).every(k=>['googleRating','googleReviewCount','photos','rappiUrl'].includes(k)),'Campo no permitido.');
 const rating=p.googleRating,count=p.googleReviewCount;
 need_(rating===null||typeof rating==='number'&&Number.isFinite(rating)&&rating>=0&&rating<=5,'Calificación inválida: usá de 0 a 5.');
 need_(count===null||Number.isInteger(count)&&count>=0&&count<=10000000,'Cantidad de opiniones inválida.');
 need_(Array.isArray(p.photos)&&p.photos.length<=4,'Admite hasta cuatro fotos.');
 const validImage=url=>typeof url==='string'&&/^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\//i.test(url)&&url.length<=1500;
 const photos=p.photos.map(photo=>{need_(photo&&validImage(photo.image)&&validImage(photo.thumbnail)&&typeof photo.alt==='string'&&photo.alt.length<=160,'Foto o descripción inválida.');return {image:photo.image,thumbnail:photo.thumbnail,alt:photo.alt.trim()};});
 need_(typeof p.rappiUrl==='string'&&(p.rappiUrl===''||/^https:\/\/(?:www\.)?rappi\.com\.ar\/tiendas\/[a-z0-9_/-]+\/?(?:\?[^\s]*)?$/i.test(p.rappiUrl)),'Usá el enlace de una tienda de Rappi Argentina.');
 const old=siteInfo_(),changed=old.googleRating!==rating||old.googleReviewCount!==count;
 const info={googleRating:rating,googleReviewCount:count,googleUpdatedAt:rating===null||count===null?null:changed?today_():old.googleUpdatedAt,photos,rappiUrl:p.rappiUrl};
 const serialized=JSON.stringify(info);need_(Utilities.newBlob(serialized).getBytes().length<8000,'Las imágenes o enlaces ocupan demasiado espacio.');
 props_().setProperty('SITE_PUBLIC_INFO_V1',serialized);
 if(typeof publicCatalogInvalidate_==='function')publicCatalogInvalidate_({pages:false});
 return {data:info};
}
