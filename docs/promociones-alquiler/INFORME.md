# Promociones de alquiler — PR37 para revisión

El PR continúa en draft: no se fusionó y el backend de promociones no se instaló ni desplegó en Apps Script. Las correcciones de catálogo sí se aplicaron a la hoja real con la autorización expresa del 3/11/2026.

## Regla comercial definitiva

| Tipo | Alquiler por traje | Garantía por traje | Promoción activa |
| --- | ---: | ---: | --- |
| Adulto | $60.000 | $60.000 | 2x1 |
| Cabezón | $75.000 | $100.000 | 3x2 |

Solo alquiler; no venta ni Niños. Se acumulan cantidades dentro de cada tipo y no se mezclan los grupos. Sin vencimiento, hasta que el administrador apague la promoción. La garantía se cobra por TODOS los trajes, incluidos los bonificados.

Ejemplo verificado en web y local: **3 adultos + 2 cabezones** → subtotal $330.000, descuento $60.000, alquiler $270.000, seña $135.000 y garantía separada $380.000.

## Corrección autorizada de la hoja real

Fuente: Disfraz Cabezón — tienda y reservas, ID `1yY0ZdMkVZs0E_VFVwOqjStVMfFfHzmAA7sgHwWjm6D4`. Antes de editar se duplicó íntegra la pestaña `disfraces` como **`disfraces_respaldo_promos_20261103`** (sheetId `1550062087`). Se leyó de nuevo el respaldo y el original y se comprobó su igualdad antes del cambio.

- 54 fichas de la antigua tarifa Premium: únicamente `rentPrice`, `insuranceDeposit` y `tariff` pasaron a 60000, 60000 y Estándar.
- Daddy Yankee, Zenon, Lobo y Maui: Cabezones como principal; conservaron su categoría anterior como secundaria y los demás vínculos. Conservan 75000 / 100000.
- Gorila y Tiburón: 60000 / 60000, Estándar; no se cambiaron sus categorías.
- Banana, Banana Fortnite y Pancho 2: Otros como principal; se retiró el vínculo a Cabezones, con 60000 / 60000 y Estándar. Pancho también quedó con los valores de adulto dentro del grupo de 54.

**61 fichas únicas modificadas: 31 activas y 30 inactivas.** Banana Fortnite y Pancho 2 se cuentan en dos indicaciones comerciales, pero cada ficha se escribió una sola vez. No se alteraron stock, fotos, descripciones, nombres, estados ni ningún campo ajeno a lo solicitado. Tampoco se modificaron reservas, movimientos o cancelaciones. Se conservaron los datos históricos de importación.

Se aplicaron los 61 JSON y se agregaron sus 61 entradas `rental_catalog_correction` a `historial_cambios` en un mismo batch atómico. Cada registro contiene antes/después, campos cambiados, fecha real, actor identificable `correccion-autorizada-PR37`, lote `PR37-20261103` y nombre del respaldo. La relectura comprobó los 559 productos y las 61 entradas completas, sin cambios inesperados.

### Auditoría final

**559 fichas, 443 que admiten alquiler: 0 diferencias de precio y 0 de garantía**, comparando categoría principal y campos vigentes con la tabla comercial. Ya no hay tarifa Premium vigente de alquiler. La auditoría incluye fichas activas e inactivas.

CSV completo de las 443 fichas, CSV anteriores y registro privado antes/después: **`C:\Users\Usuario\OneDrive\Escritorio\excel-tienda\salidas\`**. No se publican en este repositorio.

Zenon y Maui siguen **inactivos**. El cálculo los clasifica como Cabezones / 3x2, pero no aparecen en el catálogo público; no se habilitaron para conseguir una captura. Daddy Yankee y Lobo sí aparecen con 3x2 en el ensayo del frontend del PR. Gorila, Tiburón, Banana, Banana Fortnite y Pancho 2 aparecen con 2x1 y $60.000. Las etiquetas son una función de este PR todavía sin desplegar: no se afirma que ya estén en producción.

### Reversión desde el admin

La versión actual del admin permite deshacer categorías y restaurar fotos, pero no estos campos económicos. El PR agrega **Deshacer corrección de alquiler** en Usuarios e historial, exclusivamente para estos registros autorizados. Requiere sesión de administrador y revisión vigente. Solo repone los seis campos permitidos presentes en el cambio; conserva stock, descripción y demás modificaciones posteriores. Si alguno de los campos corregidos cambió nuevamente, frena sin escribir. La reversión genera su propia entrada `undo_rental_catalog_correction`; conserva la entrada original.

Esta función estará disponible **después de instalar el backend y publicar el frontend aprobados**. No se ejecutó ninguna reversión real. El respaldo completo permite una recuperación manual por ID, siempre con aprobación; no se debe reemplazar toda la pestaña a ciegas si hubo cambios posteriores.

## Implementación y documentos

`lib/rental-pricing.ts` es la fuente única del cálculo, con centavos enteros. `scripts/generate-rental-pricing.mjs` genera `backend/RentalPricing.gs`, verificado con paridad de objetos completos. La garantía es fija por tipo; no se descuenta con la promoción.

`RentalPromotions.gs` guarda `RENTAL_PROMOTIONS_V1`; la preparación manual precarga ambas activas una sola vez y repetirla no reactiva promociones apagadas. `rentalConfig` solo lee. `saveRentalPromotion` es exclusivo del administrador, valida campos, reglas y revisión antes de escribir.

Web y local comparten resumen y cálculo. El servidor ignora totales adulterados, valida productos y categorías y conserva un snapshot inmutable de precios, reglas, bonificaciones, descuento, total y garantía aceptados. Las reservas previas no se recalculan. Si cambia la configuración antes del envío, el formulario exige volver a revisar y firmar. Los formularios anteriores siguen siendo compatibles y su monto declarado queda informativo, separado del total calculado.

Mails, revisión del admin, constancias y PDF conservan el cálculo original; cualquier ajuste administrativo posterior se identifica aparte. Caja contabiliza solo cobros verificados y conserva la garantía por separado. La caché pública puede tardar hasta 60 segundos en reflejar una etiqueta; el servidor consulta la configuración vigente al crear cada reserva.

Términos online **DC-2026-11-03.2** y local **DC-LOCAL-2026-11-03.2**: precios definitivos, 2x1 / 3x2 solo alquiler mientras estén activas y garantía por traje incluido el bonificado. No hay importes de la tarifa anterior en el código operativo de formularios, garantías, mails, PDFs o constancias.

El contrato público recupera las **cinco páginas del diseño anterior**, logo, tablas, colores y casilleros. El generador reutiliza el PDF anterior como base, elimina los bloques de texto reemplazados del contenido PDF y agrega los nuevos: no deja texto obsoleto escondido debajo. Conserva tildes, ñ, comillas tipográficas y guiones largos. Se revisaron visualmente las cinco páginas. Para regenerar: `node scripts/generate-terms-pdf.mjs`, con Python, pypdf y reportlab; `PDF_PYTHON` permite indicar el intérprete.

Los importadores históricos y sus manifiestos permanecen intactos: contienen valores del catálogo original y **no se deben volver a ejecutar para fijar precios actuales**. No son la fuente del cálculo de alquiler. Tampoco se ejecutaron durante esta corrección.

## Privacidad del repositorio

Las capturas del admin y los CSV se guardaron en la carpeta privada indicada. `.gitignore` impide agregarlos nuevamente. La rama del PR se reconstruye sobre main y se publica con `--force-with-lease` únicamente sobre `codex/promociones-alquiler`, según la autorización expresa para reescribirla. Los commits alcanzables de esa rama no incluyen esos archivos ni sus blobs anteriores. La galería pública solo contiene páginas públicas y formularios con datos ficticios.

GitHub puede conservar objetos antiguos desreferenciados y vistas en caché: limpiar la rama no permite garantizar su eliminación física de los servidores de GitHub. No se publica ningún enlace a los objetos retirados.

## Instalación y validación

Ver [INSTALACION.md](INSTALACION.md), [VALIDACION.md](VALIDACION.md) y la [galería pública](capturas.html). Se conservan las funciones de #35 y #36, incluido el registro de búsquedas. No se fusiona, instala ni despliega hasta revisión y autorización.
