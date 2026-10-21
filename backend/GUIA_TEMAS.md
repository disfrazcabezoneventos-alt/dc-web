# Temas de Disfraz Cabezón: instalación

La web pública se construye con Next.js y Render. **Google Apps Script no contiene el diseño**: solo guarda el tema elegido y comprueba que quien lo cambia haya iniciado sesión como administrador. No se modifica Google Sheets, Cloudinary ni las reservas.

1. Esperá a que Render termine el despliegue del último commit de `main`. La variable `NEXT_PUBLIC_APPS_SCRIPT_URL` sigue apuntando a la misma aplicación web de siempre; no hace falta cambiarla.
2. Abrí el proyecto **web-dc** en Google Apps Script. Confirmá que su URL de implementación termina en `AKfycbzg5m5PsnI33gaB2QpyWqqqlSp4fBBJoPV36tbe6QfA2wW81IZd98A44sAT0ZnmRZRz/exec`. No uses el proyecto **Notificaciones Disfraz Cabezón**.
3. Abrí `Código.gs`, seleccioná todo su contenido y pegá **todo** el archivo actualizado [`Code.gs`](Code.gs). No pegues una función suelta. Guardá. El archivo `Validation.gs` no cambia.
4. En **Implementar → Administrar implementaciones**, elegí la aplicación web que conserva esa URL, tocá el lápiz de editar y seleccioná **Nueva versión**. Implementá la actualización. No crees una aplicación web nueva ni cambies su URL.
5. Abrí la URL `/exec` en otra pestaña. Debe responder JSON con `"version":7` y `"theme":"default"` (o `"halloween"` si ya lo activaste). Si muestra versión 6 u otra, Render y el administrador seguirán hablando con el código anterior: revisá que hayas actualizado la implementación correcta.
6. Entrá en `https://dc-web-8ai4.onrender.com/admin/`, iniciá sesión y elegí **Apariencia de la web**. Elegí un tema, probá **Vista previa en esta pestaña** y después **Publicar para todos**. Aparece una confirmación antes de publicar.
7. Abrí la web pública en una ventana privada y recargala. Debe verse el tema publicado. Para volver al diseño habitual, seleccioná **Tema predeterminado** y publicalo de la misma manera.

El tema se guarda en la propiedad privada `SITE_THEME` de Apps Script. El sistema la crea cuando publicás un cambio; no hay que editar propiedades ni ejecutar una migración. La web consulta esa propiedad al abrirse y al volver a una pestaña. `localStorage` solo recuerda el último tema para evitar un parpadeo mientras llega la respuesta del servidor. Si esa consulta falla, el sitio conserva la apariencia ya cargada y las operaciones comerciales siguen disponibles.

La vista previa solo cambia tu pestaña. La acción `setSiteTheme` exige una sesión de administrador válida en Apps Script; ocultar el botón en la interfaz no es la protección.
