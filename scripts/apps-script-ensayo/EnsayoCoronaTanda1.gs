/* SOLO ENSAYO. La instalación en producción requiere revisión y autorización posterior. */
function ejecutarCoronaEnsayoTanda1(){
 need_(ScriptApp.getScriptId()==='1dhU7i9BXg8tXVyTK8R98FpIbhZyBAKhvShqHSVCmBSlwXvjkwqQ347IE','Solo proyecto de ensayo.');
 need_(config_('TANDA1_COPY_ID')&&config_('SPREADSHEET_ID')===config_('TANDA1_COPY_ID')&&config_('MAIL_MODE')==='disabled','Solo copia de ensayo sin mails.');
 need_(SpreadsheetApp.openById(config_('SPREADSHEET_ID')).getName().startsWith('ENSAYO '),'No es copia.');
 return lock_(()=>{
  need_(catalogRolesReady_(),'El historial debe estar habilitado.');
  const actor={id:'owner-tanda1',username:'dueño · Tanda 1',role:'admin'},result=[];
  for(const id of ['excel-2115053557','excel-2115151669']){
   const before=rows_('cotillon').find(p=>p.id===id);need_(before&&before.name==='Corona Princesa Plastica','Revisar ficha '+id);
   const after=id==='excel-2115053557'?{...before,active:true,price:2500,stock:4}:{...before,active:false};
   catalogWriteProduct_(actor,'cotillon',before,after,'owner_correction_corona');result.push({id,active:after.active,price:after.price,stock:after.stock});
  }
  console.log(JSON.stringify(result));return result;
 });
}
