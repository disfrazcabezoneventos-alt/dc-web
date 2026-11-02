# Revisión previa a instalar — PR #32

La revisión continúa en la misma rama y en DRAFT. No se fusionó ni desplegó nada;
no se cambió el proyecto de Apps Script ni la hoja de producción.

**No instalar todavía:** el ensayo real de renombrado con 120 productos agotó
el tiempo de ejecución de Apps Script y dejó la operación incompleta. Los detalles
y el alcance de la recuperación están abajo.

Validación de esta revisión: **280/280 pruebas unitarias, 6/6 Playwright de ambos
roles en escritorio/celular y build estático sin errores**. La regresión anterior
de 64 escenarios sigue documentada por separado. El ensayo real de Sheets se
informa por separado y no se cuenta como aprobado.

## Correcciones

1. `backend/MantenimientoTemporal.gs` contiene solo cuatro wrappers públicos:
   preparar roles, migrar disparadores, recuperar historial y medir hash. Cada uno
   devuelve una única llamada a su función privada, sin argumentos. El test de
   entrypoints admite solo ese archivo con esas cuatro funciones y ninguna otra
   instrucción. **Pegar, ejecutar y borrar; nunca desplegarlo.**
2. `passwordMatches_` verifica el costo guardado como entero entre 100.000 y
   1.000.000. No exige que coincida con el costo para registros nuevos.
   `ejecutarMedirHash` devuelve ms y registra únicamente costo y tiempo. No guarda
   ni muestra contraseñas, sal, hash, tokens o registros de clientes.
3. La instalación empieza por inventariar Activadores y retirar los trabajos de
   importación terminados (cotillón 27, seis Rappi, disfraces 28, limpieza y mover).
   Solo se migran trabajos que continúan en uso. Incluye un ensayo de activador
   privado, sin ejecutar importaciones ni desplegar el proyecto de ensayo.
4. El rollback explica la carga **manual** de `ADMIN_PASSWORD` en Propiedades del
   script: preparar roles elimina esa propiedad y el backend viejo la necesita.

## Hash medido en Google Apps Script

En un proyecto nuevo de ensayo, sin implementación y con contraseña ficticia:

| Costo | Tiempo observado |
| --- | ---: |
| 600.000 | 4.470 ms |
| 210.000 | 493 ms |

Esas muestras individuales no permiten comparar proporcionalidad ni decidir un
cambio de costo. Se reemplaza esa conclusión por la repetición controlada siguiente.

### Repetición en una sola ejecución de Google Apps Script

Se ejecutó `ejecutarEnsayoHashRepetido` en un proyecto exclusivo de hash, sin acceso
a hojas ni correo. Reutiliza `ejecutarMedirHash` y su helper real, variando el costo
solo durante esa ejecución; restaura el helper en `finally`. **No cambia la constante,
propiedades de cuentas ni registros de contraseñas.**

Primero una corrida de calentamiento por costo (no incluida en las seis muestras):
600.000 → 2.747 ms; 210.000 → 871 ms. Luego se alternaron los costos en tres rondas:

| Ronda | 600.000 iteraciones | 210.000 iteraciones |
| --- | ---: | ---: |
| 1 | 2.460 ms | 919 ms |
| 2 | 3.089 ms | 1.103 ms |
| 3 | 2.844 ms | 957 ms |
| Promedio | 2.798 ms | 993 ms |

La relación de promedios es aproximadamente 2,8×, compatible con la relación de
costos de 2,9×. Ninguna de las seis muestras calientes supera 4 segundos. Tres
muestras por costo no garantizan latencia futura ni bajo concurrencia. La constante
sigue en **600.000**; no se aplica la propuesta anterior de bajarla a partir de dos
muestras aisladas. Las capturas y los enlaces privados se entregan fuera de GitHub.

## Renombrado de categoría con 120 productos

El 1 de noviembre se ejecutó el backend en un proyecto de ensayo sin
implementaciones, apuntado a una segunda copia privada en la cuenta del local,
con `MAIL_MODE=disabled`. El propietario completó el consentimiento de Sheets y
activadores. No se usó el proyecto ni la hoja de producción.

| Comprobación real | Resultado |
| --- | ---: |
| Productos ficticios preparados | 120 |
| Duración total que muestra Ejecuciones | 360,707 s |
| Estado final | En tiempo de espera: excedió el tiempo máximo |
| Productos con el nombre de categoría nuevo | 91 |
| Eventos de historial confirmados | 91 |
| Eventos pendientes | 0 |
| Productos que conservaron el nombre anterior | 29 |

Los 360,707 s son el tiempo **total de la ejecución**, incluida la preparación
de datos. No son el valor `ms` del tramo cronometrado: Google interrumpió la
función antes de devolver ese resultado. **No hay una duración de renombrado
completo ni una prueba exitosa de los 120 productos.** El corte concuerda con el
[límite de 6 minutos por ejecución de Google](https://developers.google.com/apps-script/guides/services/quotas).

La lectura posterior contó únicamente los productos sintéticos y sus eventos;
no ejecutó recuperación ni reintentó el renombrado. La categoría ya había sido
guardada con el nombre nuevo. `recoverCatalogHistory_` recupera eventos pendientes,
pero no puede completar los otros 29 productos, que todavía no tenían evento.
Repetir `saveCategory` con el mismo nombre tampoco reanuda ese recorrido: la
actualización de productos depende de que cambie `old.name`.

Antes de instalar, hace falta reducir las llamadas de Sheets y resolver la
reanudación de la operación completa, conservando el historial de cada producto.
Luego repetir este ensayo sobre copia y contrastarlo con los **120 segundos de
espera del frontend**. Aumentar solamente ese timeout no resuelve el corte del
servidor ni la actualización parcial. Esta revisión documenta el hallazgo; no
introduce una optimización o migración adicional sin revisión.

`scripts/apps-script-ensayo/EnsayoCategoria.gs` deja preparado el recorrido:
agrega 120 productos ficticios en borrador y una categoría exclusiva en la copia,
ejecuta la API de renombrado y verifica 120 eventos confirmados. Cuenta las 120
escrituras de productos, 240 de historial (pendiente/confirmado) y una de categoría.
Mide la operación real, excluyendo la preparación de datos y lectura posterior.
Rechaza hojas sin el nombre/bandera de ensayo y copias con stock pendiente.

La prueba automatizada local confirma ese recorrido y que no cambia productos
previos. Su tiempo de VM **no representa** el rendimiento de Sheets; el ensayo
real mostró ese límite. Los pasos para repetir la medición y verificar el
activador están en
[la guía de instalación](CATALOGO_ROLES_INSTALACION.md).

## Activador de una función privada: aprobado en Google

En el mismo proyecto de ensayo se creó un único activador de tiempo para
`verificarActivadorPrivado_`, sin desplegar nada y sin ejecutar importaciones.
El 1 de noviembre, a las 21:06 de Buenos Aires, **Ejecuciones** lo muestra como
«Basada en el tiempo», «Completada», con duración de **2,906 s**. Su registro dice
«Activador privado de ensayo ejecutado» y se comprobó la propiedad
`PR32_PRIVATE_TRIGGER_OK` con la fecha de esa ejecución.

Esto confirma que el activador puede llamar a la función terminada en `_`, aunque
no aparezca en el menú Ejecutar. No demuestra la ejecución de los importadores
existentes: no se corrieron ni se migraron activadores de producción.
El activador de una sola ejecución quedó automáticamente **inhabilitado** en el
proyecto de ensayo; se conserva como evidencia y no tiene próximas ejecuciones.
