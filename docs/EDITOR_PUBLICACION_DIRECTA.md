# Publicación directa del Editor

Cambio solicitado el 3 de noviembre de 2026: el Editor puede agregar y publicar
productos sin aprobación previa del Administrador.

- Agregar producto → Guardar y publicar crea una ficha activa y publicada.
- Foto obligatoria; descripción opcional y categorías múltiples conservadas.
- Stock inicial cero. El Editor no ve ni modifica cantidades de stock; Cotillón
  conserva su comportamiento de mostrar como agotado lo que tenga stock cero.
- Los borradores anteriores siguen privados hasta pulsar Publicar borrador.
  Ese botón ahora está disponible para ambos roles.
- Publicar exige sesión válida, rol permitido y revisión actual del producto.
  Solo modifica publicación y activación, usando el producto guardado en servidor.
- Crear y publicar quedan registrados en historial con usuario y antes/después.
- No cambian contraseñas, sesiones, borrados, usuarios, categorías, reservas, caja,
  datos bancarios ni otros permisos administrativos.

## Instalación incremental

1. Respaldar el contenido actual de Código.gs y CatalogAccess.gs. Comprobar que
   no hay cambios ajenos a esta actualización.
2. Reemplazar únicamente Código.gs con backend/Code.gs y CatalogAccess.gs con
   backend/CatalogAccess.gs de esta rama. No ejecutar mantenimiento ni migraciones.
3. Guardar. En la misma implementación de Apps Script, crear una nueva versión
   con descripción "Publicación directa del editor" y conservar la URL /exec.
   No se agregan propiedades ni se modifican las existentes.
4. Publicar el frontend actualizado después del backend. Una pestaña con el
   frontend anterior todavía crea borradores explícitos, que siguen privados;
   recargar para ver Guardar y publicar.
5. Comprobar catálogo y ambos roles. Las pruebas de escritura se ejecutan con
   datos ficticios aislados, nunca creando publicaciones de prueba en la tienda real.

## Verificación

Las pruebas de API cubren ambos catálogos, creación pública sin aprobación,
borradores explícitos privados, publicación por ambos roles, revisión vencida,
sesiones ausentes, historial, reintentos, y rechazo de stock, fotos vacías y campos
no permitidos. Las pruebas de navegador cubren creación y publicación en ambas
áreas, publicación de borradores por ambos roles y límites del Editor en escritorio
y celular. Usan el backend real del repositorio con hojas en memoria y servicios
externos simulados; no envían correos ni cambian el catálogo de producción.

## Vuelta atrás

Volver a la versión anterior de la misma implementación y al frontend anterior
retira el permiso nuevo. Los productos que ya se hayan publicado siguen publicados;
la vuelta atrás del código no altera datos. No volver a un backend anterior a roles
ni restaurar credenciales antiguas.
