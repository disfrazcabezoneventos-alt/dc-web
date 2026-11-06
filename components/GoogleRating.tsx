'use client';
import {MAP_URL,ratingLabel} from '@/lib/site-info';
import {useSiteInfo} from './SiteInfoProvider';
export default function GoogleRating({compact=false}:{compact?:boolean}){
 const info=useSiteInfo(),label=ratingLabel(info);if(!label)return null;
 const date=new Date(info.googleUpdatedAt!.slice(0,10)+'T12:00:00Z').toLocaleDateString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',year:'numeric'});
 return <a className={'google-rating'+(compact?' compact':'')} href={MAP_URL} target="_blank" rel="noreferrer" aria-label={label+' · Actualizado el '+date}><strong>{label}</strong><small>Actualizado el {date}</small></a>;
}
