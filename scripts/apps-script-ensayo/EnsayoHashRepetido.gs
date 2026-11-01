/* SOLO en el proyecto de ensayo. No desplegar. No modifica la constante ni cuentas. */
function ejecutarEnsayoHashRepetido(){
 const costs=[600000,210000],original=medirHashCatalogo_,warmup=[],samples=[];
 let currentCost=costs[0];
 // Mantiene el wrapper público sin argumentos y utiliza su implementación real.
 // La sustitución vive solo en esta ejecución y siempre se revierte.
 medirHashCatalogo_=()=>original(currentCost);
 try{
  for(const iterations of costs){currentCost=iterations;warmup.push({iterations,ms:ejecutarMedirHash()});}
  for(let sample=1;sample<=3;sample++)for(const iterations of costs){
   currentCost=iterations;samples.push({sample,iterations,ms:ejecutarMedirHash()});
  }
 }finally{medirHashCatalogo_=original;}
 const result={method:'same-execution; one-warmup-per-cost; alternating-costs',warmup,samples};
 console.log(JSON.stringify(result));return result;
}
