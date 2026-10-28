# Preparar los 447 disfraces rescatados

Esta importación toma las 447 publicaciones públicas de la web anterior. Conserva sus nombres, categorías, enlaces y la URL de la foto original. No importa las propuestas editadas por IA: requieren comparación con el disfraz real.

## Antes de ejecutar

- Conservá el ZIP `disfraces-web-completo.zip`, que incluye las 447 fotos originales y el Excel con las URL. La importación usa las URLs de la web anterior para subir las fotos a Cloudinary; si esa web deja de servirlas antes de terminar, el ZIP permite recuperarlas manualmente.
- Comprobá que el proyecto de Apps Script sea **web-dc** y que su URL `/exec` sea la que usa Render.
- Confirmá que estén configuradas las tres propiedades privadas `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. No copies secretos al repositorio.

## Carga controlada

1. Después de incorporar estos cambios a `main`, reemplazá el contenido completo de `Code.gs` en el proyecto correcto. Guardá y publicá una **nueva versión** de la implementación existente. La URL `/exec` debe responder `"version":11`.
2. Ejecutá `importarDisfracesWeb2026` **una vez**. Crea hasta 447 fichas ocultas, sin stock y con precio de alquiler cero. Conserva los registros existentes; si un nombre coincide con una ficha manual, lo informa como conflicto y no duplica esa ficha. Repetir la función no duplica productos.
3. Revisá `estadoDisfracesWeb2026`. Anotá `importados`, `pendientes` y `visibles` (debe ser 0 para estas fichas).
4. Ejecutá `iniciarFotosDisfracesWeb2026`. Procesa ocho fotos al inicio y programa tandas de ocho cada cinco minutos. Cada archivo pasa a Cloudinary con su miniatura. Consultá `estadoDisfracesWeb2026` hasta que `pendientes` llegue a cero.
5. Si hay `fallidas`, comprobá si la URL de origen aún abre. Para fallos pasajeros, ejecutá `reintentarFotosDisfracesWeb2026` y después `iniciarFotosDisfracesWeb2026`. Si la web anterior dejó de servir una imagen, usá el archivo original del ZIP para reemplazarla desde el administrador.
6. Antes de activar una ficha, completá stock, precio, descripción y categoría; compará la foto con el disfraz físico. Activá solo las que estén verificadas.

Las fotos editadas son **propuestas**. El importador usa los originales para evitar cambios de diseño o accesorios inventados por la IA. No toca cotillón, reservas ni caja.
