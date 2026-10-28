# Acceso administrador: enlace público y revisión de seguridad

## Cambio visual

Se quitó el único enlace público a `/admin/`, que estaba en el pie compartido (`components/Shell.tsx`). La cabecera y el menú móvil ya carecían de ese enlace. La dirección `/admin/` sigue existiendo para el equipo; ocultar su enlace no reemplaza la autenticación.

| Vista | Antes | Después |
| --- | --- | --- |
| Cabecera, escritorio | [Captura](antes-escritorio-cabecera.png) | [Captura](despues-escritorio-cabecera.png) |
| Cabecera y menú abierto, celular | [Captura](antes-celular-cabecera.png) | [Captura](despues-celular-cabecera.png) |
| Pie, escritorio (donde estaba el enlace) | [Captura](antes-escritorio-pie.png) | [Captura](despues-escritorio-pie.png) |
| Pie, celular (donde estaba el enlace) | [Captura](antes-celular-pie.png) | [Captura](despues-celular-pie.png) |

## Revisión de solo lectura

- **Ruta directa:** `/admin/` es una página estática accesible si alguien escribe la URL. En una visita sin sesión, el componente muestra primero “Comprobando tu sesión…” y luego el formulario de **usuario y contraseña**. El panel y sus datos no se muestran sin una sesión válida. `app/admin/page.tsx` indica `noindex`, pero eso no es un control de acceso.
- **Backend:** `backend/Code.gs` compara usuario y contraseña configurados en Script Properties, exige contraseña de al menos 12 caracteres, limita intentos y entrega un token temporal. `session_` comprueba ese token en caché. La respuesta `admin` y las operaciones de productos, categorías, reservas y caja están detrás de `session_(b.token)` en `dispatch_`. Los tests existentes también comprueban el rechazo de `admin` sin sesión. No se identificó un CRUD administrativo que dependa solamente de ocultar el panel.
- **Hallazgo P2 — escrituras previas a autenticar:** `dispatch_` llama `recoverStock_()` y, para determinadas acciones, `ensureCotillonDepth3_()` **antes** de `session_(b.token)`. Esas funciones pueden escribir stock o categorías pendientes. Por lo tanto, una solicitud sin credenciales puede disparar esas tareas internas aunque luego se rechace su acceso al panel. No permite elegir libremente el producto o el cambio desde esa solicitud, pero sí cruza el límite de autenticación para esos efectos. **Se documenta; no se corrige en este PR.**
- **Entorno de demostración:** si el frontend se compila sin `NEXT_PUBLIC_APPS_SCRIPT_URL`, `/admin/` ofrece “Explorar panel de demostración” con datos ficticios y bloquea escrituras. Esto se observó en el build local sin esa variable; no demuestra que esté habilitado en producción.

## Verificación local

Sobre el `out/` estático, Playwright confirmó que no hay enlace a `/admin/` en Inicio, Disfraces, Cotillón, Comprar, Reservas, Solicitud, Condiciones ni Arrepentimiento, tanto a 1366 px como a 390 px. La entrada directa a `/admin/` mostró los dos campos de acceso y ningún panel sin iniciar sesión. No se hicieron peticiones de prueba al Apps Script de producción. `backend/Code.gs` y los archivos del importador permanecen sin cambios.
