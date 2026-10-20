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
- [x] Exportación estática y 36 pruebas automatizadas aprobadas para esta revisión.
- [x] Las categorías antiguas se conservan en el administrador pero quedan ocultas al público tras ejecutar la importación.
- [ ] El usuario debe publicar `Code.gs` versión 4 en la implementación existente y ejecutar `importarCotillonAnterior` en el proyecto **web-dc**.
- [ ] El usuario debe ejecutar `iniciarFotosCotillon` con las tres propiedades privadas de Cloudinary configuradas y revisar los lotes hasta completar las 337 fotos disponibles.
- [ ] Verificar el carrito y la carga real de los 635 productos en Render después de importar; las pruebas automatizadas usan una hoja Google simulada.

## Reorganización de Cotillón — 19/10/2026

- [x] Navegación pública con solo cuatro categorías principales y 26 subcategorías en el orden solicitado; permite volver, ver todos y buscar también entre artículos pendientes de clasificación.
- [x] Migración automática e idempotente de `categorias_cotillon`: reutiliza coincidencias exactas, conserva las anteriores y no reescribe productos ni fotos, precios, stock o identificadores.
- [x] Administrador permite vincular una categoría anterior a una subcategoría nueva sin alterar productos; muestra cuántos quedan pendientes.
- [x] La API, el carrito y las reservas mantienen sus rutas y operaciones. La compilación estática y las pruebas automatizadas pasan localmente.
- [ ] El usuario debe pegar `backend/Code.gs` completo en el proyecto Apps Script **web-dc** y publicar **Nueva versión** de la implementación web existente. La URL `/exec` debe indicar `version: 5`.
- [ ] Verificar con las cuentas reales que el primer acceso a Cotillón creó las 26 subcategorías, que los 635 productos siguen en **Ver todos**, y que las categorías anteriores quedan disponibles para vincularlas.

## Tercer nivel de Cotillón — 20/10/2026

- [x] Fiestas tiene 14 categorías internas y Cumpleaños infantil tiene 4, con IDs y `parentId` distintos; Accesorios de Fiestas no se confunde con Accesorios de Repostería.
- [x] Migración automática y repetible en `categorias_cotillon`; en las pruebas simuladas no cambió ninguna fila de productos, foto, precio, stock ni ID.
- [x] Navegación por tres niveles, ruta de regreso, vista de todos los productos de cada sección y búsqueda global; el administrador muestra rutas completas y productos pendientes del tercer nivel.
- [x] Pruebas automatizadas, comprobación de TypeScript y exportación estática local aprobadas.
- [ ] El usuario debe reemplazar **Código.gs** completo en **web-dc** y publicar una nueva versión de la implementación existente. La URL `/exec` debe indicar `version: 6`.
- [ ] Verificar en Google Sheets y en la web real las 18 categorías internas, que los productos históricos siguen accesibles y que se puede clasificar un producto de prueba sin afectar el resto. No se dispone de escritura a esas cuentas reales durante esta verificación.
