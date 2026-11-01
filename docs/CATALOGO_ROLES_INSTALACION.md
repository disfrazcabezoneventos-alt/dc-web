# Instalación de cuentas y permisos del catálogo

**Esta rama es un draft. No ejecutar estos pasos en producción sin aprobación
explícita posterior.** El ensayo usa una copia privada; su URL y evidencia se
entregan al propietario por separado, fuera del repositorio público.

## Archivos que se revisan y prueban

- `backend/Code.gs`: API actual más origen múltiple, revocación y autorización.
- `backend/CatalogAccess.gs`: cuentas, permisos, borradores e historial.
- `backend/AuthCrypto.gs`: bundle reproducible de PBKDF2-HMAC-SHA256.
- `backend/AUTH_CRYPTO_LICENSE.txt`: licencia MIT de la biblioteca incluida.
- `backend/MantenimientoTemporal.gs`: wrappers solo para ejecutar manualmente;
  pegar, ejecutar y borrar. Nunca incluir este archivo en una versión desplegada.
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
5. Pegá temporalmente `MantenimientoTemporal.gs` y ejecutá `ejecutarMedirHash`.
   Devuelve milisegundos y registra únicamente `{iterations, ms}`: usa una
   contraseña ficticia y no guarda ni registra contraseña, sal, hash o tokens.
   Borrá el archivo al terminar. No aparece la función privada en el menú Ejecutar.
   Para comparar costos, agregá también `scripts/apps-script-ensayo/EnsayoHashRepetido.gs`
   solo al proyecto de ensayo y ejecutá `ejecutarEnsayoHashRepetido`. Hace una corrida
   de calentamiento por costo y tres muestras alternadas por costo, en una única
   ejecución, llamando al wrapper real. No modifica la constante ni cuentas.
   Si las mediciones comparables de 600.000 superan **4.000 ms**, la propuesta es bajar
   `CATALOG_PBKDF2_ITERATIONS` a **210.000 para cuentas nuevas y próximos resets**,
   previa aprobación. No reescribir registros existentes: cada registro conserva
   su costo, validado como entero entre 100.000 y 1.000.000. La rama sigue creando
   registros de 600.000 hasta aprobar el cambio. Medir varias veces en Google y
   conservar los resultados completos, excluyendo el calentamiento del promedio.
   Las seis muestras controladas de esta revisión dieron menos de 4 segundos;
   ver los números en `CATALOGO_ROLES_REVISION_PR32.md`. No bajar el costo con los
   dos valores aislados iniciales como única evidencia.

## Después del OK: actualizar la implementación actual

1. **Primero listá Activadores y retiralos si pertenecen a importaciones ya
   terminadas**, según la sección de disparadores. Solo migrar los que sigan en uso.
   Guardá el número de versión activo y respaldá la hoja. Guardá las propiedades
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
   **Antes de crear esa versión, verificar que MantenimientoTemporal.gs no exista.**
5. Después de publicar la versión limpia, pegá **MantenimientoTemporal.gs** en el
   editor y ejecutá **ejecutarPrepararRoles** una vez. Es un wrapper de
   `prepararRolesCatalogo_`; la función privada no aparece en Ejecutar. La función:
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
   Ejecutá `ejecutarMigrarDisparadores` solo después de la revisión de Activadores
   detallada abajo. `ejecutarRecuperarHistorial` queda para una recuperación manual
   autorizada si hace falta. **Borrá MantenimientoTemporal.gs al terminar** y
   verificá que no quede en el proyecto antes de cualquier versión posterior.
   No desplegar de nuevo mientras ese archivo público temporal esté presente.
6. Publicá el frontend de este mismo PR en Render, únicamente cuando también esté
   aprobado: `npm ci && npm run build`, directorio `out`. Conservar la variable
   `NEXT_PUBLIC_APPS_SCRIPT_URL` que apunta a esa implementación. No cambiar DNS.
7. Iniciá sesión nuevamente como Admin y verificá los tres dominios. Revisá
   también otras implementaciones antiguas: este código no cambia ni retira sus URL.

## Funciones manuales y disparadores existentes

Las funciones privadas terminan en `_` y **no aparecen en el menú Ejecutar**.
El archivo temporal contiene únicamente estos wrappers públicos:

| Función visible | Llama únicamente a |
| --- | --- |
| `ejecutarPrepararRoles` | `prepararRolesCatalogo_` |
| `ejecutarMigrarDisparadores` | `migrarDisparadoresCatalogo_` |
| `ejecutarRecuperarHistorial` | `recuperarHistorialCatalogo_` |
| `ejecutarMedirHash` | `medirHashCatalogo_` |

Pegá el archivo, ejecutá lo necesario y **borrá el archivo completo**. Nunca
desplegar estos wrappers públicos ni dejarlos instalados. El test de entrypoints
solo admite esta excepción en ese archivo y exige llamadas directas, sin argumentos
ni instrucciones adicionales. Al borrarlo se conserva el cierre del acceso alternativo de
[google.script.run documentado por Google](https://developers.google.com/apps-script/guides/html/communication#private_functions).
Las funciones de validación sin datos y `doGet`/`doPost` conservan sus nombres.

1. **Primero abrí Activadores**, listá todos (función, frecuencia y propietario)
   y comprobá cuáles siguen en uso. No ejecutar ninguna importación para averiguarlo.
2. Borrá los activadores de importaciones **ya terminadas** de cotillón 27,
   seis Rappi, disfraces 28, limpieza de manuales y mover disfraces a cotillón,
   incluyendo variantes de nombres con o sin `_`. Revisá también procesadores
   generales de fotos; si no tienen trabajo pendiente, no migrarlos. Conservar
   cualquier tarea que todavía esté trabajando o cuya finalización sea incierta.
3. En la misma ventana de mantenimiento, después de actualizar los archivos,
   pegá el archivo temporal y ejecutá `ejecutarMigrarDisparadores` **solo para las
   tareas anteriores que sigan en uso**; luego borrá el archivo temporal. Cambia únicamente
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

### Comprobar un activador privado en el proyecto de ensayo

Sin desplegar nada y solo en un proyecto apuntado a la copia:

1. Agregá `scripts/apps-script-ensayo/EnsayoCategoria.gs` junto con Code.gs,
   CatalogAccess.gs, AuthCrypto.gs y Validation.gs. Este archivo **no va a producción**.
2. Configurá `SPREADSHEET_ID` con la copia cuyo nombre empieza por `ENSAYO ` y
   `PR32_ENSAYO=yes`, exclusivamente en las propiedades de ese proyecto de ensayo.
3. Ejecutá `ejecutarProbarActivador`. Programa una sola ejecución de
   `verificarActivadorPrivado_` después de un minuto. La función privada no necesita
   aparecer en el desplegable.
4. En **Ejecuciones**, esperá la ejecución de `verificarActivadorPrivado_`, tipo
   activador, estado completado. Debe registrar «Activador privado de ensayo
   ejecutado» y existir `PR32_PRIVATE_TRIGGER_OK` con la fecha en las propiedades.
5. Anotá el resultado y quitá exclusivamente el activador de esa prueba. No usar
   tareas de importación ni tocar activadores de producción para comprobarlo.

### Medir un renombrado con más de 100 productos

En ese mismo proyecto de ensayo, ejecutá `ejecutarEnsayoCategoria`. Agrega una
categoría y 120 productos ficticios sin publicar, usa la API real para renombrarla
y verifica los 120 eventos confirmados. La medición incluye las escrituras reales
de Sheets: un producto y dos escrituras de historial por producto (pendiente y
confirmado). No incluye la creación inicial de las filas de prueba ni la lectura
de verificación posterior. Devuelve y registra solo cantidades y milisegundos;
no copia filas de clientes a logs ni publica identificadores de la hoja.
La función rechaza una copia con movimientos de stock pendientes para evitar
que el mantenimiento previo de la API afecte productos ajenos al ensayo.

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
coordinación. `prepararRolesCatalogo_` **borra `ADMIN_PASSWORD`**. Para volver al
backend anterior hay que abrir **Configuración del proyecto → Propiedades del
script → Agregar propiedad** y cargar **a mano** `ADMIN_PASSWORD` con la contraseña
privada elegida por el propietario. No alcanza con seleccionar la versión anterior;
`ADMIN_PASSWORD_RECORD` no sustituye esa propiedad en el código antiguo. Mantener
el backend nuevo hasta poder hacer la carga privada si todavía no está disponible.
No reconstruirla desde el hash ni publicar propiedades. No borrar historial,
cuentas ni marcas de borrador: una versión anterior puede mostrar borradores de
Cotillón como agotados. Evitar volver a un backend que no filtre borradores.

## Dependencias reproducibles

`AuthCrypto.gs` se genera con `node scripts/generate-auth-crypto.mjs`, a partir
de versiones fijadas en package-lock. No editar el bundle a mano.

- [PBKDF2 y almacenamiento de contraseñas, OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Biblioteca noble-hashes](https://github.com/paulmillr/noble-hashes)
