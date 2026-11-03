# Instalación futura de promociones de alquiler

Esta es una guía para después de aprobar el draft. No se ejecutó este despliegue. #35 y #36 ya están en main; conservar su registro de búsquedas al actualizar Apps Script.

## 1. Revisar antes de publicar

1. La hoja real ya fue corregida con autorización: 61 fichas únicas, respaldo `disfraces_respaldo_promos_20261103`, 61 entradas de historial y auditoría final con cero diferencias entre los 443 alquileres. No repetir la corrección ni ejecutar importadores.
2. Revisar las condiciones `DC-2026-11-03.2` / `DC-LOCAL-2026-11-03.2`, el contrato de cinco páginas y los ensayos del PR. Zenon y Maui permanecen inactivos.
3. Guardar una copia privada del proyecto Apps Script, sus archivos actuales y propiedades, y anotar la versión activa (22 al preparar esta guía). Las credenciales deben permanecer privadas. Hacer copia del Google Sheet antes de una prueba real; mantener `MAIL_MODE=disabled` y usar adjuntos ficticios en esa copia.

## 2. Probar en una copia aislada

1. Usar una copia del proyecto Apps Script y del Sheet, verificando que su `SPREADSHEET_ID` NO sea el de producción. Usar una carpeta de Drive de prueba y un origen frontend de prueba; no transmitir documentos reales.
2. En la copia, reemplazar completos los archivos de la tabla siguiente. Crear los dos nuevos archivos `.gs` una sola vez. Los nombres del editor pueden ser `Código` o `Code`; conservar el archivo que ya contiene `doGet`/`doPost` y no crear un segundo dispatcher.

| Archivo del repositorio | Archivo de Apps Script | Operación |
| --- | --- | --- |
| `backend/Code.gs` | `Código.gs` existente | Reemplazar contenido completo |
| `backend/CatalogAccess.gs` | `CatalogAccess.gs` | Reemplazar contenido completo, conservar acciones de #36 |
| `backend/Validation.gs` | `Validation.gs` | Reemplazar contenido generado completo |
| `backend/LocalForms.gs` | `LocalForms.gs` | Reemplazar contenido completo |
| `backend/LocalReceipts.gs` | `LocalReceipts.gs` | Reemplazar contenido completo |
| `backend/RentalPricing.gs` | `RentalPricing.gs` | Crear como archivo de secuencia de comandos |
| `backend/RentalPromotions.gs` | `RentalPromotions.gs` | Crear como archivo de secuencia de comandos |

3. Guardar; esperar a que desaparezca “Guardando…”. Comprobar que no haya duplicados de funciones ni archivos. No cambiar `AuthCrypto.gs`, `appsscript.json`, archivos del importador ni ejecutar importadores o preparación de catálogo/roles.
4. Crear temporalmente un archivo de secuencia de comandos llamado **MantenimientoTemporal** y pegar:

   ```javascript
   function ejecutarPrepararPromociones() {
     console.log(JSON.stringify(prepararPromocionesAlquiler_()));
   }
   ```

   En el selector de funciones, elegir **ejecutarPrepararPromociones**, pulsar **Ejecutar** y autorizar únicamente el proyecto de copia. Revisar el registro de ejecución: precios 60000/75000 y ambas promociones activas. El wrapper permite ejecutar la función privada terminada en guion bajo desde el editor. Borrar **MantenimientoTemporal** y guardar antes de desplegar cualquier versión. La preparación precarga la propiedad `RENTAL_PROMOTIONS_V1` con las dos promos activas. Repetir no reactiva una promoción apagada. No cambia productos, reservas ni caja.
5. Probar web y local: 2 adultos → 1 pagado; 3 cabezones → 2 pagados; 1 adulto + 1 cabezón sin descuento; seña del 50% del total; garantía completa. Verificar guardar/reintentar sin duplicar la reserva, correo solo de prueba, constancia y límite de cobros. Caso mixto: 3 adultos + 2 cabezones → alquiler 270000, seña 135000 y garantía 380000.
6. En la copia, comprobar Usuarios e historial → expandir una corrección → Deshacer corrección de alquiler; verificar antes/después, stock y campos ajenos conservados, nueva entrada de reversión y rechazo si el campo cambió después. No probar esta reversión en la hoja real.
7. Desde admin apagar una promo y comprobar una reserva nueva; la anterior conserva su cálculo. Desde Editor comprobar rechazo del guardado de promociones. Probar un formulario web anterior con monto manual: se guarda el total recalculado y `declaredTotal` informativo.

Propiedad nueva: **`RENTAL_PROMOTIONS_V1`**, creada por la preparación anterior. No pegar valores manuales ni cambiar `SPREADSHEET_ID`, credenciales, carpetas, `LOCAL_FORMS_ENABLED`, `SITE_URL` o `EXTRA_SITE_URLS`. Mantener **`SEARCH_MISS_LOG_ENABLED=yes`**.

## 3. Actualizar la implementación de producción, después del OK

1. Abrir el proyecto **web-dc** que ya usa el sitio. Confirmar que la copia probada y los archivos aprobados corresponden al commit final del PR, no a una rama vieja de #36.
2. Respaldar de nuevo la versión y configuración vigentes. Reemplazar/crear exactamente los siete archivos anteriores. Guardar y recargar para comprobar que el contenido persistió.
3. Repetir el wrapper temporal del paso 2.4 en el proyecto autorizado, ejecutar una sola vez, revisar el registro y borrar el archivo temporal antes de implementar. Confirmar `LOCAL_PRICE_ADULTO=60000` y `LOCAL_PRICE_CABEZON=75000`; conservar `SITE_URL`, `EXTRA_SITE_URLS`, `SEARCH_MISS_LOG_ENABLED=yes` y las demás propiedades existentes. No modificar claves, accesos ni URL de implementación.
4. Pulsar **Implementar → Administrar implementaciones → seleccionar la app web activa → lápiz**.
5. En **Versión**, elegir **Nueva versión**; descripción sugerida: `Promociones alquiler 2x1 adultos y 3x2 cabezones`. Conservar “Ejecutar como” y “Usuarios con acceso”. Pulsar **Implementar** y anotar número de versión.
6. Confirmar que el ID y la URL `/exec` sean los mismos. Google documenta que actualizar la versión de una implementación existente conserva su URL: [gestión de implementaciones](https://developers.google.com/apps-script/concepts/deployments#edit_a_versioned_deployment).

El backend empieza a aplicar la configuración vigente en reservas nuevas desde este paso, incluso si un visitante aún tiene el formulario anterior. Su monto declarado se conserva como información y el pago sigue requiriendo revisión del local. No cambia reservas históricas.

## 4. Publicar frontend después del backend

1. Verificar lecturas de catálogo y configuración, sin crear reservas ficticias en producción. Las pruebas con envíos se hacen en la copia.
2. Pasar el PR aprobado a Ready for review y fusionar con merge normal a main. Esperar Render Live y confirmar el commit publicado.
3. Abrir Inicio, Disfraces, `/reservas/`, `/reserva-local/` y admin en celular y escritorio. Revisar cartel, etiquetas, precio automático, seña y garantía. No subir documentos ni enviar una reserva real como prueba.
4. Comprobar que “Lo que buscan y no tenemos” y el catálogo sigan operativos. No hace falta cambiar la variable de URL de Apps Script en Render.

## Revertir o pausar

Para pausar una promoción en reservas nuevas, apagar su interruptor en admin; no recalcula reservas recibidas. Para deshacer una instalación técnica, anotar primero el problema y pedir autorización: no hacer rollback automático. Cualquier eventual reversión debe tratar backend y frontend como un conjunto; volver al backend anterior mientras el frontend nuevo espera `rentalConfig` puede impedir completar el formulario. No borrar `pricingSnapshot`, reservas ni movimientos.
