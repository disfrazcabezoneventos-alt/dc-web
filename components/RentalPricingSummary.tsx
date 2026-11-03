import {money} from '@/lib/model';
import {RentalCalculation,RentalPromotion,promotionNudges} from '@/lib/rental-pricing';

export default function RentalPricingSummary({calculation,promotions=[],nudges=false,className=''}:{calculation:RentalCalculation;promotions?:RentalPromotion[];nudges?:boolean;className?:string}){
 return <section className={'rental-pricing-summary '+className} aria-label="Detalle del precio del alquiler" aria-live="polite">
  {calculation.lines.filter(l=>l.quantity>0).map(l=><div className="pricing-category" key={l.category}>
   <div className="pricing-row"><span>{l.quantity} {l.category==='adulto'?'disfraces adulto':'cabezones'} × {money(l.unitPrice)}</span><strong>{money(l.subtotal)}</strong></div>
   {l.promotion&&<div className="pricing-row pricing-discount"><span>Promo {l.promotion.take}x{l.promotion.pay} {l.category==='adulto'?'adultos':'cabezones'} <small>({l.free} {l.free===1?'traje gratis':'trajes gratis'})</small></span><strong>−{money(l.discount)}</strong></div>}
  </div>)}
  <div className="pricing-row"><span>Subtotal</span><strong>{money(calculation.subtotal)}</strong></div>
  <div className="pricing-row pricing-total"><span>Total del alquiler</span><strong>{money(calculation.total)}</strong></div>
  <div className="pricing-row pricing-guarantee"><span>Garantía <small>(se devuelve al finalizar)</small></span><strong>{money(calculation.guarantee)}</strong></div>
  <small>La garantía se cobra por cada traje, incluidos los bonificados. Se abona al retirar.</small>
  {nudges&&promotionNudges(calculation,promotions).map(text=><p className="pricing-nudge" key={text}>{text}</p>)}
 </section>;
}
