# Instalación de cuentas y permisos del catálogo

**Esta rama es un draft. No ejecutar estos pasos en producción sin aprobación
explícita posterior.** El ensayo usa una copia privada; su URL y evidencia se
entregan al propietario por separado, fuera del repositorio público.

## Archivos que se revisan y prueban

- `backend/Code.gs`: API actual más origen múltiple, revocación y autorización.
- `backend/CatalogAccess.gs`: cuentas, permisos, borradores e historial.
- `backend/AuthCrypto.gs`: bundle reproducible de PBKDF2-HMAC-SHA256.
- `backend/AUTH_CRYPTO_LICENSE.txt`: licencia MIT de la biblioteca incluida.
- Frontend Next.js de la misma rama. No cambian contratos ni formularios públicos.

Conservá `Validation.gs`. Actualizá también `LocalForms.gs`, `LocalReceipts.gs`
y los archivos de mantenimiento/importación existentes con sus versiones de esta
rama: mantienen el comportamiento, pero sus funciones manuales ahora terminan en
`_` para que no puedan invocarse por `google.script.run`. No agregues importadores
que no estén instalados ni ejecutes ninguna importación. No pegues código en otro proyecto.

## Primero: ensayo aislado

1. Copiá la hoja completa y verificá que la copia tenga otro ID y permisos privados.
2. Si se hace un ensayo de Apps Script real, usá un proyecto de prueba separado,
   apuntado a esa copia, una carpeta de documentación exclusiva y `MAIL_MODE=disabled`.
   No uses claves reales de Cloudinary para subir fotos de ensayo: usá una cuenta
   de prueba o el adaptador de servicio. No ejecutar importaciones.
3. No desplegar ni siquiera una implementación de prueba sin el OK solicitado.
   Las pruebas incluidas pueden correr sin endpoints de Google: `npm test` y
   Playwright con backend VM y servicios adaptados. El ensayo de persistencia
   en Sheets lee/escribe únicamente filas ficticias en la copia verificada.
4. Generá credenciales de ensayo en memoria. Nunca las agregues al repositorio,
   capturas, logs o ejemplos de propiedades. Nunca cargues clientes reales en tests.

## Después del OK: actualizar la implementación actual

1. Guardá el número de versión activo y respaldá la hoja. Guardá las propiedades
   privadas por un medio seguro que no sea GitHub, chat ni capturas.
2. En **web-dc**, reemplazá `Código.gs` con `backend/Code.gs` completo. Agregá o
   reemplazá **CatalogAccess.gs** y **AuthCrypto.gs** con los archivos de esta rama.
   No borres otros archivos. Actualizá los módulos existentes indicados arriba;
   no dejes versiones viejas duplicadas con funciones públicas. La biblioteca criptográfica ya está incluida: no
   requiere agregar un servicio, instalar una biblioteca remota ni crear API keys.
3. Revisá **Propiedades del script**:

   | Propiedad | Configuración |
   | --- | --- |
   | `SITE_URL` | `https://disfrazcabezon.com.ar` |
   | `EXTRA_SITE_URLS` | `https://www.disfrazcabezon.com.ar,https://dc-web-8ai4.onrender.com` |
   | `SPREADSHEET_ID` | Conservar la hoja autorizada; en ensayo, solo la copia. |
   | `ADMIN_USER` | Conservar el usuario actual del administrador. |
   | `ADMIN_PASSWORD` | Mantener temporalmente el valor privado existente hasta migrarlo. No copiarlo aquí. |
   | `ADMIN_SESSION_VERSION` | Opcional: cambiar a un valor nuevo para cerrar las sesiones del administrador. |

4. **Implementar → Administrar implementaciones → editar la app web actual →
   Nueva versión → Implementar.** Mantener el mismo ID, la misma URL `/exec`,
   ejecución como propietario y los permisos actuales. Guardar el código no publica.
   El campo `version` de `doGet` es metadato histórico; no es el número de implementación.
   El backend nuevo acepta las credenciales anteriores mientras no se migraron.
   Hacer el cambio en una ventana sin edición de catálogo.
5. Ejecutá **prepararRolesCatalogo_** una vez, después de publicar esa versión. La función:
   - crea únicamente la pestaña `historial_cambios` si falta;
   - convierte la contraseña actual del Admin a PBKDF2-SHA256, con sal individual
     y 600.000 iteraciones, en `ADMIN_PASSWORD_RECORD`;
   - elimina `ADMIN_PASSWORD` en texto plano y habilita `CATALOG_ROLES_ENABLED=yes`;
   - no modifica ningún producto, precio, categoría, foto, stock o visibilidad.

   El usuario y la contraseña que escribe el Admin para entrar siguen siendo los
   mismos. No cambies ni pegues hashes a mano. Repetir la preparación conserva el
   hash ya creado. Las sesiones anteriores se invalidan.

   No ejecutar la migración mientras siga atendiendo la versión antigua: necesita
   la propiedad de contraseña que la preparación elimina.
6. Publicá el frontend de este mismo PR en Render, únicamente cuando también esté
   aprobado: `npm ci && npm run build`, directorio `out`. Conservar la variable
   `NEXT_PUBLIC_APPS_SCRIPT_URL` que apunta a esa implementación. No cambiar DNS.
7. Iniciá sesión nuevamente como Admin y verificá los tres dominios. Revisá
   también otras implementaciones antiguas: este código no cambia ni retira sus URL.

## Funciones manuales y disparadores existentes

Las funciones manuales ahora terminan en `_`: por ejemplo,
`prepararRolesCatalogo_` y `reintentarAvisosSinCuota_`. Se ejecutan desde el editor
de Apps Script; nunca desde la web. Así se cierra también el acceso alternativo de
[google.script.run documentado por Google](https://developers.google.com/apps-script/guides/html/communication#private_functions).
Las funciones de validación sin datos y `doGet`/`doPost` conservan sus nombres.

Antes de instalar, anotá los disparadores existentes y su programación. En la
misma ventana de mantenimiento, después de actualizar los archivos, ejecutá
`migrarDisparadoresCatalogo_` **solo si hay tareas anteriores**. Cambia únicamente
los tres procesadores de fotos creados por este repositorio a sus nombres privados,
con el mismo intervalo de 5 minutos; no ejecuta sus tareas ni modifica productos.
Si ya existe el disparador nuevo no lo duplica. Los disparadores ajenos se conservan
y aparecen en `manualReview` para revisión del propietario.
Si personalizaste el intervalo de alguno de esos tres trabajos, no uses la
migración automática: recreá ese disparador manualmente conservando su programación.

Si habías creado manualmente un disparador, por ejemplo para avisos sin cuota,
recrealo con el nombre terminado en `_`, la misma programación y la misma cuenta
propietaria; después quitá el anterior. Revisá también disparadores creados por
otras cuentas. No habilites trabajos de importación que antes estaban detenidos.

## Crear y usar la cuenta del colaborador

1. Admin → **Usuarios e historial** → Crear Editor de catálogo.
2. Elegí un usuario individual (3–50 caracteres: letras, números, punto, guion o
   guion bajo) y una contraseña de 12–128 caracteres. Compartila por un canal
   privado. No se muestra de nuevo ni se guarda en la hoja.
3. El colaborador entra por `/admin/` con su propia cuenta. Ve solo Disfraces y
   Cotillón, con búsquedas, edición y estados adaptados al celular.
4. Crear producto genera un **borrador con stock cero y sin publicar**. Debe tener
   foto. El Admin revisa sus datos, carga stock si corresponde y pulsa
   **Publicar borrador** desde la lista.
5. El Editor puede cambiar nombre, descripción, precios, categorías y foto. El
   interruptor de estado solo sirve en productos ya publicados. No cambia stock.
6. Para retirar acceso, pulsá **Desactivar** en Usuarios e historial. Para cambiar
   la contraseña, pulsá **Restablecer contraseña**. Ambas acciones revocan todas
   las sesiones de esa cuenta. Reactivarla no revive tokens anteriores.

Las cuentas son de la aplicación, no cuentas Google. No hay que compartir la hoja,
Apps Script ni Cloudinary con el colaborador.

## Historial y fotos

En Usuarios e historial, expandí un cambio para ver autor, producto, fecha y
campos antes/después. **Restaurar foto anterior** solo cambia la foto y su miniatura
y deja un evento nuevo. Nunca se elimina la imagen anterior de Cloudinary.

Si hubo una interrupción, aparece **Recuperar cambios pendientes**. Se recupera
solo si el producto sigue coincidiendo con el estado anterior o posterior
registrado. Un conflicto requiere revisión; no se sobrescribe otro cambio.

Los cambios de producto relacionados con otras operaciones administrativas
(renombrar/eliminar una categoría o recuperar un movimiento pendiente) también
pasan por el historial. Los scripts de mantenimiento ejecutados manualmente desde
el editor no tienen una identidad del panel: no sustituyen este historial de API.

## Comprobación y límites

- Probar Editor con solicitudes directas a cada acción, no solo ocultación de botones.
- Probar reset, desactivación y cambio de credenciales/version del Admin.
- Probar borradores en ambos catálogos, incluidos Cotillón agotado y selección de
  disfraces. Un borrador no se devuelve por `catalog` ni `catalogData`.
- Probar H001 y H002, foto nueva, foto restaurada y conflicto de versiones.
- Confirmar que el Admin conserva reservas, cobros, formularios, constancias y categorías.
- Los productos desactivados de Cotillón siguen apareciendo como agotados: se conserva
  ese comportamiento. Quedan fuera múltiples fotos, recortes y orden de fotos.
- Medir el tiempo real de PBKDF2 en Apps Script antes de habilitar usuarios en producción.
  Las pruebas de Node no garantizan su latencia en V8 de Google. El límite de
  intentos y el bloqueo global pueden hacer esperar otras operaciones durante un login.
- No se puede impedir que alguien sin sesión use formularios que son públicos para
  todos. Con un token de Editor, las acciones de reservas/cobros se rechazan.
- El historial es privado en Sheets y no es inalterable frente a un propietario de
  Google que edite la hoja directamente. Conservá respaldos y permisos restringidos.

## Volver atrás, con aprobación

Restaurar frontend y versión anterior de Apps Script requiere aprobación y
coordinación. **La versión antigua necesita `ADMIN_PASSWORD` en texto plano**:
tras migrar no basta con seleccionar esa versión. El propietario debe restaurar
la credencial por un canal privado, o conservar el backend nuevo hasta resolverlo.
No reconstruirla desde el hash ni publicar propiedades. No borrar historial,
cuentas ni marcas de borrador: una versión anterior puede mostrar borradores de
Cotillón como agotados. Evitar volver a un backend que no filtre borradores.

## Dependencias reproducibles

`AuthCrypto.gs` se genera con `node scripts/generate-auth-crypto.mjs`, a partir
de versiones fijadas en package-lock. No editar el bundle a mano.

- [PBKDF2 y almacenamiento de contraseñas, OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Biblioteca noble-hashes](https://github.com/paulmillr/noble-hashes)
