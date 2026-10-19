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

## Migración de cotillón — 19/10/2026

- [x] Se tomaron 635 productos vigentes de las ocho secciones públicas del sitio anterior; se excluyeron disfraces de niños y adultos, así como los productos generales fuera de esas secciones.
- [x] El carrito es exclusivo de cotillón, permite varias líneas y cantidades, conserva la selección en el navegador y compone un mensaje detallado para WhatsApp 11 4989-7969.
- [x] Apps Script versión 4 admite varias categorías por producto, precio/stock desconocidos y una importación repetible sin pisar registros editados.
- [x] Las categorías antiguas se conservan en el administrador pero quedan ocultas al público tras ejecutar la importación.
- [ ] El usuario debe publicar `Code.gs` versión 4 en la implementación existente y ejecutar `importarCotillonAnterior` en el proyecto **web-dc**.
- [ ] El usuario debe ejecutar `iniciarFotosCotillon` con las tres propiedades privadas de Cloudinary configuradas y revisar los lotes hasta completar las 337 fotos disponibles.
- [ ] Verificar el carrito y la carga real de los 635 productos en Render después de importar; las pruebas automatizadas usan una hoja Google simulada.
