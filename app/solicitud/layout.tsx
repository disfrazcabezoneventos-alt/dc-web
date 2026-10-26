import type {Metadata} from 'next';

export const metadata:Metadata={title:'Mi solicitud',description:'Consulta privada de tu solicitud de alquiler.',alternates:{canonical:'/solicitud/'},robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return children;}
