import type {Metadata} from 'next';
import {pageMetadata} from '@/lib/page-metadata';

export const metadata:Metadata=pageMetadata('Solicitud de arrepentimiento','Conocé cómo solicitar el arrepentimiento de una contratación en Disfraz Cabezón.','/arrepentimiento/');
export default function Layout({children}:{children:React.ReactNode}){return children;}
