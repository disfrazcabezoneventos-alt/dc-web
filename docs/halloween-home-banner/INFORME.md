# Franja de Halloween en la portada

Draft separado, sin merge ni despliegue. No se modificaron backend, Apps Script
ni datos. La portada incorpora únicamente `HalloweenHomeBanner` inmediatamente
antes de `.hero`. El resto de `app/page.tsx` se conserva; los estilos son un
CSS Module exclusivo del componente y no afectan otras páginas.

## Vencimiento en el navegador

El corte es **01/11/2026 00:00 Argentina**, representado por
`2026-11-01T00:00:00-03:00` = `2026-11-01T03:00:00Z`.
El componente comienza oculto tanto en el HTML estático como en la primera
renderización. Después de hidratar, `useEffect` compara ese instante con
`Date.now()` del visitante. No se decide la visibilidad durante el build.

Antes del corte aparece con los textos y enlaces pedidos. Al llegar al corte
un temporizador lo quita, incluso sin recargar. También se vuelve a comprobar
al recuperar visibilidad y con `pageshow`, incluyendo restauración de pestañas.
Después del corte retorna `null`, sin contenedor, márgenes ni espacio reservado.
La comparación usa un instante absoluto: funciona aunque el visitante esté en
otro huso horario. Depende del reloj de su dispositivo. Sin JavaScript la
franja permanece oculta y la portada sigue disponible.

## Temas y tamaños

Se usan las variables existentes de default y halloween, sin cambiar el tema
publicado. En celular los botones se apilan y mantienen una altura mínima de
46 px; la franja está en el flujo normal, sin posición fija ni z-index.
Se verificó con carrito no vacío y WhatsApp visibles, sin solapamientos,
sin desbordamiento horizontal y conservando el h1 y la hero originales.

| Tema y pantalla | Antes | Después |
| --- | --- | --- |
| Default, 360 × 640 | [Captura](antes-default-mobile-360.png) | [Captura](despues-default-mobile-360.png) |
| Default, 390 × 844 | [Captura](antes-default-mobile-390.png) | [Captura](despues-default-mobile-390.png) |
| Default, 412 × 915 | [Captura](antes-default-mobile-412.png) | [Captura](despues-default-mobile-412.png) |
| Default, 1366 × 900 | [Captura](antes-default-desktop.png) | [Captura](despues-default-desktop.png) |
| Halloween, 360 × 640 | [Captura](antes-halloween-mobile-360.png) | [Captura](despues-halloween-mobile-360.png) |
| Halloween, 390 × 844 | [Captura](antes-halloween-mobile-390.png) | [Captura](despues-halloween-mobile-390.png) |
| Halloween, 412 × 915 | [Captura](antes-halloween-mobile-412.png) | [Captura](despues-halloween-mobile-412.png) |
| Halloween, 1366 × 900 | [Captura](antes-halloween-desktop.png) | [Captura](despues-halloween-desktop.png) |

Las capturas anteriores corresponden a un build del commit base `7293be9`,
sin la franja, servido desde una copia de su `out/`. Las posteriores usan el
build del PR con la misma fecha simulada (28/10), catálogo de prueba y un
producto en el carrito. No son capturas de producción.

## Validación

- Build limpio: eliminar `.next`, `npm ci` y `npm run build`, con
  `NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/mock/exec`.
- **98/98 unitarias** existentes, sin modificar sus expectativas.
- **28/28 Playwright** del banner contra `out/`, con los cuatro tamaños de la
  tabla y ambos temas; configuración y servidor estático temporales en `tmp/`,
  sin cambiar `playwright.config.mjs` ni usar `next dev`.
- Texto y enlaces exactos, posición anterior a hero, destinos de los botones,
  ausencia en Disfraces/Cotillón, controles táctiles, carrito/WhatsApp visibles,
  ausencia de solapamientos/desbordamiento y de errores de JavaScript.
- Fecha posterior (02/11): ausencia total de la franja; contenido de `main`,
  HTML de hero y su posición/tamaño iguales al build base. Se conservó esa
  evidencia de referencia en `before-layout.json` para los tests.
- Borde temporal: visible a las 23:59:59.999 de Argentina y ausente a las
  00:00:00.000 del 01/11 sin recarga; también ausente al abrir justo en el corte.
- Visitante con huso Asia/Tokyo: mismo corte argentino.

Todas las respuestas del backend fueron simuladas en el navegador de prueba.
No se ejecutaron operaciones sobre Apps Script o servicios de producción.
El cambio queda para revisión: no se fusiona ni se publica desde este trabajo.
