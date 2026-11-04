import {test,expect} from './theme-fixture.mjs';
import {localHarness,fixture,submission,png} from '../local-forms-harness.mjs';

async function setup(page,theme){
 const h=localHarness();h.settings.SITE_THEME=theme;h.settings.BANK_HOLDER='CUENTA DE ENSAYO';h.settings.BANK_ALIAS='solo.pruebas';h.settings.BANK_CUIT='00-00000000-0';h.settings.COTILLON_EXCEL_2026_STATE='ready';
 h.tables.categorias_disfraces.push({id:'adultos',area:'disfraces',name:'Hombres'},{id:'cabezones',area:'disfraces',name:'Cabezones'},{id:'ninos',area:'disfraces',name:'Niños'});
 const product={id:'adulto',area:'disfraces',name:'Adulto de ensayo',mode:'alquiler',rentPrice:60000,price:0,stock:20,active:true,categoryId:'adultos',categoryIds:['adultos'],category:'Hombres',image:'/catalog/robin.jpg',description:'Producto ficticio'};
 h.tables.disfraces.push(product,{...product,id:'cabezon',name:'Cabezón de ensayo',categoryId:'cabezones',categoryIds:['cabezones'],category:'Cabezones',rentPrice:75000},{...product,id:'venta',name:'Adulto solo venta',mode:'venta',price:25000,rentPrice:0},{...product,id:'nino',name:'Niño de ensayo',categoryId:'ninos',categoryIds:['ninos'],category:'Niños',mode:'venta',price:18000,rentPrice:0});
 await page.clock.setFixedTime(new Date('2026-10-29T15:00:00Z'));
 await page.addInitScript(theme=>localStorage.setItem('dc-site-theme',theme),theme);
 await page.route('https://script.google.com/**',async route=>{
  if(route.request().url()!=='https://script.google.com/macros/s/mock/exec')throw Error('Prueba intentó conectar a Apps Script real');
  const fields=new URLSearchParams(route.request().postData()||'');let result;
  try{result={ok:true,data:h.dispatch(JSON.parse(fields.get('payload')))}}catch(e){result={ok:false,error:e.message}}
  await route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><script>parent.postMessage(${JSON.stringify({type:'dc-apps-result',id:fields.get('bridgeId'),result}).replace(/</g,'\\u003c')},${JSON.stringify(fields.get('origin'))})</script>`});
 });
 return h;
}
async function identity(page,local){
 for(const [name,value]of Object.entries({fullName:'Cliente de Ensayo',dni:'12345678',birthDate:'1990-01-01',email:'ensayo@example.invalid',address:'Dirección ficticia 123',city:'CABA',phone:'1100000000',altPhone:'1100000001'}))await page.locator(`input[name="${name}"]`).fill(value);
 await page.getByRole('checkbox',{name:/18 años/}).check();await page.getByRole('checkbox',{name:local?/tratamiento de mis datos/:/aviso de privacidad/}).check();await page.getByRole('button',{name:'Continuar',exact:true}).click();
}
async function choose(page,local,n,category,id){
 const card=page.locator(local?'.local-costume':'.costume-item').nth(n);
 await card.getByRole('combobox').nth(0).selectOption(category);await card.getByRole('combobox').nth(1).selectOption(id);
}
async function attach(page,label){await page.getByLabel(label,{exact:true}).setInputFiles({name:'ENSAYO.png',mimeType:'image/png',buffer:Buffer.from(png.base64,'base64')});}
async function signature(page){
 const canvas=page.getByLabel('Dibujá tu firma',{exact:true});await canvas.hover({position:{x:40,y:60}});
 const b=await canvas.boundingBox();await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+120,{steps:15});await page.mouse.move(b.x+b.width*.3,b.y+145,{steps:10});await page.mouse.up();await expect(page.locator('.signature-placeholder')).toHaveCount(0);
}
async function shot(page,info,name){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath(name+'.png'),fullPage:/-catalogo(?:-corregido)?$/.test(name)});}
for(const theme of ['default','halloween']){
 test(`${theme}: cartel y etiquetas en portada y catálogo, detalle y exclusión de venta/Niños`,async({page},info)=>{
  const h=await setup(page,theme);await page.goto('/');await expect(page.getByRole('complementary',{name:'Promociones de alquiler'})).toContainText('2x1 en disfraces de adulto');await page.getByRole('complementary',{name:'Promociones de alquiler'}).scrollIntoViewIfNeeded();await shot(page,info,theme+'-inicio');
  await page.goto('/disfraces/');const cards=page.locator('.product-card');await expect(cards).toHaveCount(4);await expect(cards.filter({hasText:'Adulto de ensayo'}).locator('.rental-promo-tag')).toHaveText('2x1');await expect(cards.filter({hasText:'Cabezón de ensayo'}).locator('.rental-promo-tag')).toHaveText('3x2');
  for(const name of ['Adulto solo venta','Niño de ensayo'])await expect(cards.filter({hasText:name}).locator('.rental-promo-tag')).toHaveCount(0);
  await shot(page,info,theme+'-catalogo');await page.getByRole('button',{name:'Ver detalle de Adulto de ensayo',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Llevá 2 y pagá 1');await shot(page,info,theme+'-detalle-adulto');await page.getByRole('button',{name:'Cerrar detalle',exact:true}).click();await page.getByRole('button',{name:'Ver detalle de Cabezón de ensayo',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Llevá 3 y pagá 2');await expect(page.getByRole('dialog')).toContainText('75.000');await shot(page,info,theme+'-detalle-cabezon');
  for(const id of ['adulto-2x1','cabezon-3x2']){const c=h.dispatch({action:'rentalConfig'});h.dispatch({action:'saveRentalPromotion',token:h.token,revision:c.revision,promotion:{...c.promotions.find(p=>p.id===id),active:false}});}
  await page.evaluate(()=>sessionStorage.removeItem('dc-public-catalog-v2'));await page.reload();await expect(cards).toHaveCount(4);await expect(page.getByRole('complementary',{name:'Promociones de alquiler'})).toHaveCount(0);await expect(page.locator('.rental-promo-tag')).toHaveCount(0);
 });
 for(const local of [false,true])test(`${theme}: ${local?'local':'web'} completo, avisos, resumen y total del servidor`,async({page},info)=>{
  const h=await setup(page,theme);const failures=[];page.on('pageerror',e=>failures.push(e.message));await page.goto(local?'/reserva-local/':'/reservas/');await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeEnabled();await identity(page,local);
  const summary=page.locator(local?'.local-total':'.form-content .rental-pricing-summary');await choose(page,local,0,'adultos','adulto');await expect(summary).toContainText('Sumá otro disfraz de adulto y te sale gratis');
  await page.locator(local?'.local-costume':'.costume-item').nth(0).getByRole('spinbutton').fill('3');await page.getByRole('button',{name:'Agregar otro traje',exact:true}).click();await choose(page,local,1,'cabezones','cabezon');await page.locator(local?'.local-costume':'.costume-item').nth(1).getByRole('spinbutton').fill('2');
  await expect(summary).toContainText('Con un cabezón más, el tercero no lo pagás');await expect(summary.locator('.pricing-total')).toContainText('270.000');await expect(summary.locator('.pricing-guarantee')).toContainText('380.000');await expect(summary.locator('.pricing-discount')).toContainText('60.000');await expect(page.locator('#total')).toHaveCount(0);
  await page.locator(local?'input[name="pickupDate"]':'#pickupDate').fill('2026-10-30');await page.locator(local?'input[name="returnDate"]':'#returnDate').fill('2026-11-02');await page.getByRole('checkbox',{name:local?/Recibí en el local/:/recibido previamente por WhatsApp/}).check();await summary.evaluate(el=>window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-100,behavior:'instant'}));await shot(page,info,theme+(local?'-local':'-web')+'-resumen');
  if(!local)await expect(page.locator('.sidebar .pricing-total')).toContainText('270.000');await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await attach(page,'DNI · frente *');await attach(page,'DNI · dorso *');
  if(!local){await page.locator('input[name="docDate"]').fill('2026-10-01');await attach(page,'Documento con tu nombre y domicilio actual *');}
  await page.getByRole('checkbox',{name:local?/ambas fotos del DNI/:/nombre completo del formulario/}).check();await page.getByRole('button',{name:'Continuar',exact:true}).click();
  if(!local){await expect(page.locator('.payment-amount')).toContainText('135.000');await expect(page.locator('.form-content .pricing-total')).toContainText('270.000');await expect(page.locator('.bank-card')).toContainText('CUENTA DE ENSAYO');await shot(page,info,theme+'-web-pago');await attach(page,'Comprobante de pago *');await page.getByRole('button',{name:'Continuar',exact:true}).click();}
  await signature(page);await page.locator('input[name="clarification"]').fill('Cliente de Ensayo');await page.getByRole('checkbox',{name:local?/mis datos y las fotos/:/datos y documentos son auténticos/}).check();await page.getByRole('checkbox',{name:/Acepto los términos y condiciones/}).check();await shot(page,info,theme+(local?'-local':'-web')+'-firma');
  await page.getByRole('button',{name:local?'Firmar y enviar formulario':'Firmar y enviar solicitud',exact:true}).click();await expect(page.getByRole('heading',{name:local?'¡Recibimos tu formulario!':'¡Recibimos tu solicitud!',exact:true})).toBeVisible();expect(h.tables.reservas).toHaveLength(1);expect(h.tables.reservas[0].data.total).toBe(270000);expect(h.tables.reservas[0].pricingSnapshot.guarantee).toBe(380000);expect(failures).toEqual([]);
 });
 test(`${theme}: admin apaga, edita y crea promociones; nuevo formulario refleja cambio`,async({page},info)=>{
  const h=await setup(page,theme),b=submission(h,{...fixture(),items:[{...fixture().items[0],quantity:2}]});h.dispatch(b);const original=structuredClone(h.tables.reservas[0]);await page.addInitScript(token=>sessionStorage.setItem('dc-admin',token),h.token);await page.goto('/admin/');await page.getByRole('button',{name:'Promociones',exact:true}).click();
  const adult=page.getByRole('switch',{name:'Activar 2x1 en disfraces de adulto',exact:true});await expect(adult).toHaveAttribute('aria-checked','true');await adult.click();await expect(adult).toHaveAttribute('aria-checked','false');await expect(page.getByText('Promoción guardada.',{exact:false})).toBeVisible();expect(h.tables.reservas[0]).toEqual(original);await shot(page,info,theme+'-admin-promociones');
  await page.getByRole('button',{name:'Editar 2x1 en disfraces de adulto',exact:true}).click();await page.getByLabel('Nombre visible',{exact:true}).fill('2x1 adultos de ensayo');await page.getByRole('button',{name:'Guardar promoción',exact:true}).click();await expect(page.getByText('2x1 adultos de ensayo',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Nueva promoción',exact:true}).click();await page.getByLabel('Nombre visible',{exact:true}).fill('Próxima promoción');await page.getByLabel('Lleva N',{exact:true}).fill('4');await page.getByLabel('Paga M',{exact:true}).fill('3');await page.getByRole('button',{name:'Guardar promoción',exact:true}).click();await expect(page.getByText('Próxima promoción',{exact:true})).toBeVisible();
  await page.goto('/reservas/');await identity(page,false);await choose(page,false,0,'adultos','adulto');await page.locator('.costume-item').first().getByRole('spinbutton').fill('2');await expect(page.locator('.form-content .pricing-total')).toContainText('120.000');await expect(page.locator('.form-content .pricing-discount')).toHaveCount(0);
 });
}

for(const theme of ['default','halloween'])test(theme+': nueve fichas corregidas usan la promo y tarifa de su categoría principal',async({page},info)=>{
 const h=await setup(page,theme);h.tables.disfraces=[];h.tables.categorias_disfraces.push({id:'otros',area:'disfraces',name:'Otros'});
 const base={area:'disfraces',mode:'alquiler',price:0,stock:5,image:'/catalog/robin.jpg',description:'Ficha de catálogo en ensayo aislado',active:true};
 for(const name of ['Daddy Yankee','Lobo','Zenon','Maui'])h.tables.disfraces.push({...base,id:name,name,categoryId:'cabezones',categoryIds:['cabezones','adultos'],category:'Cabezones',rentPrice:75000,insuranceDeposit:100000,active:!['Zenon','Maui'].includes(name)});
 for(const name of ['Gorila','Tiburón','Banana','Banana Fortnite','Pancho 2']){const men=['Gorila','Tiburón'].includes(name);h.tables.disfraces.push({...base,id:name,name,categoryId:men?'adultos':'otros',categoryIds:men?['adultos','cabezones']:['otros'],category:men?'Hombres':'Otros',rentPrice:60000,insuranceDeposit:60000});}
 const full=h.ctx.products_('disfraces');for(const p of full){const type=p.category==='Cabezones'?'cabezon':'adulto';const c=h.dispatch({action:'rentalConfig'});expect(c.promotions.find(r=>r.category===type&&r.active).take).toBe(type==='cabezon'?3:2);expect(p.rentPrice).toBe(type==='cabezon'?75000:60000);}
 await page.goto('/disfraces/');const cards=page.locator('.product-card');await expect(cards).toHaveCount(7);
 for(const name of ['Daddy Yankee','Lobo'])await expect(cards.filter({has:page.getByRole('heading',{name,exact:true})}).locator('.rental-promo-tag')).toHaveText('3x2');
 for(const name of ['Gorila','Tiburón','Banana','Banana Fortnite','Pancho 2']){const card=cards.filter({has:page.getByRole('heading',{name,exact:true})});await expect(card.locator('.rental-promo-tag')).toHaveText('2x1');await expect(card).toContainText('60.000');}
 for(const name of ['Zenon','Maui'])await expect(cards.filter({has:page.getByRole('heading',{name,exact:true})})).toHaveCount(0);
 await shot(page,info,theme+'-catalogo-corregido');
});
