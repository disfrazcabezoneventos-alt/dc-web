# Listas del administrador con filtros y edición rápida

PR draft separado, sin merge, despliegue de Apps Script ni cambios en producción.
Los ensayos usan datos ficticios: 60 disfraces y 1.200 productos de Cotillón.

## Comportamiento

- Filtros combinables por estado, categoría y búsqueda. La búsqueda ignora
  tildes y mayúsculas e incluye nombre, categorías, ID e ID de origen.
- Disfraces: incluye las categorías reales del área, por ejemplo Niños y
  Halloween. Filtrar por Halloween encuentra también un disfraz cuya categoría
  principal sea Niños y tenga Halloween como asociación secundaria.
- Cotillón: permite elegir grupos, categorías y subcategorías internas. Elegir
  una categoría superior incluye sus descendientes. «Sin categoría» encuentra
  fichas sin un vínculo resoluble en las categorías del área; se conserva el
  respaldo por nombre para registros heredados sin categoryId.
- Cada área conserva sus filtros y página mientras se usa el panel. El contador
  indica «Mostrando X de Y productos»: X son las filas renderizadas, Y el total
  del área. Se muestra además el total que coincide con los filtros.
- Páginas de **50** filas, con Anterior/Siguiente y rango de resultados.
  Los filtros se aplican sobre todos los datos antes de paginar. El navegador
  conserva la respuesta admin completa en memoria, pero no renderiza 1.200
  filas con imágenes y controles al mismo tiempo. No se cambió el contrato de
  descarga de admin ni se implementó paginación del lado del servidor.
- Tabla con foto pequeña, nombre, categoría principal, precio, stock, estado
  y acciones. En celular se convierte en tarjetas sin scroll horizontal.
- Venta muestra price; alquiler muestra rentPrice; «ambos» muestra los dos.
  Cada campo tiene Guardar y admite Enter. Stock exige entero 0–100000; precios
  0–100000000, redondeados a dos decimales. Vacíos y valores inválidos se avisan.
- El interruptor actualiza la vista inmediatamente. Una solicitud en curso
  bloquea los controles de esa fila para impedir doble envío. Si falla, se
  revierten solo sus campos y aparece un aviso, incluso si la fila había salido
  del filtro de habilitados. Precio y stock usan la misma recuperación de vista.
- Editar mantiene el formulario completo. Se conservan Clonar producto y
  Eliminar; estas acciones siguen usando sus caminos existentes.
- No se usa saveProduct como reemplazo si quickUpdate no está desplegado.
  Una implementación anterior devolverá error y la vista se revertirá.

## Contrato aditivo del backend

```json
{
  "action": "quickUpdate",
  "token": "TOKEN_DE_LA_SESION_DE_ENSAYO",
  "area": "disfraces",
  "id": "ID_DEL_PRODUCTO_DE_ENSAYO",
  "cambios": {"active": false, "stock": 3, "rentPrice": 65000}
}
```

Devuelve el producto actualizado. La nueva rama autentica con session_ antes
de leer el producto o llamar al helper. Retorna antes del mantenimiento global
existente de dispatch_: no recupera stock ni crea categorías como efecto lateral.
Se mantiene el bloqueo de doPost para serializar la escritura.

Solo admite claves propias active, stock, price, rentPrice. Rechaza cambios
vacíos, arrays, claves adicionales, tipos incorrectos, importes no finitos,
rangos inválidos, área o producto inexistentes y precios incompatibles con la
modalidad. Active exige boolean real; stock exige entero. Se valida el conjunto
completo antes de put_. No exige ni crea description.

Se combina el registro actual con ese parche mínimo, conservando categoryId,
categoryIds, description, image, thumbnail, modalidad, sourceId y todos los
metadatos ajenos. El cliente también fusiona únicamente los campos solicitados,
sin reemplazar las categorías proyectadas que recibió de admin.

Si hay stockPending para ese producto, cambiar stock se rechaza hasta resolver
el movimiento en Caja. No se borra el pendiente ni se fuerza una recuperación.
Precio/estado pueden actualizarse sin alterar ese movimiento.

Los indicadores priceKnown/stockUnknown y el límite orderLimit se conservan.
Por eso se informa en la fila cuando el precio sigue «a consultar», el stock
sigue «a confirmar» o el límite de pedidos difiere del stock físico; esas
decisiones se cambian desde Editar, fuera del parche rápido.

## H011: Cotillón deshabilitado sigue visible como agotado

Se conserva el comportamiento actual de la tienda: catalog/catalogData incluyen
Cotillón aunque active sea false. El interruptor cambia active, pero **no borra
ni oculta esa ficha de la tienda**. Se ve agotada y no permite agregarla al
carrito. La lista de admin incluye un aviso explícito para el operador.
Disfraces deshabilitados sí quedan fuera de la respuesta pública existente.
No se modificaron Catalog, carrito ni las reglas públicas de publicación.

## Verificación

Resultado final: **build limpio correcto, 150/150 pruebas unitarias y 28/28
casos Playwright**. Las 52 pruebas nuevas de backend y filtros están incluidas
en las 150. Playwright ejecutó siete casos en cada proyecto: escritorio
1440×1000, 390×844, 360×640 y 412×915. Se revisaron las capturas.

Para repetir solamente este recorrido sin modificar la configuración del repo,
crear `tmp/playwright-admin.config.mjs` con:

```js
import original from '../playwright.config.mjs';
import {fileURLToPath} from 'node:url';
export default {
 ...original,
 projects:[['desktop',1440,1000],['mobile-390',390,844],
  ['mobile-360',360,640],['mobile-412',412,915]].map(([name,width,height])=>
   ({name,use:{viewport:{width,height},isMobile:width<500,hasTouch:width<500}})),
 testDir:'../tests/e2e',testMatch:'admin-quick-edit.spec.mjs',
 outputDir:'../test-results',
 webServer:{cwd:fileURLToPath(new URL('..',import.meta.url)),
  command:'node docs/qa/mobile-actions/serve-static.mjs',
  url:'http://127.0.0.1:3017/admin/',reuseExistingServer:false,timeout:30000}
};
```

Desde la raíz del checkout en PowerShell:

```powershell
# Revisar que se está en el checkout de ensayo antes de limpiar artefactos.
if (Test-Path -LiteralPath .next) { Remove-Item -LiteralPath .next -Recurse -Force }
npm ci
$env:NEXT_PUBLIC_APPS_SCRIPT_URL='https://script.google.com/macros/s/mock/exec'
npm run build
npm test
npx playwright test --config tmp/playwright-admin.config.mjs
```

No continuar si algún comando falla. Las pruebas existentes de importación
requieren sus archivos originales ignorados en `tmp/`; si faltan, recuperarlos
por el canal privado habitual, sin publicarlos ni usar una hoja real. Para
regenerar las capturas, definir `DC_ADMIN_SCREENSHOTS=docs/admin-quick-edit`
antes de Playwright. La configuración conserva el ejecutable Chrome local
que usa el repo; adaptarlo únicamente en el archivo temporal si hace falta.

Las pruebas de backend evalúan Code.gs con servicios simulados. Playwright
evalúa el frontend servido desde out/ y conecta su endpoint mock al dispatch_
real ejecutado en un entorno Node aislado, con tablas ficticias en memoria.
No se usaron una cuenta ni una hoja de producción, credenciales reales,
Cloudinary, correo o un endpoint vivo de Apps Script.

Se cubren campos ajenos intactos (incluido Niños + Halloween), descripción vacía
o ausente, sesiones inválidas, tipos/rangos, modalidad, escritura parcial,
stockPending y H011. En el navegador: filtros combinados, áreas independientes,
50 filas de 1.200, paginación, Enter/Guardar, estado optimista, doble envío,
reversión tras error, validación y acceso al editor completo.

Build limpio mediante eliminar .next, npm ci y npm run build con URL mock.
La configuración Playwright temporal usa el out/ de producción en 3017, sin
modificar playwright.config.mjs ni recurrir a next dev.

### Capturas

Todas son locales, con datos ficticios. Se incluyen ambos temas y las dos áreas.

| Vista | Disfraces, default | Cotillón, default | Disfraces, Halloween | Cotillón, Halloween |
| --- | --- | --- | --- | --- |
| Escritorio 1440×1000 | [Ver](desktop-default-disfraces.png) | [Ver](desktop-default-cotillon.png) | [Ver](desktop-halloween-disfraces.png) | [Ver](desktop-halloween-cotillon.png) |
| Celular 390×844 | [Ver](mobile-390-default-disfraces.png) | [Ver](mobile-390-default-cotillon.png) | [Ver](mobile-390-halloween-disfraces.png) | [Ver](mobile-390-halloween-cotillon.png) |
| Celular 360×640 | [Ver](mobile-360-default-disfraces.png) | [Ver](mobile-360-default-cotillon.png) | [Ver](mobile-360-halloween-disfraces.png) | [Ver](mobile-360-halloween-cotillon.png) |
| Celular 412×915 | [Ver](mobile-412-default-disfraces.png) | [Ver](mobile-412-default-cotillon.png) | [Ver](mobile-412-halloween-disfraces.png) | [Ver](mobile-412-halloween-cotillon.png) |

Detalle de una tarjeta completa en 390×844:
[Disfraces](mobile-390-default-disfraces-fila.png),
[Cotillón](mobile-390-default-cotillon-fila.png),
[Disfraces Halloween](mobile-390-halloween-disfraces-fila.png),
[Cotillón Halloween](mobile-390-halloween-cotillon-fila.png).

La guía de despliegue está en [APPS_SCRIPT.md](APPS_SCRIPT.md). No se ejecutó.
