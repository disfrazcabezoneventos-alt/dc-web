/* Tanda 4: activar SECURITY_V1_ENABLED solo después de preparar MFA en ensayo. */
function securityEnabled_(){return config_('SECURITY_V1_ENABLED')==='yes';}
function securityMfaKey_(actor){return 'SECURITY_MFA_'+actor.id;}
function securityJson_(key,fallback){const raw=config_(key);if(!raw)return fallback;try{return JSON.parse(raw)}catch(_){throw new Error('Configuración de seguridad inválida.')}}
function securityMfa_(actor){return securityJson_(securityMfaKey_(actor),null);}
function securityBase32_(hex){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits=0,value=0,out='';for(let i=0;i<hex.length;i+=2){value=(value<<8)|parseInt(hex.slice(i,i+2),16);bits+=8;while(bits>=5){bits-=5;out+=alphabet[(value>>>bits)&31]}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out;}
function securityCode_(secret,code,lastStep){if(typeof code!=='string'||!/^\d{6}$/.test(code))return null;const step=Math.floor(Date.now()/30000);for(const offset of [-1,0,1]){const candidate=step+offset;if(candidate>Number(lastStep??-1)&&equal_(DcPasswords.hotp(secret,candidate),code))return candidate}return null;}
function securityVerifyMfa_(actor,code){
 need_(typeof code==='string'&&code.length<=80,'Código de autenticación inválido.');const state=securityMfa_(actor);need_(state&&state.secret,'Configurá la verificación en dos pasos.');
 const step=securityCode_(state.secret,code,state.lastStep);
 if(step!==null){state.lastStep=step;props_().setProperty(securityMfaKey_(actor),JSON.stringify(state));return;}
 const normalized=typeof code==='string'?code.replace(/[ -]/g,'').toUpperCase():'';
 const index=normalized.length>=20?state.recovery.findIndex(h=>equal_(h,hash_(state.salt+normalized))):-1;
 need_(index>=0,'Código de autenticación inválido, usado o vencido.');state.recovery.splice(index,1);props_().setProperty(securityMfaKey_(actor),JSON.stringify(state));
}
function securityVersion_(actor){const base=actor.role==='admin'?adminSessionVersion_():catalogSessionVersion_(catalogAccount_(actor.id)),mfa=securityMfa_(actor);return hash_(base+JSON.stringify(mfa?{secret:mfa.secret,createdAt:mfa.createdAt}:null));}
function securityIssue_(actor,pending=false){const token=Utilities.getUuid()+Utilities.getUuid(),state={v:3,id:actor.id,role:actor.role,username:actor.username,version:securityVersion_(actor),lastAt:Date.now(),mfaPending:pending};CacheService.getScriptCache().put('session:'+hash_(token),JSON.stringify(state),pending?600:7200);return {token,user:{id:actor.id,username:actor.username,role:actor.role},mfaSetup:pending};}
function securityIdentity_(token){
 need_(typeof token==='string'&&token.length>30,'Sesión vencida. Volvé a ingresar.');const cache=CacheService.getScriptCache(),key='session:'+hash_(token);let state;try{state=JSON.parse(cache.get(key)||'null')}catch(_){}
 const valid=state&&state.v===3&&Date.now()-state.lastAt<(state.mfaPending?600000:7200000)&&['admin','editor'].includes(state.role);
 if(!valid){cache.remove(key);throw new Error('Sesión vencida. Volvé a ingresar.');}
 const account=state.role==='editor'?catalogAccount_(state.id):null;
 if(state.role==='editor'&&(!account||!account.active)||!equal_(state.version,securityVersion_(state))){cache.remove(key);throw new Error('Sesión vencida. Volvé a ingresar.');}
 return {id:state.id,username:state.username,role:state.role,mfaPending:state.mfaPending};
}
function securityTouch_(token){const cache=CacheService.getScriptCache(),key='session:'+hash_(token),s=JSON.parse(cache.get(key)||'null');need_(s&&!s.mfaPending,'Completá la verificación en dos pasos.');s.lastAt=Date.now();cache.put(key,JSON.stringify(s),7200);}
function securityNotify_(event,detail){
 if(config_('MAIL_MODE')!=='production')return;
 const hour=new Date().toISOString().slice(0,13),key='SECURITY_MAIL_RATE',state=securityJson_(key,{hour,count:0});if(state.hour!==hour){state.hour=hour;state.count=0}if(state.count>=10)return;
 state.count++;props_().setProperty(key,JSON.stringify(state));
 try{MailApp.sendEmail({to:'disfrazcabezoneventos@gmail.com',subject:'Seguridad Disfraz Cabezón: '+event,body:event+'\n'+String(detail||'').slice(0,600)+'\nFecha: '+now_()+'\nNo se incluyen claves, tokens ni datos de clientes.'})}catch(_){console.error('No se pudo entregar una alerta de seguridad.');}
}
function securityLoginFailure_(username){
 const key='SECURITY_LOGIN_FAILURES',now=Date.now(),state=securityJson_(key,{times:[],alerted:false});state.times=state.times.filter(t=>now-t<900000);if(!state.times.length)state.alerted=false;state.times.push(now);state.times=state.times.slice(-60);
 if(state.times.length>=5&&!state.alerted){state.alerted=true;securityNotify_('5 intentos fallidos en 15 minutos','Revisá los accesos del panel. No se guardan contraseñas ni códigos intentados.');}props_().setProperty(key,JSON.stringify(state));
}
function securityKnownBrowser_(actor,b){if(actor.role!=='admin')return;const raw=String(b.browserId||''),id=hash_(raw.length>=20&&raw.length<=100?raw:'sin-identificador'),key='SECURITY_KNOWN_BROWSERS',known=securityJson_(key,[]);if(known.includes(id))return;known.push(id);props_().setProperty(key,JSON.stringify(known.slice(-20)));securityNotify_('Ingreso desde navegador nuevo',String(b.browserLabel||'Navegador sin identificar').slice(0,180).replace(/[\r\n]/g,' '));}
function securityPasswordActor_(b){
 need_(typeof b.username==='string'&&b.username.length<=50,'Usuario o contraseña incorrectos.');const name=b.username.trim().toLowerCase(),password=b.password;need_(typeof password==='string'&&password.length<=128,'Usuario o contraseña incorrectos.');
 if(name===config_('ADMIN_USER').trim().toLowerCase()){const raw=config_('ADMIN_PASSWORD_RECORD'),record=raw?catalogPrivateJson_(raw):null;need_(record?passwordMatches_(password,record):config_('ADMIN_PASSWORD').length>=12&&equal_(hash_(password),hash_(config_('ADMIN_PASSWORD'))),'Usuario o contraseña incorrectos.');return {id:'administrator',username:config_('ADMIN_USER'),role:'admin'};}
 const u=catalogRolesReady_()?catalogAccounts_().find(u=>u.username===name):null;need_(u&&u.active&&passwordMatches_(password,u.password),'Usuario o contraseña incorrectos.');return {id:u.id,username:u.username,role:'editor'};
}
function securityLogin_(b){
 let actor;try{limit_('login-global',60,900);limit_('login:'+String(b.username||'').toLowerCase(),8,900);actor=securityPasswordActor_(b);const mfa=securityMfa_(actor);if(mfa){if(!b.authenticationCode)return {mfaRequired:true};securityVerifyMfa_(actor,b.authenticationCode);}}catch(error){securityLoginFailure_(String(b.username||''));throw error;}
 const pending=actor.role==='admin'&&!securityMfa_(actor);if(!pending)securityKnownBrowser_(actor,b);const result=securityIssue_(actor,pending);if(pending)CacheService.getScriptCache().put('mfa-browser:'+hash_(result.token),JSON.stringify({browserId:b.browserId,browserLabel:b.browserLabel}),600);return result;
}
function securityDispatch_(b,actor){
 const actions=['securityStatus','securityActivity','beginTotp','confirmTotp','disableTotp','revokeSessions','changeOwnPassword'];if(!actions.includes(b.action))return null;
 need_(actor,'Sesión vencida. Volvé a ingresar.');const mfa=securityMfa_(actor);
 if(b.action==='securityStatus')return {data:{enabled:!!mfa,required:actor.role==='admin',pending:!!actor.mfaPending,recoveryRemaining:mfa?.recovery.length||0,idleMinutes:120}};
 if(b.action==='beginTotp'){need_(!mfa,'La verificación en dos pasos ya está configurada.');const secret=hash_(Utilities.getUuid()+Utilities.getUuid()).slice(0,40),cache=CacheService.getScriptCache();cache.put('mfa-enroll:'+hash_(b.token),secret,600);const key=securityBase32_(secret);return {data:{secret:key,uri:'otpauth://totp/'+encodeURIComponent('Disfraz Cabezón:'+actor.username)+'?secret='+key+'&issuer=Disfraz%20Cabez%C3%B3n&algorithm=SHA1&digits=6&period=30'}};}
 if(b.action==='confirmTotp'){
  need_(!mfa,'La verificación en dos pasos ya está configurada.');const cache=CacheService.getScriptCache(),secret=cache.get('mfa-enroll:'+hash_(b.token));need_(secret,'La configuración venció. Volvé a generar el QR.');limit_('mfa-enroll:'+hash_(b.token),5,600);const step=securityCode_(secret,b.code,-1);need_(step!==null,'Código de autenticación inválido o vencido.');
  const codes=Array.from({length:10},()=>Utilities.getUuid().replace(/-/g,'').toUpperCase()),salt=Utilities.getUuid();props_().setProperty(securityMfaKey_(actor),JSON.stringify({secret,salt,recovery:codes.map(c=>hash_(salt+c)),lastStep:step,createdAt:now_()}));cache.remove('mfa-enroll:'+hash_(b.token));
  let browser;try{browser=JSON.parse(cache.get('mfa-browser:'+hash_(b.token))||'{}')}catch(_){browser={}}cache.remove('mfa-browser:'+hash_(b.token));cache.remove('session:'+hash_(b.token));securityKnownBrowser_(actor,browser);return {data:{...securityIssue_(actor),recoveryCodes:codes}};
 }
 need_(!actor.mfaPending,'Completá la verificación en dos pasos.');
 if(b.action==='securityActivity'){securityTouch_(b.token);return {data:{ok:true}};}
 if(b.action==='revokeSessions'){need_(actor.role==='admin','No tenés permiso para esta acción.');props_().setProperty('SECURITY_SESSION_EPOCH',Utilities.getUuid());return {data:{ok:true}};}
 need_(securityPasswordActor_({username:actor.username,password:b.password}).id===actor.id,'Contraseña actual incorrecta.');if(mfa)securityVerifyMfa_(actor,b.code);
 if(b.action==='disableTotp'){need_(actor.role==='editor','El administrador debe conservar la verificación en dos pasos.');props_().deleteProperty(securityMfaKey_(actor));securityNotify_('Verificación en dos pasos modificada','Cuenta: '+actor.username);return {data:{ok:true}};}
 if(b.action==='changeOwnPassword'){const record=passwordRecord_(b.newPassword);if(actor.role==='admin')props_().setProperty('ADMIN_PASSWORD_RECORD',JSON.stringify(record));else{const u=catalogAccount_(actor.id);u.password=record;u.sessionVersion=Utilities.getUuid();props_().setProperty('CATALOG_USER_'+u.id,JSON.stringify(u));}securityNotify_('Contraseña modificada','Cuenta: '+actor.username);return {data:{ok:true}};}
 return null;
}
function prepararSeguridadTanda4_(){need_(config_('ADMIN_PASSWORD_RECORD'),'Primero prepará las cuentas con contraseña cifrada.');props_().setProperty('SECURITY_SESSION_EPOCH',Utilities.getUuid());props_().setProperty('SECURITY_V1_ENABLED','yes');return {ready:true,adminMfa:'required-at-next-login',idleMinutes:120};}
