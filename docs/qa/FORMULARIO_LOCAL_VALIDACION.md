# Validación del formulario local y gestión de entradas

Fecha: 29 de octubre de 2026. Implementación preparada en el repositorio; pendiente de publicación en Apps Script y Render.

## Resultado final

| Comprobación | Resultado |
| --- | --- |
| Instalación limpia con `npm ci` | Correcta; 36 paquetes del lockfile |
| Compilación `npm run build` | Correcta; exportación estática con `/reserva-local/` |
| TypeScript | Correcto, tanto `npm run typecheck` como durante la compilación final |
| `npm test` | 108 pruebas aprobadas; 0 fallos |
| Playwright contra `out/` | 68 pruebas aprobadas; 0 fallos; 1,8 minutos |
| Proyectos Playwright | desktop, mobile-360, mobile-390, tablet-768 |
| Formulario web original | Sin cambios en `RentalForm.tsx`, `lib/model.ts`, `lib/terms.ts` y `app/reservas/page.tsx` |
| Cambios en producción durante esta implementación | Ninguno |

Las 68 pruebas de navegador incluyen 48 escenarios existentes de catálogo, carrito, compra, selección de disfraz, reserva web y 404, más 20 ejecuciones de los cinco recorridos nuevos (uno por cada tamaño). Las pruebas unitarias incluyen diez escenarios nuevos de la API local y gestión, además de las 98 pruebas anteriores.

## Escenarios nuevos verificados

1. Formulario local completo: identidad, precio automático del cabezón (aunque el catálogo tenga otro precio), franjas fijas, retiro hoy con 100% seleccionado y 50% deshabilitado, errores sin DNI, adjuntos, firma, declaraciones y envío. Solo se guardan DNI frente/dorso y firma.
2. Retiro futuro con seña seleccionable, cantidades y tipos combinados (2 cabezones y 1 adulto = $210.000 con las tarifas iniciales); domingo bloqueado.
3. Tarifas del admin guardadas sin modificar productos. Formularios web/local separados. Búsqueda inmediata con sugerencias seleccionables. Modal con cancelar/descartar, edición y guardado de nombre, disfraz, categoría, precio y estado; estado también editable desde la fila.
4. Ordenamientos reales con dos registros distintos por llenado, retiro y devolución, ascendente/descendente; reemplazo y descarga de DNI; descarga del PDF original firmado; aviso de origen web que abre el modal correspondiente; sin desbordamiento horizontal global.
5. Consulta de avisos a los diez segundos tras una entrada nueva; apertura y eliminación del aviso leído; Borrar todas con Cancelar y Aceptar; eliminación recuperable del formulario.

El backend también verifica autenticación, precios adulterados o desactualizados, reclasificación de cabezón como adulto para pagar menos, horarios adulterados, DNI/firma faltantes, adjuntos extra, reintento sin duplicados, conflictos de edición, precio inferior a cobros registrados y preservación de datos/documentos/hash originales. Las reservas web siguen exigiendo cuenta de cobro, domicilio adjunto y comprobante de pago.

## Método y reproducibilidad

Se leyeron las guías de Next.js instaladas sobre exportación estática. Se limpió `.next` antes de instalar/compilar. La primera instalación encontró un error DNS del aislamiento y el primer build un bloqueo EPERM al crear carpetas; la instalación y compilación finales se completaron con acceso autorizado fuera del aislamiento. No se alteraron dependencias para superar esos errores.

Se compilaron los assets con `NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/mock/exec`, exclusivamente para las pruebas. **Este `out/` es de prueba**: Render debe compilar de nuevo usando su URL real de Apps Script. La variable de producción no fue modificada.

Playwright se ejecutó con una configuración temporal fuera del repositorio que importa los cuatro proyectos originales y reemplaza solo `webServer` para servir `out/`. Se corrigieron los selectores de las nuevas pruebas y el servidor temporal (portada y página 404) antes de la ejecución final. No se modificaron las pruebas existentes ni se usó `next dev` como validación final.

Comando del recorrido final en este equipo:

```powershell
npx playwright test --config C:/Users/Usuario/.codex/visualizations/2026/10/29/01a187b2-4c57-7930-a2f5-0c127d8bc37d/playwright-static.config.mjs
```

Las peticiones del navegador se interceptan en ese endpoint de prueba y se ejecutan contra el código real de los tres archivos `.gs`, dentro de un entorno que simula Sheets, Drive y sesiones. El correo está desactivado. No se transmite documentación a Google ni se crean operaciones en la aplicación publicada.

## Evidencias

- [Log completo de pruebas unitarias](formulario-local/unit.log).
- [Log completo de Playwright](formulario-local/playwright.log).
- [Solicitud local enviada en escritorio](formulario-local/local-escritorio.png).
- [Solicitud local enviada en celular de 360 px](formulario-local/local-celular.png).
- [Formularios entrantes en escritorio](formulario-local/admin-escritorio.png).
- [Modal editable en celular de 360 px](formulario-local/modal-celular.png).

Las capturas contienen exclusivamente datos ficticios. Se revisó visualmente la presentación del modal en celular.

## Pendiente externo

Publicar `Code.gs`, `Validation.gs` y `LocalForms.gs` en el Apps Script que usa la web, ejecutar `prepararFormulariosLocales`, publicar una nueva versión en la misma implementación y desplegar el frontend. La guía [FORMULARIO_LOCAL.md](../FORMULARIO_LOCAL.md) incluye los pasos y el recorrido de aceptación.

Las pruebas locales no certifican permisos reales de Drive/Sheets, cuotas de Google, entrega de correo ni latencia del polling contra Google. Después de actualizar Apps Script debe completarse ese recorrido en una copia aislada y la prueba final coordinada en el sitio publicado. No se cambió la aplicación original alojada en ChatGPT Sites.
