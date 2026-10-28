# Guía de prueba y ejecución futura: mover disfraces desde Cotillón

**Estado actual: PR en borrador. No ejecutar en producción.** La tarea de retirar cinco fichas de prueba de Disfraces debe completarse antes. Este módulo no borra esas fichas.

## Archivos y qué hacen

- `backend/MoverDisfracesCotillon20261028.gs`: archivo completo para pegar como **nuevo archivo** en el proyecto Apps Script `web-dc`. No reemplaza `Code.gs` ni `Validation.gs`.
- `backend/mover-disfraces-cotillon-2026-10-28.json`: lista verificada de 105 movimientos y 12 casos en revisión. Se descarga automáticamente desde GitHub y su SHA-256 se comprueba antes de escribir. No hay que pegar este JSON en Apps Script.
- `backend/INFORME_MOVER_DISFRACES_COTILLON_2026-10-28.md`: propuestas de categorías y resultado de la prueba.

## Antes de cualquier ejecución

1. Revisar las **31 categorías propuestas** y las **12 filas REVISAR** del informe. Las REVISAR no se mueven.
2. Terminar por separado la tarea de retirar las cinco fichas manuales de prueba de la hoja `disfraces` de producción. No mezclar esa tarea con esta.
3. Aguardar a que este PR sea aprobado y fusionado a `main`. El usuario pidió que permanezca draft hasta un OK explícito.
4. Crear una **copia nueva** de la planilla de producción después del retiro de esas cinco fichas. La copia usada en nuestro ensayo ya está procesada y sirve como evidencia, no como punto de inicio para la prueba del script.

## Probar el módulo en Apps Script, solo con la copia nueva

1. Abrir el proyecto correcto de Apps Script, **web-dc**. Verificar en Configuración del proyecto > Propiedades de secuencia de comandos que `SPREADSHEET_ID` corresponde a la hoja de producción habitual. **No cambiarla.**
2. Ir a **Archivos > + > Secuencia de comandos**. Nombrar el archivo `MoverDisfracesCotillon20261028` y pegar allí el contenido **completo** de `backend/MoverDisfracesCotillon20261028.gs`. Guardar. No hace falta implementar una nueva versión web: estas funciones se ejecutan manualmente desde el editor.
3. En **Configuración del proyecto > Propiedades de secuencia de comandos**, añadir `MOVER28_COPIA_ID` con el ID de la copia nueva. Es el texto entre `/d/` y `/edit` en la URL de Google Sheets. Verificar que sea diferente del valor de `SPREADSHEET_ID`.
4. En el selector de funciones, elegir `previsualizarMovimientoDisfracesCopia` y pulsar **Ejecutar**. El registro debe mostrar `porMover:105`, `enRevision:12`, `referencias:[]` y `conflictos:[]`. Si difiere, detenerse.
5. Elegir `probarLoteMovimientoDisfracesCopia` y ejecutar. Repetir **siete veces en total**. Cada vez procesa hasta 15; después de la séptima debe indicar `pendientes:0`. Los respaldos se crean en la copia antes del primer lote.
6. Volver a ejecutar `previsualizarMovimientoDisfracesCopia`. Debe indicar `porMover:0`, `interrumpidos:0`, `yaMovidos:105`, `enRevision:12`, sin referencias ni conflictos.
7. Revisar manualmente en la copia las pestañas `cotillon`, `disfraces` y `categorias_disfraces`: debe existir **Niños**; los 74 niños y 31 adultos deben estar en Disfraces; los 12 REVISAR deben seguir en Cotillón; las fotos y miniaturas deben verse en las filas movidas.

Si aparece un error o una ejecución se corta, **no editar filas a mano**. Leer `previsualizarMovimientoDisfracesCopia`. Si `conflictos` está vacío y solo hay `interrumpidos`, repetir el lote: el módulo termina las transferencias interrumpidas sin duplicarlas. Si hay conflictos o referencias, detenerse y revisar el registro. No pasar a producción.

## Producción: solo después de nuevo OK explícito

Estos pasos quedan preparados para más adelante; **no forman parte de este PR**.

1. Confirmar por lectura que las cinco fichas de prueba ya no están y que la copia nueva pasó la prueba completa.
2. Ejecutar `previsualizarMovimientoDisfracesProduccion` y guardar el resultado. Debe mostrar 105 por mover, 12 en revisión, cero conflictos y cero referencias. Si cambió alguna fila desde la auditoría, el hash de origen hará que se detenga y se tendrá que rehacer la revisión; no se debe ignorar el aviso.
3. Solo tras autorización explícita, añadir la propiedad `MOVER28_APROBADO_SHA256` con el hash del JSON que figura en la constante `MOVER28_SHA256` del archivo. El valor se verifica exactamente. No publicar esa propiedad como secreto; actúa como consentimiento operativo, no como contraseña.
4. Elegir `aplicarLoteMovimientoDisfracesProduccion` y ejecutar **siete veces**. Revisar `pendientes` después de cada lote. El primer lote crea tres respaldos con nombres `mover28_production_cotillon`, `mover28_production_disfraces` y `mover28_production_categorias_disfraces` antes de modificar filas.
5. Al terminar, `previsualizarMovimientoDisfracesProduccion` debe indicar 105 ya movidos, cero pendientes y cero conflictos. Después verificar categorías, fotos y fichas en la web pública. El módulo no crea pedidos ni reservas.

## Si hay que volver atrás

**No borrar los respaldos.** Hacer primero otra copia completa de la planilla en su estado actual, para conservar cualquier cambio posterior al inicio de la migración. En la planilla original, renombrar las tres pestañas activas `cotillon`, `disfraces` y `categorias_disfraces` agregando, por ejemplo, `_despues_del_error`. Luego renombrar las tres pestañas de respaldo `mover28_production_...` con sus nombres originales exactos. Comprobar las cantidades y una muestra de productos. Esta reversión también deshace cambios legítimos hechos después del respaldo; reconciliarlos desde la copia adicional. **No volver a ejecutar el módulo tras renombrar los respaldos** sin revisar su propiedad de respaldo y el estado de la planilla.
