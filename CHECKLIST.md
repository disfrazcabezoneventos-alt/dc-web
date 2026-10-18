# Revisión del sitio — 18/10/2026

## Comprobado

- [x] Next.js compila con exportación estática para Render (`out/`); TypeScript y las 31 pruebas automatizadas pasan.
- [x] El sitio publicado abre portada, disfraces, cotillón, compra, reservas, administración, condiciones y arrepentimiento.
- [x] La URL pública de Apps Script responde con el esquema `saleCondition+orderLimit` y los catálogos publicados cargan desde allí.
- [x] Se muestran las imágenes reales del catálogo; la búsqueda y los estados sin resultados funcionan.
- [x] El detalle de venta a pedido muestra el plazo y la consulta de medidas; el formulario pide reconfirmación y limita la cantidad al máximo configurado.
- [x] Los productos de venta inmediata limitan la cantidad al stock disponible.
- [x] Un enlace desde un disfraz de alquiler llega al formulario con el producto elegido.
- [x] La pantalla pública de administración sin sesión muestra el acceso; el botón flotante de WhatsApp apunta al número correcto.
- [x] En una ventana de 390 px, portada, catálogo, reserva y aviso de preventa no presentan desborde horizontal; el menú móvil abre.
- [x] La consola del navegador no mostró errores en las rutas públicas recorridas.
- [x] Las reglas privadas de stock, categorías, estados, caja y reserva pasan con servicios Google simulados.

## Límites de esta revisión

- [ ] La versión nueva de `backend/Code.gs` aún debe copiarse al proyecto Apps Script correcto y publicarse como nueva versión de la implementación existente. La respuesta `/exec` debe mostrar `version: 3` después de hacerlo. Hasta entonces, Render continúa usando el backend publicado con `version: 2`.
- [ ] No se realizó una reserva real ni se enviaron documentos, correos o cobros de prueba en producción.
- [ ] No se verificó el inicio de sesión privado, la subida de una nueva foto a Cloudinary, los permisos reales de Google Drive ni la administración/caja en vivo. Las pruebas automatizadas de esas reglas usan simuladores.
- [ ] Queda revisar el sitio en teléfonos físicos y realizar una prueba completa controlada con las cuentas del negocio.
- [x] `npm audit --audit-level=high` consultó el registro npm y encontró 0 vulnerabilidades, incluidas las dependencias de compilación.
- [x] Los avisos de correo en `retry` por falta de cuota se pueden reintentar manualmente con `reintentarAvisosSinCuota` desde Apps Script, en lotes de hasta 10. Los estados de envío incierto permanecen bloqueados para evitar duplicados.
- [x] Los diálogos de eliminación de categorías y condiciones mantienen el foco dentro, cierran con Escape y devuelven el foco al control anterior.

La disponibilidad de disfraces por fecha se confirma manualmente. La estadística de ganancia usa los cobros y costos cargados y es una estimación, no una conciliación bancaria.
