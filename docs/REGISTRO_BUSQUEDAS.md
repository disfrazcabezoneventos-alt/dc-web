# Registro de búsquedas sin resultados — PR dependiente, en DRAFT

Se basa en el PR #35, Buscador global. Ese frontend ya busca con el backend actual y omite silenciosamente un registro no disponible. Este segundo PR agrega únicamente Apps Script y la vista privada del admin; no cambia el buscador.

## Backend

- Acción pública recordSearchMiss: texto entre 2 y 120 caracteres, 60 intentos/minuto globales y uno/minuto por consulta normalizada. Usa CacheService y el lock de doPost existentes.
- Habilitación explícita con SEARCH_MISS_LOG_ENABLED=yes. Sin esa propiedad no escribe y devuelve accepted:false.
- Hoja busquedas_sin_resultados, creada al aceptar el primer registro: solo query_json y fecha. Se guarda un string JSON para neutralizar fórmulas de Sheets; la vista lo decodifica. No se guardan IP, visitante, correo, cuenta ni token.
- Máximo 10.000 registros, sin borrar datos automáticamente; al llenarse hay que archivarlos manualmente.
- searchDemand agrupa sin mayúsculas ni tildes y ordena por cantidad, con desempate por fecha. Solo Administrador: el Editor y las solicitudes sin sesión se rechazan antes de leer la hoja.

## Administración

Nueva sección Lo que buscan y no tenemos, exclusiva del Administrador. Tabla con consulta, cantidad y última fecha. Refleja búsquedas del público, no una comprobación física de stock.

## Instalación futura, después de aprobar los dos PR

1. Probar en copia privada con MAIL_MODE=disabled. No enviar búsquedas de prueba a producción.
2. Respaldar y actualizar Código.gs con backend/Code.gs y CatalogAccess.gs. No ejecutar importadores ni preparar roles otra vez.
3. Crear nueva versión de la MISMA implementación, conservando /exec, y habilitar SEARCH_MISS_LOG_ENABLED=yes.
4. Publicar la vista del admin y comprobar los roles. El PR #35 puede publicarse antes de este: la búsqueda no depende del registro.
5. Para detener registros, quitar la propiedad o poner no; el buscador sigue funcionando. No se borran registros.

Las pruebas usan el código real de Apps Script con hojas ficticias aisladas: campos, fórmulas, frecuencia, capacidad y permisos. Playwright comprueba recepción desde el frontend y el informe del Administrador en cuatro tamaños. No se instaló este backend en Apps Script ni se escribió en una hoja real.

Validación de esta rama: 3/3 pruebas unitarias de registro y permisos; 8/8 Playwright del registro y admin en 360, 390, 768 y escritorio; build estático correcto.
