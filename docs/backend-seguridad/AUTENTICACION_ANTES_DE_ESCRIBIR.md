# Autenticar antes del mantenimiento del backend

Draft separado del PR #14. No desplegado ni ejecutado en producción.

`dispatch_` recuperaba stock y creaba categorías antes de rechazar una sesión
ausente o vencida. Ahora `session_(b.token)` ocurre primero en la rama
administrativa; luego se ejecutan `recoverStock_()` y, para `admin`,
`saveCategory`, `saveProduct` y `mapLegacyCategory`, `ensureCotillonDepth3_()`.
Las lecturas públicas `catalog` y `catalogData` dejan de crear categorías o
recuperar stock. Las demás funciones de negocio permanecen iguales.

## Acciones públicas, una por una

| Acción | Escrituras sin token administrativo | Justificación y condición |
| --- | --- | --- |
| siteTheme | Ninguna | Lee tema; `doPost` mantiene su salida directa. |
| catalog | Ninguna | Lee productos y categorías existentes. |
| catalogData | Ninguna | Lee catálogo, categorías, campaña y estado de importación. |
| login | Caché de intentos y, con contraseña válida, sesión temporal | Necesario para limitar ataques y emitir el token; nunca mantiene tablas. Un intento fallido sí consume el límite. |
| bank | Ninguna | Valida formulario y documentos antes de devolver datos bancarios; solo lecturas. |
| submit | Reserva, documentos privados, notificaciones y caché de límites | Alta pública intencional del formulario: exige requestKey, clave privada, validaciones, cuenta configurada y documentos; conserva idempotencia. Los avisos siguen MAIL_MODE. |
| request | Ninguna | Exige clave privada de la reserva o sesión administrativa antes de devolverla. |
| file | Ninguna | Exige acceso a la reserva; para documentos distintos de la firma exige además sesión administrativa. Lee un archivo existente. |
| correct | Documentos, reserva y envío a papelera de documentos reemplazados | Exige acceso privado o sesión, estado correction, plazo vigente y archivos válidos. Permite al cliente corregir su propia solicitud. |
| cancel | Cancelación y caché de límites | Formulario público de arrepentimiento: valida campos y limita intentos. No cambia stock ni categorías. |

Por ello, “sin token no escribe” se garantiza para acciones administrativas,
desconocidas y lecturas públicas, no para los formularios públicos válidos ni
el limitador de login. Ninguna excepción pública llama mantenimiento global.

Un movimiento interrumpido espera la próxima operación administrativa válida.
Una lectura pública puede ver el stock persistido anterior hasta esa recuperación.
No confirma ventas ni reservas automáticamente. Antes de publicar, el operador
debe revisar pendientes y completar un acceso administrativo válido en ensayo.
Las categorías deben prepararse mediante configuración/importación autorizada
o acceso administrativo; visitar el catálogo ya no inicializa la estructura.

## Tests

La nueva suite deja stockPending real y flags de categorías pendientes para
reproducir el fallo original. Comprueba cada acción administrativa con token
ausente, inválido y vencido: cero escrituras en tablas, propiedades o caché.
También cubre doPost, lecturas públicas, claves privadas incorrectas, login y
orden de sesión/mantenimiento con un administrador válido. Todo se ejecuta en
Node con servicios simulados, sin peticiones al endpoint de producción.
Resultado: **57/57 nuevas**, **155/155 unitarias totales**, build estático limpio
con URL mock correcto. No se alteraron los tests anteriores. Playwright no se
repitió: el cambio afecta dispatch de Apps Script y queda cubierto por la suite
de backend; no se cambió el frontend. El runtime de Apps Script requiere el
ensayo separado indicado abajo antes de desplegar.

## Desplegar en Apps Script, solo con autorización posterior

1. Revisar y aprobar este draft por separado. Guardar la versión y el deployment
   ID actuales de Apps Script y una copia del código anterior fuera del repo.
2. Usar un proyecto de ensayo con una copia de la hoja, carpeta privada propia,
   MAIL_MODE=disabled y credenciales de prueba. Copiar Code.gs completo desde
   este PR; conservar Validation.gs y los importadores existentes sin cambios.
3. Probar en ese ensayo las solicitudes sin token y verificar que no cambian
   stockPending, categorías ni Script Properties. Probar un login y acceso
   admin válidos; verificar recuperación de stock y creación de categorías.
   Probar catálogo, alta/corrección de reserva y arrepentimiento con datos ficticios.
4. **Esperar OK explícito antes de editar o desplegar producción.** Luego
   reemplazar únicamente Code.gs en el proyecto existente; no ejecutar funciones
   de preparación o importación. No modificar secretos ni permisos de acceso.
5. Implementar → Administrar implementaciones → editar la implementación web
   actual → Versión: Nueva versión → descripción del cambio → Implementar.
   Mantener el mismo deployment ID y URL /exec. Guardar el número de versión.
   Fusionar GitHub o desplegar Render por sí solos no actualiza Apps Script.
6. Verificar el formulario y acceso administrativo dentro de la ventana autorizada.
   Si falla, informar antes de revertir. Para revertir con aprobación, editar
   esa misma implementación y seleccionar la versión previa; no crear otra URL.
