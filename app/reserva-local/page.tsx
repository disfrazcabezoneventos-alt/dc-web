import type {Metadata} from 'next';
import LocalRentalForm from '@/components/LocalRentalForm';
export const metadata:Metadata={title:'Solicitud en el local',robots:{index:false,follow:false},alternates:{canonical:'/reserva-local/'}};
export default function Page(){return <div className="rental-scope"><LocalRentalForm/></div>}
