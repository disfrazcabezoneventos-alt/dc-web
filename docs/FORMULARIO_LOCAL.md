# Formulario del local y formularios entrantes

## Qué se agregó

- URL para el QR: `https://disfrazcabezon.com.ar/reserva-local/`.
- No aparece en portada, catálogo ni menú. Tiene `noindex`. Quien conozca la URL puede abrirla: no es un acceso privado ni una autenticación.
- Cuatro pasos: datos, alquiler, DNI frente/dorso y firma. Sin comprobante de domicilio, comprobante de pago, datos bancarios, paso de pago ni cuenta regresiva.
- Horarios fijos actuales: lunes a viernes, retiros de 16 a 20 y devoluciones de 10 a 14; sábados ambos de 10 a 12. Domingos no disponibles. No se pueden elegir excepciones desde el formulario local.
- Tarifas independientes del catálogo: adulto $60.000 y cabezón $75.000 inicialmente. Se multiplican por las cantidades. Cambiar la tarifa no modifica reservas recibidas ni los precios de la web.
- Retiro hoy (hora de Buenos Aires): alquiler completo obligatorio. Para otra fecha se permite 50% o completo. Esto indica la modalidad acordada; no acredita pagos ni crea movimientos en Caja.
- Admin: **Precios disfraces**, **Formularios entrantes → Formularios web / Formulario local** y campanita con consulta cada diez segundos mientras el panel está abierto.
- Orden por llenado, retiro o devolución, en ambos sentidos; búsqueda inmediata por disfraz con sugerencias seleccionables.
- Precio editable desde cada fila; estado operativo Reserva / Despachado / Finalizado. Abrir permite editar todos los datos del cliente, disfraces, categorías, cantidades, fechas, precio, modalidad, autorizados y declaraciones; descargar/reemplazar adjuntos y consultar contrato e historial. Cancelar descarta el borrador previa confirmación.

## Antes de empezar

Estos cambios están preparados en el repositorio. No actualizan automáticamente el proyecto de Apps Script ni Render. No modifiques el sitio antiguo de `goldenvine.chatgpt.site`: esta implementación pertenece a la web actual.

El formulario web `/reservas/`, su componente y su validación conservan sus requisitos. **Revisión de reservas** conserva la aprobación, corrección documental, rechazo y demás estados anteriores. Los tres estados nuevos son de organización interna: Despachado no confirma un cobro, Finalizado no devuelve dinero y ninguno reemplaza la revisión anterior. Caja sigue registrándose por separado.

## Instalación paso a paso

1. **Respaldá.** En Drive hacé una copia de la hoja actual de tienda y reservas. En Apps Script guardá una copia de los archivos actuales. No publiques la hoja ni la carpeta de DNI.
2. **Abrí el Apps Script de la web actual**, el que corresponde a la URL `/exec` configurada en Render. No uses el del formulario original de ChatGPT Sites.
3. En Apps Script reemplazá **Code.gs** por `backend/Code.gs` del repositorio.
4. Reemplazá **Validation.gs** por `backend/Validation.gs` del mismo cambio. Ya está generado; no se edita a mano. Si en el futuro cambiás las reglas/condiciones, ejecutá `node scripts/generate-backend.mjs` antes de copiarlo.
5. Creá un archivo de secuencia de comandos llamado **LocalForms** y pegá **todo** `backend/LocalForms.gs`. Apps Script muestra el nombre `LocalForms.gs`. Conservá los demás archivos de importación/mantenimiento que ya existan.
6. En el selector superior elegí **prepararFormulariosLocales** y pulsá **Ejecutar**. Si Google pide permisos de la hoja o Drive, autorizá con la cuenta propietaria que ya utiliza el sistema. Esta función reutiliza la hoja y carpeta actuales; no copia ni mueve las reservas existentes y no cambia la cuenta de cobro.
7. Verificá el resultado: `ready: true`, adulto `60000`, cabezón `75000`. En Propiedades del script se crean `LOCAL_FORMS_ENABLED=yes`, `LOCAL_PRICE_ADULTO`, `LOCAL_PRICE_CABEZON` y `FORM_NOTIFICATIONS_SINCE`. Podés repetir la preparación sin reponer tarifas ni reiniciar las notificaciones. Los registros anteriores se listan como web; solo las entradas desde la habilitación generan avisos nuevos.
8. **Publicá Apps Script:** Implementar → Administrar implementaciones → lápiz de la aplicación web que usa Render → Nueva versión → Implementar. Conservá la misma URL `/exec`, ejecución como propietario y el acceso actual de la aplicación web. Guardar el código sin publicar no alcanza.
9. **Publicá el frontend** del mismo cambio en Render, después del backend. Build: `npm ci && npm run build`; directorio de publicación: `out`. Conservá la URL `/exec` y `SITE_URL` que ya funcionan. No hace falta cambiar DNS ni cuentas bancarias. Si estás haciendo la prueba en otra web, usá otra implementación, hoja, carpeta y `SITE_URL` de prueba.
10. Abrí `/admin/` e iniciá sesión. En **Precios disfraces** verificá los dos importes y guardá cualquier ajuste deseado. Abrí **Formularios entrantes** y comprobá que las reservas anteriores estén en Formularios web. La campanita está arriba a la derecha.
11. Abrí `https://disfrazcabezon.com.ar/reserva-local/` en un celular. Generá/imprimí un QR que contenga esa URL exacta. Probalo con la cámara antes de ponerlo en el mostrador. No hace falta agregar botones al sitio.

## Prueba final recomendada

Primero en una copia aislada con datos y documentos ficticios marcados PRUEBA. En producción, cualquier envío crea una solicitud y puede enviar correos según `MAIL_MODE`; coordiná una única prueba identificable.

1. Elegí un adulto: total $60.000. Elegí un cabezón: $75.000. Probá 2 cabezones + 1 adulto: $210.000 con las tarifas iniciales.
2. Elegí retiro hoy: completo queda seleccionado y 50% deshabilitado. Cambiá a un día futuro habilitado: se puede seleccionar 50%. Probá un domingo: se impide continuar. Los horarios no tienen selectores.
3. Adjuntá frente y dorso de DNI de prueba. Verificá que no aparezcan domicilio adjunto, transferencia ni comprobante de pago. Firmá, completá aclaración y aceptá las condiciones presenciales. No hay tiempo límite para completar el formulario.
4. Enviá una vez. Guardá el código y el enlace privado. En el admin esperá hasta diez segundos (más el tiempo de respuesta de Google). La campanita debe sumar uno.
5. Abrí la campanita y pulsá el aviso. Debe ir al origen correcto, abrir ese formulario y quitar su aviso. Comprobá ambos orígenes enviando también una reserva web de prueba con los requisitos habituales.
6. Buscá parte del nombre de disfraz y elegí una sugerencia sin Enter. Probá las tres fechas de ordenamiento, en ambas direcciones.
7. Abrí el modal, cambiá nombre, disfraz, categoría y precio; cancelá y confirmá el descarte. Reabrí: los datos anteriores deben seguir. Repetí, guardá y verificá la fila y el historial. Probá Reserva → Despachado → Finalizado.
8. Reemplazá una foto de prueba y descargala. Descargá el contrato original firmado: debe conservar los datos y la firma del envío, aunque haya modificaciones de gestión.
9. Con varios avisos probá Borrar todas → Cancelar y Borrar todas → Aceptar. Las nuevas notificaciones que lleguen después de abrir la confirmación no se borran por accidente.
10. Eliminá un formulario de prueba desde el modal: desaparece de entradas y avisos. La hoja conserva el registro y los archivos para recuperación; no se borran contratos ni cobros. La recuperación requiere quitar `deletedAt` del JSON de esa fila en la copia respaldada/hoja, con ayuda técnica. No uses este mecanismo como borrado definitivo de datos personales.
11. Abrí el formulario web normal y el catálogo, carrito, compra, Revisión de reservas y Caja. Deben conservar sus flujos. Esta prueba no confirma que un correo llegó a la bandeja: comprobalo también en el buzón y spam.

## Datos, firma y cambios simultáneos

Se reutiliza la pestaña `reservas`. Nuevas solicitudes locales llevan `source: local`; las anteriores o sin origen se consideran web. La consulta de notificaciones lee solo reservas y no descarga el catálogo entero cada diez segundos. La lectura se conserva en `adminNotificationReadAt`, compartida por el equipo. Borrar un aviso no borra la solicitud ni el historial del correo.

La edición guarda `managementData`, `managementFiles`, `formState` y `managementRevision`. Los datos firmados (`data`), `signedFiles`, condiciones, fecha y hash originales no se sobrescriben. El modal muestra los datos de gestión vigentes; el portal del cliente y el contrato muestran el envío firmado original. Editar una aceptación en administración no produce una nueva aceptación del cliente. Cambiar precios de una solicitud no altera retroactivamente el contrato firmado.

Cada guardado exige la revisión que se abrió. Si otro administrador guardó antes, se rechaza el cambio: cerrá y reabrí para revisar los datos actuales. Un precio no puede quedar por debajo de los cobros de alquiler ya registrados. Una nueva tarifa detectada durante el envío obliga al cliente a actualizar precios y volver a revisar/firmar; no se cambia silenciosamente lo firmado. Los reintentos idénticos de envío reutilizan la solicitud y no duplican documentos ni correos.

## Si algo falla

- **“Primero ejecutá…” / sección sin habilitar:** verificá los tres archivos, la función de preparación y la publicación de una nueva versión en la misma implementación.
- **“Acción desconocida”:** Render apunta a una implementación antigua o guardaste Apps Script sin publicar.
- **Error de origen:** `SITE_URL` debe coincidir exactamente con el origen real del frontend. Conservá el valor de producción; para localhost usá una implementación de prueba independiente.
- **Precios cambiaron:** en el formulario local volvé a Tu alquiler y pulsá Actualizar tarifas y catálogo; revisá el resumen antes de firmar otra vez.
- **Sesión vencida:** volvé a ingresar al admin. La campanita no renueva credenciales por sí sola.
- **Google tarda al guardar:** revisá antes el admin para evitar repetir un envío con un formulario nuevo. El formulario conserva su identificador durante el intento actual.
- **Volver atrás de esta publicación:** restaurá primero el frontend anterior. El código nuevo del backend sigue aceptando el formulario web anterior. No borres los campos o registros locales al restaurar versiones.

## Validación del repositorio

Pruebas de reglas y API simulando los servicios de Google en `tests/local-forms.test.mjs`; recorrido real del navegador contra `out/` en `tests/e2e/local-forms.spec.mjs`. El navegador usa el código real de `Code.gs`, `Validation.gs` y `LocalForms.gs` con almacenamiento simulado: no escribe producción ni envía correos reales. La entrega incluye además las pruebas existentes, el chequeo de tipos y una compilación estática limpia. Los resultados concretos y límites se registran en `docs/qa/FORMULARIO_LOCAL_VALIDACION.md`.
