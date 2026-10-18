# Revisión de entrega — 18/10/2026

## Implementado

- [x] React + Next.js con `output: 'export'`, sin servidor Next ni rutas `/api`.
- [x] Configuración de Render Static Site con carpeta `out`.
- [x] Rediseño responsive basado en el negocio y fotos del sitio de referencia.
- [x] Inicio, disfraces alquiler/venta, cotillón venta y reservas.
- [x] Búsqueda, categorías, modalidad y detalle de productos.
- [x] WhatsApp fijo abajo a la derecha, número internacional `5491149897969`, mensajes preparados.
- [x] Formulario original de cinco pasos integrado: identidad, fechas, documentos, pago y firma.
- [x] Validación compartida entre navegador y Apps Script; validación de formatos de archivo en servidor.
- [x] Datos de cobro configurables; envío real bloqueado mientras no haya cuenta de cobro.
- [x] Reserva pendiente, seguimiento privado, corrección documental e historial de estados.
- [x] Descarga de contrato PDF con firma y condiciones de la solicitud.
- [x] Formulario y gestión de solicitudes de arrepentimiento.
- [x] Acceso administrador con usuario y contraseña en propiedades privadas de Apps Script.
- [x] CRUD separado de disfraces y cotillón, visibilidad y stock.
- [x] Backend de Google Sheets y archivos personales en Drive privado.
- [x] Subida firmada de imágenes de productos a Cloudinary desde Apps Script.
- [x] Caja: ventas, cobros parciales de alquiler, costos, gastos, reintegros y anulaciones.
- [x] Stock de ventas con recuperación de operaciones interrumpidas.
- [x] Estadísticas diarias, semanales y mensuales con ingresos reales y ganancia estimada.
- [x] Avisos iniciales por MailApp con modos test/production y registro contra duplicados.
- [x] Demostración sin escrituras, reemplazada por datos reales cuando se configura la conexión.
- [x] Guía paso a paso y `.env.example`.

## Verificación realizada localmente

- Compilación de producción: `npm run build`, exportación estática de las ocho páginas de negocio y página 404.
- TypeScript: `npm run typecheck`.
- Doce pruebas automáticas: validación, autenticación, CRUD separado, stock/idempotencia, recuperación tras corte, acceso privado, estados/cobros, archivos, reenvío de reserva, estadísticas, exportación, correo y generación PDF (algunas agrupadas en una prueba).
- Backend ejecutado con dobles de prueba de Google: verifica las reglas, no los permisos ni el comportamiento real de los servicios Google.
- Navegador: portada, búsqueda de Robin, detalle y enlace WhatsApp, panel de demostración y pantalla de firma con envío desactivado.
- Revisión visual: portada de escritorio y portada/formulario dentro de un viewport de 390 px mediante un iframe local. No equivale a una prueba en todos los dispositivos físicos.
- PDF: generación y estructura multipágina verificadas por prueba automatizada. Queda revisar visualmente un contrato real descargado durante la prueba con servicios configurados.

## Pendiente de configuración y prueba real

- [ ] Crear el proyecto Apps Script, pegar ambos `.gs`, ejecutar configuración y publicar `/exec`.
- [ ] Configurar Cloudinary, datos bancarios y la variable pública de Next.js.
- [ ] Probar conexión navegador → Apps Script y cargas reales con archivos ficticios.
- [ ] Comprobar en las cuentas propias el almacenamiento privado, permisos y correos.
- [ ] Recorrer reserva, corrección, PDF, caja y cancelación de punta a punta.
- [ ] Publicar en Render y probar desde un teléfono real.
- [ ] Cambiar el correo de test a production después de verificar.

No se modificó ni publicó la web de referencia, el proyecto anterior de Sites o su Apps Script. No se migraron clientes/reservas de D1/R2. Este repositorio reemplaza esas dependencias para las solicitudes nuevas.

## Decisiones operativas

- La disponibilidad de cada disfraz/talle/fecha se acuerda y confirma manualmente por WhatsApp, como en el formulario recibido.
- La estadística de ganancia es una estimación basada en los cobros y costos cargados; no es contabilidad fiscal ni conciliación de banco.
- Las garantías no forman parte de la caja de ingresos implementada.
- WhatsApp usa enlaces Click to Chat; no envía mensajes automáticamente ni requiere una cuenta de WhatsApp Business API.
- El registro técnico de Sheets almacena un ID y JSON por fila. La edición diaria se hace desde el panel; no hay que modificar las celdas JSON a mano.
- Un solo administrador, como se pidió. No se trasladaron los permisos del personal por identidad ChatGPT, que pertenecían a la plataforma anterior.
- La descarga reconstruye el PDF con datos y condiciones originales; no se almacena un PDF firmado por un certificado digital.
- Se preservaron las condiciones entregadas por el usuario. Su contenido contractual no fue reformulado ni certificado jurídicamente.
- No hay borrado automático de documentos ni migración histórica; el responsable define la conservación y realiza las supresiones que correspondan.
