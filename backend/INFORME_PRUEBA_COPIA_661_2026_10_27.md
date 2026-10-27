# Resultado de la prueba de los 661 productos en una copia

Fecha: 27/10/2026. La copia procesada fue [PRUEBA 661 Cotillón - NO PRODUCCION](https://docs.google.com/spreadsheets/d/1HlUI6BTuDjhVNxmkeWJInj8J0kq77nZgB2fTLg-pYkw/edit). Se creó a partir de los archivos CSV previos, separados de la hoja de producción. También quedó una [copia limpia](https://docs.google.com/spreadsheets/d/1gDEA3WGzKmTlVlJ8AwDJc2-VsXSDXPePiw8f-dV__uE/edit) para que el dueño ejecute el módulo desde Apps Script cuando autorice el PR.

| Control | Resultado |
|---|---:|
| Productos en la fuente revisada | 661 |
| Productos existentes en la fuente | 554 |
| Altas | 107 |
| Actualizaciones necesarias | 87 |
| Reactivaciones incluidas en las 87 | 14 |
| Existentes sin cambio | 467 |
| Operaciones aplicadas a la copia | 194 |
| Ejecuciones de hasta 15 operaciones | 13: doce de 15 y una de 14 |
| Productos finales de la copia | 1.313 |
| Altas de prueba, inactivas y sin Cloudinary | 107 |
| Reactivados en la copia | 14 |
| Conflictos y fotos fallidas en la prueba | 0 |

Antes de escribir, se duplicó la pestaña `cotillon` como `cotillon_respaldo_20261027_test`. La pestaña original tenía 1.206 productos. Se verificó mediante lectura completa que las 1.314 filas finales (incluido encabezado) coincidieran celda por celda con la simulación, que las 1.207 filas del respaldo coincidieran con la exportación original y que las 52 filas de `categorias_cotillon` permanecieran iguales. El encabezado con BOM del CSV se normalizó al importar el archivo de prueba a Google Sheets; los datos de productos no cambiaron por ese detalle.

Las 14 fotos principales y las 14 miniaturas de los productos a reactivar respondieron HTTP 200 y tipo de contenido de imagen en una comprobación real. **Ningún producto fue rechazado por HTTP en esta revisión.** El importador comprueba otra vez las dos URL al ejecutar cada reactivación; una falla impide escribir esa ficha y la deja inactiva. El ensayo automatizado con una miniatura 404 confirmó esta conducta y el reintento posterior.

La prueba de copia usó el simulador del módulo Apps Script y escrituras reales en una hoja nativa de Google Sheets. **No se ejecutó todavía `CotillonIncremental20261027.gs` dentro del proyecto real de Apps Script, no se subieron las 107 fotos a Cloudinary y no se escribió la hoja de producción.** El PR #8 permanece sin fusionar.
