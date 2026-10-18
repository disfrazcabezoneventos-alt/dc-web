# Nueva condición de venta de disfraces

El sitio guarda la condición de venta dentro del mismo registro de cada disfraz en Google Sheets. No hace falta crear una pestaña ni añadir propiedades o variables `.env`.

## Actualizar Apps Script

1. Abrí **el proyecto de Apps Script que ya usa el sitio**.
2. Abrí `Code.gs`, borrá todo su contenido y pegá el contenido **completo** de [`backend/Code.gs`](backend/Code.gs). Ese archivo también incluye las mejoras anteriores de categorías y miniaturas. `Validation.gs` no cambia.
3. Guardá con **Ctrl + S**.
4. Elegí **Implementar → Administrar implementaciones → Editar** (lápiz) en tu implementación web actual. En **Versión**, seleccioná **Nueva versión** y tocá **Implementar**. Conservá la implementación existente para mantener la misma URL `/exec` de Render.
5. Abrí en otra pestaña la **misma URL `/exec` que figura en `NEXT_PUBLIC_APPS_SCRIPT_URL` de Render**. La respuesta debe contener `"version":2` y `"catalogSchema":"saleCondition+orderLimit"`. Si aparece `"version":1`, todavía estás mirando una implementación anterior: compará la URL de cada implementación en **Administrar implementaciones** con la de Render y editá la que coincida exactamente. Si no aparece esa URL, abriste otro proyecto de Apps Script.

No hay que ejecutar ninguna función ni migración en Sheets. Los disfraces de venta que ya existen seguirán funcionando; cuando los edites, elegí su condición de venta para que aparezca al público.

## Usar las opciones nuevas

- En **Admin → Disfraces**, al crear o editar un disfraz con modalidad **Venta** o **Alquiler y venta**, elegí **Nuevo a pedido**, **Nuevo Inmediato** o **Usado inmediato**. El cotillón y los disfraces solo de alquiler no tienen este campo.
- Si elegís **Nuevo a pedido**, podés cambiar el tiempo estimado de entrega y el **máximo de unidades por consulta**. Ese límite se guarda aparte del stock. El valor inicial de entrega es **aproximadamente 1 mes**. El cliente verá una confirmación antes de consultar por WhatsApp y sabrá que tendrá que enviar sus medidas por ese medio.
- Un disfraz **solo de venta y a pedido** no necesita stock físico: el editor oculta ese campo y guarda stock 0. Si elegís **Alquiler y venta**, el stock físico se usa para el alquiler, mientras que el límite a pedido se usa para la compra. Las ventas **Nuevo Inmediato** y **Usado inmediato** siguen usando stock físico.
- En la lista de disfraces, **Clonar producto** crea un registro llamado `Copia ...` y abre su editor. La copia empieza **oculta y con stock 0**, pero conserva el límite a pedido si corresponde. Revisá categoría, precio, condición y disponibilidad antes de publicarla. La imagen se reutiliza; no se vuelve a subir.
- En la consulta de compra, **Cantidad** nunca puede superar el stock de una venta inmediata ni el límite por consulta de un producto a pedido. La consulta no reserva unidades: confirmá disponibilidad o capacidad de confección por WhatsApp antes de cerrar la venta.
- El formulario de alquiler limita la cantidad al stock físico del disfraz seleccionado. Si se repite el mismo disfraz en varios renglones, Apps Script comprueba el total.

Si después de actualizar Render ves las opciones nuevas pero al guardar un disfraz o su copia aparece **«Sin definir»**, la URL `/exec` que usa Render todavía puede estar ejecutando una versión anterior de `Code.gs`. Guardar el archivo en el editor de Google no actualiza por sí solo esa implementación. Verificá el paso 5 antes de volver al admin. Después abrí ese mismo disfraz, seleccioná la condición y guardalo de nuevo. El panel comprueba la respuesta y la lista recargada; si Apps Script descarta la condición, muestra un error y mantiene abierto el editor para que no pierdas los cambios.
