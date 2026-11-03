# Categorías por lotes — PR #32

Misma rama DRAFT. Sin merge, despliegues ni cambios en producción. PBKDF2 permanece
en **600.000 iteraciones**; el activador privado ya aprobado no se modifica.

## Implementación

- Renombrar y borrar categorías toma un solo snapshot de la hoja del área.
  Calcula todos los productos en memoria y escribe una vez con `setValues`, en el
  rango comprendido entre la primera y la última fila afectada. Las filas intermedias
  ajenas al cambio conservan exactamente el JSON leído. No se alteran los otros
  campos de los productos ni se los normaliza por el editor individual.
- Se escribe primero un diario `category_bulk` pendiente. Los productos y las
  categorías se escriben por rango, con **un único `SpreadsheetApp.flush()`**
  explícito, antes de marcar el diario confirmado. No hay lecturas ni flush por
  producto. Google Sheets no ofrece una transacción conjunta entre estas hojas;
  el diario permite detectar y recuperar interrupciones.
- El diario guarda por producto solo `id` y `categoryId`, `category`, `categoryIds`
  antes/después. El propietario aprobó `categoryIds` para restaurar secundarios.
  No guarda nombre, precio, foto, stock ni el JSON completo del producto. Conserva
  autor, fecha y los cambios de la propia categoría necesarios para deshacerla.
- Una operación usa una entrada salvo que su tamaño obligue a dividirla. Se
  reserva margen al dividir y se valida **cada registro por debajo de 48.000
  caracteres antes de escribirlo**. Todas las partes comparten `operationId`.
- Renombrar revisa los productos primarios vinculados cuyo nombre almacenado
  difiere del nuevo. No depende de que `old.name` cambie. Guardar nuevamente el
  mismo nombre termina los productos rezagados; no altera la categoría principal
  de un producto que solo tiene esa categoría como secundaria.
- `recoverCatalogHistory_` recupera grupos pendientes completos. Con
  `{historyId, mode:'rollback'}` deshace el grupo completo, incluso si tiene varias
  partes. La intención de deshacer también queda pendiente antes de escribir;
  una interrupción durante el rollback se puede continuar. Un grupo incompleto o
  un conflicto se rechaza antes de modificar productos. El rollback no pisa
  cambios posteriores de precio, foto u otros campos ajenos a la categoría.
- No se elimina un destino que haya recibido otros productos, ni se restaura
  una categoría si su nombre ahora ocupa otra en la misma sección. El Admin
  dispone de **Deshacer cambio de categoría** con confirmación en Historial.
  El Editor sigue sin permiso para las acciones de categorías o recuperación.
- Guardar un producto y la edición rápida conservan el recorrido individual y
  su historial habitual. Sus permisos y normalización no cambian; únicamente se
  impide superponer una edición a un lote pendiente que incluya ese producto.

## Ensayo real en Google

Proyecto de ensayo ya autorizado, sin implementaciones, con copia privada y
`MAIL_MODE=disabled`. El código ejecutado corresponde a esta rama; los entrypoints
web se renombraron únicamente en ese proyecto para impedir usarlo como endpoint.
No se tocaron importaciones, fotos, correos ni activadores de producción.

La copia contiene **678 filas de Disfraces**: 558 anteriores y 120 de ensayo.
Por eso la medición de 441 usa 441 fichas existentes de esa copia, no afirma que
sean todas sus filas. Las otras fichas se conservan. La preparación también tiene
diario y al terminar se compara el JSON completo de las 441 fichas con el baseline
para confirmar su restauración. Se verifica y deshace además el borrado de las 120.

Los tiempos del tramo de API incluyen validación, bloqueo y escritura del diario,
productos y categoría; excluyen preparación y lecturas de comprobación posteriores.
Las mediciones de VM se usan solo para pruebas funcionales, no para estos tiempos.

Resultados del 1 de noviembre de 2026, en el runtime real de Google:

| Operación | Productos | Primera corrida completa | Última corrida, código final |
| --- | ---: | ---: | ---: |
| Renombrar | 120 | 3.028 ms | **2.633 ms** |
| Renombrar | 441 | 3.552 ms | **2.065 ms** |
| Borrar categoría, destino sin categoría | 120 | 2.055 ms | **1.350 ms** |

Ambas corridas completas quedaron por debajo de 60 segundos por operación. La
segunda también comprobó los controles finales de conflicto durante el rollback.
Las **29 fichas rezagadas reales** se reanudaron una sola vez, en **2.676 ms**,
guardando el mismo nombre de categoría; se confirmó que las 120 quedaron coherentes.
En las corridas posteriores se conserva ese resultado y no se vuelve a crear la
inconsistencia. Una primera pasada parcial midió 2.002 ms para renombrar 120 y se
detuvo por una validación de cantidad antes de preparar el lote de 441; se corrigió
el selector del ensayo después del conteo de la copia, sin cambiar productos de producción.

Cada operación cronometrada registró **una lectura y una escritura del área**.
Los contadores del ensayo envuelven los helpers propios; las pruebas del adaptador
de Sheets comprueban además las llamadas `getValues`, `setValues` y el único flush.
La salida final confirmó `originalsRestored=441`, `deleteUndone=true` y costo
PBKDF2 600000. Las dos restauraciones forman parte de la comprobación posterior;
no se incluyen en los milisegundos del renombrado/borrado.

## Validación local

- **289/289 pruebas unitarias**: permisos, costos de hash, guardado individual,
  categorías múltiples, lotes de 120/441, división de registros, las tres estrategias
  de borrado, las 29 fichas rezagadas y reintentos idempotentes.
- Interrupciones antes/después del producto y al confirmar, recuperación global,
  rollback interrumpido, conflictos sin escrituras, diario incompleto y límite de
  tamaño. Se conserva la recuperación del formato individual anterior.
- **22/22 Playwright** en escritorio y celular: los dos roles, guardado individual,
  edición rápida, foto, borradores/cuentas y cancelación/confirmación al deshacer
  un lote desde Historial. Se repitió solo el deshacer tras el control final de
  conflictos: **2/2** adicionales, escritorio/celular. Capturas con datos ficticios
  fuera de GitHub.
- Build estático limpio con endpoint simulado, sin desplegar. No cambian las
  dependencias, el frontend público ni la constante PBKDF2.

Las capturas, logs y enlaces privados del ensayo quedan fuera del repositorio
público. El recorrido HTTP por `/exec`, la concurrencia externa y cargas mayores
siguen fuera de esta comprobación sin despliegue.
