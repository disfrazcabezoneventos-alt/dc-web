# Importación incremental de Cotillón — 27/10/2026

Esta guía acompaña el PR separado del importador. **No ejecutar en producción antes del OK del dueño de la tienda.** No modifica disfraces ni reservas.

## Origen y respaldo

- Excel leído: copia corregida de `Stock-productos-rappi-web-2026-10-27.xlsx`, hojas `General` y `Web dc`. Solo Sorbetes Halloween se modificó: visible, descripción y nombre del archivo de foto; el original quedó intacto.
- Fotos vinculadas por `indice-fotos-2026-10-27.csv`; no se generan fotos.
- Estado previo: exportaciones `cotillon.csv` y `categorias_cotillon.csv`, con 1.206 productos y 51 categorías.
- Los originales y ZIP de fotos se copiaron íntegros en `tmp/import-2026-10-27/originales/` y se comprobó su SHA-256. Esa carpeta está excluida de Git.
- La copia de Google Sheets usada para las pruebas está separada de la hoja de producción; su enlace se entrega de forma privada al dueño.

## Qué incluye el lote

- `backend/import-cotillon-incremental-2026-10-27.json`: 661 filas visibles de `General`, vinculadas por ID de Rappi con `Web dc` y el índice de fotos, más la foto local verificada de Sorbetes Halloween.
- 554 ya existen. Solo 87 tienen cambios efectivos: 87 cambios de stock y uno de precio en ese mismo grupo. Los 467 restantes se dejan sin escritura.
- 107 son nuevos. Las 24 altas de Halloween se procesan primero. En producción, cada ficha se escribe y activa **solo después** de que Cloudinary devuelva foto y miniatura. Si la foto falla, esa ficha no se crea.
- De las 106 altas originales, 105 tienen URL de Rappi y una de Casa Alberto: ninguna depende de foto local. Sorbetes Halloween es el alta adicional con foto local. Su JPG original, sin cambios, se incluye en `backend/import-images/cotillon-2026-10-27/` (SHA-256 `3ad62bbad1660350471754f1603c2bca07050823aedd7fce4c92dd5381a1b786`). Como el repositorio es público, tras fusionar el PR GitHub sirve esa imagen por HTTPS; el importador pasa esa URL al flujo firmado de Cloudinary que ya existe en `Code.gs`, que devuelve foto y miniatura. La lista de URLs permitidas admite únicamente esa ruta local exacta además de Rappi y Casa Alberto.
- Se conservan exactamente los nombres y valores de precio y stock del Excel. Las categorías se expresan con los nombres ya existentes en Google Sheets; se normalizaron solamente cuatro variantes de puntuación del Excel.
- Las otras 943 filas que `Web dc` marca `No` no entran al lote. Tampoco entran 24 variantes de globos que `Web dc` marca `Sí` pero que no tienen ID de Rappi en `General`; se preparan en un PR separado con identidad basada en código Mini y variante.
- Cuatro filas con nombres duplicados y las filas sin categoría o con `Disfraz` ya están dentro de las 944 ocultas.

## Protección de ediciones manuales

Para cada producto existente, el lote conserva una referencia del precio y stock previos. El importador compara **cada campo por separado**: actualiza el precio o el stock solo si el valor actual todavía coincide con el valor previo de referencia. Si alguien lo cambió a mano, omite ese campo. Nunca escribe nombre, descripción, categoría, foto ni estado activo de productos existentes.

En particular, 14 productos hoy inactivos tienen stock positivo en el Excel. El importador **no los activa** porque esta tarea permite modificar solo precio y stock de fichas existentes. Requieren revisión manual.

## Pasos cuando se apruebe la carga real

1. Revisar y fusionar el PR únicamente después del OK. No usar el PR #1 de disfraces para esta importación.
2. Crear en el proyecto Apps Script **un archivo nuevo** llamado `CotillonIncremental20261027.gs` y pegar allí el contenido completo de `backend/CotillonIncremental20261027.gs`. No reemplazar `Code.gs` ni `Validation.gs`.
3. Publicar una nueva versión de la implementación web existente. El importador se ejecuta manualmente desde el editor de Apps Script; no expone nuevas acciones públicas de la API.
4. Configurar `COTILLON_INC_20261027_TEST_ID` con el ID de una **copia limpia** que tenga las pestañas `cotillon` y `categorias_cotillon`. Ejecutar `previsualizarCotillon27Copia`: debe informar 107 altas, 87 actualizaciones, 467 sin cambios y cero conflictos. Ejecutar `probarLoteCotillon27Copia` las veces necesarias; cada llamada procesa hasta 15 registros y crea un respaldo en esa copia. Las altas de prueba quedan inactivas y sin subir fotos para que esta etapa no use Cloudinary. Comprobar los registros y sus campos.
5. Exportar nuevamente la pestaña `cotillon` de producción inmediatamente antes de operar. Ejecutar `previsualizarCotillon27Produccion`. Si las cantidades cambiaron por ediciones recientes, revisar las diferencias antes de seguir.
6. Solo después del OK, configurar `COTILLON_INC_20261027_APPROVED` con el SHA-256 literal que figura como constante en el archivo `.gs`. Sin esa propiedad, la función de producción se niega a escribir.
7. Ejecutar `aplicarLoteCotillon27Produccion` repetidamente hasta que `procesados` sea 0 y `fotosFallidas` sea 0. Cada llamada procesa hasta 15 operaciones. La primera crea `cotillon_respaldo_20261027_production` dentro de la hoja de producción **antes de modificar un producto**. Las fotos nuevas se suben por el flujo Cloudinary existente; solo entonces se escribe y activa la ficha. Si falla una foto, esa ficha no se crea y su ID queda marcado para revisión. No se sustituyen fotos de los 554 existentes.
8. Si hay fotos fallidas, revisar sus URLs de origen. Cuando el problema esté resuelto, ejecutar `reintentarFotosCotillon27Produccion` y repetir el paso anterior. Esta función solo habilita los reintentos; no modifica productos.
9. Revisar las 107 fichas efectivamente creadas, sus fotos, categorías, stock y el carrito de Cotillón. No hacer pedidos reales de prueba. Revisar aparte los 14 productos inactivos con stock repuesto.

Las funciones son reanudables: vuelven a calcular qué registros faltan en cada llamada. No vuelven a crear un ID que ya exista. Un conflicto de identidad o una categoría faltante detiene el lote antes de escribirlo.

## Volver atrás

Conservar el CSV previo y la pestaña `cotillon_respaldo_20261027_production`. Si se necesita revertir, detener las funciones de importación; renombrar la pestaña actual `cotillon` a un nombre de revisión y renombrar la pestaña de respaldo a `cotillon`. Así vuelve el catálogo anterior y el resultado de la carga queda disponible para revisar. Confirmar la restauración antes de reanudar la tienda. La migración no modifica `categorias_cotillon` ni otras pestañas.

## Límite de las pruebas actuales

La versión anterior del algoritmo se ejecutó con un simulador de Apps Script usando la exportación de 1.206 filas, incluido un caso de foto fallida y reintento. También se escribieron y verificaron sus 193 operaciones en una **copia nativa de Google Sheets**, que terminó con 1.312 IDs únicos; las 106 altas de esa copia permanecen inactivas. La versión revisada añade Sorbetes Halloween y una operación más; requiere repetir la simulación y la prueba en una copia limpia antes de producción. Todavía no se ejecutó este archivo `.gs` dentro del servicio Apps Script real ni se subieron fotos a Cloudinary.
