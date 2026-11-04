# Tanda 1 — catálogo, rendimiento y accesibilidad

Preparación para revisión, 2026-11-04. Rama creada desde `main` (`da20b88`). **Sin merge, sin instalación ni modificaciones de datos en producción.**

## Comportamiento

- `catalogData`, `catalog`, `siteTheme`, `localConfig` y `rentalConfig` no adquieren el ScriptLock de las escrituras. Reservas, administración, compras registradas y búsquedas sin resultado lo conservan.
- Se mantienen **15 segundos** de espera para escrituras: al quitar las lecturas de esa fila, las tres escrituras simultáneas del ensayo se completaron. Aumentarlo ahora prolongaría la espera percibida y no resolvería por sí mismo la contención.
- El catálogo público usa un esquema explícito `catalogVersion: 2`: campos necesarios para tarjetas, búsqueda, carrito y promociones; **sin stock exacto, garantía del producto, tarifa, notas, origen/importación ni historial**. `rentalConfig` conserva las garantías generales necesarias para explicar/calcular el alquiler.
- `available` indica disponibilidad; `purchaseMax` es `min(stock, 10)`. El adaptador del formulario de alquiler usa su límite de consulta de 20, que no representa inventario. El editor conserva su lectura autenticada de stock real.
- Cotillón inactivo queda afuera de la respuesta pública y de todas las búsquedas. Activo con stock cero permanece como agotado. El aviso del admin explica ambos casos.
- El servidor sigue leyendo productos, precios y promociones reales al preparar/enviar una reserva. La compra actual es una consulta por WhatsApp; la venta/movimiento se valida al registrarla en el backend. Esta tanda no incorpora un checkout nuevo.
- La instantánea comprimida se guarda durante 300 s en bloques ASCII de 80.000 caracteres, con manifiesto, generación y hash. Se publica el manifiesto al final: un bloque ausente/corrupto provoca reconstrucción, nunca JSON parcial.
- Se invalida por cambios de productos (incluidos edición rápida, publicaciones y fotos), categorías y lotes. Las propiedades de promociones, precios, tema y campaña también integran la clave de versión.
- Un UserLock independiente elige al constructor sin tomar el ScriptLock de las escrituras. En la implementación ejecutada como propietario, los seguidores comparten el resultado. CacheService es de mejor esfuerzo: tras 12 s sin un snapshot utilizable hay lectura directa de respaldo; con caché caída/evictada puede haber reconstrucciones duplicadas, sin error de sistema ocupado por el lock de escritores.
- Los botones de carrito/WhatsApp pasan a una franja dentro del flujo en todos los anchos; no permanecen superpuestos al desplazarse. En tablet/notebook se muestran como iconos con nombres accesibles. Ambos conservan un objetivo táctil de al menos 44 px.
- Logos WebP de 320 px con PNG de respaldo, una sola variante según el tema. Fuentes locales con sus licencias, imagen principal priorizada y decoración secundaria diferida. El fondo principal de Halloween tiene preload condicional.
- `robots.txt`, `sitemap.xml` y LocalBusiness incluyen las siete páginas públicas y los horarios aprobados. Quedan fuera del sitemap `/admin/`, `/constancia/`, `/solicitud/`, `/reserva-local/` y `/buscar/`. El pie muestra la dirección, Cómo llegar, lunes a viernes 10–14 y 16–20, sábados 10–17 y domingos cerrado; no se publica el horario de Rappi.

## Ensayo real de Apps Script

Se usó el proyecto de ensayo indicado por el dueño y una **copia nueva completa de la hoja real, posterior a PR37**, con `MAIL_MODE=disabled`. La copia antigua de PR32 se conservó. No se cambió el uso compartido de ningún archivo.

La implementación temporal admitía solamente las cinco lecturas públicas y `recordSearchMiss`; rechazaba los demás endpoints y exigía proyecto/copia de ensayo y correo deshabilitado. Se midió versión 1 con backend de `main` y versión 2 con estos cambios; al terminar **se archivó** la implementación. Se retiraron las ocho búsquedas sintéticas creadas en la copia. No se enviaron reservas ni mails.

### Tamaño y ejecución de catalogData

Los tiempos siguientes son de ejecución dentro de Apps Script, sin transporte HTTP. El tamaño es JSON UTF-8, sin compresión HTTP.

| Estado | Bytes | Productos públicos | Ejecución |
|---|---:|---:|---|
| Antes, tres llamadas | 1.687.248 | 1.574 | 1.581 / 1.723 / 2.342 ms |
| Después, caché fría | 998.053 | 1.230 | 3.080 ms |
| Después, caché lista | 998.053 | 1.230 | 460 / 436 ms |

Reducción de **40,85 %**. Las 344 fichas menos corresponden a Cotillón inactivo, que ahora se excluye. Las llamadas calientes reutilizaron el mismo `snapshotId`. La construcción fría cuesta más que una lectura anterior; ese trabajo se amortiza entre las visitas.

### 18 catálogos + 3 escrituras simultáneas

Cada fila es una ronda independiente de 21 solicitudes HTTP reales. Las escrituras fueron búsquedas ficticias sin resultados; no reservas ni operaciones de caja. p50/p95 se calculan sobre las lecturas exitosas e incluyen red, arranque y transferencia.

| Ronda | Lecturas correctas | Ocupado / errores de lectura | p50 | p95 | Escrituras aceptadas | Snapshots compartidos |
|---|---:|---:|---:|---:|---:|---:|
| Antes | 7/18 | 11 / 11 | 13.202 ms | 20.965 ms | 2/3 | — |
| Después, fría | 18/18 | 0 / 0 | 6.586 ms | 6.809 ms | 3/3 | 1 |
| Después, caliente | 18/18 | 0 / 0 | 2.082 ms | 11.085 ms | 3/3 | 1 |

La cola de escrituras ya no impide responder al catálogo. El p95 HTTP caliente aún tiene variación del servicio de Apps Script; no se promete un tiempo máximo de red.

## Lighthouse móvil

Lighthouse 13.6.0 sobre los exports estáticos de `main` y de esta rama, Chrome limpio por corrida, throttling móvil predeterminado, CPU ×4 y gzip para HTML/CSS/JS/SVG en ambos casos. Mismo catálogo controlado y transporte simulado a Apps Script en ambas versiones. Son mediciones comparables de laboratorio, **no una medición posterior en producción**; fotos públicas mantienen sus URLs.

| Tema | Antes: rendimiento | Antes: LCP | Después: rendimiento | Después: LCP |
|---|---:|---:|---:|---:|
| Default | 95 | 2,38 s | 100 | 1,38 s |
| Halloween | 71 | 8,64 s | 88 | 3,85 s |

Ambos cumplen ≥85 y LCP <4 s en esta medición. Logos transferidos: default 122.451 → 18.636 bytes; Halloween 2.353.474 → 56.666 bytes. No se descarga el logo del tema inactivo.

## Corona Princesa Plastica — exclusivamente en la copia

| ID | Resultado probado | Cambio efectivo |
|---|---|---|
| `excel-2115053557` | Activa, $2.500, stock 4 | Stock 3 → 4; precio y estado ya eran correctos |
| `excel-2115151669` | Inactiva, $2.000; conserva el resto | Active true → false |

Se usó `catalogWriteProduct_`, actor `owner-tanda1`, acción `owner_correction_corona`. **Dos registros `committed` en `historial_cambios`**, con antes/después consultables en el admin. La rutina entregada en `scripts/apps-script-ensayo/EnsayoCoronaTanda1.gs` impide ejecutarse fuera del proyecto/copia de ensayo; no instalarla en producción.

Para aplicar luego en la hoja real: autorización de publicación, respaldo de Cotillón con fecha, identificar los dos IDs, editar la primera a stock 4/precio 2500/activa y apagar la segunda mediante el admin autenticado; revisar ambos cambios en Historial. Si cualquier otro dato difiere de lo ensayado, detener y revisar. Para revertir, consultar los valores anteriores de cada entrada y aplicarlos mediante una nueva edición autenticada, que genera su propio historial (no hay botón genérico de deshacer para stock/estado). En la copia serían stock 3 y segunda ficha activa, siempre verificando que no haya cambios posteriores. **Ese cambio en producción queda pendiente de revisión.**

## Verificación

- Unitarias: **387/387**.
- Build limpio: carpeta `.next` eliminada, `npm ci`, `NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/mock/exec npm run build`; **17 rutas exportadas**.
- Playwright contra `out/`, sin servidor de desarrollo, sin reintentos: 70 casos × 10 proyectos (360, 390, 768, 1093 y 1366; default y Halloween).
- Corrida completa: **696/700**, con cuatro fallos del mismo test de polling al adelantar el reloj antes de finalizar la primera petición. Se corrigió exclusivamente la sincronización de ese test: espera la respuesta inicial y el retiro del iframe antes de adelantar 11 s. Repetición dirigida del caso en los diez proyectos: **10/10**. Los 700 escenarios quedan cubiertos entre ambas corridas; no se presenta como una única ejecución limpia de 700.
- Mock de carrito actualizado a rentalConfig v2. Se conservan las comprobaciones funcionales y se agregan casos de esquema público, agotados, inactivos, tope de 10, consulta de alquiler y descarga exclusiva del logo activo.
- Matriz visual: **70 escenarios**, 360/390/430/768/1093/1366/1920, dos temas, inicio/Disfraces/Cotillón/admin/editor. En páginas públicas se verifican posiciones superior, media y final: **0 superposiciones, 0 desbordes y 0 errores JavaScript**. El admin conserva su columna de stock; editor.local conserva sus permisos y presentación anteriores (sin esa columna en la tabla), y su respuesta autenticada conserva el stock real.
- Capturas, informes Lighthouse HTML/JSON, resultados Playwright y registros del ensayo se conservan localmente en la carpeta privada de salidas de la auditoría; no se suben capturas del admin ni catálogos/CSV privados a este repositorio público.

Para repetir E2E después del build limpio:

```powershell
npx playwright test --config=playwright.production.config.mjs --workers=4
```

## Instalación propuesta, después de aprobar

**Orden de compatibilidad: frontend primero y backend después.** El frontend nuevo acepta tanto la respuesta anterior con stock como el esquema v2. El frontend anterior necesita stock, por lo que no debe quedar frente al backend v2.

1. Anotar SHA de `main`, versión activa y URL `/exec` de Apps Script. Exportar respaldo de Código.gs y CatalogAccess.gs, propiedades y hoja antes de cambios de datos. No modificar URL ni credenciales.
2. Aprobar/mergear este PR y esperar Render Live. Comprobar que el frontend nuevo funciona con el backend anterior, catálogo y admin incluidos.
3. En **web-dc de producción**, reemplazar `Código.gs` por `backend/Code.gs` y `CatalogAccess.gs` por `backend/CatalogAccess.gs`. Agregar **un único `PublicCatalog.gs`** desde `backend/PublicCatalog.gs`.
4. Mantener los demás archivos PR37, AuthCrypto, Validation, LocalForms, LocalReceipts, RentalPricing y RentalPromotions. No instalar helpers de ensayo ni tocar importadores. Buscar duplicados de funciones antes de guardar. Recargar el editor y comparar el contenido completo guardado.
5. **No se requieren propiedades nuevas manuales**: `PUBLIC_CATALOG_REVISION` se crea al invalidar. Conservar SPREADSHEET_ID real, MAIL_MODE y el resto de propiedades productivas; no copiar propiedades del ensayo. Conservar la implementación ejecutada como propietario para la coordinación del constructor.
6. Implementar → Administrar implementaciones → elegir la implementación actual → lápiz → Nueva versión → descripción «Tanda 1 catálogo público y rendimiento» → Implementar, **misma URL `/exec`**.
7. Verificar en las tres direcciones el catálogo, búsqueda, tarjetas activas agotadas, exclusión de inactivos, carrito, consulta de alquiler, stock real en la administración y avisos del admin. Confirmar que catalog/catalogData no exponen stock exacto y que hay un snapshot compartido. Repetir Lighthouse contra el sitio publicado; las cifras de laboratorio no reemplazan esa verificación.
8. Aplicar la corrección de Corona con respaldo e historial según el apartado anterior. Revisar la invalidación y el resultado público.

Si falla el backend, volver a la versión anotada de la **misma implementación**; el frontend nuevo sigue siendo compatible con la respuesta anterior. Si hay que revertir ambos, backend anterior primero y luego frontend anterior. Los cambios de Corona se revierten separadamente mediante una nueva edición con los valores anteriores registrados. Esta guía no autoriza ni ejecuta la publicación.

## Referencias técnicas

- [CacheService: límites y expiración de mejor esfuerzo](https://developers.google.com/apps-script/reference/cache/cache).
- [LockService: ámbitos de ScriptLock y UserLock](https://developers.google.com/apps-script/reference/lock/lock-service).
- [Apps web: ejecución como propietario](https://developers.google.com/apps-script/guides/web).
- Fuentes y licencias OFL: `app/fonts/SOURCES.json`, `dmsans-OFL.txt`, `manrope-OFL.txt`.
