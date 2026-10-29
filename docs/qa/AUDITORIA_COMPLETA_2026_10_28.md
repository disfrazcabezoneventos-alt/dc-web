# Auditoría completa de tienda — 28/10/2026

> Estado de entrega: informe y CSV listos. Las 102 capturas existen en la carpeta local de esta auditoría; su publicación en el repositorio público está pendiente de autorización específica del usuario, solicitada tras el rechazo de la revisión automática por posible contenido confidencial en archivos binarios. Los enlaces de captura de este borrador se completarán al aprobar esa publicación; todavía no constituyen evidencia disponible en GitHub.

## Resumen de 10 líneas

1. Se documentan 24 registros: 1 CRÍTICO, 3 ALTO, 14 MEDIO y 6 BAJO.
2. Prioridad crítica: la cuenta de cobro está vacía; el código impide continuar desde Pago sin cuenta habilitada.
3. La hoja y el panel coinciden: 558 disfraces, 1.204 cotillones y 1.225 productos activos.
4. Se abrieron 33 fichas de disfraces con fotos cargadas, además de fichas de cotillón, opciones y agotados.
5. Se verificaron todos los filtros de Disfraces: 370 activos, 309 de alquiler y 61 de venta.
6. Se recorrieron 44 nodos de categorías/subcategorías de Cotillón y las diez pestañas del administrador.
7. Se abrieron los cinco editores pedidos y uno adicional, siempre sin guardar ni modificar campos.
8. El carrito pasó suma, resta, stock agregado, eliminación, recarga y total; el mensaje de WhatsApp no se envió.
9. Las páginas se revisaron a 360×640, 390×844, 412×915 y 1366×900; no se detectó desbordamiento horizontal global.
10. No se corrigió producción, no se enviaron formularios ni adjuntos y no se ejecutaron funciones de Apps Script manualmente.

## Antes del sábado 31/10 — solo CRÍTICO y ALTO

- **H022 · CRÍTICO · La cuenta de cobro está vacía y el flujo bloquea continuar desde Pago.** El dueño debe verificar y aprobar una cuenta de cobro válida antes del sábado; comprobar su funcionamiento de punta a punta en una copia aislada y acordar una alternativa cuando el local no tenga cuenta habilitada. Esta auditoría no cambia la configuración.
- **H001 · ALTO · Guardar un disfraz puede eliminar sus categorías secundarias.** Conservar y permitir editar todas las categorías de Disfraces; cubrir un cambio de stock que no altere categorías. Confirmar primero qué versión de backend está desplegada.
- **H002 · ALTO · Descripción obligatoria bloquea cambios rutinarios en los 309 alquileres activos.** Definir si la descripción es opcional y alinear importación, editor y backend; permitir cambios operativos sin exigir un texto nuevo.
- **H003 · ALTO · 31 garantías difieren entre hoja y fórmula del formulario.** Elegir una fuente de verdad para la garantía y el tipo de traje; alinear catálogo, formulario, condiciones y editor, y mostrar el importe antes del compromiso de pago.

H022 combina configuración vacía observada con el bloqueo definido por el código: no se envió documentación para reproducir el paso Pago en producción. H001 no se guardó: la pérdida de categorías del backend del repositorio debe reproducirse en copia. Las prioridades no implican autorización para corregirlas.

## Puede esperar respecto de los anteriores

- H004 · MEDIO · Los 61 disfraces activos de venta carecen de condición de venta.
- H005 · MEDIO · Buscar sin ñ o tildes pierde resultados.
- H006 · MEDIO · Dos productos con el mismo nombre y precios diferentes.
- H007 · BAJO · Pre,ium es un error de nombre y de búsqueda.
- H008 · MEDIO · 72 fotos de tarjetas son pequeñas; 50 corresponden a productos activos.
- H009 · MEDIO · Un producto comprable no tiene foto.
- H010 · MEDIO · 46 productos activos publican instrucciones editoriales.
- H011 · MEDIO · Oculto en el panel no significa oculto en Cotillón.
- H012 · MEDIO · Un producto activo solo se encuentra en el grupo general o por búsqueda.
- H013 · MEDIO · Logo y algunos detalles descargan PNG grandes.
- H014 · MEDIO · La expiración durante una operación no devuelve al login.
- H015 · MEDIO · Las tareas diarias dependen de tablas largas y entradas al editor.
- H016 · BAJO · No existen enlaces a Instagram, Facebook ni al mapa.
- H017 · BAJO · No hay acción para vaciar todo el carrito.
- H018 · BAJO · Cerrar ficha tiene un objetivo táctil de 35×35 px.
- H019 · MEDIO · El total precargado no se actualiza al cambiar cantidades o sumar trajes.
- H020 · MEDIO · La foto y descripción no siempre aclaran si se ofrece traje completo o accesorio.
- H021 · BAJO · El HTML inicial de los catálogos no contiene productos.
- H023 · MEDIO · Se observaron timeouts iniciales de catálogo que se recuperaron al reintentar.
- H024 · BAJO · El botón + queda habilitado al alcanzar el stock total entre opciones.

## Alcance y método

Web: https://dc-web-8ai4.onrender.com. Hoja identificada por metadatos y título exacto: Disfraz Cabezón — tienda y reservas (enlace e identificador privados omitidos). Se leyeron registros de productos/categorías y conteos de IDs de las pestañas operativas, sin escribir celdas. La fuente de referencia es [main a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34](https://github.com/disfrazcabezoneventos-alt/dc-web/commit/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34); se contrastaron los comportamientos con los chunks públicos. No se invocó el endpoint Apps Script por terminal ni se ejecutaron funciones de mantenimiento. Las páginas realizan sus lecturas normales del catálogo.

Primero se hizo análisis HTTP, de hoja y de código. Tras habilitarse las herramientas, se completó la interfaz pública y el usuario inició sesión en el navegador integrado; no se pidió, leyó ni almacenó su contraseña o token. El estado anterior de bloqueo de navegador/GitHub quedó superado. Esta versión reemplaza el informe preliminar que declaraba la UI pendiente.

El tema Halloween y la campaña aparecen activos en el panel; no se tocaron sus controles. El panel se dejó en Estadísticas con su sesión abierta. El carrito empezó vacío y terminó vacío tras eliminar exclusivamente las tres líneas de prueba. No hay clientes reales en las capturas; los campos usados en reservas fueron ficticios y los archivos con esos datos no se publican. No se capturaron valores bancarios: la evidencia H022 contiene campos vacíos.

### Cobertura de interfaz

| Prueba | Resultado y límite |
| --- | --- |
| Portada | Franja Halloween, hero, inspiración con cuatro productos, banner de reservas y pie revisados en los cuatro tamaños. Sin cortes o superposiciones bloqueantes observados en este recorrido. |
| Menú | Abrir/cerrar y enlaces en 360/390/412; navegación de escritorio y rutas públicas comprobadas. Instagram/Facebook/mapa ausentes (H016). |
| Disfraces | Todos y las diez categorías, modalidades y Ver más probados. Cantidades de la UI coinciden con hoja. Búsqueda con/sin ñ falla según H005. |
| Fichas | 33 disfraces abiertos con imágenes cargadas y enlaces correctos por ID. Incluye alquiler, venta, Niños, Cabezones, Halloween y originales pequeños. No se pulsó el envío de la consulta de compra. |
| Cotillón | Campaña visible; cuatro grupos, 24 subcategorías directas fuera de COTILLÓN, dos secciones de COTILLÓN y sus 18 categorías internas recorridas. Sin errores de carga en esas ramas. |
| Carrito | Opciones obligatorias de Abanicos, cantidad 999 limitada a 13, stock compartido entre rojo/azul sin exceder 13, suma/resta, tres líneas, eliminación, total y recarga probados. H017 y H024 describen limitaciones. |
| Reservas | Precarga de Banana Fortnite comprobada; pasos 1–3 y errores locales recorridos con datos ficticios. Se detuvo sin adjuntos antes de transmitir documentación; Pago/Firma/envío no probados en producción por regla. |
| Admin | Diez pestañas abiertas; seis editores inspeccionados/cancelados. Ningún Guardar, Clonar, Eliminar, Registrar, Actualizar estado, Publicar, Vincular o Activar/Pausar ejecutado. |
| Sesión | Chrome sin sesión mostró login sin registros. La sesión aportada por el usuario mostró el panel. Expiración durante uso y respuestas autenticadas negativas: solo revisión estática, para copia. |
| Calidad | HTTP de páginas, JS/CSS, fotos y metadatos medido; consola del recorrido final público y del panel sin errores/advertencias capturados. No equivale a una prueba de carga ni a Web Vitals. |

### Capturas por tamaño

Las dimensiones son el viewport CSS solicitado. Las capturas completas pueden excluir la barra de desplazamiento de 15 px; su ancho de imagen no es una nueva resolución de prueba. Las capturas de página completa pueden representar el encabezado sticky en su posición de desplazamiento: no se usa ese artefacto para declarar una superposición real.

| Viewport | Portada | Disfraces | Cotillón | Compra | Reservas | Condiciones | Arrepentimiento | 404 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 360×640 | [Captura](capturas-2026-10-28/public-home-360.jpg) | [Captura](capturas-2026-10-28/public-disfraces-360.jpg) | [Captura](capturas-2026-10-28/public-cotillon-360.jpg) | [Captura](capturas-2026-10-28/public-comprar-360.jpg) | [Captura](capturas-2026-10-28/public-reservas-360.jpg) | [Captura](capturas-2026-10-28/public-condiciones-360.jpg) | [Captura](capturas-2026-10-28/public-arrepentimiento-360.jpg) | [Captura](capturas-2026-10-28/public-404-360.jpg) |
| 390×844 | [Captura](capturas-2026-10-28/public-home-390.jpg) | [Captura](capturas-2026-10-28/public-disfraces-390.jpg) | [Captura](capturas-2026-10-28/public-cotillon-390.jpg) | [Captura](capturas-2026-10-28/public-comprar-390.jpg) | [Captura](capturas-2026-10-28/public-reservas-390.jpg) | [Captura](capturas-2026-10-28/public-condiciones-390.jpg) | [Captura](capturas-2026-10-28/public-arrepentimiento-390.jpg) | [Captura](capturas-2026-10-28/public-404-390.jpg) |
| 412×915 | [Captura](capturas-2026-10-28/public-home-412.jpg) | [Captura](capturas-2026-10-28/public-disfraces-412.jpg) | [Captura](capturas-2026-10-28/public-cotillon-412.jpg) | [Captura](capturas-2026-10-28/public-comprar-412.jpg) | [Captura](capturas-2026-10-28/public-reservas-412.jpg) | [Captura](capturas-2026-10-28/public-condiciones-412.jpg) | [Captura](capturas-2026-10-28/public-arrepentimiento-412.jpg) | [Captura](capturas-2026-10-28/public-404-412.jpg) |
| 1366×900 | [Captura](capturas-2026-10-28/public-home-1366.jpg) | [Captura](capturas-2026-10-28/public-disfraces-1366.jpg) | [Captura](capturas-2026-10-28/public-cotillon-1366.jpg) | [Captura](capturas-2026-10-28/public-comprar-1366.jpg) | [Captura](capturas-2026-10-28/public-reservas-1366.jpg) | [Captura](capturas-2026-10-28/public-condiciones-1366.jpg) | [Captura](capturas-2026-10-28/public-arrepentimiento-1366.jpg) | [Captura](capturas-2026-10-28/public-404-1366.jpg) |

No se observó scrollWidth mayor que innerWidth en las 32 combinaciones de páginas/tamaños registradas. Esto no garantiza ausencia de todos los defectos visuales posibles. El JSON conserva observaciones iniciales de carga; las capturas de la matriz se actualizaron con el catálogo o formulario listo.

## Disfraces: cantidades y fichas

558 registros, 370 activos / 188 inactivos. No se detectaron IDs duplicados, stocks negativos/fraccionarios, activos sin foto o activos con precio aplicable cero. price=0 en alquiler y rentPrice=0 en venta son campos no aplicables. Las categorías se superponen; no deben sumarse.

| Categoría | Todos | Alquiler | Comprar |
| --- | --- | --- | --- |
| Todos | 370 | 309 | 61 |
| Hombres | 110 | 110 | 0 |
| Mujeres | 103 | 103 | 0 |
| Niños | 49 | 0 | 49 |
| Cabezones | 94 | 94 | 0 |
| Personajes | 148 | 144 | 4 |
| Profesiones | 50 | 47 | 3 |
| Superheroes y Princesas | 32 | 32 | 0 |
| Halloween | 45 | 32 | 13 |
| Históricos | 52 | 48 | 4 |
| Otros | 78 | 78 | 0 |

Los 13 recuentos interactivos (once chips y las dos modalidades generales) coinciden con estos totales. La modalidad por categoría también se calculó con la lógica pura del repositorio. Ver más añade lotes de 36; no hay selector de orden y se conserva el orden devuelto por el catálogo.

Las 33 fichas están registradas en capturas-2026-10-28/public-audit.json, con texto, enlaces, dimensiones originales y loaded=true para todas sus fotos. Se capturó cada una como public-ficha-ID.jpg. Quiero comprar se siguió hasta Anna Niña precargada: $10.000, stock/límite 1. La reserva precargó Banana Fortnite con su ID, categoría y alquiler $65.000. El envío final de la consulta de compra no se pulsó.

## Cotillón: categorías, opciones y carrito

1.204 registros: 855 activos / 349 inactivos. Los inactivos se muestran como agotados por diseño del código; la etiqueta Oculto del panel es confusa (H011). Hay 348 inactivos con stock 0 y Araña Con Luces inactiva con stock 1. Se verificó la discrepancia de ese producto entre panel y ficha pública.

| Grupo | Catalogables | Comprables según datos |
| --- | --- | --- |
| COTILLÓN | 718 | 557 |
| REPOSTERÍA | 196 | 128 |
| FECHAS ESPECIALES | 228 | 126 |
| DESCARTABLES | 62 | 44 |

Las 42 ramas hoja (3 Repostería + 12 Fechas especiales + 9 Descartables + 18 internas) mostraron min(36,cantidad) tarjetas y sin errores; se seleccionaron además Fiestas (681) y Cumpleaños infantil (37), que requieren elegir una interna o Ver todos. Las categorías vacías se pudieron abrir y mostraron estado vacío coherente. Todos los nodos y cantidades se detallan en categorias-2026-10-28.csv.

Opciones: 44 productos comprables activan elección de texto por la regla del repositorio. Abanicos exige color/modelo/talle antes de permitir Agregar. No hay inventario por variante; se comparte el stock del producto. Dos opciones acumularon 13 abanicos sin exceder el máximo. El botón + de una línea todavía habilitado sin stock restante está documentado en H024.

El ejemplo real del carrito fue 2 abanicos rojos ($3.000 c/u) y una corona ($2.500): total $8.500. Se incrementó y redujo una unidad, se recargó conservando 3 unidades y luego se probó el máximo agregado con una segunda opción. Se eliminaron las tres líneas de prueba; quedó vacío. No hay Vaciar todo. El mensaje exacto se extrajo del href, sin abrirlo ni enviarlo:

```text
¡Hola! Quiero consultar por este pedido de cotillón:

1. 2 × Abanicos Colores Surtidos · rojo (COTILLÓN › Fiestas › Carnaval carioca) — $ 3.000 c/u · subtotal $ 6.000
2. 1 × Corona Princesa Plastica (COTILLÓN › Fiestas › Vinchas y coronas) — $ 2.500 c/u · subtotal $ 2.500

Total publicado de los productos con precio: $ 8.500.
Por favor, confirmen disponibilidad, precios finales y forma de entrega. ¡Gracias!
```

También está en capturas-2026-10-28/carrito-mensaje-exacto.txt.

## Reservas: recorrido y validaciones

Se usaron exclusivamente datos ficticios en una pestaña de prueba; no se transmitieron documentos ni una solicitud. El nombre ficticio se borró antes de abandonar el formulario.

| Paso | Resultado |
| --- | --- |
| 1 · Tus datos | Se probaron vacíos, DNI corto, correo inválido, fecha de nacimiento y teléfonos alternativos repetidos. Los campos válidos permitieron avanzar. La entrada de fecha necesitó confirmar el control nativo; no se reporta ese comportamiento de automatización como defecto de la tienda. |
| 2 · Tu alquiler | Precarga correcta de Banana Fortnite. Se verificó la garantía general, total manual al cambiar cantidad, retiro por tercero sin nombre/DNI y declaración previa. Sábado 31/10 y devolución lunes 02/11 fueron aceptados con sus franjas. |
| 3 · Documentación | Sin adjuntos, la validación detuvo Continuar y pidió ambos DNI, domicilio, coincidencia y fecha del mes en curso. Una emisión del mes anterior fue rechazada. No se seleccionaron archivos; límites/formato se contrastaron con los textos y el código. |
| 4 · Pago | No recorrido en producción: pasar desde Documentación transmite tres archivos al endpoint bank. La cuenta vacía observada en admin determina H022 según el código. En copia probar también comprobante, cuenta no configurada y pago parcial/completo. |
| 5 · Firma | No recorrido en producción por el límite anterior. Código revisado: firma, aclaración coincidente, veracidad, términos y todos los adjuntos obligatorios. Probar con firma/documentos sintéticos en copia. |

El proceso requiere acuerdo previo por WhatsApp de fecha, talle, cantidad e importe. Se anuncian revisión hasta 24 h y confirmación posterior del local. La garantía se separa de la seña; existen discrepancias con la hoja (H003). El campo total es un presupuesto manual, aunque la precarga puede parecer un cálculo automático (H019). No se emite dictamen legal sobre las condiciones. El PDF enlazado responde 200; no se creó ni firmó contrato.

## Administración

Las diez pestañas cargaron sin banners de error en la sesión aportada: Estadísticas, Disfraces, Categorías disfraces, Cotillón, Categorías cotillón, Reservas, Caja, Arrepentimientos, Datos de cobro y Apariencia de la web. Niños existe entre las 10 categorías de Disfraces; Cotillón tiene 51 categorías totales. Panel y hoja coinciden en 558/1.204 productos, 1.225 activos; el panel muestra 18.529 unidades de inventario. Reservas, movimientos y arrepentimientos estaban vacíos; no se inventaron registros para probarlos.

| Editor inspeccionado | Observado sin modificar |
| --- | --- |
| Abejita · alquiler | Precio $60.000, stock 1, visible, foto, Descripción vacía obligatoria. Tabla Mujeres + Otros; editor solo principal Mujeres. |
| Disfraz Anna Niña · venta Niños | Precio $10.000, stock 1, Niños, visible, foto; condición de venta vacía y obligatoria. |
| Abeja - Abejita · cabezón | Alquiler $75.000, stock 1, Cabezones, foto y activo. El editor no expone garantía propia. |
| Abanicos Colores Surtidos · cotillón | Precio $3.000, stock 13, foto, categoría principal y múltiples checkboxes de asociación; sin tabla estructurada de variantes. |
| Alemana · inactivo | Alquiler $60.000, stock 1, casilla Visible desmarcada. En esta sesión figura sin foto; la instantánea previa de hoja tenía referencia de 160 px. No se cambió el registro. |
| Mantel Friselina · adicional | Categoría principal Sin categoría, precio $5.000, stock 6, foto y visible. Confirma H012. |

Acciones leídas, no ejecutadas: Guardar producto escribe; seleccionar una foto llama uploadImage antes de guardar; Clonar crea una copia inmediatamente; Eliminar borra tras confirmación; Vincular/Guardar categorías recategoriza; Registrar/Anular caja puede mover stock; Actualizar estado modifica historial; Marcar gestionado escribe; Guardar datos de cobro modifica configuración; Publicar tema y Activar/Pausar campaña cambian producción. No se pulsó Vista previa de tema.

Móvil: sin desbordamiento de página. La tabla exige scroll horizontal: 798 px de contenido en 302 px a 360, 328 px a 390 y 347 px a 412. A 1366 cabe en 1.214 px. Los chips de pestañas miden aproximadamente 39 px de alto; las acciones de fila quedan lejos horizontalmente. Buscar funciona por nombre/categoría/ID sin diacríticos; no hay filtros dedicados de estado/modalidad, precios en lista o paginación. No se hizo un benchmark de tiempos del dueño.

Datos de cobro: cinco campos vacíos; solo se registró su estado vacío, no valores bancarios. El panel informa correo modo test: la entrega real de correo no se probó ni se activó. Tema Halloween y campaña Activa, sin cambios.

## HTTP, imágenes, accesibilidad y SEO

| Ruta | HTTP | GET ms | HTML bytes |
| --- | --- | --- | --- |
| / | 200 | 561 | 32509 |
| /disfraces/ | 200 | 344 | 15293 |
| /cotillon/ | 200 | 374 | 17749 |
| /comprar/ | 200 | 375 | 13882 |
| /reservas/ | 200 | 358 | 26323 |
| /condiciones/ | 200 | 479 | 42182 |
| /arrepentimiento/ | 200 | 336 | 13733 |
| /admin/ | 200 | 313 | 13117 |
| /solicitud/ | 200 | 348 | 13233 |
| /auditoria-pagina-inexistente/ | 404 | 372 | 13585 |

Los GET son mediciones desde este equipo, no LCP ni carga completa del catálogo. Se comprobaron 16 JS y dos CSS públicos, todos 200; 370 destinos de producto con ID devolvieron 200. La respuesta de HTML no demuestra que la API cargue: H023 recoge el incidente inicial de Chrome. En el recorrido final del navegador integrado no se capturaron errores o advertencias de consola.

Se comprobaron 1.573 imágenes de tarjetas y 37 originales (34 en imagenes-2026-10-28.csv y tres pequeñas adicionales en JSON), todos 200. Hay 72 tarjetas con lado mayor menor de 250 px, 50 de productos activos. Las tres pequeñas de Disfraces se abrieron en la UI y sus originales son 224/225 px. Una foto activa falta en Cotillón (H009). El peso agregado de todas las tarjetas del barrido es 21.943.705 bytes, no el peso de la portada.

Logos: Halloween PNG 1.622.170 bytes, OG PNG 1.402.218 bytes; algunos originales de detalle superan 1 MB. No se midieron Web Vitals, red móvil real, carga simultánea, caché de WhatsApp ni comportamiento bajo pérdida de red.

SEO: título, descripción, canonical, OG y favicon declarados en las páginas comerciales; OG imagen 1254×1254 y el PNG de icono responden 200. /favicon.ico, /robots.txt y /sitemap.xml dan 404; el favicon declarado funciona, por lo que no se lo considera roto. /admin y /solicitud llevan noindex/nofollow y la página inexistente noindex. El problema histórico del icono de /arrepentimiento no se reprodujo. La vista previa real de WhatsApp no se compartió por mensaje.

Accesibilidad básica: lang es-AR, etiquetas y nombres de botones, alt en hero/detalle; fotos de tarjetas decorativas dentro de botones con nombre accesible. Cerrar detalle conserva 35×35 px (H018); carrito tiene mínimos de 44 px. Se recorrió menú y se revisaron objetivos/flujo básico; no se realizó auditoría exhaustiva con lector de pantalla o contraste pixel a pixel. No se declara cumplimiento integral de WCAG.

[hrefs-2026-10-28.csv](hrefs-2026-10-28.csv) lista los href del HTML y los calculables por producto: internos exactos verificados, externos generales de WhatsApp 200 y 1.574 variantes de consulta con texto. Esas 1.574 variantes NO se solicitaron individualmente; la columna lo dice, sin inventar códigos. Los mensajes libres de carrito generan combinaciones ilimitadas: se verificó la muestra real, no se afirma enumerarlas todas. Instagram/Facebook/mapa están ausentes.

## Hallazgos detallados

### H001 · ALTO · Guardar un disfraz puede eliminar sus categorías secundarias

**Área / página / dispositivo:** admin · /admin/ · Disfraces · Todos; revisión de código.

263 disfraces activos tienen más de una categoría (390 contando inactivos). El editor ofrece selección múltiple únicamente a Cotillón. saveProduct en el backend del repositorio reduce los disfraces a [category.id], incluso cuando el payload conserva categoryIds. Ejemplo: Abejita está en Mujeres y Otros. Evidencia de código y hoja; NO se guardó ni se comprobó la versión que ejecuta Apps Script. Se abrió el editor real: la tabla conserva Mujeres + Otros y el editor solo muestra Mujeres. No se guardó; el efecto destructivo del backend sigue pendiente de reproducción en copia.

**Reproducir:** En una copia: abrir Abejita, completar su descripción obligatoria, cambiar solo stock, guardar y comparar categoryIds antes/después. En producción limitarse a abrir el editor.

**Evidencia:** [components/Admin.tsx:39](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Admin.tsx#L39); [backend/Code.gs:136](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/backend/Code.gs#L136)

**Captura:** [Captura](capturas-2026-10-28/admin-editor-alquiler.jpg)

**Propuesta, sin implementar:** Conservar y permitir editar todas las categorías de Disfraces; cubrir un cambio de stock que no altere categorías. Confirmar primero qué versión de backend está desplegada.

### H002 · ALTO · Descripción obligatoria bloquea cambios rutinarios en los 309 alquileres activos

**Área / página / dispositivo:** admin · /admin/ · editor de productos · Todos; revisión de código.

Los 309 disfraces activos de alquiler tienen description vacía. Son 443 disfraces sin descripción contando inactivos. El input Descripción tiene required y el backend exige texto no vacío. Cambiar solo stock, precio o visibilidad obliga a inventar/completar una descripción para poder guardar. No se intentó guardar en producción. Confirmado en el editor real: description vacía y atributo required=true. Se canceló el editor sin modificar campos.

**Reproducir:** En copia: editar Abejita o Abeja - Abejita, modificar stock sin tocar Descripción y guardar. Revisar validación nativa y del backend.

**Evidencia:** [components/Admin.tsx:39](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Admin.tsx#L39); [backend/Code.gs:32](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/backend/Code.gs#L32)

**Captura:** [Captura](capturas-2026-10-28/admin-editor-alquiler.jpg)

**Propuesta, sin implementar:** Definir si la descripción es opcional y alinear importación, editor y backend; permitir cambios operativos sin exigir un texto nuevo.

### H003 · ALTO · 31 garantías difieren entre hoja y fórmula del formulario

**Área / página / dispositivo:** datos · /reservas/ · garantía · Todos; hoja y cálculo offline.

El formulario calcula $60.000 para Adulto y $100.000 para Cabezón; ignora insuranceDeposit de cada producto y usa la categoría principal para el tipo inicial. Hay 31 alquileres activos con diferencia: Banana Fortnite $65.000 en hoja frente a $100.000 calculados; Daddy Yankee $100.000 frente a $60.000; Freddy Krueger $65.000 frente a $60.000. La política comercial correcta requiere decisión del local. La reserva real precargó Banana Fortnite por $65.000 y mostró la garantía general de Cabezones $100.000. No se avanzó a pago.

**Reproducir:** Comparar las filas identificadas en garantias-2026-10-28.csv con deposit() y con la preselección del formulario. Para verlo en pantalla, abrir /reservas/?producto=catalogo-disfraz-39 sin enviar.

**Evidencia:** [lib/model.ts:14](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/lib/model.ts#L14); [components/RentalForm.tsx:27](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/RentalForm.tsx#L27)

**Captura:** [Captura](capturas-2026-10-28/H003-garantia-reserva.jpg)

**Propuesta, sin implementar:** Elegir una fuente de verdad para la garantía y el tipo de traje; alinear catálogo, formulario, condiciones y editor, y mostrar el importe antes del compromiso de pago.

### H004 · MEDIO · Los 61 disfraces activos de venta carecen de condición de venta

**Área / página / dispositivo:** admin · /admin/ · disfraces de venta · Todos; hoja y código.

saleCondition está vacío en las 61 ventas, incluidas 49 de Niños. El editor requiere elegir Nuevo a pedido, Nuevo Inmediato o Usado inmediato antes de guardar. No hay evidencia para decidir qué condición corresponde a cada artículo; la web no muestra una condición cuando está vacía. Confirmado visualmente en el editor de Anna Niña: Elegí una condición, campo obligatorio.

**Reproducir:** Abrir en copia Disfraz Anna Niña y revisar condición vacía. Intentar cambiar únicamente precio en la copia y observar la exigencia de condición.

**Evidencia:** [components/Admin.tsx:39](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Admin.tsx#L39); [components/PurchaseForm.tsx](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/PurchaseForm.tsx)

**Captura:** [Captura](capturas-2026-10-28/admin-editor-venta-ninos.jpg)

**Propuesta, sin implementar:** Revisar comercialmente y completar las condiciones correctas; acordar cómo manejar registros importados incompletos.

### H005 · MEDIO · Buscar sin ñ o tildes pierde resultados

**Área / página / dispositivo:** comprador · /disfraces/ y /cotillon/ · buscador · Todos; filtros ejecutados offline.

La lógica pública solo convierte a minúsculas. En la instantánea, ninos devuelve 0 disfraces y niños devuelve 49. mascara y máscara producen conjuntos distintos; el buscador del administrador sí elimina diacríticos. Es una diferencia funcional reproducida con datos actuales y funciones del repositorio, sin navegador.

**Reproducir:** En el buscador comparar ninos con niños, y mascara con máscara. No enviar formularios.

**Evidencia:** [components/Catalog.tsx:49](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Catalog.tsx#L49); [lib/cotillon-taxonomy.ts:104](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/lib/cotillon-taxonomy.ts#L104)

**Captura:** [Captura](capturas-2026-10-28/H005-busqueda-ninos-390.jpg)

**Propuesta, sin implementar:** Normalizar diacríticos y espacios en consulta y campos indexados de los dos catálogos públicos.

### H006 · MEDIO · Dos productos con el mismo nombre y precios diferentes

**Área / página / dispositivo:** datos · /cotillon/ · Corona Princesa Plastica · Todos; hoja.

Corona Princesa Plastica aparece activa con IDs excel-2115053557 y excel-2115151669, precios $2.500 y $2.000 y stock 3 cada uno. No se afirma que sean el mismo SKU: el nombre público no permite distinguirlos.

**Reproducir:** Buscar Corona Princesa Plastica y comparar las dos fichas, IDs, fotos y presentación con la hoja.

**Evidencia:** cotillon!A2:B1205; duplicados-2026-10-28.csv

**Captura:** [Captura](capturas-2026-10-28/H006-coronas-dos-precios.jpg)

**Propuesta, sin implementar:** Confirmar si son modelos distintos y añadir el diferenciador al nombre; solo unificar después de verificar el inventario.

### H007 · BAJO · Pre,ium es un error de nombre y de búsqueda

**Área / página / dispositivo:** datos · /disfraces/ · Merlina · Todos; hoja y filtro offline.

Disfraz Merlina Pre,ium Niños (excel-2115179180) está activo. La búsqueda premium no incluye este registro; pre,ium sí lo encuentra.

**Reproducir:** Comparar el nombre en la hoja y buscar premium y pre,ium.

**Evidencia:** disfraces!A514:B514; búsquedas en evidencia-2026-10-28.json

**Captura:** [Captura](capturas-2026-10-28/public-ficha-excel-2115179180.jpg)

**Propuesta, sin implementar:** Corregir el nombre tras aprobación y revisar los demás errores de transcripción con el local.

### H008 · MEDIO · 72 fotos de tarjetas son pequeñas; 50 corresponden a productos activos

**Área / página / dispositivo:** datos · Portada, /disfraces/ y /cotillon/ · fotos · Todos; dimensiones HTTP.

Se midieron 72 imágenes de tarjetas cuyo lado mayor es menor que 250 px: 3 de Disfraces y 69 de Cotillón. Las tres de Disfraces están activas: Gaucho 224×224, Papá Noel Friselina 225×225 y Túnica Harry Potter Grande 225×225; se verificaron también los originales. La hero usa spider.jpg de 225×225 y la tarjeta de globos parte de 189×267. No se juzgó pixelado visual ni se midió el tamaño renderizado.

**Reproducir:** Abrir estas fichas y revisar detalle y nitidez en los cuatro tamaños; consultar dimensiones originales y resultados de imagenes-2026-10-28.csv.

**Evidencia:** [lib/thumbnail.ts:12](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/lib/thumbnail.ts#L12); imagenes-2026-10-28.csv; activos-2026-10-28.csv

**Captura:** [Captura](capturas-2026-10-28/public-ficha-excel-2115151739.jpg) · [Captura](capturas-2026-10-28/public-ficha-excel-2115061671.jpg) · [Captura](capturas-2026-10-28/public-ficha-excel-2115151758.jpg)

**Propuesta, sin implementar:** Reemplazar por fotos con resolución suficiente; conservar proporción y evitar ampliaciones que degraden el detalle.

### H009 · MEDIO · Un producto comprable no tiene foto

**Área / página / dispositivo:** datos · /cotillon/ · Cortante Momia · Todos; hoja.

Cortante Momia (excel-2115450781, fila 279 de cotillon) está activo, stock 2 y precio $2.500, pero image está vacío. El código mostrará Foto próximamente.

**Reproducir:** Buscar Cortante Momia y abrir su ficha. Comparar con cotillon!B279.

**Evidencia:** cotillon!A279:B279; [components/Catalog.tsx:98](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Catalog.tsx#L98)

**Captura:** [Captura](capturas-2026-10-28/H009-sin-foto.jpg)

**Propuesta, sin implementar:** Completar una foto del producto correcto o definir cómo presentarlo mientras falta.

### H010 · MEDIO · 46 productos activos publican instrucciones editoriales

**Área / página / dispositivo:** datos · Fichas públicas de productos · Todos; hoja y código.

Descripciones activas contienen antes de publicar, por ejemplo Set Scream Niño: Verificar piezas incluidas antes de publicar. También hay confirmar presentación antes de publicar. El modal imprime description directamente. Son instrucciones para el equipo, no información suficiente de lo que recibe el cliente.

**Reproducir:** Buscar Set Scream Niño o Set Zombie Niño y leer su descripción. Revisar textos-internos-2026-10-28.csv.

**Evidencia:** [components/Catalog.tsx:101](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Catalog.tsx#L101); textos-internos-2026-10-28.csv

**Captura:** [Captura](capturas-2026-10-28/H010-H020-set-scream.jpg)

**Propuesta, sin implementar:** Separar notas internas de la descripción pública y aclarar piezas, presentación y variantes reales.

### H011 · MEDIO · Oculto en el panel no significa oculto en Cotillón

**Área / página / dispositivo:** admin · /admin/ · Cotillón y /cotillon/ · Todos; hoja y código.

El backend público y Catalog incluyen Cotillón aunque active=false. Los 349 inactivos seguirán como AGOTADO; 348 tienen stock 0 y Araña Con Luces tiene stock 1. El editor llama al checkbox Visible en el catálogo y la tabla dice Oculto. Mostrar agotados es una decisión explícita en el código, pero la etiqueta administrativa promete otra cosa. Se comparó la fila real del panel (stock 1, Oculto) con el modal público AGOTADO.

**Reproducir:** Sin cambiar nada, comparar Araña Con Luces (excel-2115065112) en hoja, panel y buscador público. La interacción visual quedó pendiente.

**Evidencia:** [components/Catalog.tsx:44](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Catalog.tsx#L44); [backend/Code.gs:96](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/backend/Code.gs#L96)

**Captura:** [Captura](capturas-2026-10-28/H011-agotado.jpg) · [Captura](capturas-2026-10-28/H011-admin-oculto-stock1.jpg)

**Propuesta, sin implementar:** Distinguir publicado/oculto de disponible/agotado y usar etiquetas acordes a la política de exhibición.

### H012 · MEDIO · Un producto activo solo se encuentra en el grupo general o por búsqueda

**Área / página / dispositivo:** datos · /cotillon/ · Descarta­bles · Todos; hoja y filtros offline.

Mantel Friselina Colores Varios Rectangular (excel-2115053543) tiene catalogGroups DESCARTABLES pero no categoryId ni categoryIds válidos. Puede aparecer en el grupo y en búsqueda, pero ninguna subcategoría lo incluye. Bowl Blanco tiene una situación equivalente, pero está inactivo en Repostería. El editor real del mantel muestra Sin categoría; se abrió y canceló sin guardar.

**Reproducir:** Buscar el mantel y luego revisar cada subcategoría de Descartables. Comparar las asociaciones en la hoja.

**Evidencia:** categorías de producción; [lib/cotillon-taxonomy.ts:103](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/lib/cotillon-taxonomy.ts#L103)

**Captura:** [Captura](capturas-2026-10-28/admin-editor-mantel-sin-categoria.jpg)

**Propuesta, sin implementar:** Asignar una categoría apropiada conservando el grupo; revisar también la clasificación del inactivo antes de republicarlo.

### H013 · MEDIO · Logo y algunos detalles descargan PNG grandes

**Área / página / dispositivo:** comprador · Todo el sitio con tema Halloween y fichas · Todos; HTTP.

brand-logo-halloween.png pesa 1.622.170 bytes y se usa en la marca del header y pie; brand-logo.png para Open Graph pesa 1.402.218. La ficha usa selected.image original: Aladin Disney 1.466.499 bytes y Mascara 1.241.973. No se midió LCP ni la espera del usuario en red móvil; estos son pesos reales descargados.

**Reproducir:** En una copia con red móvil simulada, abrir portada Halloween y las dos fichas; observar transferencia y experiencia. Ver activos e imágenes originales en los CSV.

**Evidencia:** [lib/thumbnail.ts:12](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/lib/thumbnail.ts#L12); [components/Catalog.tsx:101](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Catalog.tsx#L101)

**Captura:** [Captura](capturas-2026-10-28/public-home-1366.jpg) · [Captura](capturas-2026-10-28/public-ficha-catalogo-disfraz-2.jpg)

**Propuesta, sin implementar:** Generar variantes adecuadas al uso, comprimir y usar imágenes de detalle dimensionadas, manteniendo nitidez.

### H014 · MEDIO · La expiración durante una operación no devuelve al login

**Área / página / dispositivo:** admin · /admin/ · sesión expirada durante uso · Todos; revisión de código.

Al iniciar, el panel detecta Sesión vencida y limpia la sesión. Durante run(), el catch únicamente muestra error y conserva token y datos. Puede quedar el panel anterior visible con operaciones que fallan hasta recargar o cerrar sesión. El backend exige sesión para admin; esto no demuestra acceso no autorizado.

**Reproducir:** Solo en copia: entrar, invalidar la sesión de prueba mientras el panel permanece abierto y realizar una operación inocua contra el backend simulado. Verificar que pida volver a ingresar.

**Evidencia:** [components/Admin.tsx:12](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Admin.tsx#L12); [backend/Code.gs:31](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/backend/Code.gs#L31)

**Captura:** [Captura](capturas-2026-10-28/admin-sin-sesion.jpg)

**Propuesta, sin implementar:** Centralizar el tratamiento de Sesión vencida y presentar reautenticación clara preservando trabajo local cuando corresponda.

### H015 · MEDIO · Las tareas diarias dependen de tablas largas y entradas al editor

**Área / página / dispositivo:** admin · /admin/ · productos, reservas y caja · Celular; revisión de estructura.

Las listas de productos renderizan todos los resultados (558/1.204 sin búsqueda), sin paginación ni filtro dedicado por estado/modalidad. La búsqueda sí reconoce nombre, categoría e ID. La tabla no muestra precios, por lo que revisar/cambiar uno requiere abrir editor. Reservas carece de búsqueda/filtro de estado y usa el orden de la respuesta. Se verificaron los cuatro tamaños: sin desbordamiento global; en 360 px la tabla mide 798 px dentro de 302 px de área desplazable, por lo que exige desplazamiento horizontal para llegar a las acciones. No se midió latencia con instrumentación.

**Reproducir:** En un entorno de prueba con volumen equivalente: buscar un inactivo, comparar precios, editar un producto situado al final y localizar la reserva más nueva desde 360×640.

**Evidencia:** [components/Admin.tsx:39](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Admin.tsx#L39); [components/Admin.tsx:40](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Admin.tsx#L40)

**Captura:** [Captura](capturas-2026-10-28/H015-admin-productos-360.jpg) · [Captura](capturas-2026-10-28/admin-productos-1366.jpg)

**Propuesta, sin implementar:** Priorizar filtros operativos, orden explícito para reservas, precios visibles y listas manejables en móvil después de medir el flujo.

### H016 · BAJO · No existen enlaces a Instagram, Facebook ni al mapa

**Área / página / dispositivo:** comprador · Portada y pie · Todos; HTML y fuente.

El HTML y Shell solo incluyen navegación interna y WhatsApp. La dirección comercial es texto, sin enlace. No hay href de Instagram/Facebook que pueda comprobarse; no se inventaron perfiles.

**Reproducir:** Revisar encabezado y pie y la lista de hrefs-2026-10-28.csv.

**Evidencia:** [components/Shell.tsx:60](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Shell.tsx#L60)

**Captura:** [Captura](capturas-2026-10-28/public-home-1366.jpg)

**Propuesta, sin implementar:** Confirmar perfiles oficiales con el local y añadir accesos y un enlace a la ubicación comercial.

### H017 · BAJO · No hay acción para vaciar todo el carrito

**Área / página / dispositivo:** comprador · Carrito de Cotillón · Todos; revisión de código.

El panel permite sumar, restar y Eliminar cada línea, pero no tiene Vaciar carrito. Para comenzar de nuevo se elimina línea por línea. Se probó con líneas locales de auditoría: se sumaron/restaron unidades y se eliminaron las tres líneas de prueba; el carrito quedó vacío. No se envió ningún pedido.

**Reproducir:** En copia o navegador de prueba, agregar varias líneas y buscar Vaciar carrito.

**Evidencia:** [components/CotillonCart.tsx](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/CotillonCart.tsx); contrastado con chunk público /_next/static/chunks/1o4srvd4ogj-d.js

**Captura:** [Captura](capturas-2026-10-28/H017-carrito-8500.jpg)

**Propuesta, sin implementar:** Añadir una acción clara para vaciar con opción de deshacer o confirmación adecuada.

### H018 · BAJO · Cerrar ficha tiene un objetivo táctil de 35×35 px

**Área / página / dispositivo:** comprador · Modal de producto · 360×640, 390×844, 412×915; CSS.

La regla publicada close-dialog fija 35×35 px y no tiene ampliación de área encontrada en CSS. Es menor que la referencia ergonómica de 44 px; no se emite un dictamen de conformidad WCAG. Los botones del carrito sí tienen mínimos 44×44 en la CSS posterior.

**Reproducir:** Abrir una ficha desde teléfono y medir el área interactiva de Cerrar. La medición de caja real en navegador quedó pendiente.

**Evidencia:** CSS publicado /_next/static/chunks/3cz-yop4nnvqa.css, selector .close-dialog

**Captura:** [Captura](capturas-2026-10-28/public-ficha-catalogo-disfraz-39.jpg)

**Propuesta, sin implementar:** Ampliar el objetivo a 44×44 conservando posición y sin tapar contenido.

### H019 · MEDIO · El total precargado no se actualiza al cambiar cantidades o sumar trajes

**Área / página / dispositivo:** comprador · /reservas/ · cantidad e importe · Todos; revisión de código.

Elegir un único producto precarga rentPrice una vez. Cambiar cantidad o añadir otro traje no recalcula total, aunque la garantía sí se multiplica por cantidades. El campo está rotulado Total del alquiler acordado por WhatsApp y es editable: no se trata de una cotización automática. La precarga puede confundirse con un total calculado. Reproducido en la UI: Mascara con cantidad 2 mantiene total $60.000 y seña $30.000. No se envió esa solicitud ficticia.

**Reproducir:** En copia: elegir Mascara (stock 3, alquiler $60.000), cambiar cantidad de 1 a 2 y observar que total queda $60.000; no avanzar a documentación/pago.

**Evidencia:** [components/RentalForm.tsx:50](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/RentalForm.tsx#L50)

**Captura:** [Captura](capturas-2026-10-28/H019-cantidad-total-manual.jpg)

**Propuesta, sin implementar:** Distinguir precio sugerido por unidad de importe total acordado y advertir al cambiar la selección; respetar los presupuestos especiales.

### H020 · MEDIO · La foto y descripción no siempre aclaran si se ofrece traje completo o accesorio

**Área / página / dispositivo:** datos · /disfraces/ y /cotillon/ · identidad del artículo · Todos; datos y fotos HTTP inspeccionadas.

Mascara La casa de papel está como alquiler de Disfraces a $60.000, description vacía y una foto que muestra solo una máscara. Set Scream Niño permanece en Cotillón; su foto presenta un niño con capa, máscara y arma y su descripción pide verificar piezas antes de publicar. Mascara (sin más) sí muestra el traje amarillo completo del personaje La Máscara; no se marcó como accesorio por el nombre. La asignación comercial correcta no puede decidirse solo con estas fotos.

**Reproducir:** Revisar los tres productos y las piezas físicas con el local. Las fotos descargadas solo se inspeccionaron; no son capturas de la web.

**Evidencia:** disfraces filas 251/252; cotillon fila 649; fotos públicas y fichas-2026-10-28.csv

**Captura:** [Captura](capturas-2026-10-28/public-ficha-catalogo-disfraz-118.jpg) · [Captura](capturas-2026-10-28/H010-H020-set-scream.jpg)

**Propuesta, sin implementar:** Aclarar exactamente qué incluye cada artículo, nombre, modalidad y sección; moverlo únicamente tras verificarlo con el negocio.

### H021 · BAJO · El HTML inicial de los catálogos no contiene productos

**Área / página / dispositivo:** comprador · SEO de catálogos · Todos; HTML HTTP.

El HTML de Disfraces/Cotillón muestra estado de carga; las fichas llegan después por JavaScript/Apps Script. Título, descripción, canonical y Open Graph sí están presentes. Esto limita el contenido disponible para consumidores que no ejecutan JavaScript; no se afirma que Google no indexe el sitio. robots.txt y sitemap.xml devuelven 404 y no se encontraron enlaces internos hacia ellos.

**Reproducir:** Comparar el HTML HTTP guardado/inspeccionado con el catálogo tras cargar JavaScript en una copia.

**Evidencia:** [components/Catalog.tsx:16](https://github.com/disfrazcabezoneventos-alt/dc-web/blob/a64f8e66fc01ec6e25f44ed49a88ff9c3fc19e34/components/Catalog.tsx#L16)

**Captura:** [Captura](capturas-2026-10-28/public-disfraces-1366.jpg)

**Propuesta, sin implementar:** Evaluar una instantánea pública de catálogo para el HTML y un sitemap de rutas públicas sin incluir datos de solicitudes.

### H022 · CRÍTICO · La cuenta de cobro está vacía y el flujo bloquea continuar desde Pago

**Área / página / dispositivo:** admin · /admin/ · Datos de cobro / /reservas/ · Pago · Panel autenticado; escritorio y móvil.

En el panel autenticado, Titular, Banco, Alias, CBU/CVU y CUIT aparecen vacíos. La fuente considera configurada la cuenta solo si hay titular y alias o CBU; RentalForm deshabilita Continuar en Pago cuando bank.configured es falso. La configuración vacía está confirmada por UI; el bloqueo final se deduce del código y no se atravesó enviando documentos. Es un impedimento de la reserva online, incluso si se quisiera adjuntar un recibo de efectivo.

**Reproducir:** Solo mirar /admin/ → Datos de cobro. No completar ni guardar. En una copia aislada, cargar tres adjuntos sintéticos y simular bank.configured=false: Pago no debe permitir avanzar. En producción no se enviaron adjuntos ni se llamó bank manualmente.

**Evidencia:** Panel real: cinco campos vacíos. components/RentalForm.tsx: disabled en step===3; backend/Code.gs: bank_().

**Captura:** [Captura](capturas-2026-10-28/H022-cuenta-cobro-vacia.jpg)

**Propuesta, sin implementar:** El dueño debe verificar y aprobar una cuenta de cobro válida antes del sábado; comprobar su funcionamiento de punta a punta en una copia aislada y acordar una alternativa cuando el local no tenga cuenta habilitada. Esta auditoría no cambia la configuración.

### H023 · MEDIO · Se observaron timeouts iniciales de catálogo que se recuperaron al reintentar

**Área / página / dispositivo:** comprador · / y /disfraces/ · Chrome, primera visita a 390×844.

En el primer recorrido de Chrome, portada y Disfraces mostraron No se pudo conectar con Apps Script y no ofrecían productos. Después de Reintentar, Disfraces cargó los 370 activos. El recorrido posterior en el navegador integrado funcionó. No se atribuye la causa a backend, red, perfil o iframe sin evidencia adicional; no se afirma una caída permanente. La captura de aquel fallo quedó reducida por la herramienta y no es legible como prueba visual.

**Reproducir:** En una sesión nueva de Chrome, abrir portada/Disfraces y observar la carga. Si aparece el banner, registrar duración y contexto antes de Reintentar. No forzar fallos ni cambiar configuración de producción.

**Evidencia:** Transcripción de DOM de la primera visita; catálogo recuperado y filtros verificados. No reproducido en la segunda sesión del navegador integrado.

**Captura:** Sin captura legible del fallo; recuperación: capturas-2026-10-28/public-disfraces-1366.jpg

**Propuesta, sin implementar:** Confirmar el comportamiento en un dispositivo del negocio y una red móvil; investigar latencia de arranque, respuesta del iframe y recuperación, conservando filtros y selección. Evitar cambios de timeout sin identificar la causa.

### H024 · BAJO · El botón + queda habilitado al alcanzar el stock total entre opciones

**Área / página / dispositivo:** comprador · /cotillon/ · carrito con varias opciones · Escritorio; stock compartido.

Con 2 abanicos rojos y 11 azules se alcanza el stock 13. El + de los rojos sigue habilitado porque esa línea tiene 2<13; al pulsarlo la cantidad no cambia. El límite agregado sí se respeta y no se excedió stock. La discrepancia está en el estado del control.

**Reproducir:** En carrito local de prueba, añadir dos opciones del mismo producto hasta agotar el total. Revisar el + de una línea cuyo número individual es menor que el stock. No enviar el pedido.

**Evidencia:** UI real: plusEnabled=true, antes/después iguales; public-audit.json, test sharedStock13.

**Captura:** [Captura](capturas-2026-10-28/H024-carrito-tope-compartido.jpg)

**Propuesta, sin implementar:** Deshabilitar + según el stock restante agregado entre opciones, o explicar que ya se alcanzó el máximo. Mantener la validación de cantidad total.

## No probado por regla y cómo probarlo de forma segura

| No probado | Motivo | Prueba segura |
| --- | --- | --- |
| Reservar, comprar, arrepentirse o enviar WhatsApp/mail | No crear operaciones ni mensajes reales. | Frontend y backend aislados con hoja de prueba y buzón sumidero; interceptar enlaces/mensajes en un receptor local. |
| Documentación→Pago y Firma | Continuar transmite adjuntos antes del envío final. | Imágenes y PDF sintéticos en copia; nunca DNI, comprobantes o firma reales. Verificar bank falso/verdadero y ambas modalidades de pago. |
| Guardar/clonar/borrar/ocultar/precios/stock/categorías | Escritura prohibida en producción. | En copia comparar JSON completo antes/después de cambiar una sola propiedad. Reproducir H001/H002 primero. |
| Uploads de archivos y foto de producto | No subir documentos; el editor sube foto al seleccionar archivo. | Almacenamiento de prueba, fixtures inválidos/válidos, 8 MiB y formato; cancelar y revisar limpieza de archivos temporales. |
| Sesión caducada, errores autenticados y cambios de estado | No invalidar la sesión del dueño ni generar reservas. | Sesión y registros de prueba; expirar el token en la copia y revisar reingreso, conservación local e idempotencia. |
| Caja, devolución, cancelación, aprobación/reintegro | Modifican historial, stock o dinero. | Registros ficticios en copia con trazabilidad de stock/contabilidad. |
| Tema/campaña y configuración de cobro/correo | No guardar ni cambiar ajustes. | Fixtures o despliegue aislado; dueño aprueba cada cambio posterior. Fecha simulada alrededor del 01/11 AR para el banner. |
| Funciones Apps Script | Prohibición expresa de ejecución manual. | No se ejecutaron. Para pruebas futuras usar copia con propiedades/endpoints verificados: dispatch contiene recuperaciones y migraciones que pueden escribir aunque la acción se llame catalog/admin. |

## Límites que no deben ocultarse

No hay prueba final de venta/reserva ni aprobación de cambios administrativos. No se comprobó el envío de correos, la entrega de documentos, el PDF generado para un cliente ni la cola de notificaciones. La versión del backend desplegada no se identificó mediante ejecución manual. H001/H014 son análisis de código; H022 confirma cuenta vacía y deduce el bloqueo sin transmitir documentos. H023 se recuperó y no tiene captura legible del fallo original; no se convierte en una caída general de la tienda. No se midieron Web Vitals ni todos los href de WhatsApp individualmente.

Esta entrega documenta esos límites y propone pruebas en copia; no los considera aprobados. No se hizo build ni se modificaron aplicación, backend, validaciones, dependencias, tema, campaña o datos. La publicación prevista es únicamente un PR DRAFT de docs/qa; no merge ni deploy.
