import RentalForm from '@/components/RentalForm';import {demo} from '@/lib/api';
import {pageMetadata} from '@/lib/page-metadata';
export const metadata=pageMetadata('Reservá tu disfraz','Completá la solicitud de alquiler de disfraces, adjuntá la documentación y consultá el estado de tu reserva.','/reservas/');
export default function Page(){return <div className="rental-scope"><RentalForm preview={demo}/></div>}
