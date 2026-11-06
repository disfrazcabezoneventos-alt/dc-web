export type SitePhoto={image:string;thumbnail:string;alt:string};
export type SiteInfo={googleRating:number|null;googleReviewCount:number|null;googleUpdatedAt:string|null;photos:SitePhoto[];rappiUrl:string};
export const INITIAL_SITE_INFO:SiteInfo={googleRating:4.7,googleReviewCount:717,googleUpdatedAt:'2026-11-05',photos:[],rappiUrl:''};
export const MAP_URL='https://maps.google.com/?cid=17436940448838339609';
// Observado en la ficha de Waze de Av. Rivadavia 3314; su CID codificado coincide con el indicado por el dueño.
export const GOOGLE_PLACE_ID='ChIJS7DHjj3KvJURGUymDvR0_PE';
export const REVIEW_URL='https://search.google.com/local/writereview?placeid='+GOOGLE_PLACE_ID;
export const SOCIALS={instagram:'https://www.instagram.com/disfrazcabezon/',tiktok:'https://www.tiktok.com/@disfrazcabezon'};
export const PAYMENT_TEXT='Efectivo: 10% de descuento · Transferencia, débito y crédito: precio de lista';
export const RENTAL_SHIPPING='Podés calcular el envío con Uber desde tu domicilio hasta el local, o pedinos por WhatsApp un contacto de mensajería de confianza. Los cabezones son voluminosos y no se pueden llevar en moto.';
export const DEPOSIT_RETURN='La garantía se entrega en efectivo al retirar y se devuelve por transferencia después de revisar los trajes.';
export const PARTY_SHIPPING='Podés pedir un envío por Uber, Didi o Rappi, o comprarnos directamente por Rappi.';
export function ratingLabel(info:SiteInfo){
 if(info.googleRating===null||info.googleReviewCount===null||!info.googleUpdatedAt)return null;
 return '★ '+info.googleRating.toLocaleString('es-AR',{maximumFractionDigits:2})+' en Google · '+info.googleReviewCount.toLocaleString('es-AR')+' opiniones';
}
