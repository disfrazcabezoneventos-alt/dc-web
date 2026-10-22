# Completar el catálogo de Cotillón del Excel

La pestaña **Web dc** del Excel tiene **1206 productos**: 790 con stock y visibles, y 416 sin stock que antes quedaron fuera. Esta segunda carga **agrega solamente los 416 faltantes**. No borra ni reinicia los 790 productos existentes, sus fotos o sus precios. Los 416 se muestran al público con **AGOTADO** y no se pueden agregar al carrito.

## Qué hacer ahora en Google Apps Script

1. Abrí el proyecto **web-dc** cuya URL `/exec` coincide con la configurada en Render. En **Código.gs**, reemplazá **todo** el contenido con el archivo completo `backend/Code.gs` de este repositorio. Guardá con **Ctrl + S**. No pegues los archivos JSON en Apps Script.
2. Entrá en **Implementar → Administrar implementaciones**, editá la aplicación web existente con el lápiz, elegí **Nueva versión** y tocá **Implementar**. Conservá la misma URL `/exec`; no hace falta cambiar Render. Al abrir esa URL, debe aparecer `"version":10` y `"catalogSchema":"cotillon-excel-2026-v2"`.
3. En el menú **Seleccionar función para ejecutarla**, elegí **`importarAgotadosCotillonExcel2026`** y tocá **Ejecutar una sola vez**. En el registro debe decir `"agregados":416` y `"totalCotillon":1206`. Si repetís esta función, debe decir `"agregados":0`; no duplica registros.
4. La carga original de 790 productos sigue subiendo fotos por su cuenta. Consultá su avance con **`estadoImportacionCotillonExcel2026`**. Cuando indique `"estado":"ready"` y `"publicadas":790`, el catálogo público mostrará los 1206 productos, incluidos los 416 agotados. Si todavía dice `photos`, esperá: el disparador sigue ejecutándose cada cinco minutos. No vuelvas a iniciar la importación original.
5. Las fotos de los 416 agotados empiezan a subir automáticamente cuando la carga original llega a `ready`. Consultá **`estadoAgotadosCotillonExcel2026`** para ver `conFoto`, `pendientes` y `fallidas`. Mientras se procesan, la web muestra “Foto próximamente” en los productos aún sin foto, pero siguen visibles como agotados. Si aparece `photo_errors`, compartí los errores; para fallos transitorios podés ejecutar **`reintentarFotosAgotadosCotillonExcel2026`** una vez.

Los archivos `backend/import-cotillon-excel-2026.json` y `backend/import-cotillon-agotados-2026.json` se descargan desde GitHub y se verifican con SHA-256 antes de escribir en Sheets. No es necesario subir el Excel a Drive ni configurar variables nuevas. Se conserva la pestaña de respaldo `cotillon_archivo_*` y no se modifican disfraces, reservas o movimientos.

**Clasificación pendiente:** “Bowl Blanco” queda en el grupo Repostería sin subcategoría, porque el Excel no la indicaba. Sigue visible al entrar en Repostería o buscarlo por nombre. “Cortante Momia” sigue en Repostería → Accesorios y con su foto pendiente de revisión.
