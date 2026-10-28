# Informe de preparación: disfraces de alquiler (28/10/2026)

**Estado:** importador preparado en un PR separado; prueba de datos completada en una **copia** de Google Sheets. **Producción no se modificó y el PR no se fusionó.**

## Fuentes y auditoría

Se leyeron `catalogo-disfraces-completo.xlsx` (Catálogo, Fotos y Tarifas), `Cruce-disfraces-stock-2026-10-28.xlsx`, `catalogo-fotos-revisado.zip` y la exportación completa de la hoja original `stock disfraces`. Los nombres se conservan tal como vienen del Catálogo; no se inventaron descripciones ni se retocaron fotos.

| Comprobación | Resultado |
| --- | ---: |
| Filas de disfraces / IDs de origen únicos | 443 / 443 |
| Nombres únicos | 442: `Luiggi` aparece en los IDs 361 y 112 |
| Fotos seleccionadas encontradas en el ZIP | 443 de 443 |
| Fotos de al menos 600 px de ancho | 309 |
| Fotos menores de 600 px | 134 |
| Tarifas completas y coherentes con la hoja Tarifas | 443 de 443 |
| Estado de revisión | 443 `Pendiente` |
| Stock numérico no negativo en Catálogo | 443 de 443 |

Las tarifas almacenadas son Cabezones $75.000 de alquiler / $100.000 de seguro (129), Premium $65.000 / $65.000 (54), Estándar $60.000 / $60.000 (260). El seguro se guarda como dato interno `insuranceDeposit`; el formulario y el contrato existentes **no** se cambian. Por eso el seguro Premium del catálogo puede diferir de la garantía que calcula hoy el formulario. Es una decisión pendiente de integración comercial, no un dato inventado por el importador.

La hoja de producción contiene cinco fichas manuales. `Scream` y `Woody` coinciden con el origen: se **omiten** y se conservan intactas, como se acordó. `Woody` manual permanece activo aunque la foto del origen nuevo tiene 160 px; esta excepción se mantiene por la instrucción de no tocar fichas manuales. Se preparan **441 altas nuevas**: 308 con ancho suficiente para activarse *solo tras subir foto y miniatura a Cloudinary*, y 133 inactivas por foto pequeña. Si falla una foto, esa ficha queda inactiva y registra el error. No se elimina ni reemplaza ninguna foto manual.

De las coincidencias de stock con confianza Alta y cantidad numérica, **167** se usan. Se detectaron **20 nombres** repetidos con cantidades diferentes en el stock original: Bruja, Dracula, Grinch, It, Papa Noel, Woody, Batman gris, Batman negro, Gatubela, Iron Man, Jesús, Payaso Art, Scream, Darth Maul, Storm Trooper, Vader, Astronauta, Corredor F1, Mucama y Fiona. Para esas coincidencias se preserva la cantidad del Catálogo. Entre ellas, estas **14 fichas** tenían coincidencia Alta numérica y se descartó ese cruce:

| ID | Disfraz | Stock conservado del Catálogo |
| ---: | --- | ---: |
| 305 | Bruja | 1 |
| 88 | Darth maul | 1 |
| 94 | Dracula | 3 |
| 236 | Fiona | 1 |
| 237 | Gatúbela | 2 |
| 346 | Grinch | 1 |
| 141 | Iron Man | 1 |
| 146 | Jesús | 1 |
| 125 | Mucama | 1 |
| 174 | Papá Noel | 50 |
| 154 | Scream | 3 (ficha manual omitida) |
| 162 | Spider Man Spectacular | 1 |
| 167 | Stormtrooper | 1 |
| 427 | Woody | 1 (ficha manual omitida) |

`Enfermera blanca` (ID 231) sí toma el 0 confirmado y queda inactiva. `Spider Man Spectacular` conserva 1: el stock original muestra 0 y 1 en secciones distintas. **Su foto mide 160 px**, así que el importador lo deja inactivo por la regla general de 600 px, aunque la aclaración de stock decía “activo”. No se hizo una excepción por cuenta propia; esto requiere tu decisión. El origen tiene una categoría `adultos` para `Teletubie Violeta` (ID 387) que no coincide con las nueve categorías actuales; se importa **sin categoría**, visible en “Todos” cuando se active, y queda para clasificación manual. No se crea una categoría nueva. Las dos fichas `Luiggi` mantienen IDs diferentes y el mismo nombre de origen; conviene revisarlas visualmente antes de producción.

## Prueba en una copia de Google Sheets

Copia completa de la hoja: [Disfraz Cabezón — copia prueba importación disfraces 2026-10-28](https://docs.google.com/spreadsheets/d/1xfOy7yCjGOTpDfiU1pvq_HmjnI3gW6CSzPCr7s5dun4/edit). Su ID es diferente del de producción. Antes de escribir se duplicó allí la pestaña `disfraces` como `disfraces_respaldo_20261028_test`.

Se simuló el módulo `.gs` con las **cinco filas reales de la copia** y las **nueve categorías reales**; el resultado se escribió en la copia mediante Google Sheets en **30 lotes de hasta 15**. Se leyeron de vuelta **todas** las filas y se compararon exactamente con la salida simulada:

| Resultado en copia | Cantidad |
| --- | ---: |
| Altas | 441 |
| Actualizaciones de fichas manuales | 0 |
| Omitidas por conflicto manual | 2 |
| Lotes | 29 de 15 y 1 de 6 |
| Filas finales de `disfraces` | 447, incluida la cabecera |
| Filas del respaldo | 6, incluida la cabecera |
| Fichas nuevas activas en copia | 0, intencionalmente |
| Cambios en Cotillón y categorías de la copia | 0 |

Los 21 paquetes privados de fotos (308 seleccionadas, unos 124 MiB) quedaron en [carpeta privada de Drive](https://drive.google.com/drive/folders/1ceEUII0gXFoxbC9ai8PSTMvRy36qlfpP). Se comprobaron los 21 nombres y tamaños contra los archivos locales; Drive los informa como no compartidos. El importador verifica SHA-256 de cada paquete y foto. No se hizo ninguna subida a Cloudinary ni se creó una reserva o pedido. Una comprobación de lectura confirmó que las primeras cinco fichas de producción seguían iguales a las de la copia inicial.

**Límite de esta prueba:** el código Apps Script se ejecutó en una simulación local de sus servicios y la escritura se hizo con el conector de Sheets. **No se ejecutó ese `.gs` dentro del servicio Google Apps Script**, ni se probó Cloudinary en vivo, ni se verificó la aparición pública de estas fichas: todo eso exige el paso de producción, que espera autorización. La cuenta que ejecutará Apps Script también deberá poder leer los paquetes privados de Drive.

## Código y verificación

El importador nuevo está en `DisfracesIncremental20261028.gs`, separado de `Code.gs`, con manifiesto JSON verificado por SHA-256, respaldo previo, lotes de 15, omisión de coincidencias manuales y bloqueo de producción mediante la propiedad `DISFRACES_20261028_APPROVED`. No modifica Cotillón, reservas, caja ni el frontend. El PR #1 anterior está desactualizado respecto de `main` y propone otro enfoque; **conviene rehacer esa importación con este PR nuevo**, dejando #1 sin fusionar hasta decidir qué hacer con él. El PR #9 de globos tampoco se toca.

Pruebas locales ejecutadas:

- `npm ci`: correcto tras permitir red; 0 vulnerabilidades reportadas.
- `npm run typecheck`: correcto.
- `npm test`: **68/68** correctos, incluidos 30 lotes, respaldo, preservación de fichas manuales, bloqueo de producción y una simulación de fallo de miniatura que deja la ficha inactiva.
- `npm run build`: correcto con Next.js 16.4.2, exportación estática de 12 páginas.
- Playwright sobre el `out/` recién compilado: `/`, `/cotillon/`, `/disfraces/`, `/reservas/` y `/admin/` respondieron HTTP 200 en 1366 px y 390 px; sin errores de JavaScript ni desborde horizontal. Esta es una prueba local con datos de demostración, no una verificación de producción.

## Cuestiones para revisar antes del OK de producción

1. Decidir si `Spider Man Spectacular` debe seguir la regla de foto mínima (queda inactivo, como está preparado) o si hay que preparar una excepción explícita para su foto de 160 px antes de publicar.
2. Confirmar si las dos fichas `Luiggi` representan disfraces distintos; se conservan ambas por sus IDs de origen.
3. Clasificar `Teletubie Violeta` si se quiere evitar “Sin categoría”.
4. Revisar en algún momento la diferencia entre el seguro Premium interno y la garantía del formulario. Este PR no la cambia.
5. Confirmar que la cuenta del proyecto Apps Script `web-dc` puede leer los 21 ZIP privados de Drive y que sus propiedades Cloudinary vigentes son correctas; aquí no se pudo ejecutar Apps Script ni Cloudinary real.

**Pendiente:** 0 productos escritos en producción, 0 fotos subidas a Cloudinary y 0 productos nuevos verificados en la web pública. No ejecutar `aplicarLoteDisfraces28Produccion`, no fusionar el PR y no colocar la propiedad de aprobación hasta un OK explícito.
