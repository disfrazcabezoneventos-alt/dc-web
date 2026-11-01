# Cerrar accesos anteriores del administrador

Este cambio permite que una contraseña nueva deje sin autorización a las sesiones
que ya estaban abiertas. Antes del cambio, una sesión podía seguir usándose hasta
seis horas después de cambiar `ADMIN_PASSWORD`.

## Publicar la corrección

1. En el proyecto **web-dc** de Apps Script, reemplazá **solo Código.gs** por la
   versión completa de `backend/Code.gs` de esta rama. Conservá los demás archivos,
   las propiedades y la URL `/exec`.
2. Actualizá la implementación web existente a una **versión nueva**. No hace
   falta publicar otro frontend ni cambiar DNS. Guardar el archivo sin actualizar
   la implementación no modifica el código que usa la web.
3. Volvé a ingresar en `/admin/`. Este primer despliegue rechaza las sesiones del
   formato anterior, por lo que también cierra las sesiones legítimas abiertas.

## Retirar accesos anteriores

1. Revisá primero quién tiene acceso a Google, al contenedor del script y a sus
   documentos, además de NIC/TAD, Cloudflare, Render y GitHub. Una persona con
   permisos de edición del script puede modificar su autenticación.
2. Si alguien conocía la contraseña del administrador, establecé un valor nuevo
   y único en **ADMIN_PASSWORD**, desde las propiedades del proyecto. No lo
   compartas por chat, commits, capturas ni archivos públicos. Con esta versión
   publicada, los tokens anteriores se rechazan en su próxima petición.
3. Para cerrar todas las sesiones conservando la contraseña, agregá o cambiá
   **ADMIN_SESSION_VERSION** por un valor nuevo, por ejemplo una referencia de
   revisión de accesos. No es una contraseña. No reutilices valores anteriores.
4. No hace falta volver a implementar al cambiar estas propiedades. Si la
   contraseña sigue siendo conocida por un tercero, revocar sesiones por sí solo
   no evita que esa persona vuelva a iniciar sesión: es necesario cambiarla.
5. Revisá las otras implementaciones activas de este mismo proyecto. El control
   actualizado protege las URL que publican este código; una implementación vieja
   debe actualizarse o retirarse después de comprobar qué servicio la usa.

No se modifican contratos, reservas, precios, documentos, enlaces privados de
clientes ni credenciales de Google. Los formularios públicos siguen funcionando.
Una pestaña administrativa puede conservar en pantalla datos ya cargados, pero
el servidor rechaza nuevas consultas y cambios con un token revocado.

## Comprobación sin tocar datos de clientes

1. Abrí dos sesiones administrativas con datos de prueba en una copia aislada.
2. Cambiá la contraseña, el usuario o `ADMIN_SESSION_VERSION`.
3. Verificá que ambos tokens anteriores fallen y que un ingreso nuevo funcione.
4. Verificá que cerrar una sesión normal conserve la otra sesión válida.
5. Comprobá que las tarifas públicas y el enlace privado de una solicitud de
   prueba sigan funcionando.

Las pruebas automatizadas `tests/admin-sessions.test.mjs` cubren estos escenarios
con un entorno simulado y sin conectarse a producción.
