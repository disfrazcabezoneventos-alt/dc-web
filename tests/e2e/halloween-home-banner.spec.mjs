import {test,expect} from '@playwright/test';
import fs from 'node:fs';

const title='Halloween es este sábado 🎃';
const message='Más de 300 disfraces para alquilar, disfraces de niños a la venta y todo el cotillón para tu fiesta. Elegí online y consultanos por WhatsApp.';
const before=JSON.parse(fs.readFileSync(new URL('../../docs/halloween-home-banner/before-layout.json',import.meta.url),'utf8'));
const sizes={'mobile-360':[360,640],'mobile-390':[390,844],'mobile-412':[412,915],desktop:[1366,900]};
async function mock(page,theme='default'){
 await page.addInitScript(theme=>{localStorage.setItem('dc-site-theme',theme);localStorage.setItem('dc-cotillon-cart-v1',JSON.stringify([{id:'mask-1',quantity:1}]));},theme);
 await page.route('https://script.google.com/macros/s/mock/exec',async route=>{
  const fields=new URLSearchParams(route.request().postData()||''),action=JSON.parse(fields.get('payload')||'{}').action;
  const data=action==='siteTheme'?{theme}:{products:[{id:'mask-1',area:'cotillon',name:'Máscara de fiesta',category:'Halloween',categoryId:'halloween',categoryIds:['halloween'],mode:'venta',price:1500,stock:3,rentPrice:0,image:'',description:'Para festejar',active:true},{id:'costume-1',area:'disfraces',name:'Disfraz de fiesta',category:'Halloween',mode:'alquiler',rentPrice:60000,price:0,stock:3,image:'',description:'Para festejar',active:true}],categories:[{id:'halloween',area:'cotillon',name:'Halloween',group:'FECHAS ESPECIALES',storefront:true}],cotillonImportReady:true};
  const response={type:'dc-apps-result',id:fields.get('bridgeId'),result:{ok:true,data}};
  await route.fulfill({status:200,contentType:'text/html',body:`<script>parent.postMessage(${JSON.stringify(response)},${JSON.stringify(fields.get('origin'))})</script>`});
 });
}
async function ready(page){await expect(page.getByText('Disfraz de fiesta',{exact:true})).toBeVisible();await page.evaluate(()=>document.fonts.ready);}
function overlap(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}

for(const theme of ['default','halloween']){
 test(`${theme}: franja antes de hero, textos, links y controles sin solaparse`,async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-10-28T12:00:00-03:00'));await mock(page,theme);await page.goto('/');await ready(page);
  const banner=page.getByRole('region',{name:title});await expect(banner).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await expect(banner.getByRole('heading',{level:2})).toHaveText(title);await expect(banner.locator('p')).toHaveText(message);
  const costume=banner.getByRole('link',{name:'Ver disfraces',exact:true}),cotillon=banner.getByRole('link',{name:'Cotillón de Halloween',exact:true});
  await expect(costume).toHaveAttribute('href','/disfraces/');await expect(cotillon).toHaveAttribute('href','/cotillon/');
  expect(await banner.evaluate(e=>e.nextElementSibling?.classList.contains('hero'))).toBe(true);
  const width=page.viewportSize().width;
  for(const link of [costume,cotillon]){
   const box=await link.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
   for(const control of [page.locator('.floating-wa'),page.locator('.floating-cart')]){
    await expect(control).toBeVisible();expect(overlap(box,await control.boundingBox())).toBe(false);
   }
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  if(process.env.DC_BANNER_SCREENSHOTS)await page.screenshot({path:`${process.env.DC_BANNER_SCREENSHOTS}/despues-${theme}-${info.project.name}.png`,animations:'disabled'});
  expect(errors).toEqual([]);
  await costume.click();await expect(page).toHaveURL(/\/disfraces\/$/);await expect(page.getByRole('region',{name:title})).toHaveCount(0);
  await page.goto('/');await expect(page.getByRole('region',{name:title})).toBeVisible();
  await page.getByRole('region',{name:title}).getByRole('link',{name:'Cotillón de Halloween'}).click();await expect(page).toHaveURL(/\/cotillon\/$/);await expect(page.getByRole('region',{name:title})).toHaveCount(0);
 });
 test(`${theme}: después del vencimiento restaura la portada anterior`,async({page},info)=>{
  await page.clock.setFixedTime(new Date('2026-11-02T12:00:00-03:00'));await mock(page,theme);await page.goto('/');await ready(page);
  await expect(page.getByRole('region',{name:title})).toHaveCount(0);
  expect(await page.locator('main').evaluate(e=>e.firstElementChild?.classList.contains('hero'))).toBe(true);
  const saved=before[theme+'-'+info.project.name]||before[theme+'-desktop'];
  expect(await page.locator('.hero').evaluate(e=>e.outerHTML)).toBe(saved.hero);
  expect(await page.locator('main').innerText()).toBe(saved.mainText);
  const target=sizes[info.project.name],viewport=page.viewportSize();
  if(target&&viewport.width===target[0]&&viewport.height===target[1])expect(await page.locator('.hero').boundingBox()).toEqual(saved.box);
 });
}
test('está visible un milisegundo antes del corte y desaparece en el instante exacto, sin recargar',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T02:59:58Z')});await page.clock.pauseAt(new Date('2026-11-01T02:59:59Z'));
 await mock(page);await page.goto('/');await expect(page.getByRole('region',{name:title})).toBeVisible();
 await page.clock.runFor(999);await expect(page.getByRole('region',{name:title})).toBeVisible();
 await page.clock.runFor(1);await expect(page.getByRole('region',{name:title})).toHaveCount(0);
});
test('al abrir exactamente a medianoche argentina no aparece',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-01T03:00:00Z'));await mock(page);await page.goto('/');await ready(page);
 await expect(page.getByRole('region',{name:title})).toHaveCount(0);
});
test('el corte usa el instante argentino aunque el visitante esté en Tokio',async({browser})=>{
 const context=await browser.newContext({timezoneId:'Asia/Tokyo'}),page=await context.newPage();
 await page.clock.setFixedTime(new Date('2026-11-01T02:59:00Z'));await mock(page);await page.goto('http://127.0.0.1:3017/');await expect(page.getByRole('region',{name:title})).toBeVisible();
 await page.clock.setFixedTime(new Date('2026-11-01T03:00:00Z'));await page.reload();await ready(page);await expect(page.getByRole('region',{name:title})).toHaveCount(0);await context.close();
});
