# Conciliación del backend antes de incorporar roles

Base: `main` en `3ef82f190eae840871679092cb984f6885ffe898`.
La comparación usa el archivo de texto entregado por el propietario como copia
del Code.gs desplegado. No se abrió ni modificó el proyecto de producción.

## Comparación

Al normalizar CRLF a LF y excluir BOM, ambos archivos tienen 459 líneas y el mismo
SHA-256: `0d567836fac1a993a577fda2ebe3df5db440b1e82dbdeab8debac281f7b7ec8b`.
**No hay diferencias de contenido.** No se publica el adjunto ni datos de la hoja.
Esto concilia la copia proporcionada; no constituye una inspección independiente
del editor o de las implementaciones activas de Google.

## Integración en una sola rama, en el orden solicitado

1. **PR #25**, commit de referencia `a037d9eaaa812ba883936f9075feedbbadcc116a`.
   Integrado en `e87a979`: SITE_URL principal y EXTRA_SITE_URLS separados por coma.
   Se compara el origen exacto. Como refuerzo, el origen y bridgeId se verifican
   antes de ejecutar una acción, no solo al responder.
2. **PR #28**, referencia `c47c7802c0515157659cb9a83a1186f8b4edefe9`.
   Integrado en `2bfd8af`: las sesiones dependen de credenciales y versión revocable.
   La ampliación a cuentas individuales conserva esa invalidación e incorpora el
   hash/sal y la versión de cada cuenta. Se rechazan los tokens del formato antiguo.
3. **PR #17**, referencia `f59cfb52397ca926e04929aa223d76dbdc7d4656`.
   Integrado en `33143e7`: las lecturas públicas no recuperan stock ni migran
   categorías. La rama administrativa autentica y autoriza antes del mantenimiento.
   El Editor usa rutas de catálogo que tampoco ejecutan mantenimiento de stock.

Son integraciones de comportamiento sobre el main actual, no fusiones de los PRs
originales. Se conservan constancias, formularios locales, cobros y edición rápida.
Las pruebas nuevas usan credenciales y tokens generados en memoria, no los valores
literales que traían los tests de aquellos PRs.

## H001 y H002

- `CatalogProductForm` comparte el editor de ambos roles: selección múltiple en
  Disfraces y Cotillón, preservación de categorías secundarias y descripción opcional.
- `catalogSaveProduct_` valida categorías existentes del área y conserva las
  secundarias si un cliente omite la lista. Una lista explícita permite retirarlas.
- La descripción vacía u omitida se acepta; los límites de texto siguen aplicando.
- La preparación de roles no reescribe productos ni agrega marcas a filas antiguas.
  Los productos sin `publicationState` siguen siendo productos publicados existentes.

## Fuentes de referencia

- [PR #25](https://github.com/disfrazcabezoneventos-alt/dc-web/pull/25)
- [PR #28](https://github.com/disfrazcabezoneventos-alt/dc-web/pull/28)
- [PR #17](https://github.com/disfrazcabezoneventos-alt/dc-web/pull/17)

No se fusionó ningún PR ni se desplegó Apps Script o Render durante este trabajo.
