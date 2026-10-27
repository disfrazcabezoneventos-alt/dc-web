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
 await expect(page).toHaveURL(/\/$/);
 await page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/}).click();
 await expect(page.getByRole('dialog',{name:'Carrito de cotillón'})).toContainText('Máscara de fiesta');
 await page.getByRole('button',{name:'Cerrar carrito'}).click();
 if(await page.getByRole('button',{name:'Abrir menú'}).isVisible())await page.getByRole('button',{name:'Abrir menú'}).click();
 await page.locator('.site-header nav').getByRole('link',{name:'Disfraces',exact:true}).click();
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await page.goBack();
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 1 productos/})).toBeVisible();
 await page.goto('/cotillon/');
 await expect(page.locator('.cart-trigger span')).toHaveText('1');
});

test('la carga lenta no borra la selección y el acceso flotante conserva el scroll',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('dc-cotillon-cart-v1',JSON.stringify([{id:'mask-1',quantity:2}])));
 await mockBackend(page,undefined,1400);
 await page.goto('/cotillon/');
 await expect(page.getByRole('button',{name:/Abrir carrito de cotillón, 2 productos/})).toBeVisible();
 await expect(page.locator('.cart-trigger span')).toHaveText('2',{timeout:15000});
 await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
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
