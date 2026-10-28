# Disfraz Cabezón: de la carpeta a tu web funcionando

Esta guía está pensada para hacer los pasos de a uno. El proyecto está en `C:\Users\Usuario\OneDrive\Documentos\dc-web`.

## 1. Qué hace cada parte

Imaginá el negocio como un local:

| Parte | Para qué sirve |
|---|---|
| Next.js + Render Static Site | La vidriera: páginas, catálogo, formulario y panel |
| Apps Script | La persona detrás del mostrador: valida y guarda cada operación |
| Google Sheets | El registro: productos, reservas, caja y avisos |
| Cloudinary | El álbum de fotos públicas de los productos |
| Carpeta privada de Google Drive | DNI, comprobantes y firmas de las reservas |

El sitio **sí es estático**. Render no necesita ejecutar un servidor de Next.js. Las operaciones se envían desde el navegador a Apps Script mediante un formulario invisible; Apps Script devuelve la respuesta a la página. Este mecanismo evita el bloqueo CORS que produciría `fetch` desde Render.

## 2. Mirar el diseño antes de conectar nada

Abrí una terminal en la carpeta del proyecto. Necesitás Node.js 22.13 o posterior.

```powershell
npm ci
npm run dev
```

Abrí `http://127.0.0.1:3000`. Dejá la terminal abierta mientras lo usás. Para detenerlo, presioná `Ctrl+C`.

Sin la URL de Apps Script, aparecen productos de ejemplo, sus precios están marcados como demostración, el formulario permite recorrer los cinco pasos sin enviar y `/admin/` ofrece un botón para explorar el panel. No hay reservas ni ingresos inventados en Sheets.

## 3. Crear el nuevo Apps Script

**Usá un proyecto nuevo de Apps Script para esta versión.** Tu script anterior es un receptor de avisos firmado por el servidor de Cloudflare. Este nuevo script también administra catálogo, documentos y reservas: su API es diferente. No pegues ambos `doPost` en el mismo proyecto ni reemplaces el servicio antiguo mientras la web anterior lo usa. El registro anterior de notificaciones queda intacto.

1. Entrá a [Google Apps Script](https://script.google.com/) con la cuenta del negocio.
2. Elegí **Nuevo proyecto**. Nombre sugerido: `Disfraz Cabezón — tienda nueva`.
3. Abrí el archivo `Código.gs` o `Code.gs` que aparece inicialmente. Borrá la función de ejemplo y pegá TODO el contenido de `backend/Code.gs` de esta carpeta.
4. Al lado de **Archivos**, tocá **+ → Secuencia de comandos**. Llamalo `Validation` y pegá TODO `backend/Validation.gs`. Son necesarios **los dos archivos**.
5. En **Configuración del proyecto**, activá la opción que muestra `appsscript.json` en el editor.
6. Volvé al editor, abrí `appsscript.json` y reemplazá su contenido con el archivo del mismo nombre que está en `backend/`.
7. Guardá. En el selector de funciones de arriba, elegí `prepararConfiguracion`. Tocá **Ejecutar**.
8. Google te pedirá autorizar el uso de tus hojas, Drive y correo. Comprobá que estás autorizando tu propio proyecto y tu cuenta del negocio. Si la cuenta de tu organización bloquea estas autorizaciones, su administrador tiene que habilitarlas.
9. Al terminar, buscá en Drive una hoja llamada **Disfraz Cabezón — tienda y reservas** y una carpeta llamada **Disfraz Cabezón — documentación privada**.

La función crea la hoja y sus pestañas automáticamente. Si la ejecutás otra vez, conserva la configuración existente.

### Las propiedades: el equivalente del `.env` en Apps Script

Apps Script no usa un archivo `.env` normal. Entrá en **Configuración del proyecto → Propiedades de la secuencia de comandos → Editar propiedades**.

La primera ejecución ya crea estas propiedades:

| Propiedad | Qué hacer |
|---|---|
| `ADMIN_USER` | Se crea como `admin`. Podés cambiarlo. |
| `ADMIN_PASSWORD` | Se genera una contraseña aleatoria privada. Copiala para iniciar sesión o reemplazala por una de al menos 12 caracteres. |
| `SPREADSHEET_ID` | Identifica la hoja recién creada. Dejala como está. |
| `PRIVATE_FOLDER_ID` | Identifica la carpeta privada. Dejala como está. |
| `MAIL_MODE` | Empieza en `test`. Dejalo así durante las pruebas. |
| `BUSINESS_EMAIL` | Empieza en `disfrazcabezoneventos@gmail.com`. Verificá que sea correcto. |

Agregá **`SITE_URL`** con la dirección pública final del sitio, por ejemplo `https://tienda.disfrazcabezon.com.ar`, sin `/` al final. Es necesaria para que Apps Script entregue sus respuestas solamente a tu web y para incluir el enlace de administración en el aviso al negocio. Si cambiás de dominio, actualizá esta propiedad una vez que el dominio nuevo funcione.

El usuario y la contraseña se comprueban **en Apps Script**. Nunca los pongas en variables `NEXT_PUBLIC_`, en el código React ni en GitHub. Una sesión dura hasta seis horas y se cierra antes si Google descarta su caché. El panel permite cerrar sesión manualmente.

**La hoja y la carpeta deben permanecer restringidas en Drive.** Publicar la aplicación web no implica compartir estos archivos: el código da acceso a cada solicitud mediante su clave privada y al equipo mediante su sesión.

## 4. Conectar Cloudinary para las fotos

1. Creá o abrí tu cuenta en [Cloudinary](https://cloudinary.com/).
2. En la consola, buscá el nombre del entorno de producto, llamado **Cloud name**, y la sección **API Keys**.
3. Copiá los tres valores a las propiedades privadas de Apps Script:

| Propiedad | Valor |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Tu Cloud name |
| `CLOUDINARY_API_KEY` | Tu API Key |
| `CLOUDINARY_API_SECRET` | Tu API Secret |

4. Guardá las propiedades.

No necesitás crear un preset de subida sin firma. El panel envía la imagen a Apps Script; Apps Script firma la subida y la envía a Cloudinary. La clave secreta queda del lado de Google. Las imágenes del catálogo se guardan bajo `disfraz-cabezon/catalogo`. Al subir una foto, Cloudinary crea también una miniatura de hasta 160 × 160 píxeles para las listas del panel, las tarjetas del catálogo y el formulario de alquiler. Las fotos antiguas se muestran mediante una versión pequeña generada a partir de su URL, sin necesidad de volver a subirlas.

Al editar un producto, podés **subir JPG, PNG o WEBP de hasta 8 MB** o pegar la URL HTTPS de una imagen ya alojada en Cloudinary. Comprimir fotos a 300–800 KB hace que el catálogo cargue más rápido.

Eliminar un producto elimina su registro del catálogo. Su imagen queda en Cloudinary por si se usa en otro producto; podés limpiar imágenes sin uso desde la biblioteca de Cloudinary. Los documentos de clientes nunca se suben al álbum público.

## 5. Publicar Apps Script como aplicación web

1. Arriba a la derecha elegí **Implementar → Nueva implementación**.
2. En el engranaje, elegí **Aplicación web**.
3. Descripción: `Tienda y reservas v1`.
4. **Ejecutar como:** vos, la cuenta propietaria del proyecto.
5. **Quién tiene acceso:** **Cualquier persona**. Es necesario para que un cliente pueda completar una reserva sin iniciar sesión en Google. Los datos privados siguen protegidos por el código.
6. Tocá **Implementar** y copiá la URL de aplicación web. Debe terminar en **`/exec`**, no en `/dev`.
7. Abrila en una ventana privada. Debe mostrar un pequeño JSON con `ok: true` y `Disfraz Cabezón`. Si pide iniciar sesión, revisá la opción de acceso.

Cuando cambies el código `.gs`, no alcanza con guardarlo: **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. Al editar la implementación existente conservás la misma URL. Si el sitio muestra «no se pudo conectar» después de publicar, comprobá que hayas copiado la versión nueva de `Code.gs`, que `SITE_URL` sea exactamente el origen de tu sitio y que Render haya compilado la versión nueva de `lib/api.ts`.

### Actualización de la instalación actual

Usá el proyecto Apps Script **web-dc**, cuya implementación existente tiene la misma URL `/exec` guardada en Render. En ese proyecto, reemplazá por completo **Code.gs** con el archivo [`backend/Code.gs`](backend/Code.gs) de este repositorio y guardá. Conservá `Validation.gs`, las propiedades del proyecto, la hoja y la carpeta de Drive. Después entrá a **Implementar → Administrar implementaciones**, elegí la aplicación web cuya URL coincide con `NEXT_PUBLIC_APPS_SCRIPT_URL` de Render, tocá el lápiz, seleccioná **Nueva versión** y finalmente **Implementar**. No crees otra implementación: la URL debe seguir siendo la misma.

Abrí esa URL `/exec` en el navegador. La actualización del carrito y la migración de cotillón se reconoce porque la respuesta contiene **`"version":4`**. Si todavía dice `2` o `3`, la implementación pública sigue usando una versión anterior; revisá que hayas editado la implementación correcta y seleccionado **Nueva versión**.

### Pasar las ocho secciones de cotillón del sitio anterior

El archivo [`backend/import-cotillon.json`](backend/import-cotillon.json) contiene una copia de **635 productos públicos** tomada del catálogo anterior. Incluye únicamente Repostería, Halloween, Accesorios disfraz, Golosinas, Fiestas patrias, Comunión y bautismo, Navidad y Egresados. Un producto que pertenece a dos secciones se guarda una sola vez y aparece en ambas.

1. Esperá a que Render termine el despliegue del código nuevo de GitHub. No cambies ninguna variable `.env` de Render para esta migración.
2. En el proyecto Apps Script **web-dc**, reemplazá el contenido de `Code.gs` por la versión nueva del archivo [`backend/Code.gs`](backend/Code.gs). Reemplazá también `appsscript.json` por [`backend/appsscript.json`](backend/appsscript.json): agrega el permiso de Apps Script para crear y quitar el activador de fotos. **No borres `Validation.gs` ni cambies `SPREADSHEET_ID`.** Guardá.
3. En **Implementar → Administrar implementaciones**, editá la implementación cuya URL `/exec` coincide con la de Render, elegí **Nueva versión** e implementá. La URL queda igual.
4. Abrí esa misma URL `/exec`. Comprobá que dice **`"version":4`**.
5. Volvé al editor de Apps Script. Arriba, en el selector de funciones, elegí **`importarCotillonAnterior`** y tocá **Ejecutar**. Si Google solicita autorización para leer una URL pública y escribir en tu hoja, completá la autorización. La función agrega categorías y productos en `categorias_cotillon` y `cotillon`.
6. En **Registro de ejecución**, buscá `agregados: 635` y `categorias: 8`. Si la repetís, debe decir `agregados: 0`: no duplica productos ni pisa cambios que hiciste en el panel.
7. Entrá a `/cotillon/` en Render y actualizá la página. Probá agregar dos productos, cambiar cantidades y abrir **Enviar pedido por WhatsApp**. El chat debe abrirse con el pedido completo **ya escrito**; el cliente solo presiona **Enviar**.

El catálogo anterior no informa stock de **598** de esos productos ni precio de **132**. La nueva web los muestra como **“disponibilidad a confirmar”** o **“precio a consultar”**. El cliente puede agregarlos al carrito para pedir una cotización, sin que el sistema invente existencias o importes. En `/admin/`, podés completar stock y precio producto por producto. Hay **298 productos sin foto de origen**; se muestran con el aviso “Foto próximamente” hasta que cargues una imagen.

Las categorías antiguas que ya existían en tu nueva hoja se **conservan en el administrador**, pero la migración las marca **ocultas en la tienda** para que el público vea solo las ocho secciones pedidas. Por ejemplo, el producto ya cargado “Espuma” no se borra: podés abrirlo en `/admin/`, asignarlo a una de las ocho categorías y volverá a verse en la tienda. Cada categoría de cotillón tiene un control **“Mostrar en la tienda”** para cambiar esto más adelante.

#### Pasar las fotos disponibles a Cloudinary

Hay **337 fotos de origen** para migrar. Las tres propiedades `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` deben estar en **Propiedades de la secuencia de comandos** de Apps Script, no en Render.

1. Después de importar los productos, elegí **`iniciarFotosCotillon`** en Apps Script y tocá **Ejecutar** una sola vez. Google puede pedirte autorizar el nuevo permiso para administrar activadores de este mismo proyecto.
2. La primera ejecución procesa hasta diez fotos y crea un activador que continúa con otros lotes cada cinco minutos. Las fotos se suben a Cloudinary con su miniatura de 160 × 160 px; puede tardar unas horas en completar todo.
3. Mirá **Ejecuciones** en Apps Script para controlar `procesadas`, `fallidas` y `pendientes`. Cuando `pendientes` llega a cero, el activador se elimina solo.
4. Si hubo fallas, revisá las claves y la cuenta de Cloudinary. Ejecutá **`reintentarFotosCotillon`** y después **`iniciarFotosCotillon`**. Los productos que no tenían foto en la web anterior requieren subir una desde `/admin/`.

Si el sitio ya está publicado y solo estás instalando las miniaturas, seguí los pasos cortos de [`ACTUALIZACION_MINIATURAS.md`](ACTUALIZACION_MINIATURAS.md). No necesitás nuevas propiedades ni pestañas en Sheets.

## 6. El `.env` del proyecto Next.js

En la raíz de `dc-web`, copiá `.env.example` como `.env.local`. Su contenido es una sola variable:

```dotenv
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_IMPLEMENTACION/exec
```

Reemplazá la URL de ejemplo por la real. Reiniciá `npm run dev` después de guardar.

**No tenés que copiar el `.env` del proyecto viejo.** `RESEND_API_KEY` y `MAIL_FROM` no se usan: los avisos salen con MailApp en Apps Script. `WEBHOOK_SECRET` y `LEDGER_SPREADSHEET_ID` pertenecen al script anterior; no se copian al navegador ni a esta nueva configuración.

Cuando existe esta URL, el catálogo consulta Sheets. Si la hoja está vacía, se ve un catálogo vacío. Si hay un error de conexión, se informa el error: no se disfraza mostrando los productos de ejemplo.

## 7. Entrar como administrador y cargar productos

Si ya tenías el sitio funcionando y querés instalar el editor de categorías, seguí primero la guía corta [`ACTUALIZACION_CATEGORIAS.md`](ACTUALIZACION_CATEGORIAS.md). Ejecutá `prepararCategorias` una vez antes de publicar la nueva versión de Apps Script.

Para instalar la condición de venta, el aviso de disfraces a pedido y el botón de clonar, seguí [`ACTUALIZACION_VENTA_DISFRACES.md`](ACTUALIZACION_VENTA_DISFRACES.md). Esta actualización no necesita pestañas nuevas ni migración de datos.

1. Abrí `/admin/` desde el enlace **Acceso administrador** al pie de la web.
2. Ingresá el `ADMIN_USER` y el `ADMIN_PASSWORD` que están en Apps Script.
3. Entrá a **Disfraces** o **Cotillón**. Son catálogos independientes y se guardan en pestañas separadas.
4. Tocá **Agregar producto**.
5. Completá nombre, categoría, descripción, modalidad, precio y stock. En Disfraces podés elegir venta, alquiler o ambos. Cotillón es venta.
6. Subí la foto. Esperá a que aparezca la vista previa.
7. Guardá el producto. Revisalo en la página pública correspondiente.

**Editar** modifica el registro existente. **Visible en el catálogo** permite ocultarlo sin borrarlo. **Eliminar** pide confirmar y lo quita de Sheets. Si no estás seguro, ocultalo primero.

Los precios de venta y alquiler son distintos. Cotillón tiene un carrito de consultas: reúne productos y cantidades y abre WhatsApp con el pedido escrito. No hay cobro automático con tarjeta. El total de cada alquiler se acuerda por WhatsApp, como en el formulario original.

## 8. Habilitar las reservas

1. En administración, abrí **Datos de cobro**.
2. Completá titular, banco, CUIT y alias o CBU/CVU. El CBU/CVU debe tener 22 dígitos.
3. Guardá. Sin cuenta de cobro, el formulario real no permite completar el envío.
4. El cliente acuerda disponibilidad, talle, fechas y precio con el negocio por WhatsApp.
5. Completa los cinco pasos: datos, alquiler, documentos, comprobante de pago y firma.
6. El envío crea una **solicitud pendiente**, no una confirmación automática.
7. El cliente debe guardar el enlace privado que aparece al terminar. Desde ahí puede ver el estado, descargar el contrato y enviar correcciones si se las pedís.
8. En **Reservas**, revisá los documentos, comprobá el pago y la disponibilidad. Después elegí el nuevo estado y escribí una nota.
9. Avisale al cliente por WhatsApp. El sistema manda avisos iniciales de recepción por correo; no manda mensajes automáticos de WhatsApp ni avisos de todos los cambios de estado.

Las fotos de DNI, comprobantes y firma se guardan en la carpeta privada de Drive. El contrato se genera al descargarlo con los datos originales, la firma y las condiciones guardadas. Los correos no llevan adjuntos ni enlaces privados.

La corrección documental conserva un plazo inicial de 12 horas. Los reintegros pendientes conservan un plazo inicial de 24 horas. Cambiar un estado no verifica una transferencia ni devuelve dinero: son tareas que realizás y registrás vos.

La disponibilidad de los trajes se confirma manualmente. Este sistema no es un calendario de bloqueo automático por traje, talle y fecha. El stock de alquiler sirve como inventario; no se descuenta cuando llega una solicitud pendiente.

## 9. Registrar caja y entender las estadísticas

Los números salen de **Caja**, no de lo que un cliente escribió en un formulario.

Ejemplo: alquiler de $40.000. Hoy recibís $20.000 de seña y al retirar recibís $20.000 de saldo.

1. Confirmá la reserva cuando corresponda, después de revisar el pago.
2. En **Caja**, elegí **Cobro de alquiler**, área **Disfraces**, y la reserva asociada.
3. Registrá $20.000, con la fecha en que efectivamente los cobraste y el detalle `Seña`.
4. Para registrar el saldo, tocá **Nuevo movimiento** y cargá el segundo cobro con su fecha real.
5. Si hubo un costo de limpieza de $3.000, cargalo una sola vez en el costo de una de las operaciones. No lo repitas en la seña y en el saldo.

Una venta inmediata permite elegir el producto y la cantidad, y descuenta stock. Una venta de un disfraz **Nuevo a pedido** respeta el límite por consulta, pero no descuenta stock físico; al anularla tampoco repone stock. Un cobro de alquiler no puede superar el total acordado sumando los cobros anteriores. Los gastos y reintegros son salidas de dinero. Una anulación conserva el movimiento como anulado.

Si se corta la conexión, podés repetir **Registrar movimiento** sin duplicarlo mientras conserves el mismo formulario. Para una operación distinta, tocá **Nuevo movimiento**. Revisá la lista antes de volver a cargar un cobro tras cerrar o recargar la página.

En **Estadísticas** podés elegir hoy, esta semana desde el lunes o este mes. Se muestran productos, unidades, ingresos, ganancia estimada, alquileres confirmados y sus cobros/ganancia. Los costos generales se descuentan en la ganancia global. La ganancia de alquileres descuenta los costos vinculados a sus cobros y los reintegros vinculados a una reserva.

No registres depósitos de garantía como ventas o ganancia. No hay contabilidad impositiva ni conciliación bancaria automática. Para que la estimación sea útil, registrá todos los cobros y costos reales.

## 10. Publicar en Render como Static Site

1. Subí el código a un repositorio privado de GitHub. Incluí `package-lock.json`, `app`, `components`, `lib`, `public`, `backend`, `scripts` y los archivos de configuración.
2. No subas `.env.local`, `node_modules`, `.next`, `out`, documentos de clientes ni secretos. El `.gitignore` ya excluye los archivos locales habituales.
3. En [Render](https://dashboard.render.com/), elegí **New → Static Site**.
4. Conectá el repositorio.
5. Si el proyecto está en la raíz del repositorio, dejá **Root Directory** vacío.
6. **Build Command:** `npm ci && npm run build`.
7. **Publish Directory:** `out`.
8. En **Environment**, agregá `NEXT_PUBLIC_APPS_SCRIPT_URL` con tu URL `/exec`.
9. Elegí **Create Static Site** y esperá el resultado.
10. Abrí la URL que entrega Render. Ponela también en `SITE_URL` de Apps Script.

No hay comando de inicio para este despliegue. `next.config.ts` ya contiene `output: 'export'` y `trailingSlash: true`. También se incluye `render.yaml` para quien prefiera usar un Blueprint.

Si cambiás `NEXT_PUBLIC_APPS_SCRIPT_URL` en Render, ejecutá un nuevo deploy: Next.js incluye esa variable al compilar. Cambiar productos en Sheets desde el panel no requiere volver a desplegar.

Para usar `https://tienda.disfrazcabezon.com.ar`, primero agregá en el DNS un CNAME con nombre `tienda` y destino `dc-web-8ai4.onrender.com`. En Render, agregá ese dominio a **Settings → Custom Domains** y esperá la verificación del certificado. Recién cuando abra con HTTPS, agregá en Render `NEXT_PUBLIC_SITE_URL=https://tienda.disfrazcabezon.com.ar` y ejecutá un nuevo deploy. Por último, cambiá la propiedad `SITE_URL` del proyecto Apps Script `web-dc` al mismo valor, sin `/` final. No cambies los registros de `www`, el dominio raíz ni el correo.

No agregues una regla general que redirija todas las rutas a `index.html`: cada página ya tiene su propio archivo. Para conectar tu dominio, usá la sección **Custom Domains** y los registros DNS que Render te indique para ese dominio concreto.

## 11. Prueba final antes de recibir clientes

Dejá `MAIL_MODE=test`. Las dos notificaciones se dirigen al correo del negocio con `[PRUEBA]`, aunque el formulario tenga otro correo.

- Creá un producto de cada área y subí fotos. Abrí sus catálogos en una ventana privada.
- Editá el precio, ocultá un producto y verificá que desaparezca. Probá eliminar un producto de prueba.
- Enviá una reserva de prueba con imágenes y comprobantes ficticios, sin efectuar una transferencia real.
- Guardá su enlace privado y abrilo en otro navegador. Revisá el estado y descargá el PDF.
- Intentá abrir `/solicitud/` sin la clave: no debe mostrar datos.
- En administración, descargá los documentos de prueba. Pedí una corrección y completala desde el enlace privado.
- Confirmá la solicitud, registrá una seña, luego un saldo. Revisá estadísticas y comprobá que no permita cobrar de más.
- Registrá y anulá una venta inmediata. El stock debe bajar y luego volver al valor anterior. En un disfraz **Nuevo a pedido**, el límite por consulta se respeta, pero el stock no cambia.
- Probá el formulario de arrepentimiento y su gestión desde el panel.
- Probá desde un teléfono real los archivos, la firma y el acceso a WhatsApp.
- Revisá en Sheets los registros y en Drive que la carpeta siga restringida.
- Confirmá la recepción de los correos de prueba. Si un aviso está en `review`, revisá el correo antes de reenviarlo manualmente: pudo haberse enviado aunque hubiera una interrupción.
- Si la pestaña `notifications` muestra `retry` porque se agotó la cuota de correo, esperá a que vuelva la cuota y ejecutá **`reintentarAvisosSinCuota`** desde el selector de funciones del editor Apps Script. Procesa hasta 10 avisos por ejecución, sólo del `MAIL_MODE` actual. No reenvía estados `sent`, `sending` ni `review` para evitar duplicados. Revisá el resultado en el registro de ejecución y la pestaña `notifications`.
- Cuando todo esté bien, cambiá `MAIL_MODE` a `production`. Las solicitudes nuevas enviarán el aviso al negocio y al cliente. Los avisos anteriores no se reenvían automáticamente.

La compilación, las pruebas locales y la revisión visual están hechas; las conexiones con tus cuentas deben verificarse con este recorrido. No se migraron reservas antiguas ni datos de Cloudflare. Si querés conservarlos en la nueva aplicación, hace falta una exportación autorizada y una migración específica.

## 12. Si algo falla

| Lo que ves | Qué revisar |
|---|---|
| Sigue diciendo demostración | Falta la variable pública o no reiniciaste / recompilaste |
| Catálogo vacío sin error | Sheets está conectado pero todavía no cargaste productos visibles |
| `Failed to fetch` / no se pudo conectar | URL `/exec`, acceso Cualquier persona, última implementación y restricciones de Google Workspace |
| Apps Script no devolvió JSON | Probablemente copiaste `/dev`, una URL del editor o Google devuelve una página de inicio de sesión |
| `validate is not defined` | Falta pegar `Validation.gs` y publicar una nueva versión |
| Cuenta de cobro pendiente | Completá titular y alias o CBU en administración |
| Error al subir foto | Revisá las tres propiedades de Cloudinary, el formato y los 8 MB máximos |
| Sesión vencida | Volvé a iniciar sesión; la caché de Google puede vencer antes de seis horas |
| Demasiados intentos al ingresar | Esperá 15 minutos antes de volver a intentar |
| No llegó un correo | Revisá Spam, `MAIL_MODE`, el destinatario del negocio, la pestaña notifications y las cuotas de MailApp |
| 404 al abrir una página en Render | Publish Directory debe ser `out`; no debe usarse `.next` |

Apps Script, Sheets, Drive, correo y Cloudinary tienen cuotas. Esta arquitectura está pensada para un negocio de volumen moderado. Se limita el envío repetido, pero no incluye CAPTCHA ni protección distribuida contra ataques masivos. Monitoreá las ejecuciones de Apps Script y el uso de tus servicios.

## Actualización 5 · cuatro mundos de Cotillón

El frontend se publica automáticamente en Render cuando este repositorio llega a `main`. Para activar el backend, en el proyecto Apps Script **web-dc**, abrí `Código.gs`, seleccioná todo su contenido y pegá el archivo completo [`backend/Code.gs`](backend/Code.gs). Guardá. No cambies `Validation.gs`, `appsscript.json`, las propiedades privadas ni la URL `/exec` que ya usa Render. En **Implementar → Administrar implementaciones**, editá la implementación web existente, elegí **Nueva versión** e implementá. Al abrir esa misma URL `/exec` debe aparecer `"version":5`.

No hay función de migración para ejecutar a mano. La primera visita al catálogo o al administrador crea automáticamente las 26 subcategorías dentro de la pestaña existente `categorias_cotillon`. Las cuatro categorías principales son parte de la navegación de la web. La migración reutiliza categorías cuyo nombre coincide exactamente, como Halloween, Navidad y Golosinas; conserva todas las demás filas anteriores, las oculta de la navegación y no modifica ninguna fila de productos. Por eso los artículos aún sin clasificar aparecen en **Ver todos los productos** y en el buscador.

Para ordenar esos artículos sin editar cientos de productos, entrá a **Administrador → Categorías cotillón**. El aviso muestra cuántos faltan. En cada categoría marcada **Anterior**, elegí una subcategoría nueva y pulsá **Vincular**. Por ejemplo, podés vincular «Fiestas patrias» con «Patrios» solo después de revisar que esa clasificación te sirva. El vínculo puede cambiarse después; no borra la categoría anterior ni altera las fotos, precios, stock o identificadores de los productos. También podés editar un producto individual si necesitás una clasificación diferente.

En la tienda pública aparecen solamente los cuatro grupos principales. Al entrar a uno aparecen sus subcategorías; al elegir una aparecen sus productos. **Volver a categorías** y **Ver todos los productos** permiten salir del filtro. El buscador consulta todo Cotillón, incluidos los productos pendientes de clasificación. El carrito y el envío del pedido completo por WhatsApp siguen funcionando.

## Actualización 6 · tercer nivel de Cotillón

Esta actualización agrega **14 categorías internas dentro de Cotillón → Fiestas** y **4 dentro de Cotillón → Cumpleaños infantil**. Repostería, Fechas Especiales, Descartables y Disfraces mantienen su estructura. Para activarla, copiá el archivo **completo** [`backend/Code.gs`](backend/Code.gs) en el archivo **Código.gs** del proyecto Apps Script **web-dc** que ya usa Render. Guardá y editá la **implementación web existente** en **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**. Mantené la misma URL `/exec`. No reemplaces `Validation.gs` ni `appsscript.json`; no cambies las propiedades privadas.

Al abrir la URL `/exec`, la respuesta debe contener `"version":6` y `"catalogSchema":"cotillon-hierarchy-v2"`. Al entrar por primera vez al catálogo o al administrador, Apps Script agrega las 18 categorías a la pestaña **categorias_cotillon** ya existente. **No hay que ejecutar ninguna función manual ni crear pestañas nuevas.** Cada categoría recibe un ID único y un `parentId` que apunta a Fiestas o Cumpleaños infantil. Si la operación se interrumpe, al repetirla reutiliza lo que ya creó. Las filas de productos, sus categorías originales, fotos, precios, stock e identificadores no se reescriben.

En la web, entrá a **Cotillón → Fiestas** o **Cotillón → Cumpleaños infantil** para ver las nuevas tarjetas. Elegí una tarjeta interna para ver sus artículos. **Ver todos los productos de Fiestas/Cumpleaños infantil** incluye tanto los ya clasificados como los que todavía tengan asignado únicamente el segundo nivel. **Ver todos los productos** y el buscador global muestran también los productos que aún están en categorías anteriores. Una categoría nueva estará vacía hasta que la clasifiques: no se hizo ningún reparto automático según nombres o fotos.

Para clasificar, abrí **Administrador → Cotillón → Editar** en el producto y elegí la ruta completa, por ejemplo **COTILLÓN › Fiestas › Anteojos**; guardá. Si un producto aparece en varias categorías, usá **También aparece en**. Para mover todos los productos de una categoría anterior a una interna sin cambiar las filas originales, usá **Administrador → Categorías cotillón → Vincular** y elegí la ruta completa. Revisá el resultado antes de vincular: una categoría como «Accesorios» puede existir en dos ramas con IDs distintos. El panel indica cuántos productos de Fiestas/Cumpleaños infantil aún no tienen tercer nivel.

## Documentación oficial de referencia

- [Exportación estática de Next.js](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js estático en Render](https://render.com/docs/deploy-nextjs-app)
- [Aplicaciones web en Apps Script](https://developers.google.com/apps-script/guides/web)
- [Propiedades privadas de Apps Script](https://developers.google.com/apps-script/guides/properties)
- [ContentService y redirecciones de Apps Script](https://developers.google.com/apps-script/guides/content)
- [Subida de imágenes a Cloudinary](https://cloudinary.com/documentation/upload_images)
