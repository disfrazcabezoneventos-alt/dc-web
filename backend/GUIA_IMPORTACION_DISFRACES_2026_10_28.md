# Guía simple para la importación de disfraces

**Por ahora no hagas ninguna carga en producción.** Este PR queda para revisar y el ensayo ya está en una [copia de la hoja](https://docs.google.com/spreadsheets/d/1xfOy7yCjGOTpDfiU1pvq_HmjnI3gW6CSzPCr7s5dun4/edit). El [informe](INFORME_IMPORTACION_DISFRACES_2026_10_28.md) explica los 441 registros ensayados y las dudas pendientes. No hay que reemplazar `Código.gs`, `Validation.gs` ni el JSON.

## Lo que quedó preparado

- El código completo para copiar es **un solo archivo**: `backend/DisfracesIncremental20261028.gs`. Se agrega como un archivo nuevo en el proyecto Apps Script **web-dc**; funciona junto al `Código.gs` actual.
- El JSON `backend/import-disfraces-2026-10-28.json` queda en GitHub. El script lo descarga y comprueba su SHA-256 antes de escribir.
- Los 21 ZIP de fotos están en una [carpeta privada de Drive](https://drive.google.com/drive/folders/1ceEUII0gXFoxbC9ai8PSTMvRy36qlfpP). No hay que pegarlos en Apps Script. La cuenta que ejecute el script debe tener acceso a ellos.
- `Code.gs` no cambia; por esta importación no hay que cambiar la URL de Render ni implementar una nueva versión de la aplicación web. Los comandos del editor usan el código guardado más reciente.

## Para revisar la copia, sin tocar producción

Estos pasos son opcionales y solo de lectura porque la copia ya está cargada:

1. Abrí el proyecto Apps Script **web-dc** que usa la tienda. En la columna izquierda, pulsá **+** al lado de “Archivos” y elegí **Secuencia de comandos**. Poné como nombre `DisfracesIncremental20261028`.
2. Abrí el archivo completo `backend/DisfracesIncremental20261028.gs` de este PR, copiá todo y pegalo en el archivo nuevo. Guardá con **Ctrl + S**. No borres ni pegues nada sobre `Código.gs`.
3. En **Configuración del proyecto → Propiedades de secuencia de comandos**, agregá `DISFRACES_20261028_TEST_ID` con el valor `1xfOy7yCjGOTpDfiU1pvq_HmjnI3gW6CSzPCr7s5dun4`. Esa es la **copia**, no la hoja de producción. Guardá.
4. En el desplegable **Seleccionar función para ejecutarla**, elegí `estadoDisfraces28Copia` y pulsá **Ejecutar**. En **Registro de ejecución** debe aparecer `"importadas":441`, `"activas":0` y `"conFoto":0`. La copia está inactiva a propósito para no hacer subidas reales desde la prueba.
5. Si ejecutás `previsualizarDisfraces28Copia`, debe indicar `"altas":0` y `"yaImportadas":441`. Eso significa que el ensayo ya está allí. Si ejecutás `probarLoteDisfraces28Copia` sobre esta misma copia, debe responder `"procesados":0`; no duplica nada. **No ejecutes ninguna función cuyo nombre termine en `Produccion`.**

La prueba completa de 30 lotes se hizo previamente en esa copia. Si querés repetirla dentro de Google Apps Script desde cero, hay que crear **otra copia nueva de la hoja de producción**, poner su nuevo ID en `DISFRACES_20261028_TEST_ID` y ejecutar `probarLoteDisfraces28Copia` 30 veces. No uses la copia ya procesada para medir un primer lote.

## Solo después de tu OK explícito para producción

Esta sección describe el procedimiento futuro. **No se ejecutó.** Antes de empezar, resolvé o aceptá los puntos pendientes del informe y confirmá que el PR se haya fusionado a `main` por indicación tuya. El importador toma el JSON de `main` en producción; si el PR sigue abierto, se detendrá sin escribir.

1. Abrí el proyecto Apps Script **web-dc** y verificá que el archivo nuevo `DisfracesIncremental20261028.gs` esté completo y guardado. No reemplaces `Código.gs`.
2. En **Configuración del proyecto → Propiedades de secuencia de comandos**, revisá que ya existan `SPREADSHEET_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. No publiques sus valores ni los pegues en GitHub. Confirmá que la cuenta de Apps Script tiene acceso a los 21 ZIP privados de Drive.
3. Agregá `DISFRACES_20261028_APPROVED` con este valor exacto del manifiesto revisado: `ba46b567c8a83de18a725cc87b4d82d62f96817a14241837198019572136cde6`. Esta propiedad es el seguro que permite la escritura en producción; **no la agregues antes del OK**.
4. Elegí `previsualizarDisfraces28Produccion` y pulsá **Ejecutar**. Deberías ver `"altas":441`, `"omitidasManuales":2`, `"conflictos":0`, `"activasPotenciales":308`. Si hay conflictos, detenete y compartí el registro. La previsualización no escribe.
5. Elegí `aplicarLoteDisfraces28Produccion` y pulsá **Ejecutar una vez**. En el registro, `"procesados"` debe ser entre 1 y 15, y aparecerá `"respaldo":"disfraces_respaldo_20261028_production"`. Abrí la hoja y verificá que exista esa pestaña de respaldo antes de continuar. Si Google pide permisos, autorizá únicamente el proyecto `web-dc` de tu cuenta.
6. Volvé a pulsar **Ejecutar** para la misma función hasta completar **30 lotes en total**: 29 lotes de 15 y el último de 6. Ejecutá **un lote por vez**, esperando a que termine y leyendo el registro. No pulses varias veces mientras uno sigue ejecutándose. Cada lote relee la hoja y toma los siguientes IDs faltantes, así que puede retomarse si se corta.
7. Elegí `estadoDisfraces28Produccion`. Al final debe indicar `"importadas":441`. El número de activas dependerá de las 308 fotos elegibles que hayan subido correctamente a Cloudinary; las 133 de baja resolución quedan inactivas. Si aparecen `fotosFallidas`, guardá el listado. `reintentarFotosDisfraces28Produccion` sirve para reintentar hasta 15 fallas por ejecución sin tocar fichas editadas manualmente; usala solo tras revisar la causa.
8. En la web pública, comprobá algunas fichas con foto y miniatura, sus precios de alquiler, categorías y disponibilidad. Revisá también que Scream y Woody manuales sigan iguales. No hagas pedidos ni reservas reales como prueba.

## Si algo falla

- Si falla **antes del primer lote**, no se escribió nada. Revisá el texto del error y no cambies IDs o hashes para forzar la ejecución.
- Si falla **durante un lote**, consultá `estadoDisfraces28Produccion` y la pestaña `disfraces`; si está todo coherente, podés repetir la misma función. El script omite los IDs que ya se cargaron. Si el mensaje habla de un conflicto o del respaldo, detenete y compartí el registro.
- Si una foto falla, la ficha queda inactiva y el error queda en `photoImportError`. La importación de las otras fichas puede continuar; luego se revisa y, si corresponde, se reintenta.
- Si el manifiesto cambió, falta un ZIP o el SHA-256 no coincide, la función se detiene **antes de escribir el lote**. No edites el JSON ni el hash a mano.
- Si no aparece una función en el desplegable, guardá el archivo nuevo y recargá el editor. Si aparece un error de permisos de Drive, revisá con qué cuenta de Google estás usando `web-dc` y si esa cuenta puede abrir la carpeta privada.

## Volver atrás con el respaldo

El primer lote crea una copia completa de la pestaña `disfraces` llamada `disfraces_respaldo_20261028_production`. **Conservá esa pestaña.** Si se decide deshacer la carga, primero detené cualquier ejecución pendiente. En Google Sheets, cambiá el nombre de la pestaña actual `disfraces` a `disfraces_importacion_20261028_retirada`, y después cambiá el nombre de `disfraces_respaldo_20261028_production` a `disfraces`. Así el sitio volverá a leer el catálogo anterior. No borres la pestaña retirada ni el respaldo adicional hasta comprobar el resultado.

Este regreso devuelve las filas tal como estaban **antes del primer lote**; también quitaría cualquier edición manual hecha después de crear el respaldo. Si hubo ediciones posteriores, hay que compararlas y guardarlas antes de cambiar los nombres. Las fotos que se hayan subido a Cloudinary no se borran automáticamente con este cambio de pestaña.
