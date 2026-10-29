# Desplegar quickUpdate en la misma implementación

**Pendiente de revisión y autorización. Este PR no despliega nada.**
No fusionar el frontend hasta coordinar su disponibilidad con el backend.

## 1. Preparar un ensayo aislado

1. Revisar Code.gs y el contrato del [informe](INFORME.md). Guardar una copia
   privada del código anterior, el número de versión y deployment ID vigentes.
   No publicar tokens, Script Properties ni enlaces privados en GitHub.
2. Crear un proyecto de Apps Script de ensayo y una copia del Google Sheet.
   Configurar SPREADSHEET_ID con la copia, credenciales administrativas de
   prueba y MAIL_MODE=disabled. Si se prueba el editor completo, usar también
   una carpeta privada y servicios de prueba; no apuntar al almacenamiento real.
3. Copiar Code.gs de este PR al proyecto de ensayo. Conservar Validation.gs y
   los módulos del importador sin cambios. No ejecutar importaciones ni crear
   triggers. Esta acción no necesita habilitar servicios avanzados nuevos.
4. Crear una implementación web de ensayo con acceso equivalente al entorno
   actual. Compilar el frontend de ensayo con NEXT_PUBLIC_APPS_SCRIPT_URL
   apuntando a esa URL de copia y SITE_URL configurado para su origen.
   La variable del frontend no debe apuntar al endpoint real durante el ensayo.

## 2. Comprobar en la copia

1. Iniciar sesión y abrir Disfraces/Cotillón. Elegir una ficha con descripción
   vacía y al menos dos categoryIds, por ejemplo Niños + Halloween. Guardar
   su registro JSON original para comparar después.
2. Cambiar estado, alquiler o venta y stock desde la fila. Verificar que solo
   cambian las claves enviadas y que categorías, fotos y descripción permanecen.
3. Comprobar cero, negativos, stock fraccionario, máximos, sesión ausente/vencida,
   ID inexistente y claves extra. Todos los rechazos deben dejar la hoja intacta.
4. Simular un fallo de conexión en el ensayo: la vista debe revertir y mostrar
   un aviso. Un timeout no demuestra que el servidor no haya guardado; recargar
   para comprobar su estado antes de repetir, sin reintento automático.
5. Comprobar filtros combinados, Sin categoría, grupos/subcategorías, contador,
   paginación de 50, Enter/Guardar y el formulario Editar. Probar desde celular.
6. En Cotillón confirmar H011: active=false sigue incluido en el catálogo como
   agotado y sin posibilidad de agregar al carrito. No cambiar esta regla.

## 3. Producción, solamente después de un OK explícito posterior

1. Obtener aprobación del PR y del despliegue. Reconfirmar proyecto y URL /exec
   actuales. Usar la misma implementación, no crear una URL nueva.
2. En el proyecto real reemplazar únicamente Code.gs con la versión revisada.
   No tocar Validation.gs, los importadores, secretos ni datos. No ejecutar
   funciones de preparación o migración.
3. Apps Script: **Implementar → Administrar implementaciones → editar** la
   implementación web existente (lápiz) → **Versión: Nueva versión** →
   descripción «Edición rápida de productos quickUpdate» → **Implementar**.
   Mantener usuario ejecutor y permisos de acceso existentes. Registrar la
   versión resultante y comprobar que deployment ID y URL /exec no cambiaron.
4. No cambiar NEXT_PUBLIC_APPS_SCRIPT_URL en Render: la URL sigue siendo la
   misma. Guardar Code.gs o fusionar GitHub no basta para actualizar Apps Script.
   La respuesta doGet/version no se incrementó en este cambio; no usarla como
   única prueba de que se publicó la nueva versión.
5. Cuando el backend esté listo y exista autorización para publicar frontend,
   fusionar el PR y esperar el deploy de Render. Si se publica antes el frontend,
   el backend anterior no reconocerá quickUpdate: se mostrará un error y la
   vista se revertirá. No hay fallback a saveProduct que altere categorías.
6. La comprobación real debe limitarse a los productos y cambios autorizados
   expresamente para esa etapa. Revisar versión desplegada, acceso y valores
   persistidos; no reutilizar datos ficticios de ensayo en producción.

## Reversión, con aprobación

Ante una anomalía, informar antes de revertir. Con autorización, editar esa
misma implementación y seleccionar la versión anterior conservando su URL.
Coordinar también el frontend: con backend antiguo, las ediciones rápidas
fallarán y se revertirán en pantalla. Esta reversión de código no restaura
valores de productos ya guardados; cualquier corrección de datos requiere una
revisión y autorización independientes. No hay rollback automático en este PR.
