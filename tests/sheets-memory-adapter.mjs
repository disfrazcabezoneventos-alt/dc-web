// Minimal two-column Sheets adapter: records stay in the shared test tables.
export function memorySheets(ctx,tables,onCall=()=>{}){
 const sheet=name=>({
  getLastRow:()=>tables[name].length+1,
  getRange:(start,column,count,width)=>({
   getValues(){onCall({type:'read',table:name,start,count});return Array.from({length:count},(_,i)=>{const p=tables[name][start+i-2];return p?[p.id,JSON.stringify(p)]:['',''];});},
   setValues(values){
    onCall({type:'write',table:name,start,count});
    const raw=tables[name].map(p=>[p.id,JSON.stringify(p)]);
    values.forEach((row,i)=>{if(start+i>=2)raw[start+i-2]=Array.from(row);});
    while(raw.length&&!raw.at(-1)?.[1])raw.pop();
    tables[name]=raw.map(row=>JSON.parse(row[1]));return this;
   },
  }),
  appendRow(){return this;},setFrozenRows(){},
 });
 const ss={getName:()=> 'ENSAYO copia sintética',getSheetByName:name=>tables[name]?sheet(name):null,insertSheet:name=>{tables[name]=[];return sheet(name);}};
 ctx.SpreadsheetApp={openById:()=>ss,flush:()=>onCall({type:'flush'})};return ss;
}
