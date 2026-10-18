# Nueva condición de venta de disfraces

El sitio guarda la condición de venta dentro del mismo registro de cada disfraz en Google Sheets. No hace falta crear una pestaña ni añadir propiedades o variables `.env`.

## Actualizar Apps Script

1. Abrí **el proyecto de Apps Script que ya usa el sitio**.
2. Abrí `Code.gs`, borrá todo su contenido y pegá el contenido **completo** de [`backend/Code.gs`](backend/Code.gs). Ese archivo también incluye las mejoras anteriores de categorías y miniaturas. `Validation.gs` no cambia.
3. Guardá con **Ctrl + S**.
4. Elegí **Implementar → Administrar implementaciones → Editar** (lápiz) en tu implementación web actual. En **Versión**, seleccioná **Nueva versión** y tocá **Implementar**. Conservá la implementación existente para mantener la misma URL `/exec` de Render.

No hay que ejecutar ninguna función ni migración en Sheets. Los disfraces de venta que ya existen seguirán funcionando; cuando los edites, elegí su condición de venta para que aparezca al público.

## Usar las opciones nuevas

- En **Admin → Disfraces**, al crear o editar un disfraz con modalidad **Venta** o **Alquiler y venta**, elegí **Nuevo a pedido**, **Nuevo Inmediato** o **Usado inmediato**. El cotillón y los disfraces solo de alquiler no tienen este campo.
- Si elegís **Nuevo a pedido**, podés cambiar el tiempo estimado de entrega. El valor inicial es **aproximadamente 1 mes**. El cliente verá una confirmación antes de consultar por WhatsApp y sabrá que tendrá que enviar sus medidas por ese medio.
- En la lista de disfraces, **Clonar producto** crea un registro llamado `Copia ...` y abre su editor. Por seguridad, la copia empieza **oculta y con stock 0**: elegí su categoría, precio, condición y unidades o cupos reales, guardá los cambios y recién entonces marcala como visible. La imagen se reutiliza; no se vuelve a subir.
- En la consulta de compra, **Cantidad** nunca puede superar el stock o los cupos publicados del producto elegido. Para un disfraz **Nuevo a pedido**, usá el campo de stock para indicar cuántos pedidos podés aceptar. La consulta no reserva unidades: confirmá la disponibilidad actual por WhatsApp antes de cerrar la venta.

Si después de actualizar Render ves las opciones nuevas pero al guardar la condición desaparece, revisá que hayas publicado una **nueva versión** de Apps Script, además de guardar el archivo.
