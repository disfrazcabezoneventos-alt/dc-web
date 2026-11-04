import {test as base,expect} from '@playwright/test';
export {expect};
export const test=base.extend({context:async({context},use,testInfo)=>{
 const theme=testInfo.project.metadata.theme;
 if(theme)await context.addInitScript(t=>{if(window.top!==window)return;try{localStorage.setItem('dc-site-theme',t)}catch{}const apply=()=>{const root=document.documentElement;if(!root)return false;root.dataset.themePreview='true';try{root.dataset.theme=localStorage.getItem('dc-site-theme')||t}catch{root.dataset.theme=t}return true};if(!apply()){const observer=new MutationObserver(()=>{if(apply())observer.disconnect()});observer.observe(document,{childList:true});}},theme);
 await use(context);
}});
