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

## Instalación, después de revisar y aprobar

1. Anotar versión y URL `/exec` activa. Copiar la hoja completa a carpeta privada. Guardar el código aprobado y el manifiesto. No imprimir ni subir valores de Propiedades a GitHub, capturas o logs.
2. Reemplazar `Código.gs` (archivo `backend/Code.gs`), `CatalogAccess.gs`, `LocalForms.gs` y `AuthCrypto.gs`. Añadir `Security.gs`, `Turnstile.gs` y `Maintenance.gs`. Conservar Validation, RentalPricing, RentalPromotions, PublicCatalog, SiteInfo, CatalogPages, LocalReceipts y los demás archivos existentes sin duplicar funciones. Conservar el manifiesto y sus ámbitos aprobados.
3. Preparar MFA: confirmar `ADMIN_PASSWORD_RECORD` existente; ejecutar `prepararSeguridadTanda4_` desde el editor. Genera el epoch e inicia el enrolamiento obligatorio al siguiente ingreso. No borrar el registro MFA después de configurarlo. El dueño escanea el QR y guarda los diez códigos fuera del dispositivo; el agente no copia esos secretos.
4. Crear claves Turnstile como se explica abajo. Guardar `TURNSTILE_SECRET_KEY` solo en Propiedades; `TURNSTILE_HOSTNAMES` con las tres direcciones sin protocolo ni rutas, separadas por comas. En producción no definir `TURNSTILE_TEST_MODE` o dejarlo distinto de `yes`.
5. Publicar nueva versión de la misma implementación con descripción «Seguridad y mantenimiento Tanda 4», conservando la URL `/exec`. Mantener `TURNSTILE_ENABLED` apagado durante el cambio de frontend.
6. En Render configurar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN`. La sitekey y el ID de Analytics son públicos por diseño; nunca poner la clave secreta ni el deploy hook en variables `NEXT_PUBLIC_*`. Mantener `NEXT_PUBLIC_APPS_SCRIPT_URL` actual. Fusionar solo tras aprobar el draft y esperar Live.
7. Verificar la obtención del token con el widget real en los cuatro formularios y la validación contra ensayo; recién entonces activar `TURNSTILE_ENABLED=yes` en producción y comprobar un envío autorizado. Evitar una ventana de incompatibilidad: backend primero, frontend después, bandera del servidor al final. La nueva interfaz bloquea un envío real si falta la sitekey.
8. Crear carpeta privada de respaldos desde la cuenta dueña del Apps Script, sin colaboradores. Configurar `BACKUP_FOLDER_ID`, `SITE_URL` y `MONITOR_EXEC_URL` (misma URL activa). Ejecutar `backupDaily_` y comprobar la copia; después `prepararMantenimientoTanda4_`, que instala respaldo 02:30 Argentina y monitor 15 min sin duplicar activadores.
9. No ejecutar `prepararRetencionAprobada_` hasta la aprobación escrita del plazo de DNI/comprobantes. No eliminar copias antiguas de clientes por esta instalación.
10. Comprobar catálogo, carrito, formularios, admin/editor, fotos, mapa y PDF en las tres direcciones. Si falla, detener y restaurar la versión registrada, con las banderas nuevas apagadas. Una reversión de frontend requiere también coordinar la bandera Turnstile.

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
