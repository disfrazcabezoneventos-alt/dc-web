# Constancias del local

El cliente recibe dos comunicaciones diferentes: al terminar el formulario, un
aviso de recepción con el enlace privado al contrato; cuando el local verifica
la reserva y registra el dinero recibido, una constancia de reserva y cobros.
El correo de constancia incluye el detalle y un enlace privado para consultar y
descargar el PDF. WhatsApp abre un mensaje preparado: hay que tocar Enviar.

## Uso diario

1. Admin → Formularios entrantes → Formulario local → Abrir.
2. Si corregiste datos, guardá y volvé a abrir el formulario.
3. En **Constancia para el cliente**, revisá el total, cobrado, saldo y garantía.
4. Cargá **solo el cobro recibido ahora**, la garantía recibida ahora, fecha y medio.
   Si ya registraste el pago en Caja, dejá ambos importes nuevos en cero.
5. Marcá que verificaste los datos y pulsá **Confirmar reserva y enviar constancia**.
   Confirma la reserva, registra los cobros nuevos en Caja y envía el correo.
6. Revisá el estado del correo. Podés descargar el PDF, copiar el enlace privado
   o pulsar **Enviar por WhatsApp** y luego Enviar dentro de WhatsApp.
7. Si el cliente paga el saldo después, cargá solo ese nuevo cobro y emití otra
   constancia. La anterior conserva lo registrado en su fecha y avisa si cambió.

La garantía se registra con tipo `garantia`, separada del alquiler y excluida de
los ingresos/ganancias. Los errores de carga se anulan desde Caja con su motivo;
no se borran. No registres una devolución real como una anulación por error.
Las reservas con reintegros requieren revisión de Caja antes de emitir otra copia.

Un envío aceptado por Google no garantiza que haya llegado a la bandeja. Revisá
spam con el cliente. **Prueba** significa que se envió solo al correo del negocio.
**Sin cuota** permite reintentar más tarde. **Incierto** requiere consultar antes
de reenviar: Google pudo haberlo enviado aunque se haya perdido la respuesta.
Los reenvíos nunca vuelven a registrar un cobro.

Si una operación se interrumpió, pulsá **Completar operación pendiente**. No
cargues otro pago por el mismo importe. El sistema reutiliza los identificadores
guardados y bloquea cambios incompatibles hasta terminar.

## Instalación (backend primero)

1. Respaldá la hoja y conservá la versión activa de Apps Script para volver atrás.
2. En el proyecto actual `web-dc`, actualizá `Código.gs` con `backend/Code.gs` y
   `LocalForms.gs` con `backend/LocalForms.gs`. Agregá `LocalReceipts.gs` copiando
   `backend/LocalReceipts.gs`. Conservá Validation y los archivos de importación.
3. Ejecutá **prepararConstanciasLocales** una sola vez. Reutiliza la misma hoja,
   agrega la pestaña privada `constancias`, crea un secreto interno y habilita
   la función. No cambia contraseñas, tarifas, permisos, DNS ni cobros existentes.
4. Verificá `ready: true`, `SITE_URL=https://disfrazcabezon.com.ar` y el modo de
   correo. `MAIL_MODE=test` envía solo al negocio; `production` al cliente.
   No publiques el secreto ni las hojas. Repetir la preparación conserva el secreto.
5. Implementar → Administrar implementaciones → editar la implementación web
   actual → Nueva versión → Implementar. Conservá la misma URL y permisos.
6. Publicá el frontend en Render (`npm ci && npm run build`, carpeta `out`).
   Hasta actualizar Apps Script, el admin muestra cómo habilitar la función.
7. Probá con una reserva ficticia identificada PRUEBA: pago parcial, PDF, correo
   recibido, WhatsApp, saldo posterior y reenvío sin duplicar cobros.

## Datos y límites

- El contrato firmado y su copia de una hoja para completar a mano se conservan.
- La constancia usa los datos de gestión vigentes y cobros reales, nunca el 50% o
  100% elegido por el cliente como supuesto pago.
- Los enlaces tienen firma HMAC con propósitos separados. La constancia pública
  no devuelve correo, teléfono, DNI, domicilio, fotos ni tokens de administración.
- El enlace del contrato conserva el acceso privado existente. Los nuevos avisos
  locales incluyen una copia accesible; las reservas web conservan su aviso habitual.
- Cada emisión conserva una foto de datos y cobros. Cambiar datos, anular cobros,
  archivar o cancelar impide reenviar esa versión como actual.
- La cuota de Apps Script para Gmail personal se comparte con otros avisos.
  No se contrata un servicio externo ni se integra WhatsApp Business Platform.
- Para volver atrás, restaurá primero frontend y luego la versión anterior de
  Apps Script. Conservá las filas de constancias y cobros para no perder historial.

## Referencias oficiales

- [Correo y cuotas](https://developers.google.com/apps-script/guides/services/quotas)
- [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app)
- [Firma HMAC](https://developers.google.com/apps-script/reference/utilities/utilities)
- [Enlaces de WhatsApp](https://faq.whatsapp.com/5913398998672934/?locale=es_ES)
