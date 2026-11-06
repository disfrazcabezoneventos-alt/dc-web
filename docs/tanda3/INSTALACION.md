# Tanda 3: instalación después de aprobar el draft

Esta rama no instala Apps Script, no crea activadores ni hooks y no modifica datos de producción. La calificación inicial informada por el dueño es 4,7 / 717 opiniones / 05/11/2026; también coincide con la ficha Google observada durante la revisión. No se copian reseñas ni se agrega aggregateRating al JSON-LD.

## 1. Respaldo y backend

1. Anotar la versión activa de **web-dc** y su URL `/exec`. Descargar una copia externa de todos los `.gs` y las propiedades antes de reemplazar archivos.
2. En el mismo proyecto, reemplazar **Código.gs** (archivo del repo `backend/Code.gs`), **CatalogAccess.gs**, **PublicCatalog.gs** y **Validation.gs**. Agregar **SiteInfo.gs** y **CatalogPages.gs**, una sola vez cada uno. Conservar RentalPricing, RentalPromotions, LocalForms, LocalReceipts y AuthCrypto, y el registro de búsquedas de PR36. No se modifica el importador.
3. No hace falta modificar `SPREADSHEET_ID`, la URL /exec ni las tarifas. Los campos públicos usan la propiedad nueva **SITE_PUBLIC_INFO_V1**: si todavía no existe, el backend responde los valores iniciales de Google; el primer guardado desde Configuración del sitio la crea.
4. Implementar → Administrar implementaciones → lápiz de la misma implementación web → Nueva versión → descripción **Confianza y páginas de productos Tanda 3** → Implementar. Conservar acceso y URL /exec existentes. Anotar el número nuevo.
5. Verificar `siteInfo` y `catalogData`: 4,7, 717, `2026-11-05`, fotos vacías y Rappi vacío. Son lecturas sin ScriptLock. `saveSiteInfo` requiere sesión de admin; editor y anónimos son rechazados.

## 2. Frontend

1. Tras aprobar el PR: Ready for review → merge normal a main → esperar Render Live.
2. Render conserva `npm ci && npm run build` y directorio publicado `out`. Confirmar **NEXT_PUBLIC_APPS_SCRIPT_URL** con la URL /exec activa. **PRODUCT_CATALOG_FILE no debe definirse en Render**: cada build obtiene una copia pública actual por `catalogData`. Si falla la lectura o devuelve un catálogo vacío, el build falla para conservar el deploy anterior.
3. El build genera una ruta `/p/{id}/` por producto activo y publicado, más su entrada del sitemap. El JSON intermedio de `generated/` está ignorado por Git. Solo se guardan campos públicos; no stock exacto, garantías, tarifas, notas, historial ni importación.
4. Comprobar las tres direcciones, un producto por área, meta `og:image` con su foto y precio en descripción. La ficha refresca disponibilidad antes de habilitar acciones. Compartir utiliza esa ruta si ya se construyó; productos nuevos usan la ficha actual con hash hasta el siguiente build.

## 3. Hook privado y activador diario

1. Render → dc-web → **Settings** → **Deploy Hook**. Copiar la URL desde ese panel. Nunca pegarla en el repo, un PR, logs ni capturas.
2. Apps Script → Configuración del proyecto → Propiedades del script → agregar **RENDER_CATALOG_DEPLOY_HOOK** con esa URL completa. No lleva prefijo NEXT_PUBLIC.
3. Elegir la función **prepararPaginasCatalogo_** y ejecutarla una vez desde el editor, con la cuenta dueña. Autorizar solo los permisos de Apps Script que correspondan. Crea un único activador de **rebuildCatalogPagesNightly_**, todos los días a las **03:00 de Argentina, aproximadamente ±15 minutos**. Repetir preparar no duplica el activador ni marca cambios ficticios. Si no hubo modificaciones del catálogo, la primera ejecución tampoco solicita un build.
4. Los cambios del catálogo (incluidos precios, promos y tema) marcan `CATALOG_PAGES_DIRTY_REVISION`. El activador no hace nada cuando esa revisión ya se envió. Agrupa todos los cambios pendientes en un build por día. No hace POST a Render mientras mantiene el ScriptLock. Una edición durante ese POST queda pendiente para el día siguiente.
5. Propiedades internas automáticas: `CATALOG_PAGES_LAST_TRIGGERED_REVISION`, `CATALOG_PAGES_LAST_TRIGGERED_DAY`, `CATALOG_PAGES_INFLIGHT_AT`. No editarlas a mano. Un HTTP 2xx confirma que Render **aceptó** el build; no que haya terminado Live. Revisar Render Events para verificar el resultado. Si Render rechaza la solicitud, queda pendiente y el error no expone la URL.
6. Si un build aceptado falla después, corregir la causa y ejecutar **reintentarPaginasCatalogo_**: es un reintento manual explícito, puede superar el límite diario. Para suspender los builds programados, quitar ese activador desde Apps Script. El catálogo web sigue funcionando en vivo aunque las vistas previas estén esperando un build.

Referencias: [hooks de Render](https://render.com/docs/deploy-hooks), [horario aproximado de activadores](https://developers.google.com/apps-script/reference/script/clock-trigger-builder).

## 4. Configuración del sitio y QR

- Admin → **Configuración del sitio**. Solo admin. Calificación acepta coma o punto; cantidad es entero. La fecha cambia al cambiar los valores. Guardar fotos o Rappi no renueva la fecha de opiniones. Borrar ambos campos y guardar oculta la calificación; un campo incompleto también la oculta.
- Hasta cuatro fotos con la subida Cloudinary existente, descripción accesible y miniatura. Subir no publica hasta **Guardar configuración del sitio**. Sin fotos, no hay bloque vacío en la tienda.
- No se encontró un enlace Rappi configurado en la web. Queda un campo opcional para su URL, sin botón público mientras esté vacío.
- El PDF A5 **/qr-opiniones-google.pdf** ya está preparado para imprimir al 100%. Apunta a `https://search.google.com/local/writereview?placeid=ChIJS7DHjj3KvJURGUymDvR0_PE`. Se comprobó que abre Escribir una opinión de Cotillón Disfraz Cabezón. No se publicó ninguna opinión.
- El Place ID proviene de [la ficha pública de Waze](https://www.waze.com/live-map/directions/ar/cdad.-autonoma-de-buenos-aires/caba/cotillon-disfraz-cabezon?to=place.ChIJS7DHjj3KvJURGUymDvR0_PE); el CID codificado coincide con **17436940448838339609**. Verificado además en Google.

## 5. Condiciones coordinadas y reversión

Versión web **DC-2026-11-05.2** y local **DC-LOCAL-2026-11-05.2**. Garantía en efectivo al retirar. En el local, reintegro en el momento si está todo en condiciones; por envío o mensajería, transferencia después de revisar los trajes. Se actualizan web, backend, resumen imprimible local y modelo PDF. Los contratos anteriores conservan su texto y versión originales. El PDF mantiene las cinco páginas diseñadas y agrega una sexta con medios de pago y envíos.

Si hace falta revertir tras instalar: desactivar el activador, restaurar la versión Apps Script anotada y revertir el merge del frontend mediante un commit normal. La nueva propiedad es aditiva y no afecta al backend anterior. No se borran datos ni contratos históricos.

## 6. Desarrollo y QA reproducible

Para datos ficticios: `NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/mock/exec` y `PRODUCT_CATALOG_FILE=tests/fixtures/product-pages.json`. Sin endpoint también se usa la muestra en modo demo. Un endpoint real que falla nunca usa la muestra como fallback.

Antes de build: eliminar únicamente `.next` dentro del checkout verificado, ejecutar `npm ci`, y `npm run build`. Servir `out/` en 3017. Playwright usa una configuración temporal externa sin servidor next dev; la matriz es 360, 390, 768, 1093 y 1440, ambos temas. Las reservas y escrituras de pruebas usan backend simulado, nunca producción.

Los metadatos de compartir conservan el precio/foto del último build, mientras la ficha visual y las acciones consultan disponibilidad/precio actuales. Después de cambiar la configuración del local, recargar la web pública para ver los valores guardados.
