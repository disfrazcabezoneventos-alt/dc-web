# Validación de roles del catálogo — 2026-11-01

Estado: propuesta DRAFT. No se fusionó, desplegó ni modificó producción.
La conciliación del backend y la instalación se describen en
[Etapa 0](CATALOGO_ROLES_ETAPA_0.md) y
[guía de instalación](CATALOGO_ROLES_INSTALACION.md).

Resultado original: **274/274 pruebas unitarias** y **64/64 pruebas Playwright**
en la regresión conjunta. La revisión posterior agrega pruebas de costo de hash,
wrappers temporales y benchmark; su resultado y las mediciones de Google figuran
en [Revisión PR32](CATALOGO_ROLES_REVISION_PR32.md). `npm ci` y build estático
completados sin errores.

La corrección posterior de categorías por lotes pasa **289/289 unitarias y 22/22
Playwright**, con build limpio. Los tiempos reales de renombrado de 120/441 y
borrado de 120, todos inferiores a 60 s, y la restauración de la copia se detallan
en [Categorías por lotes](CATALOGO_CATEGORIAS_LOTES_PR32.md).

## Cobertura

- Autorización del servidor por rol y acción, antes de módulos y mantenimiento.
  Solicitudes directas prohibidas se rechazan sin escrituras en tablas o propiedades.
- Editor: editar campos permitidos, subir/reemplazar foto, cambiar únicamente
  `active` por quickUpdate, crear borradores en ambas áreas. Stock, publicación,
  borrado, categorías y módulos privados se rechazan.
- Admin: permisos previos, cuentas individuales, publicación, recuperación del
  historial y restauración de foto. Los tests anteriores de formularios locales,
  formularios web, caja y constancias siguen incluidos.
- PBKDF2 contrastado con `crypto.pbkdf2Sync` de Node, sal individual, mínimo de
  contraseña, límite por usuario y revocación por reset/desactivación/credenciales.
- H001 con lista múltiple, cambio de principal y lista omitida; H002 con
  descripción vacía u omitida. No se pierden campos heredados desconocidos.
- Historial antes/después, activación, desactivación, publicación, fotos,
  paginación y recuperación de interrupciones antes y después de escribir producto.
- Reutilizar un identificador de operación no puede sobrescribir un producto
  existente; repetir una creación propia confirmada no duplica producto ni historial.
- Las funciones manuales y de importación son privadas para `google.script.run`.
  Se revisan sus declaraciones y se prueba la migración idempotente de los
  disparadores conocidos sin ejecutar sus trabajos ni tocar productos.
- Borradores excluidos de las dos API públicas, de la selección de alquiler y de
  la tienda. Cotillón publicado desactivado conserva su comportamiento de agotado.
- Playwright con ambos roles, escritorio y celular de 390 px; edición, foto,
  cuentas, publicación y restauración. Capturas con datos ficticios, sin claves,
  guardadas en evidencia privada y excluidas del repositorio público.

## Ensayo sobre copia privada de Sheets

Se creó una copia completa con otro ID, se verificó `shared=false` y permisos de
propietario únicamente. El ID, enlace y los datos de origen no se publican aquí.

1. Se leyeron categorías e identificadores de la copia y se eligieron filas libres.
2. Se agregaron dos productos sintéticos de base, uno por área, sin sobrescribir
   productos existentes; se leyeron nuevamente desde Sheets.
3. El backend real de esta rama ejecutó el recorrido en una VM de Node con los
   servicios de Apps Script adaptados y las filas leídas. Se probaron cambios,
   categorías, descripción, estados, foto/restauración, borradores y publicación.
4. Se persistió el resultado exclusivamente en las filas sintéticas de la copia
   y en su nueva pestaña `historial_cambios`.
5. La lectura posterior coincidió exactamente: **4 productos ficticios, 14 eventos
   confirmados y 9 acciones prohibidas rechazadas**. Ninguna escritura apuntó a
   identificadores o rangos de productos originales. Se verificaron también las
   filas iniciales de ambos catálogos.

`scripts/test-catalog-copy.mjs` reproduce el paso de VM con entradas privadas
leídas de la copia y valida que los productos de base sean sintéticos. No hace
llamadas de red ni escribe hojas: las escrituras se hicieron mediante el conector
después de verificar el destino. Los archivos de entrada/salida no están en Git.

## Reproducir pruebas sin producción

Con Node compatible y Chrome instalado:

```powershell
npm ci
npm test
node scripts/generate-auth-crypto.mjs
$env:NEXT_PUBLIC_APPS_SCRIPT_URL='https://script.google.com/macros/s/mock/exec'
npm run build
npx playwright test --config playwright.static.config.mjs tests/e2e/catalog-roles.spec.mjs tests/e2e/admin-quick-edit.spec.mjs tests/e2e/local-forms.spec.mjs tests/e2e/local-receipts.spec.mjs tests/e2e/cart.spec.mjs --project desktop --project mobile-390
Remove-Item Env:NEXT_PUBLIC_APPS_SCRIPT_URL
```

El build de este comando tiene endpoint simulado: **no publicarlo en Render**.
La configuración estática sirve `out/` solo en loopback y devuelve `404.html` en
rutas inexistentes. No requiere un servidor Next de producción ni un Apps Script
de ensayo desplegado. El servidor y los mocks no se incluyen en `out/`.

## Límites y riesgos pendientes antes de autorizar producción

- La copia del Code.gs desplegado fue suministrada por el propietario. Coincide
  con main normalizando saltos/BOM; no se inspeccionó de forma independiente el
  editor de Apps Script ni se afirmó cuál versión está activa en Google.
- No se desplegó ni recorrió la API de la aplicación en Google Apps Script.
  VM + persistencia de Sheets no sustituyen ese ensayo de extremo a extremo.
  La revisión posterior sí mide PBKDF2 y ejecuta `dispatch_` contra Sheets en el
  runtime de Google, sin endpoint desplegado. El benchmark real de 120 productos
  **falló por tiempo máximo** a los 360,707 s totales: 91 productos actualizados,
  91 eventos confirmados y 29 productos sin actualizar. Es un impedimento para
  instalar que se corrigió posteriormente en la misma rama. Las nuevas mediciones
  y la reanudación de las 29 fichas están en
  [Categorías por lotes](CATALOGO_CATEGORIAS_LOTES_PR32.md).
  Sigue pendiente el recorrido por `/exec`. Ver también Revisión PR32.
- El activador privado real `verificarActivadorPrivado_` terminó correctamente
  en Google (2,906 s), con su registro y marca de fecha comprobados. No se
  ejecutaron importadores ni se modificaron activadores de producción.
- Cloudinary y correo se simularon. No se subieron fotos reales ni enviaron
  notificaciones. Los documentos y clientes de producción no se usaron en tests.
- La copia es privada del propietario conectado al conector. La cuenta distinta
  abierta en el navegador no pudo verla; no se amplió el acceso. La verificación
  de Sheets fue por API y lectura posterior, sin captura de su interfaz nativa.
  Para la revisión posterior se creó otra copia privada en la cuenta del local y
  se autorizó un proyecto de ensayo separado; los enlaces siguen fuera de GitHub.
- El bloqueo de Apps Script serializa escrituras y login; medir la carga real.
  CacheService puede expirar antes sus entradas; en ese caso se requiere ingresar
  de nuevo. El límite de intentos es el de esa caché, no un firewall permanente.
- El historial aumenta de tamaño con cada cambio y conserva valores anteriores.
  Restringir la hoja y respaldarla; el propietario de Google puede editarla.
- Al migrar se retira la contraseña de Admin en texto plano. Volver a versiones
  antiguas requiere coordinación privada y puede exponer borradores si el backend
  antiguo no los filtra. Seguir las precauciones de la guía.
- No se puede probar accesibilidad desde los tres dominios reales sin desplegar.
  Sí se verificó la lista de orígenes exactos y rechazo de dominios parecidos.
