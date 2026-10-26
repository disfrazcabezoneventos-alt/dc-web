import PurchaseForm from '@/components/PurchaseForm';
import {pageMetadata} from '@/lib/page-metadata';
export const metadata=pageMetadata('Consultar compra de disfraces','Elegí un disfraz, indicá cantidad y consultá la compra por WhatsApp con los datos ya preparados.','/comprar/');
export default function Page(){return <PurchaseForm/>}
