# Actualización de miniaturas y panel

El sitio nuevo se publicará automáticamente en Render después del push. Para que **las nuevas subidas** creen su miniatura y para que el servidor ignore precios de una modalidad que no corresponde, actualizá tu Apps Script:

1. Abrí el proyecto de Apps Script que ya usa tu web.
2. Abrí `Code.gs`, borrá todo su contenido y pegá **todo** el contenido del archivo [`backend/Code.gs`](backend/Code.gs) de este repositorio. No hace falta cambiar `Validation.gs`.
3. Guardá con **Ctrl + S**.
4. Arriba a la derecha: **Implementar → Administrar implementaciones**. En la implementación web actual, elegí **Editar** (lápiz). En **Versión**, elegí **Nueva versión** y luego **Implementar**. No crees otra implementación: así conservás tu URL `/exec` y la variable de Render sigue funcionando.
5. Esperá a que Render termine su despliegue. Entrá a `/admin/`, iniciá sesión y subí una foto de prueba a un producto. Al guardarlo, debería aparecer su miniatura a la izquierda de la lista. Elegí el disfraz desde el catálogo y comprobá que la foto pequeña aparezca en el paso **Tu alquiler**.

No tenés que ejecutar una función nueva ni agregar pestañas a Google Sheets. Tampoco hay nuevas variables `.env` ni propiedades de Apps Script: siguen siendo las tres de Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) que ya configuraste en **Configuración del proyecto → Propiedades de secuencia de comandos**.

Los productos que ya existen siguen funcionando. Sus imágenes se muestran en tamaño pequeño con una transformación de Cloudinary; al volver a subir una imagen con este código, la miniatura se genera durante la subida y su URL se guarda junto al producto. Si pegás una URL de Cloudinary manualmente, el sitio genera la versión pequeña a partir de esa URL.
