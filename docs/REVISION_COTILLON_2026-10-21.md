# Revisión de Cotillón — 21/10/2026

La comprobación se hizo con el catálogo público de Apps Script: 636 productos de Cotillón. No se modificaron filas de Google Sheets. Las correspondencias de categorías antiguas se calculan al mostrar la tienda; los identificadores, precios, stock, imágenes y vínculos originales siguen intactos.

## Categorías

Antes, los 274 artículos de «Accesorios disfraz» y los 213 de «Repostería» seguían ligados a rubros antiguos. Por eso Cotillón indicaba cero y «Máscaras y antifaces» no encontraba «Careta De Freddy Krugger».

Con la vista de compatibilidad, Cotillón muestra 275 artículos (274 en Fiestas), Repostería 232, Fechas Especiales 196 y Descartables 20. Un producto puede estar en más de un rubro; cada contador de rama lo cuenta una sola vez. La careta de Freddy aparece en «Fiestas › Máscaras y antifaces» y conserva también su vínculo con Halloween. Los totales corresponden a la lectura de ese día y pueden variar cuando se edite el catálogo.

Las reglas solo asignan una subcategoría cuando el nombre del artículo identifica claramente su tipo. Quedan para revisión individual: «Espuma», «Gorro Seleccionador Harry Potter», «Bowl Blanco» y «Drops Estrellas/Corazon/ Circulo X 35g Dorada». Siguen disponibles en «Todos» y en la búsqueda, sin una asignación inventada. Las secciones vacías, como «Cumpleaños infantil», no se rellenaron artificialmente.

## Fotografías pendientes

De los 636 artículos, 298 no tenían foto. Se revisaron las 338 imágenes originales disponibles: 183 tenían al menos un lado menor de 300 px. El catálogo ahora carga desde el original de Cloudinary para sus tarjetas y evita agrandar una imagen más allá de sus dimensiones originales, pero una foto pequeña no puede ganar detalle inexistente.

Algunos reemplazos prioritarios por resolución baja: «Mascara Calavera Negra» (172 × 292), «Careta Diablo» (195 × 259), «Gorro General» (311 × 162), «Premezcla Cheesecake» (165 × 305) y «Chips Choco Blanco X100g» (335 × 150). Las imágenes sin foto y las de baja resolución deben renovarse desde el panel de productos cuando haya originales mejores. No se alteraron las fotos existentes.

## Activar el control de campaña en producción

La campaña se puede activar o pausar desde **Administración → Apariencia de la web**, independientemente del tema visual. Para que ese botón guarde el ajuste global, el proyecto **web-dc** de Apps Script debe usar el [Code.gs actualizado](../backend/Code.gs) y publicar una versión nueva de **la implementación web existente**, conservando su misma URL `/exec`. Al abrir esa URL debe indicar `version: 8`. No hace falta agregar propiedades ni ejecutar una migración: `CAMPAIGN_HALLOWEEN` se crea automáticamente al usar el botón; mientras no exista, la campaña está activa.

Render solo necesita el nuevo commit del frontend. La URL `NEXT_PUBLIC_APPS_SCRIPT_URL` no cambia si se actualiza la implementación existente.
