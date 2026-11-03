# Buscador global — PR frontend en DRAFT

Barra entre logo y menú desde 1000 px, atajo / fuera de campos editables, lupa y diálogo a pantalla completa hasta 999 px. Cierre de 48 px y foco inmediato que solicita el teclado del dispositivo. Header sticky, temas normal/Halloween y accesos de Carrito/WhatsApp conservados.

Hasta seis sugerencias con miniatura, nombre, precio y área; flechas, Enter y clic. Abren el detalle existente de cada sección. /buscar/?q=… incluye todos los resultados, filtros y tarjetas actuales, con compra/alquiler y carrito existentes. Usa catalogData, su caché y petición compartida. H005 comparte normalización con Disfraces y Cotillón; sinónimos editables en lib/store-search.ts.

El vacío ofrece WhatsApp con Hola, busco: … y enlaces a ambas áreas. La llamada opcional recordSearchMiss espera 1,5 segundos y se intenta solo una vez por consulta y sesión. Si el backend actual (incluida la versión 20) no tiene esa acción, se ignora el fallo: sin mensajes ni reintentos. La búsqueda no depende del registro. No se agregan acciones ni vistas administrativas en este PR.

## Verificación

Playwright prueba respuestas de catálogo existentes y rechaza expresamente recordSearchMiss como acción desconocida. Comprueba que siguen funcionando resultados, navegación, WhatsApp y caché y que no se muestran errores ni se reintenta el registro. Los escenarios cubren 360/390/768 px y escritorio, en los dos temas. El foco se comprueba por software; la apertura física del teclado virtual requiere un teléfono real.

No se instala Apps Script ni se modifica producción. El registro y el panel del admin se entregan en un segundo PR basado en este.

Resultado de esta rama: 20/20 Playwright (ambos temas y cuatro tamaños), 2/2 unitarias de normalización y build estático de 15 páginas correcto. El backend y el admin no tienen cambios.

Revisión: entre 761 y 999 px se conserva el menú completo con lupa; desde 1000 px se muestra barra y menú, y hasta 760 px lupa y hamburguesa. El foco rodea el contenedor completo. El vacío de sugerencias ofrece WhatsApp primero y ambas secciones como botones; no ofrece Ver todos. Cada palabra de cuatro letras o más también prueba variantes sin s/es final. Sinónimos ampliados: mujer maravilla, hombre murciélago y banderín.
