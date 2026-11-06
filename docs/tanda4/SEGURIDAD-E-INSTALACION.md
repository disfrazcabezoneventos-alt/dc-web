# Tanda 4: seguridad y mantenimiento

Estado: propuesta en draft. No instalar el backend ni activar Turnstile/MFA hasta completar el ensayo y revisar este PR. La guía de recuperación y el inventario de copias con datos personales están en Drive privado; no se adjuntan al repositorio público.

## Comportamiento

- `Security.gs`: TOTP RFC 4226/6238 (SHA-1, seis cifras, 30 s, tolerancia de un paso), QR generado localmente y diez códigos de recuperación de un uso, almacenados con hash y sal. La cuenta admin debe enrolarse tras activar la función; editor puede optar. Una sesión pendiente solo permite configurar MFA, consultar su estado y salir. Los códigos ya usados no se aceptan de nuevo.
- Sesiones de dos horas de inactividad. Solo la actividad explícita prolonga la sesión; las notificaciones en segundo plano no la mantienen abierta. Cambiar contraseña, activar/desactivar MFA, desactivar usuario o cerrar todas las sesiones invalida las sesiones correspondientes. No se registra la contraseña ni el código intentado.
- Alertas a la cuenta del negocio por navegador nuevo, cinco fallos en 15 minutos, contraseña o datos de cobro modificados. El identificador de navegador es orientativo y no prueba una ubicación o identidad. `MAIL_MODE=disabled` no envía nada. Límite de diez alertas por hora.
- `Turnstile.gs`: verifica éxito, dominio, acción y antigüedad en el servidor antes de escribir. No se confía en el navegador. Formularios de reserva, local, corrección y arrepentimiento quedan protegidos; compra individual y carrito verifican también precio y disponibilidad reales antes de abrir WhatsApp. Una consulta por WhatsApp no crea una compra ni descuenta stock.
- Archivos: máximo 8 MiB por adjunto, tipos reales JPEG/PNG/WebP/PDF comprobados por firma binaria, DNI/foto solo imagen, firma PNG máximo 1 MiB; base64 inválido se rechaza. El límite global de solicitud es 47 MB. Esto no sustituye un antivirus.
- `Maintenance.gs`: copia completa diaria de la hoja en carpeta privada sin colaboradores, 30 diarias y 12 semanales (domingo). Solo administra sus prefijos `DC-T4-DAILY-` y `DC-T4-WEEKLY-`, con papelera recuperable. Monitor cada 15 minutos: avisa después de dos fallos consecutivos y al recuperarse.
- Retención: solo preparada. No hay activador instalado. Solo considera reservas cerradas explícitamente, sin retención legal ni incidentes y sin referencias compartidas por registros vigentes. Conserva metadatos mínimos/hash y firma; pasa adjuntos elegibles a la papelera en lotes de hasta 30. El dueño debe aprobar ambos plazos por separado.
- Admin móvil: selector de sección y acceso a retiros/devoluciones de hoy, considerando la última fecha de gestión.

## Ensayo obligatorio

1. Usar el proyecto de ensayo existente, nunca cambiar `SPREADSHEET_ID` de producción. Guardar código, manifiesto y propiedades originales antes de modificar el ensayo.
2. Crear una copia actual de la hoja, verificar su nombre `ENSAYO ...` y su ID. Quitar de esa copia las tablas con datos de clientes y reemplazarlas por registros sintéticos antes de hacer pruebas funcionales. `MAIL_MODE=disabled`, `SECURITY_ENV=ensayo`.
3. Probar MFA, recuperación de un solo uso, vencimiento/revocación, matriz anónimo/editor/admin, validación de archivos y Turnstile. Las claves oficiales de prueba requieren además `TURNSTILE_TEST_MODE=yes` y se rechazan fuera de ensayo.
4. Crear respaldo real de Drive, alterar solo la copia, restaurar desde la copia de respaldo y comparar valores y fórmulas de todas las pestañas. Ensayar restauración de propiedades solo con la rutina guardada para ensayo. Medir tiempos y registrar los resultados en la guía privada.
5. Restaurar código, manifiesto y propiedades originales del ensayo, retirar utilidades temporales y archivar cualquier implementación temporal. No archivar el proyecto de ensayo que se sigue usando.

## Instalación aprobada: orden obligatorio sin interrumpir formularios

1. Antes de cualquier merge, Nahuel crea el widget Turnstile. Cargar la sitekey en `NEXT_PUBLIC_TURNSTILE_SITE_KEY` de Render y la secret key en `TURNSTILE_SECRET_KEY` de Script Properties, junto con `TURNSTILE_HOSTNAMES` (dominios sin protocolo ni rutas). Incluir www mientras la tienda pueda usarse allí. Configurar también el ID público de Analytics en Render; nunca poner claves secretas ni hooks en variables `NEXT_PUBLIC_*`.
2. Tras la autorización personal de Google, completar el ensayo real con `MAIL_MODE=disabled`: restaurar hoja y propiedades, respaldo diario, monitor, MFA admin/editor y un código de recuperación aceptado una vez y rechazado al repetirlo. `RECOVERY_T4_*` es solo una herramienta del ensayo dentro del mismo proyecto, no un respaldo de producción. No seguir si falla alguna prueba.
3. Anotar versión y URL `/exec` activa y respaldar la hoja completa. Reemplazar `Código.gs` (backend/Code.gs), CatalogAccess.gs, LocalForms.gs y AuthCrypto.gs; agregar Security.gs, Turnstile.gs y Maintenance.gs, sin duplicados. Conservar los demás módulos y el manifiesto aprobado. Publicar «Seguridad y mantenimiento Tanda 4» como nueva versión de la implementación existente, misma URL. Mantener `TURNSTILE_ENABLED` apagado y no ejecutar aún `prepararSeguridadTanda4_`. Comprobar que la tienda sigue funcionando.
4. Confirmar claves y variables antes de pasar el PR a revisión y fusionar. Esperar Render Live. Probar reserva y carrito desde celular y escritorio con datos de prueba identificados, revisar resultados y retirar solo las pruebas. Recién después activar `TURNSTILE_ENABLED=yes` y repetir. Nunca usar claves dummy ni `TURNSTILE_TEST_MODE=yes` en producción.
5. Con Nahuel presente, confirmar `ADMIN_PASSWORD_RECORD` y ejecutar `prepararSeguridadTanda4_`. Nahuel entra enseguida, escanea el QR y anota diez códigos en papel; el agente no copia esos secretos. Confirmar salida y nuevo ingreso con contraseña más código, y que el editor siga funcionando.
6. Crear o confirmar carpeta privada de respaldos desde la cuenta dueña del script, sin colaboradores. Configurar `BACKUP_FOLDER_ID`, `SITE_URL` y `MONITOR_EXEC_URL` con la implementación activa. Ejecutar `backupDaily_`, comprobar copia del día y ejecutar `prepararMantenimientoTanda4_`: respaldo 02:30 Argentina y monitor cada 15 minutos, sin duplicados.
7. Mantener retención apagada: no ejecutar `prepararRetencionAprobada_` ni activar `PERSONAL_RETENTION_APPROVED` hasta que Nahuel apruebe ambos plazos. No eliminar copias de clientes por esta instalación.
8. Comprobar catálogo, carrito, formularios, admin/editor, fotos, mapa y PDF. Ante un fallo, detener la siguiente etapa y recuperar el último estado funcional. La reversión del frontend debe coordinarse con la bandera Turnstile para conservar el envío de reservas.

## Claves que debe crear el dueño en Cloudflare

Cloudflare → Turnstile → Add widget → nombre «dc-web formularios» → Managed → añadir `disfrazcabezon.com.ar`, `www.disfrazcabezon.com.ar` y `dc-web-8ai4.onrender.com` → Create. Copiar la sitekey a Render y la secret key a Propiedades del Apps Script. No pegarlas en el PR ni enviarlas por correo/chat. El widget no necesita Cloudflare proxy para funcionar. Usar claves distintas para ensayo; nunca publicar las claves dummy en producción.

Referencia: https://developers.cloudflare.com/turnstile/get-started/ y https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

## Cabeceras y DNS

`render.yaml` refleja las seis reglas `/*` instaladas en el servicio existente, no pide crear otro servicio. Se probó primero CSP Report-Only y luego se cambió el nombre a Content-Security-Policy. Verificación HTTP 200 en los tres hosts; securityheaders.com da **A** (2026-11-06 UTC). La advertencia es `unsafe-inline` para scripts de hidratación y estilos de Next export; no hay `unsafe-eval`. Una CSP con hashes sería una mejora separada, no se promete protección total contra XSS. HSTS no incluye subdominios del dominio propio para no afectar servicios desconocidos. Cloudinary, Apps Script, Cloudflare Insights, Turnstile y el iframe de Maps quedan permitidos, sin comodín general de scripts.

DMARC actualizado a `v=DMARC1; p=reject;`; SPF y DKIM de Cloudflare y los tres MX de Email Routing conservados. DNSSEC: `.com.ar` tiene cadena firmada, pero el dominio aún no publica DS/DNSKEY. No se activó DNSSEC ni se inventó un DS. La carga efectiva de DS en NIC debe confirmarse con el panel o soporte antes de activar; no usar registros TXT para simular un DS.

## Repositorio y pruebas

- Historial completo: gitleaks 8.30.1, 93 commits, siete coincidencias revisadas (ID público de Analytics, contraseñas históricas sintéticas y hook ficticio de un mock); cero secretos privados confirmados. No se creó una exclusión global ni se rotó una credencial sin evidencia de exposición. Los logs redactados están en privado.
- Dependabot alerts, dependency graph y security updates activados. Secret scanning y push protection ya estaban activados. Dependabot semanal de npm y Actions en este draft.
- Se retiran 63 capturas de admin/formularios de la versión actual del árbol; quedaron copiadas a almacenamiento local privado. Esto no reescribe ni purga el historial remoto. No se publican nuevas capturas de admin, ni siquiera sintéticas.
- Fixtures portátiles: las pruebas de importación ya no exigen archivos locales. No se cambian los archivos de los importadores ni sus manifiestos aprobados.
- CI en cada PR/push main: scan de secretos del rango nuevo, npm ci, audit alto/crítico, build estático, unitarias y un conjunto Playwright con Chrome escritorio y 390 px. Actions fijadas a SHA. La regla de main está preparada con PR, rama actualizada y el check exacto «Unitarias, build y Playwright», sin bypass, force push ni borrado. GitHub pidió verificación por correo al guardar: pendiente de que el dueño complete esa confirmación; no se declara aplicada aún.
- 428 unitarias correctas; build limpio y diez casos Playwright de seguridad correctos. La primera ejecución real de GitHub Actions pasó completa (scan, audit, build, unitarias y 60 Playwright). El diálogo de Turnstile también se prueba al cancelar con Escape y ante error del widget: no cierra el carrito ni deja el fondo bloqueado. Las pruebas vivas de ensayo siguen pendientes de la autorización de Google: no se confunden mocks locales con Apps Script desplegado.

## Propiedades nuevas (sin valores privados)

`SECURITY_V1_ENABLED`, `SECURITY_ENV`, `SECURITY_SESSION_EPOCH`: activación, guardia de ensayo e invalidación global. `SECURITY_MFA_<id>`: secreto TOTP y hashes de recuperación; no exportar al repo. `SECURITY_KNOWN_BROWSERS`, `SECURITY_LOGIN_FAILURES`, `SECURITY_MAIL_RATE`: estado acotado de alertas. `TURNSTILE_ENABLED`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_HOSTNAMES`, `TURNSTILE_TEST_MODE`: protección de formularios. `BACKUP_FOLDER_ID`, `BACKUP_LAST_SUCCESS`: destino privado y última copia. `MONITOR_EXEC_URL`, `MONITOR_STATE`: monitor. `PERSONAL_RETENTION_APPROVED`, `PERSONAL_DNI_RETENTION_DAYS`, `PERSONAL_RECEIPT_RETENTION_DAYS`: aprobación y plazos. `RECOVERY_T4_META`, `RECOVERY_T4_<n>`: snapshot de propiedades dentro del mismo proyecto; no sustituye una recuperación ante pérdida de la cuenta/proyecto.

## Recuperación e inventario realizados

Se reconstruyó el commit base `5316680` desde git archive en una carpeta aislada: npm ci y build terminaron en 38,7 s, y se abrió una ficha estática sintética en el navegador. Esto verifica la reconstrucción del frontend; la restauración completa de Sheets/propiedades no se ejecutó por el bloqueo de autorización de Google.

En web-dc se archivaron las dos implementaciones activas antiguas (v15 y v3, ambas Solo yo). Solo queda activa v25 PR42; se inventariaron las 24 archivadas. La URL retirada de compatibilidad devuelve HTTP 404 y no pertenece a las implementaciones activas de este proyecto. El proyecto «ENSAYO PR32 hash repetido sin acceso a datos», sin ámbitos OAuth y sin implementación publicada, se movió a papelera recuperable; el ensayo que seguimos usando se conserva. No se vació la papelera ni se eliminaron copias de clientes.
