'use client';
import {useEffect,useRef} from 'react';

const focusable='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Keep keyboard navigation in a custom dialog and return focus to its opener. */
export function useModalFocus<T extends HTMLElement>(open:boolean,onClose:()=>void){
 const modalRef=useRef<T>(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 useEffect(()=>{
  if(!open||!modalRef.current)return;
  const modal=modalRef.current;
  const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
  modal.focus();
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){
    event.preventDefault();
    closeRef.current();
    return;
   }
   if(event.key!=='Tab')return;
   const elements=[...modal.querySelectorAll<HTMLElement>(focusable)].filter(element=>element.getClientRects().length>0);
   if(!elements.length){event.preventDefault();modal.focus();return}
   const first=elements[0],last=elements[elements.length-1],active=document.activeElement;
   if(event.shiftKey&&(active===modal||active===first||!modal.contains(active))){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&(active===modal||active===last||!modal.contains(active))){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKeyDown,true);
  return()=>{
   document.removeEventListener('keydown',onKeyDown,true);
   if(opener?.isConnected)opener.focus({preventScroll:true});
  };
 },[open]);
 return modalRef;
}
