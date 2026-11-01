# Revisión previa a instalar — PR #32

La revisión continúa en la misma rama y en DRAFT. No se fusionó ni desplegó nada;
no se cambió el proyecto de Apps Script ni la hoja de producción.

Validación de esta revisión: **280/280 pruebas unitarias, 6/6 Playwright de ambos
roles en escritorio/celular y build estático sin errores**. La regresión anterior
de 64 escenarios sigue documentada por separado; estas cifras no cuentan ensayos
reales de Sheets que no se completaron.

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

Se preparó una segunda copia privada en la cuenta del local y un proyecto de
ensayo con permisos solicitados limitados a Sheets y activadores de ese proyecto.
El propietario autorizó continuar con ese consentimiento. En la primera pasada,
el control de computadora se detuvo al no poder verificar la URL de Chrome. Al
retomar se encontró la ventana de Google, que requiere verificación del dispositivo
por el propietario antes de conceder los permisos de Sheets y activadores.

**La medición real del renombrado sigue pendiente. No hay un tiempo de Sheets
medido para informar.** Tampoco quedó confirmada una ejecución real del activador
privado. Ambas esperan esa verificación personal. No se confunden las pruebas VM
con esas dos comprobaciones de Google; el ensayo de hash ya quedó completo.

`scripts/apps-script-ensayo/EnsayoCategoria.gs` deja preparado el recorrido:
agrega 120 productos ficticios en borrador y una categoría exclusiva en la copia,
ejecuta la API de renombrado y verifica 120 eventos confirmados. Cuenta las 120
escrituras de productos, 240 de historial (pendiente/confirmado) y una de categoría.
Mide la operación real, excluyendo la preparación de datos y lectura posterior.
Rechaza hojas sin el nombre/bandera de ensayo y copias con stock pendiente.

La prueba automatizada local confirma ese recorrido y que no cambia productos
previos. Su tiempo de VM **no representa** el rendimiento de Sheets. Los pasos
para completar la medición real y verificar el activador están en
[la guía de instalación](CATALOGO_ROLES_INSTALACION.md).
