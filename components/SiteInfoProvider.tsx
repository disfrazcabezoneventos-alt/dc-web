'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {catalogData,demo} from '@/lib/api';
import {INITIAL_SITE_INFO,SiteInfo} from '@/lib/site-info';
const Context=createContext<SiteInfo>(INITIAL_SITE_INFO);
export function useSiteInfo(){return useContext(Context)}
export default function SiteInfoProvider({children}:{children:React.ReactNode}){
 const [value,setValue]=useState(INITIAL_SITE_INFO);
 useEffect(()=>{let alive=true;if(!demo)catalogData().then(data=>{if(alive&&data.siteInfo)setValue(data.siteInfo)}).catch(()=>{});return()=>{alive=false}},[]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
