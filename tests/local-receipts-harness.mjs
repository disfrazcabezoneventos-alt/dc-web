import crypto from 'node:crypto';
import {localHarness,submission} from './local-forms-harness.mjs';
export function receiptsHarness(){
 const h=localHarness(),sent=[];
 Object.assign(h.settings,{LOCAL_RECEIPTS_ENABLED:'yes',LOCAL_RECEIPT_SECRET:'test-secret-'.repeat(8),SITE_URL:'https://disfrazcabezon.com.ar',BUSINESS_EMAIL:'negocio@example.invalid'});
 h.ctx.MailApp={getRemainingDailyQuota:()=>100,sendEmail:m=>sent.push(m)};
 const created=h.dispatch(submission(h));h.settings.MAIL_MODE='production';
 const issue={action:'issueLocalReceipt',id:created.id,token:h.token,operationId:crypto.randomUUID(),revision:0,payment:{amount:30000,guarantee:10000,date:'2026-10-29',method:'Efectivo'}};
 return {...h,created,issue,sent};
}
