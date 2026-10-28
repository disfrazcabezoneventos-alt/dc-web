# Limpieza de cinco fichas de prueba y reemplazos Scream / Woody

Estado: preparación para **PR draft, sin merge**. No se escribió en producción,
no se ejecutó Apps Script en producción y no se subió nada a Cloudinary.
La ejecución real necesita un nuevo OK explícito del propietario.

## Auditoría de referencias, antes del ensayo

Fuente actual confirmada por el propietario: la hoja operativa indicada en la
conversación privada. Su ID permanece en `SPREADSHEET_ID`, fuera de este informe.
Lectura del 28/10/2026, zona America/Buenos_Aires. Se revisaron las tres pestañas
completas dentro de sus límites actuales: `A1:Z1000` en cada una.

| Pestaña | Registros, sin encabezado | Referencias por ID | Referencias por nombre |
| --- | ---: | ---: | ---: |
| reservas | 0 | 0 | 0 |
| movimientos | 0 | 0 | 0 |
| cancelaciones | 0 | 0 | 0 |

Las tres contienen solamente `id, registro_json`. No hay reservas reales,
de prueba, activas ni futuras registradas en esas pestañas en esta lectura.
No se dedujo el carácter de prueba a partir de un nombre: no hay registros.
Esto es una observación de este momento, no una autorización para borrar después.
El módulo vuelve a auditar antes de preparar y justo antes de escribir;
**cualquier referencia nueva, incluso cancelada o rotulada de prueba, frena todo**
y devuelve pestaña, fila, ID, código, estado y fechas para revisión humana.
No cambia ni elimina reservas, movimientos o cancelaciones.

## Borrado físico previsto

Se aplica la última instrucción del propietario: borrar estas cinco filas de
prueba, sin dejarlas desactivadas. El manifiesto fija también el SHA-256 del JSON
actual de cada ficha: si cambia cualquier campo o su posición inicial, se frena.

| Fila actual | Nombre exacto | ID |
| --- | --- | --- |
| 2 | Scream | bb202e08-8358-46da-b5cb-5d4f57980303 |
| 3 | Medusa | af47db49-984f-46bd-b7f8-3d831e89e828 |
| 4 | Woody | 898a77f0-b030-441d-bd48-27fb0dece9d4 |
| 5 | Scream Venta | 62bc26b2-6533-4d4d-8adb-be01d01b72bd |
| 6 | Scream Preventa | e147abcd-cc6a-46ee-857f-95f41acf74d6 |

No se borran imágenes ni archivos de Cloudinary, Drive o contratos.

## Altas previstas

Se conservan exactamente los objetos de origen 154 y 427 del manifiesto del
PR #11, sin editarlo, con las mismas categorías, tarifas y seguros.

| ID nuevo | Nombre exacto | Stock | Alquiler | Seguro | Estado final previsto |
| --- | --- | ---: | ---: | ---: | --- |
| catalogo-disfraz-154 | Scream | 3 | $60.000 | $60.000 | Activo tras subir foto y miniatura válidas |
| catalogo-disfraz-427 | Woody | 1 | $75.000 | $100.000 | Inactivo: **pendiente de foto nueva** |

Scream: Hombres, Halloween, Personajes; tarifa Estándar. Woody: Cabezones,
Personajes; tarifa Cabezones. Se crean fichas de alquiler, sin precio de venta.
No se remapean IDs históricos ni se sustituyen referencias de reservas.

La foto de Scream se extrajo, sin editar ni reescalar, de
`excel-tienda/entradas/catalogo-fotos-revisado.zip`, entrada
`fotos-catalogo/154-scream.jpg`, 1254 × 1254 px. Se incluye en
`backend/manual-cleanup-assets/154-scream.jpg`; inspección visual correcta.
SHA-256: `3c918d3d6102cc690f93ca0b67c9d364faf04615f2c584b1d4608bde0286ffe4`.
Coincide con el PR #11. La subida firmada y la miniatura reutilizan
`disfraces28Photo_` del módulo existente, sin modificarlo.

Woody: la foto original `fotos-catalogo/427-woody.png` mide 160 × 220 px.
Queda con `active:false`, `image:''`, `thumbnail:''` y
`photoStatus:'pendiente de foto nueva'`. **No se toma ninguna imagen ni miniatura
de la ficha manual**. No se intenta subir la imagen chica.

## Ensayo real en una copia de Google Sheets

El enlace de la copia de ensayo, NO PRODUCCIÓN, se entrega únicamente en la
conversación privada, sin publicar su ID en este informe.
Se duplicó el libro completo, con un ID distinto del original. Allí:

1. Se volvieron a leer categorías, disfraces y las tres pestañas de referencias.
2. Se duplicó `disfraces` como `disfraces_respaldo_limpieza_20261028_test`.
   Se comprobó igualdad exacta de las 447 filas A:B (encabezado + 446 fichas).
   La duplicación nativa conserva también las otras columnas y formato.
3. Se generaron las seis solicitudes con las mismas funciones `lm28Product_`
   y `lm28Requests_` del módulo: dos altas y cinco borrados físicos descendentes.
   Se enviaron en un único batch atómico de Google Sheets mediante el conector.
4. Resultado: **443 fichas** (444 filas con encabezado), cinco IDs manuales
   ausentes, dos IDs nuevos presentes. Las otras **441 fichas A:B permanecen
   exactamente iguales**, incluyendo sus URLs, stock y estado de publicación.
5. Scream y Woody quedan inactivos en este ensayo: el modo copia verifica los
   bytes de la foto, pero no sube nada a Cloudinary. La activación de Scream
   se comprobó en la simulación local con respuestas de Cloudinary controladas.
6. Se ensayó la restauración duplicando el respaldo como
   `disfraces_ensayo_restauracion`: nuevamente 446 fichas, iguales al original.
   Se conserva esa pestaña como evidencia, sin alterar el resultado del ensayo.
7. Se releyó producción: sus 446 fichas seguían idénticas al estado inicial.

Este ensayo usó Sheets real con el batch generado por el código. El módulo
completo se ejecutó en Node con servicios simulados; **no se ejecutó dentro
del runtime de Apps Script ni se instaló en el proyecto de producción**.
El procedimiento de abajo permite reproducir esa última parte antes del OK.

## Archivos nuevos y controles

- Módulo: `LimpiezaManualesDisfraces20261028.gs`.
- Plan: `limpieza-manuales-disfraces-2026-10-28.json`.
- SHA-256 del plan: `f03c991454f29e2a3b852a965eae8e2fd4f8b9bd15069efc7df0622cee27ca21`.
- SHA-256 del origen PR #11: `ba46b567c8a83de18a725cc87b4d82d62f96817a14241837198019572136cde6`.
- Se frena ante manifiesto o foto alterados, fichas editadas, categorías faltantes,
  duplicados, estado parcial, referencias o respaldo distinto del estado actual.
- El respaldo nuevo de producción será
  `disfraces_respaldo_limpieza_20261028_production`; todavía **no existe por este
  trabajo**. No se reutiliza el respaldo anterior del importador.
- Si falla la foto o su miniatura, no se borra ninguna fila. El batch evita un
  borrado parcial. Si una verificación posterior falla, se informa y no se
  hace rollback automático. Una reejecución completa válida no duplica altas.
- No hay triggers ni conexiones nuevas con `doGet`/`doPost`.
- No se modifican `Code.gs`, `Validation.gs`, el manifiesto del PR #11,
  su módulo, sus guías ni sus pruebas. Se agregan pruebas propias separadas.

## Paso a paso para Apps Script

### Reproducir solamente en una copia

1. Conservar este PR en draft, sin fusionar. Revisar módulo, manifiesto y foto.
2. Crear **otra copia nueva del libro actual**, con las cinco manuales todavía
   presentes. La copia entregada arriba ya contiene el resultado del ensayo.
3. En una sesión controlada del proyecto que ya contiene los helpers de
   `Code.gs` y `DisfracesIncremental20261028.gs`, añadir únicamente un archivo
   nuevo con `LimpiezaManualesDisfraces20261028.gs`, sin editar los existentes.
   No crear triggers ni desplegar una nueva versión de la aplicación web.
   Esta instalación aún no se realizó en este trabajo.
4. En Servicios, habilitar el servicio avanzado **Google Sheets API** (`Sheets`).
5. Mantener `SPREADSHEET_ID` con el ID real existente. Configurar `LM28_TEST_ID`
   con el ID de la copia nueva, obligatoriamente diferente. Dejar
   **`LM28_APPROVED` sin definir**. No modificar las propiedades de otros importadores.
6. Ejecutar `previsualizarLimpiezaManuales28Copia`. Debe informar cinco bajas,
   dos altas, cero referencias. Si encuentra referencias, frenar y mostrarlas;
   el código no decide que una reserva es ficticia.
7. Ejecutar `probarLimpiezaManuales28Copia`. Comprobar respaldo, cinco IDs
   ausentes y altas con los importes/stock anteriores. Scream debe quedar
   inactivo por ser ensayo sin Cloudinary; Woody inactivo y sin foto.
8. Verificar las otras fichas y las tres pestañas de referencias. Reejecutar:
   debe devolver `ya aplicado` sin escribir ni duplicar. La primera ejecución
   exitosa registra `LM28_COPY_PASSED` con el SHA-256 exacto del plan.
9. Entregar el resultado al propietario y **esperar su OK explícito**.

### Producción: pendiente, no ejecutar ahora

1. Obtener el OK explícito para el borrado de esos cinco IDs y las dos altas.
   Este documento, una propiedad o un ensayo aprobado no sustituyen ese OK.
   Mantener también la orden de no fusionar hasta que se autorice por separado.
2. La variante de producción descarga desde `main`, por lo que el archivo debe
   estar allí mediante una integración previamente autorizada; este draft no
   habilita ni ejecuta esa integración. Repetir el ensayo si cambia el plan.
3. Programar una ventana sin ediciones manuales ni escrituras desde proyectos
   externos. El bloqueo del módulo coordina llamadas del mismo proyecto de
   Apps Script; no bloquea a editores humanos ni a otros proyectos.
4. Mantener las credenciales Cloudinary existentes fuera del repositorio.
   Configurar `LM28_APPROVED` con el SHA-256 exacto del plan **recién después
   del OK**. El módulo exige también `LM28_COPY_PASSED` del ensayo.
5. Ejecutar `previsualizarLimpiezaManuales28Produccion` y revisar el resultado.
   Ejecutar `aplicarLimpiezaManuales28Produccion` solamente dentro de ese OK.
   El módulo crea y verifica el respaldo antes de modificar la hoja; vuelve
   a revisar referencias y estado tras preparar la foto; hace un único batch.
6. Verificar: cinco bajas, dos altas, Scream activo con foto y miniatura, Woody
   inactivo pendiente de foto nueva, resto sin cambios. Quitar `LM28_APPROVED`
   al terminar. Si ocurre cualquier anomalía, informar antes de revertir.

## Cómo revertir, con aprobación y revisión previa

No hay rollback automático ni se borra el respaldo. Primero conservar una
copia del estado posterior y volver a revisar reservas/movimientos/cancelaciones,
esta vez también por los IDs `catalogo-disfraz-154` y `catalogo-disfraz-427`.
Si aparecieron referencias reales a las altas nuevas, frenar: no borrarlas.

Si no hubo cambios posteriores y el propietario autoriza restaurar, duplicar la
pestaña de respaldo y verificar igualdad antes de reemplazar `disfraces`,
manteniendo también la pestaña posterior archivada. La pestaña resultante debe
conservar el nombre exacto `disfraces`, su encabezado y todas sus columnas.
Esto restaura las cinco manuales y quita las dos altas. Se ensayó la duplicación
del respaldo en la copia indicada arriba.

Si hubo cambios legítimos posteriores en otras fichas, **no restaurar toda la
pestaña**: comparar por ID y preparar una reversión selectiva separada, con las
cinco filas del respaldo y las dos altas; obtener aprobación antes de aplicarla.
Las fotos subidas no se eliminan automáticamente, para conservar trazabilidad.

## Validación local

`npm ci` y build limpio, con `.next` eliminado previamente y
`NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/mock/exec`.
Build correcto; 12 elementos estáticos generados por Next, incluidas las rutas
`/arrepentimiento` y `/solicitud`.

Suite unitaria final: **85/85**, incluidas **16 pruebas nuevas** del módulo.
La primera corrida del worktree nuevo encontró `out/` y dos CSV de prueba
locales ausentes; se generó el build y se copiaron los fixtures ignorados desde
el checkout de origen. No se modificaron pruebas existentes para hacerlas pasar.

Las pruebas nuevas cubren referencias por ID/nombre en las tres pestañas,
bloqueo aun con referencia cancelada/de prueba, aprobación y ensayo obligatorios,
respaldo idéntico, idempotencia, ficha editada, estado parcial, categorías,
foto corrupta, fallos de respaldo/batch, referencia aparecida durante la
preparación y activación exclusiva de Scream con Cloudinary simulado.

Playwright completo contra `out/`: **48/48**, en `desktop`, `mobile-360`,
`mobile-390` y `tablet-768`, sin reintentos y con backend mock. Se heredaron los
cuatro proyectos desde la configuración del repositorio y se sustituyó solamente
el servidor en una configuración temporal ignorada por Git, puerto 3017.
No se modificó la configuración versionada ni los tests existentes. El primer
arranque temporal tenía el directorio de trabajo equivocado; luego una primera
corrida dio 44/48 porque el servidor temporal respondía un 404 vacío. Se corrigió
ese adaptador para servir el `out/404.html` exportado por Next con estado 404;
la corrida final pasó completa. Ningún cambio de aplicación fue necesario.
