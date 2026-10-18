# Actualización de categorías y enlaces de productos

Esta actualización conserva el mismo Google Sheets, la misma URL de Apps Script y los mismos datos de Render. No hay que crear otro proyecto ni cambiar claves.

## Qué hay que hacer, en orden

1. Abrí **el proyecto de Apps Script que ya usa la web**. Antes de cambiarlo, podés guardar una copia del `Code.gs` actual en tu computadora.
2. En el editor de Apps Script, abrí `Code.gs`, seleccioná todo y pegá el contenido completo del nuevo [`backend/Code.gs`](backend/Code.gs). **No cambies `Validation.gs`.** Guardá con `Ctrl+S`.
3. En el desplegable de funciones, arriba, elegí **`prepararCategorias`** y tocá **Ejecutar**. Si Google pide autorización, aceptala desde la cuenta dueña del proyecto. Esperá a que la ejecución termine sin error.
4. Abrí el Google Sheets cuyo ID figura en la propiedad `SPREADSHEET_ID`. Deben aparecer dos pestañas nuevas: `categorias_disfraces` y `categorias_cotillon`. La primera empieza con la lista sugerida de la imagen. Los nombres de categorías que ya tenían productos también se incorporan, y esos productos quedan vinculados automáticamente. La segunda empieza con `Otros` y agrega los nombres que ya usabas en cotillón. **No edites a mano las celdas JSON**; las modificaciones diarias se hacen desde `/admin/`.
5. En Apps Script elegí **Implementar → Administrar implementaciones → lápiz (Editar) → Versión: Nueva versión → Implementar**. Usá la implementación que ya tenés; así conservás la URL `/exec` y no tenés que tocar Render.
6. Esperá a que Render termine su despliegue automático del `main` actualizado. Abrí la web con `Ctrl+F5` o en una ventana privada.

Si volvés a ejecutar `prepararCategorias`, no duplica datos ni vuelve a crear categorías que hayas eliminado desde el panel.

## Cómo probarlo

1. Entrá a `/admin/`. Las pestañas **Categorías disfraces** y **Categorías cotillón** tienen listas independientes.
2. Cambiá el nombre de una categoría con un producto asociado. El producto debe aparecer bajo el nombre nuevo sin editarlo por separado.
3. Probá eliminar una categoría: el cuadro indica cuántos productos afecta y te deja pasarlos a **Otros**, dejarlos **Sin categoría** o crear otra categoría para ellos. Cancelá si solo querías mirar.
4. En **Disfraces** o **Cotillón**, al crear o editar un producto, elegí su categoría desde la lista. En las páginas públicas probá filtrar por esa categoría.
5. Abrí un disfraz del catálogo. Si se alquila, verás **Quiero alquilar**: abre `/reservas/` con el traje, la categoría y el precio publicado precargados. Revisá el tipo **Adulto/Cabezón** y el importe acordado antes de enviar. Si se vende, verás **Quiero comprar**: abre una consulta de compra con el producto precargado y la envía por WhatsApp. Los disfraces de ambas modalidades muestran las dos opciones.

**Importante:** la consulta de compra no cobra ni descuenta stock por sí sola. El local confirma disponibilidad y precio por WhatsApp; después registra la venta en **Caja**. El alquiler tampoco queda confirmado hasta que el local aprueba la solicitud.

Si el editor muestra `Ejecutá prepararConfiguracion primero` o falta una pestaña, volvé a ejecutar `prepararCategorias` con la cuenta dueña del Apps Script. Si la web dice `Acción desconocida`, se publicó una versión vieja del script; elegí **Nueva versión** en la implementación existente.
