# Cargar el Excel de Cotillón en la web

Esta carga usa la pestaña **Web dc** de `Disfraz_Cabezon_Catalogo.xlsx`. El archivo publicado en GitHub contiene solamente las **790 filas con visible = Sí**; las 416 filas ocultas permanecen únicamente en el Excel local. No hace falta subir el Excel a Google Drive ni configurar variables nuevas.

## En Google Apps Script

1. Abrí el proyecto **web-dc**, el que tiene la misma URL `/exec` configurada en Render. En el archivo **Código.gs**, seleccioná todo el contenido anterior y pegá el contenido completo de `backend/Code.gs`. No pegues el archivo JSON en Apps Script. Guardá con **Ctrl + S**.
2. En **Implementar → Administrar implementaciones**, editá la **aplicación web existente** (ícono de lápiz), elegí **Nueva versión** y tocá **Implementar**. No crees otra aplicación web. Abrí la URL `/exec` que ya utiliza Render: debe indicar `"version":9` y `"cotillonImportReady":false`.
3. En el selector **Seleccionar función para ejecutarla**, elegí **`iniciarImportacionCotillonExcel2026`** y tocá **Ejecutar** una sola vez. Aceptá las autorizaciones de Google si aparecen. El registro debe incluir `"importados":790`, el número de publicaciones anteriores archivadas y el nombre de la pestaña de respaldo `cotillon_archivo_*`.
4. La función deja los nuevos productos inicialmente ocultos y crea un disparador que sube hasta diez fotos a Cloudinary cada cinco minutos. Podés elegir y ejecutar **`estadoImportacionCotillonExcel2026`** para ver `pendientes`, `fallidas`, `conFoto` y `publicadas`. No hace falta volver a ejecutar la importación.
5. Cuando aparezca `"estado":"ready"` y `"publicadas":790`, recargá la página de Cotillón. La web empezará a mostrar el nuevo catálogo automáticamente. La foto de **Cortante Momia** queda pendiente de corrección deliberadamente; mostrará “Foto próximamente”.

Si el estado pasa a `photo_errors`, mirá la lista `errores`. Si fue un problema temporal de Cloudinary o conexión, ejecutá **`reintentarFotosCotillonExcel2026`** una vez. Si vuelve a fallar, compartí el mensaje de error para corregir esa foto; las publicaciones permanecen ocultas hasta que se resuelva. No borres la pestaña `cotillon_archivo_*` ni las pestañas de reservas o movimientos.

El archivo `backend/import-cotillon-excel-2026.json` se descarga automáticamente desde este repositorio y se verifica con SHA-256 antes de modificar la hoja. La migración no modifica disfraces, reservas ni movimientos. El producto **Mantel Friselina Colores Varios Rectangular** figura en **Descartables**, sin subcategoría hasta que se elija una; **Cortante Momia** figura en **Repostería → Accesorios**.
