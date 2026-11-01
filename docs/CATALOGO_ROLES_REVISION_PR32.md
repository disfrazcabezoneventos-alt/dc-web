# Revisión previa a instalar — PR #32

La revisión continúa en la misma rama y en DRAFT. No se fusionó ni desplegó nada;
no se cambió el proyecto de Apps Script ni la hoja de producción.

Validación de esta revisión: **278/278 pruebas unitarias, 6/6 Playwright de ambos
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

Son muestras individuales, no garantías de latencia. El primer valor supera el
umbral de 4 segundos solicitado: **se propone 210.000 para cuentas nuevas y los
próximos resets**, previa aprobación. La constante de esta rama sigue en 600.000.
Cambiarla más adelante no invalida los hashes existentes porque se verifica el
costo de cada registro. No hay migración masiva ni se reescriben contraseñas.
Las capturas y los enlaces privados del ensayo se entregan fuera del repositorio.

## Renombrado de categoría con 120 productos

Se preparó una segunda copia privada en la cuenta del local y un proyecto de
ensayo con permisos solicitados limitados a Sheets y activadores de ese proyecto.
El propietario autorizó continuar con ese consentimiento. Antes de completarlo,
el control de computadora se detuvo al no poder verificar la URL de Chrome.

**La medición real del renombrado sigue pendiente. No hay un tiempo de Sheets
medido para informar.** Tampoco quedó confirmada una ejecución real del activador
privado. No se confunden las pruebas VM con esas dos comprobaciones de Google.

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
