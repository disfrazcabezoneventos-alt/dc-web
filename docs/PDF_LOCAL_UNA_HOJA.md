# Imprimir el contrato del local en una hoja

En el enlace privado de una solicitud local, elegí **Descargar contrato (1 hoja)**.
También está disponible en **Admin → Formularios entrantes → Formulario local →
Abrir**, debajo de los archivos. Imprimí el PDF en papel A4.

La hoja reúne los datos del cliente y de quien retira, los disfraces con sus
categorías y cantidades, retiro y devolución, alquiler, garantía, modalidad,
declaraciones, condiciones resumidas, firma y aclaración. La tabla conserva un
espacio para anotar partes e indicaciones en el local.

La modalidad elegida no se presenta como un cobro acreditado. La copia lleva el
código de solicitud, la versión y el hash del registro firmado.

El **original completo** sigue disponible como descarga adicional, tanto en el
portal del cliente como en administración. Los datos, adjuntos y condiciones
firmados que conserva Apps Script no se modifican. Tampoco cambia el PDF de las
reservas web.

El formato ajusta el tamaño de texto dentro de límites legibles. Si un registro
excepcionalmente extenso no entra, ofrece usar el original completo en lugar de
recortar datos o generar texto diminuto. Las condiciones que no coincidan con
el texto conocido se conservan completas, sin aplicarles un resumen desactualizado.

Este cambio se publica con el frontend de Render. **No requiere editar ni volver
a implementar Apps Script.** Se aplica también al volver a descargar solicitudes
locales anteriores desde la web actualizada. Los PDF ya descargados conservan su
formato anterior.
