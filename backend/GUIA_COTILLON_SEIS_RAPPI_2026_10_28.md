# Guía del lote de seis faltantes de Rappi

**PR draft: no fusionar ni ejecutar la carga real sin otra autorización expresa del dueño.** Estos pasos documentan una ejecución futura; no se ejecutó nada en producción.

## Archivos y dependencias

Agregar únicamente el nuevo módulo [CotillonSeisRappi20261028.gs](CotillonSeisRappi20261028.gs) al proyecto existente cuando se autorice. Necesita Code.gs y el módulo de #8, CotillonIncremental20261027.gs. No reemplazar ninguno de ellos, no modificar Validation.gs y no cambiar archivos del importador de disfraces. No requiere otra implementación web ni una URL /exec nueva.

La fuente y las seis fotos se descargan de main. Mientras el PR sea draft y no esté fusionado, esa descarga del archivo nuevo fallará sin escribir. No cambiar la URL a otra rama para ejecutar una carga real adelantada.

## Estado de la preparación

- JSON: import-cotillon-seis-rappi-2026-10-28.json.
- SHA-256: **9bc98afb0181c3928f7a377350fee9933c263c9c679f157f3c2a302ca7e6aae3**.
- Seis fotos originales revisadas, todas aptas. Ningún producto rechazado por foto.
- La [copia de prueba procesada](https://docs.google.com/spreadsheets/d/1u1cN2569dN7gP_V46iAnzRj4c7OpIO5OCakOeJ41f_M/edit) ya contiene las seis filas inactivas y su respaldo. Si se usa para previsualizar este mismo lote, se esperan cero altas y seis sin cambios. No representa producción ni una ejecución del editor de Apps Script.

## Prueba manual posterior en otra copia limpia

1. Crear otra copia de la hoja de prueba de #8, o una copia limpia del catálogo que se quiera evaluar. No cambiar la hoja de producción para probar.
2. Mantener SPREADSHEET_ID con el ID real de producción y asignar COTILLON_SIX_20261028_TEST_ID al ID de esa copia nueva. Ambos deben estar presentes y ser distintos. El módulo rechaza la prueba si falta identificar producción o si los IDs coinciden.
3. Dejar COTILLON_SIX_20261028_APPROVED sin configurar. No copiar propiedades de aprobación de otro lote.
4. Tras autorizar y fusionar el PR en el futuro, ejecutar previsualizarCotillon6Copia. En una copia sin estos productos: fuente 6, altas 6, conflictos 0, sinFotoAprobada 0. Si difiere, detenerse y comparar con el informe.
5. Ejecutar probarLoteCotillon6Copia. Crea cotillon_respaldo_seis_20261028_test antes de escribir. Devuelve procesados 6. Las seis filas quedan inactivas y sin subida a Cloudinary.
6. Repetir una vez: procesados 0. Verificar filas, precios, stock y categorías; cotejar todos los registros anteriores contra el respaldo.

## Carga real futura, solo con nueva autorización

No realizar estos pasos con este PR draft. El siguiente permiso no está incluido en la preparación.

1. Revisar la copia y el informe; confirmar que el JSON y las fotos de main siguen correspondiendo al SHA-256 aprobado. Revisar nuevamente stock/precio si pasó tiempo desde la solicitud del 28/10.
2. Guardar una copia externa de la hoja inmediatamente antes de la carga real. Conservar el respaldo automático que creará el módulo; no reemplazar ni borrar otras pestañas.
3. Solo después de una autorización expresa para producción, asignar COTILLON_SIX_20261028_APPROVED al SHA-256 exacto de arriba. Mantener las credenciales de Cloudinary en propiedades del script, nunca en Git ni en el informe.
4. Ejecutar aplicarLoteCotillon6Produccion. Antes de escribir verifica aprobación, fuente, identidades, nombres, categorías y configuración. Crea cotillon_respaldo_seis_20261028_production antes de la primera alta.
5. Cada foto aprobada se comprueba por tipo de contenido y SHA-256, se sube con la función existente de Cloudinary y se verifican imagen y miniatura finales. Solo entonces la ficha queda activa. Los fallos se guardan como fichas inactivas con photoImportState:error. Una foto no aprobada crea una ficha inactiva con photoImportState:review y motivo obligatorio.
6. No reactivar fichas a mano para ocultar errores. Revisar primero el motivo. Tras resolverlo, reintentarFotosCotillon6Produccion verifica otra vez los archivos y completa únicamente las fotos fallidas de este lote, sin duplicar ni reemplazar sus demás campos.
7. Una repetición normal debe devolver procesados 0. Si ya existe un ID, sourceId o nombre de otra procedencia, se bloquea el lote completo: no intentar forzar la identidad.

## Ante un error

- Fuente o foto con SHA diferente: detenerse y revisar; no modificar el sello para saltar el control.
- Conflicto de identidad, nombre o categoría: no se escribe nada y no se crea un respaldo nuevo. Comparar la copia con el catálogo actualizado.
- Respaldo perdido o propiedad que apunta a otra hoja: detenerse y conservar las hojas; no borrar propiedades para forzar otro respaldo.
- Corte entre operaciones: la reanudación normal omite las filas ya creadas. El primer respaldo se conserva.
- Un rollback o modificación de producción requiere una nueva instrucción del dueño. La presente guía no autoriza ejecutarlo.

La validación y las limitaciones completas están en [el informe](INFORME_COTILLON_SEIS_RAPPI_2026_10_28.md).
