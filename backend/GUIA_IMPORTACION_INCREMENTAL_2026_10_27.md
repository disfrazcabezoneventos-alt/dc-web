# Guía de importación incremental de Cotillón — 27/10/2026

**Estado actual: PR #8 en borrador. No fusionarlo ni ejecutar la carga real hasta que el dueño de la tienda lo confirme.** Esta guía explica los pasos posteriores a esa confirmación. No hay que reemplazar `Code.gs`, `Validation.gs` ni la URL de Render.

## Qué se va a cargar

- Archivo preparado: `backend/import-cotillon-incremental-2026-10-27.json`, con 661 productos del Excel. Su identidad es el ID de Rappi.
- 107 altas y 87 actualizaciones de productos existentes: **194 operaciones en 13 lotes** (12 lotes de 15 y el último de 14). Otros 467 productos existentes no requieren escritura.
- Las primeras 24 altas son de Halloween. Las 107 altas requieren foto en Cloudinary antes de quedar activas.
- Dentro de las 87 actualizaciones hay 14 productos actualmente inactivos que recuperaron stock. Sus 14 fotos y 14 miniaturas respondieron HTTP 200 en la revisión del 27/10/2026. Apps Script repetirá ambas comprobaciones justo antes de reactivar cada producto. Si una falla, ese producto queda inactivo y sin escritura, y aparecerá en la lista de fallos.
- Precio y stock se comparan con una referencia previa: un cambio manual posterior se respeta. El importador no reemplaza nombres, descripciones, categorías ni fotos de productos existentes. Para los 14, también exige que foto, miniatura, precio, stock y estado sigan coincidiendo con la referencia antes de reactivar.
- Los 24 globos sin ID de Rappi van en otra etapa y otro PR.

## 1. Después de autorizar el PR #8: preparar Apps Script

1. Confirmá que el PR #8 esté fusionado a `main`. **No hacerlo todavía.** El archivo de importación se descarga de `main` y se comprueba con SHA-256; antes de la fusión, esta comprobación detendrá el proceso sin escribir nada.
2. Abrí el proyecto de Apps Script **`web-dc`** que ya usa la tienda. Comprobá el nombre arriba a la izquierda. No uses otro proyecto de notificaciones.
3. En la columna izquierda, junto a **Archivos**, hacé clic en **+** y elegí **Secuencia de comandos**. Escribí `CotillonIncremental20261027` como nombre. Apps Script agregará `.gs`.
4. Abrí en el repositorio [CotillonIncremental20261027.gs](./CotillonIncremental20261027.gs), copiá **todo** su contenido y pegalo en el archivo nuevo de Apps Script. Guardá con **Ctrl + S** y esperá a que desaparezca el aviso de cambios sin guardar. No pegues fragmentos en `Código.gs`.
5. En Apps Script, abrí el engranaje **Configuración del proyecto** → **Propiedades del script**. Revisá que existan `SPREADSHEET_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. Conservá sus valores existentes. No compartas ni publiques las claves.
6. Agregá `COTILLON_INC_20261027_TEST_ID` con este valor, que apunta a una copia limpia separada de producción: `1gDEA3WGzKmTlVlJ8AwDJc2-VsXSDXPePiw8f-dV__uE`. [Abrir copia limpia de prueba](https://docs.google.com/spreadsheets/d/1gDEA3WGzKmTlVlJ8AwDJc2-VsXSDXPePiw8f-dV__uE/edit). Guardá las propiedades. **No agregues todavía** `COTILLON_INC_20261027_APPROVED`.

Estas funciones se ejecutan desde el editor. Por eso, **agregar solo este archivo no requiere crear otra implementación web ni cambiar la URL `/exec` de Render**. La autorización de Google puede aparecer al primer uso: revisá los permisos y aceptá para tu propio proyecto `web-dc`.

## 2. Probar primero en la copia limpia

1. Arriba, en **Seleccionar función para ejecutarla**, elegí `previsualizarCotillon27Copia` y pulsá **Ejecutar**. Abrí **Registro de ejecución**. Esperá: `fuente: 661`, `altas: 107`, `actualizaciones: 87`, `reactivaciones: 14`, `sinCambios: 467`, `conflictos: 0`. Si no coincide, detenete; puede haber cambiado la copia o el archivo fuente.
2. Elegí `probarLoteCotillon27Copia` y pulsá **Ejecutar**. La primera vez crea `cotillon_respaldo_20261027_test` antes de escribir. Mirá `procesados` en el registro; normalmente será 15.
3. Volvé a pulsar **Ejecutar** la misma función hasta completar **13 ejecuciones con operaciones**: las primeras 12 procesan hasta 15 cada una y la 13.ª procesa 14. Sumá los `procesados`: deben dar **194**. No ejecutes 13 veces a ciegas si alguna devuelve menos de 15 o un error; revisá el registro.
4. Ejecutá una 14.ª vez como comprobación: debe decir `procesados: 0`. En la copia, `cotillon` debe tener **1.313 productos** (1.314 filas contando encabezado), y el respaldo debe tener **1.206 productos** (1.207 filas contando encabezado). Las 14 reactivaciones deben quedar activas. Las 107 altas de esta **prueba** quedan inactivas y sin subir fotos a Cloudinary.
5. Revisá que `categorias_cotillon` no haya cambiado. Si hay `conflictos` o fallos de fotos, no continúes a producción.

Esta prueba en la copia limpia la tendrás que ejecutar vos desde Apps Script; yo ya hice la simulación completa y escribí sus 194 operaciones en **otra** copia nativa de Google Sheets. Comprobé todos los registros finales, el respaldo y las categorías. Todavía no ejecuté el archivo `.gs` dentro del servicio real de Apps Script.

## 3. Carga real: solo con confirmación expresa

1. En la hoja **de producción**, usá **Archivo → Descargar → Microsoft Excel (.xlsx)** para guardar una copia externa inmediatamente antes de la carga. Dejá esa descarga intacta. Comprobá que `SPREADSHEET_ID` sigue apuntando a producción y que `COTILLON_INC_20261027_TEST_ID` apunta a la copia de prueba; nunca deben ser iguales.
2. Ejecutá `previsualizarCotillon27Produccion`. Compará sus números con los del paso 2. Si hubo cambios desde la exportación inicial, detenete para revisar; el importador preserva los campos editados a mano, pero el resumen puede cambiar.
3. Solo tras confirmar la carga real, agregá en **Propiedades del script** `COTILLON_INC_20261027_APPROVED` con el valor exacto `c5108e1fd799b253a3db3fe41d9ef9959ce31fe62f3a7304229169d8f0b7173d`. Es el sello del archivo revisado, no una contraseña. Guardá.
4. Elegí `aplicarLoteCotillon27Produccion` y pulsá **Ejecutar**. La primera ejecución crea `cotillon_respaldo_20261027_production` dentro de la hoja, antes de la primera escritura. Comprobá que la pestaña exista.
5. Repetí la función y observá `procesados`, `reactivadasEnEsteLote` y `fotosFallidasEnEsteLote`. Sin fallos ni cambios nuevos, habrá **13 ejecuciones con operaciones** para las 194: 12 de 15 y una de 14. Una ejecución adicional debe devolver `procesados: 0`. La carga es reanudable: si cerrás Apps Script, podés volver y continuar. No cambia los IDs existentes ni duplica un alta ya escrita.
6. Las 107 fotos nuevas pasan por el flujo existente de Cloudinary. Cada producto nuevo se escribe activo solo después de subir foto y miniatura. Las 14 reactivaciones vuelven a comprobar por HTTP ambas imágenes; una foto fallida deja el producto inactivo y sin escritura.
7. Al terminar, revisá `/cotillon` en la web pública: Halloween primero, fotos, categorías, stock, carrito y el texto preparado de WhatsApp. Podés abrir el mensaje, **sin enviarlo** ni hacer una compra real. La página lee Google Sheets: no hace falta redeploy de Render únicamente por estos datos.

## Si aparece un error

- **No se pudo obtener la importación / cambió el SHA-256:** verificá que el PR #8 esté fusionado y el archivo JSON esté en `main`. No alteres el SHA a mano. Antes de la fusión esta falla es esperada.
- **Falta la copia / permiso de Google:** verificá `COTILLON_INC_20261027_TEST_ID` y que tu cuenta pueda abrir la copia limpia. Nunca pongas en esa propiedad el ID de producción.
- **Conflictos de identidad o categorías:** no ejecutes más lotes. El lote se detiene antes de escribir; revisá qué cambió en las hojas.
- **Una foto o miniatura falla:** fijate en `fotosFallidasEnEsteLote`. En producción, ejecutá `verFotosFallidasCotillon27Produccion` para ver ID, nombre y si es `alta` o `reactivacion`. La ficha fallida no se activa. Una vez resuelto el problema de URL/Cloudinary, ejecutá `reintentarFotosCotillon27Produccion` y después continuá con `aplicarLoteCotillon27Produccion`. Un reintento no borra productos ni cambia su precio.
- **Se corta una ejecución:** no vuelvas al principio ni copies filas a mano. Ejecutá la previsualización y continuá con el mismo botón del lote. Anotá el valor `procesados` de cada ejecución. Si hay resultados inesperados, frená y conservá el respaldo.
- **Error de propiedades de Cloudinary:** comprobá que las tres propiedades existentes estén cargadas en `web-dc`; no las pegues en el código ni en GitHub.

## Cómo volver atrás en producción

1. Dejá de ejecutar los lotes. En Apps Script → **Configuración del proyecto → Propiedades del script**, **eliminá** `COTILLON_INC_20261027_APPROVED` para bloquear nuevas escrituras de producción.
2. Abrí la hoja de producción y confirmá que exista `cotillon_respaldo_20261027_production`. **No la borres.** Si no está, usá la descarga `.xlsx` externa y pedí ayuda antes de reemplazar filas.
3. Cambiá el nombre de la pestaña actual `cotillon` a `cotillon_revision_20261027` para conservar lo que se cargó. Cambiá el nombre de `cotillon_respaldo_20261027_production` a `cotillon`. No cambies `categorias_cotillon` ni otras pestañas.
4. Volvé a abrir la web y comprobá que se vea el catálogo anterior. Guardá tanto la pestaña de revisión como el archivo descargado hasta terminar el análisis. No reanudes la carga automáticamente tras el rollback.

## Verificación realizada antes de entregar

- HTTP GET real: **28/28** imágenes respondieron 200 con tipo de contenido de imagen. **Ninguno de los 14 quedó descartado en la revisión previa.** La comprobación se repite al activar en Apps Script.
- Simulador del archivo Apps Script actualizado: **661 fuente, 107 altas, 87 actualizaciones, 14 reactivaciones, 467 sin cambios; 194 operaciones, 13 lotes**, sin conflictos ni fallos. Se probó además una miniatura que devuelve 404: la ficha permaneció inactiva y pudo reintentarse.
- Copia nativa de Google Sheets usada para la prueba completa: [ver copia procesada](https://docs.google.com/spreadsheets/d/1HlUI6BTuDjhVNxmkeWJInj8J0kq77nZgB2fTLg-pYkw/edit). Se verificaron todas las celdas de los 1.313 registros finales, las 1.206 fichas del respaldo y las 51 categorías originales. **No se tocó la hoja de producción.**
- Límite: todavía falta la ejecución manual del módulo `.gs` dentro del proyecto real de Apps Script y la subida real de las 107 fotos a Cloudinary. No se afirma que esas dos partes estén probadas.
