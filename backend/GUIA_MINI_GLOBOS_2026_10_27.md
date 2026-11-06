# Globos de Mini — segunda etapa separada

Este PR se basa en `main` y no depende del PR #8. **No se ha fusionado ni se ha ejecutado contra producción.** Tampoco se modifica `Code.gs` ni la web pública.

## Datos revisados

- El Excel original se cruza por nombre exacto entre `Web dc` y `Mapa variantes`. Hay 24 variantes visibles: 12 colores por unidad y 12 bolsas x25.
- Los 24 precios y stocks de ambas hojas coinciden. Cada presentación tiene ID único `mini-<código Mini>-unidad` o `mini-<código Mini>-x25`; ambas conservan el código Mini original.
- Se localizaron 12 fotos JPG, una por color. Son copias byte por byte de `Fotos-IA-y-Casa-Alberto-2026-10-27`. No se crearon fotos nuevas.
- La lista íntegra de nombres, precios, stocks, foto y código figura en [INFORME_MINI_GLOBOS_2026_10_27.md](INFORME_MINI_GLOBOS_2026_10_27.md).
- El lote principal de productos con ID Rappi no contiene estos 24 registros. Las claves Mini tampoco chocan con los 1.206 IDs de la copia previa del catálogo.

## Flujo de fotos

Las fotos locales se incluyen en este PR bajo `backend/import-images/mini-globos-2026-10-27/`. Tras una futura fusión aprobada, sus URLs públicas de GitHub se envían al `subirFotoCotillon_` ya existente. Esta función firma la carga con las claves almacenadas exclusivamente en Propiedades del script y exige que Cloudinary devuelva imagen y miniatura. La ficha se crea y se activa solo después de ese resultado. Si falla, no se crea ninguna ficha para ese ID; la falla queda registrada para reintento manual.

## Prueba y posible publicación futura

1. Revisar este PR y los 24 renglones del informe. No mezclarlo con el PR #8.
2. Si se aprueba más adelante, fusionar primero este PR. En Apps Script crear un archivo **nuevo** llamado `CotillonMiniGlobos20261027.gs` y pegar el archivo completo incluido aquí. No reemplazar `Code.gs`.
3. Configurar `MINI_GLOBOS_20261027_TEST_ID` con el ID de una **copia limpia** de la hoja, distinta de `SPREADSHEET_ID`. Ejecutar `previsualizarMiniGlobos27Copia`: debe mostrar 24 altas, 0 conflictos. Ejecutar `probarLoteMiniGlobos27Copia` dos veces: 15 y 9 altas inactivas. Esta prueba no utiliza Cloudinary. Una tercera ejecución debe procesar 0.
4. Antes de producción, exportar de nuevo la pestaña `cotillon` y revisar `previsualizarMiniGlobos27Produccion`. Verificar 24 altas y 0 conflictos. Si los registros ya existen por otro camino, detenerse.
5. Solo con una aprobación posterior, configurar la Propiedad del script `MINI_GLOBOS_20261027_APPROVED` con el SHA-256 literal declarado en `CotillonMiniGlobos20261027.gs`. Sin ella, la función de producción se niega a escribir.
6. Ejecutar `aplicarLoteMiniGlobos27Produccion` en lotes de hasta 15. Antes de escribir crea una pestaña `cotillon_respaldo_mini_globos_20261027_production`. Repetir hasta 0 pendientes y 0 fotos fallidas. Si una foto falla, corregir el origen, ejecutar `reintentarFotosMiniGlobos27Produccion` y retomar.
7. Comprobar las 24 fichas, miniaturas, categorías, stock y carrito sin realizar pedidos reales.

Para deshacer: detener el importador; conservar la pestaña actual con otro nombre y restaurar la pestaña de respaldo como `cotillon`. La copia de seguridad conserva los valores anteriores de todos los productos.

## Verificación y límites

El simulador de Apps Script leyó la exportación CSV de 1.206 fichas, ensayó el respaldo, dos lotes, una falla de foto, reintento y ausencia de cambios en las 1.206 originales. No se subieron fotos a Cloudinary ni se ejecutó el `.gs` en el servicio real. Esas verificaciones quedan pendientes de una aprobación de publicación.
