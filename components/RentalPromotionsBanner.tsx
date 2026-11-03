import {RentalPromotion} from '@/lib/rental-pricing';
export default function RentalPromotionsBanner({promotions}:{promotions:RentalPromotion[]}){
 const active=promotions.filter(p=>p.active);
 if(!active.length)return null;
 return <aside className="rental-promotions-banner" aria-label="Promociones de alquiler"><strong>{active.map(p=>p.name).join(' · ')}</strong><span>Solo alquiler</span></aside>;
}
