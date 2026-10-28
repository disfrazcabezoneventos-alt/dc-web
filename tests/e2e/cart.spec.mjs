import {test,expect} from '@playwright/test';

const products=[
 {id:'mask-1',area:'cotillon',name:'Máscara de fiesta',category:'Halloween',categoryId:'halloween',categoryIds:['halloween'],catalogGroups:['FECHAS ESPECIALES'],mode:'venta',price:1500,priceKnown:true,stock:3,rentPrice:0,image:'',description:'Para festejar',active:true},
 {id:'hat-2',area:'cotillon',name:'Sombrero de fiesta',category:'Halloween',categoryId:'halloween',categoryIds:['halloween'],catalogGroups:['FECHAS ESPECIALES'],mode:'venta',price:2000,priceKnown:true,stock:2,rentPrice:0,image:'',description:'Para festejar',active:true}
];
const categories=[{id:'halloween',area:'cotillon',name:'Halloween',group:'FECHAS ESPECIALES',storefront:true}];
async function mockBackend(page,state={products,categories,cotillonImportReady:true},delay=0){
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  const fields=new URLSearchParams(route.request().postData()||'');
  const action=JSON.parse(fields.get('payload')||'{}').action;
  const data=action==='catalogData'?state:action==='siteTheme'?{siteTheme:'default'}:null;
  const message={type:'dc-apps-result',id:fields.get('bridgeId'),result:{ok:true,data}};
  await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><script>parent.postMessage(${JSON.stringify(message)},${JSON.stringify(fields.get('origin'))})</script>`});
 });
}

test('el carrito sobrevive al logo, a otras páginas, a recargar y al botón Atrás',async({page})=>{
 await mockBackend(page);
 await page.goto('/cotillon/');
 await page.getByRole('button',{name:'Agregar al carrito'}).first().click();
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await page.locator('.site-header .wordmark').click();
 await expect(page).toHaveURL('http://127.0.0.1:3017/');
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/}).click();
 await expect(page.getByRole('dialog',{name:'Carrito de cotillón'})).toContainText('Máscara de fiesta');
 await page.getByRole('button',{name:'Cerrar carrito'}).click();
 if(await page.getByRole('button',{name:'Abrir menú'}).isVisible())await page.getByRole('button',{name:'Abrir menú'}).click();
 await page.locator('.site-header nav').getByRole('link',{name:'Disfraces',exact:true}).click();
 await expect(page).toHaveURL('http://127.0.0.1:3017/disfraces/');
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await page.goBack();
 await expect(page).toHaveURL('http://127.0.0.1:3017/');
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await page.goto('/cotillon/');
 await expect(page.locator('.cart-trigger span')).toHaveText('1');
});

test('la carga lenta no borra la selección y abrir el carrito conserva el scroll',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('dc-cotillon-cart-v1',JSON.stringify([{id:'mask-1',quantity:2}])));
 await mockBackend(page,undefined,1400);
 await page.goto('/cotillon/');
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 2 productos/})).toBeVisible();
 await expect(page.locator('.cart-trigger span')).toHaveText('2',{timeout:15000});
 await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 2 productos/}).scrollIntoViewIfNeeded();
 const before=await page.evaluate(()=>window.scrollY);
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 2 productos/}).click();
 await expect(page.getByRole('dialog',{name:'Carrito de cotillón'})).toContainText('Máscara de fiesta');
 await page.getByRole('button',{name:'Cerrar carrito'}).click();
 expect(await page.evaluate(()=>window.scrollY)).toBe(before);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dc-cotillon-cart-v1')))).toHaveLength(1);
});

test('actualiza stock y precio antes de preparar WhatsApp, y permite vaciar',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('dc-cotillon-cart-v1',JSON.stringify([{id:'mask-1',quantity:3,unitPrice:1000,priceKnown:true}])));
 await mockBackend(page,{products:[{...products[0],stock:2,price:1800}],categories,cotillonImportReady:true});
 await page.goto('/cotillon/');
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 3 productos/}).click();
 await expect(page.getByText(/Cambió el precio, la cantidad disponible/)).toBeVisible();
 await expect(page.getByRole('link',{name:/Enviar pedido por WhatsApp/})).toHaveCount(0);
 await page.getByRole('button',{name:'Actualizar mi carrito'}).click();
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 2 productos/})).toBeVisible();
 const href=await page.getByRole('link',{name:/Enviar pedido por WhatsApp/}).getAttribute('href');
 expect(decodeURIComponent(href)).toContain('2 × Máscara de fiesta');
 expect(decodeURIComponent(href)).toContain('3.600');
 await page.getByRole('button',{name:'Eliminar'}).click();
 await expect(page.getByText('Tu carrito está vacío.')).toBeVisible();
});

test('los cambios de otra pestaña llegan al carrito sin borrar datos',async({browser})=>{
 const context=await browser.newContext();
 const first=await context.newPage(),second=await context.newPage();
 await mockBackend(first);await mockBackend(second);
 await first.goto('http://127.0.0.1:3017/cotillon/');
 await second.goto('http://127.0.0.1:3017/');
 await first.getByRole('button',{name:'Agregar al carrito'}).first().click();
 await expect(second.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await context.close();
});

test('si falla el catálogo, conserva el carrito y ofrece reintentar',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('dc-cotillon-cart-v1',JSON.stringify([{id:'mask-1',quantity:1}])));
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||'');
  const action=JSON.parse(fields.get('payload')||'{}').action;
  const message={type:'dc-apps-result',id:fields.get('bridgeId'),result:action==='catalogData'?{ok:false,error:'Servicio temporalmente no disponible'}:{ok:true,data:{siteTheme:'default'}}};
  await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><script>parent.postMessage(${JSON.stringify(message)},${JSON.stringify(fields.get('origin'))})</script>`});
 });
 await page.goto('/cotillon/');
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/}).click();
 await expect(page.locator('.cart-panel [role="alert"]')).toContainText('Servicio temporalmente no disponible');
 await expect(page.locator('.cart-panel').getByRole('button',{name:'Reintentar'})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dc-cotillon-cart-v1')))).toHaveLength(1);
});

test('con almacenamiento bloqueado conserva la selección durante la navegación',async({page})=>{
 await page.addInitScript(()=>{
  Storage.prototype.getItem=function(key){if(key==='dc-cotillon-cart-v1')throw new Error('blocked');return null};
  Storage.prototype.setItem=function(key){if(key==='dc-cotillon-cart-v1')throw new Error('blocked')};
 });
 await mockBackend(page);
 await page.goto('/cotillon/');
 await page.getByRole('button',{name:'Agregar al carrito'}).first().click();
 await page.locator('.site-header .wordmark').click();
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/}).click();
 await expect(page.getByText(/Tu navegador no permite guardar el carrito/)).toBeVisible();
 await expect(page.getByRole('dialog',{name:'Carrito de cotillón'})).toContainText('Máscara de fiesta');
});

test('reintentar el catálogo conserva la búsqueda y no recarga toda la página',async({page})=>{
 let attempts=0;
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||'');
  const action=JSON.parse(fields.get('payload')||'{}').action;
  const result=action==='catalogData'&&++attempts===1?{ok:false,error:'Sin conexión temporal'}:{ok:true,data:action==='catalogData'?{products,categories,cotillonImportReady:true}:{siteTheme:'default'}};
  await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><script>parent.postMessage(${JSON.stringify({type:'dc-apps-result',id:fields.get('bridgeId'),result})},${JSON.stringify(fields.get('origin'))})</script>`});
 });
 await page.goto('/cotillon/');
 await expect(page.locator('.catalog .error-banner')).toContainText('Sin conexión temporal');
 await page.getByRole('textbox',{name:'Buscar productos'}).fill('Máscara');
 await page.evaluate(()=>window.__keepPage=true);
 await page.getByRole('button',{name:'Reintentar sin perder mi búsqueda'}).click();
 await expect(page.locator('.product-card')).toHaveCount(1);
 await expect(page.getByRole('textbox',{name:'Buscar productos'})).toHaveValue('Máscara');
 expect(await page.evaluate(()=>window.__keepPage)).toBe(true);
});

test('una ruta inexistente muestra una salida clara al inicio',async({page})=>{
 await page.goto('/ruta-que-no-existe/');
 await expect(page.getByRole('heading',{name:'Esta página no está disponible.'})).toBeVisible();
 await page.getByRole('link',{name:'Ir al inicio'}).click();
 await expect(page).toHaveURL(/\/$/);
});

test('la consulta de compra permite reintentar y recupera el disfraz elegido',async({page})=>{
 const costume={...products[0],id:'costume-1',area:'disfraces',name:'Disfraz de prueba',category:'Personajes',mode:'venta',saleCondition:'Nuevo inmediato'};
 let attempts=0;
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||'');
  const action=JSON.parse(fields.get('payload')||'{}').action;
  const result=action==='catalogData'&&++attempts===1?{ok:false,error:'Servicio temporalmente no disponible'}:{ok:true,data:action==='catalogData'?{products:[costume],categories:[],cotillonImportReady:true}:{siteTheme:'default'}};
  await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><script>parent.postMessage(${JSON.stringify({type:'dc-apps-result',id:fields.get('bridgeId'),result})},${JSON.stringify(fields.get('origin'))})</script>`});
 });
 await page.goto('/comprar/?producto=costume-1');
 await expect(page.locator('.error-banner')).toContainText('Servicio temporalmente no disponible');
 await page.getByRole('button',{name:'Reintentar sin perder mis datos'}).click();
 await expect(page.getByRole('combobox',{name:'Producto'})).toHaveValue('costume-1');
 await expect(page.getByText('Disfraz de prueba').last()).toBeVisible();
});

test('abrir el carrito consulta stock y precio nuevos aunque exista caché reciente',async({page})=>{
 await page.addInitScript(({oldProducts,categories})=>{
  localStorage.setItem('dc-cotillon-cart-v1',JSON.stringify([{id:'mask-1',quantity:1,unitPrice:1500,priceKnown:true}]));
  sessionStorage.setItem('dc-public-catalog-v1',JSON.stringify({at:Date.now(),data:{products:oldProducts,categories,cotillonImportReady:true}}));
 },{oldProducts:products,categories});
 await mockBackend(page,{products:[{...products[0],price:1800}],categories,cotillonImportReady:true});
 await page.goto('/cotillon/');
 await expect(page.locator('.product-card').first()).toContainText('1.500');
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/}).click();
 await expect(page.getByText(/Cambió el precio, la cantidad disponible/)).toBeVisible();
 await page.getByRole('button',{name:'Actualizar mi carrito'}).click();
 const href=await page.getByRole('link',{name:/Enviar pedido por WhatsApp/}).getAttribute('href');
 expect(decodeURIComponent(href)).toContain('1.800');
});

test('un disfraz conserva su selección al ir a comprar y a reservar',async({page})=>{
 const costume={...products[0],id:'costume-1',area:'disfraces',name:'Disfraz de prueba',category:'Personajes',categoryId:'personajes',mode:'ambos',rentPrice:1000,saleCondition:'Nuevo inmediato'};
 await mockBackend(page,{products:[costume],categories:[{id:'personajes',area:'disfraces',name:'Personajes'}],cotillonImportReady:true});
 await page.goto('/disfraces/');
 await page.getByRole('button',{name:'Ver detalle de Disfraz de prueba'}).click();
 await page.getByRole('link',{name:/Quiero comprar/}).click();
 await expect(page).toHaveURL(/\/comprar\/\?producto=costume-1/);
 await expect(page.getByRole('combobox',{name:'Producto'})).toHaveValue('costume-1');
 await page.goto('/disfraces/');
 await page.getByRole('button',{name:'Ver detalle de Disfraz de prueba'}).click();
 await page.getByRole('link',{name:/Quiero alquilar/}).click();
 await expect(page).toHaveURL(/\/reservas\/\?producto=costume-1/);
 await expect(page.locator('.rental-product-note')).toContainText('Disfraz de prueba');
});

test('el carrito conserva controles táctiles cómodos sin desbordar la pantalla',async({page})=>{
 await mockBackend(page);
 await page.goto('/cotillon/');
 await page.getByRole('button',{name:'Agregar al carrito'}).first().click();
 const cartButton=await page.locator('.floating-cart').boundingBox();
 const whatsappButton=await page.locator('.floating-wa').boundingBox();
 const separated=cartButton.x+cartButton.width<=whatsappButton.x||whatsappButton.x+whatsappButton.width<=cartButton.x||cartButton.y+cartButton.height<=whatsappButton.y||whatsappButton.y+whatsappButton.height<=cartButton.y;
 expect(separated).toBe(true);
 if(page.viewportSize().width<=760){
  for(const shortcut of await page.locator('.floating-cart,.floating-wa').all()){
   const box=await shortcut.boundingBox();
   expect(box.width).toBeGreaterThanOrEqual(44);
   expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const covered=await page.evaluate(()=>{
   const shortcuts=[...document.querySelectorAll('.floating-cart,.floating-wa')];
   const targets=[...document.querySelectorAll('.product-quick,.product-info strong,.site-footer a,.site-footer small')];
   let covered=false;
   for(const top of [0,document.body.scrollHeight/2,document.body.scrollHeight]){
    window.scrollTo({top,behavior:'instant'});
    covered ||= shortcuts.some(shortcut=>targets.some(target=>{
     const a=shortcut.getBoundingClientRect(),b=target.getBoundingClientRect();
     return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    }));
   }
   return covered;
  });
  expect(covered).toBe(false);
 }
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/}).click();
 await expect(page.getByRole('dialog',{name:'Carrito de cotillón'})).toContainText('Máscara de fiesta');
 for(const button of await page.locator('.cart-close,.cart-quantity button').all()){
  const box=await button.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
 }
 const overflow=await page.evaluate(()=>document.querySelector('.cart-panel').scrollWidth>document.querySelector('.cart-panel').clientWidth);
 expect(overflow).toBe(false);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
});
