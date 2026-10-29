# Disfraz Cabezón

Next.js con exportación estática para Render. Catálogos separados, reservas, administración y caja con backend Google Apps Script. Fotos públicas en Cloudinary; documentos personales en Drive privado.

**Empezá por [GUIA_CONFIGURACION.md](GUIA_CONFIGURACION.md).** Incluye la migración del catálogo anterior y la actualización a cuatro categorías principales de Cotillón, con un tercer nivel en Fiestas y Cumpleaños infantil sin mover productos existentes. Estado y límites de verificación: [CHECKLIST.md](CHECKLIST.md).

Para instalar y usar los temas predeterminado/Halloween, seguí [backend/GUIA_TEMAS.md](backend/GUIA_TEMAS.md).

Para habilitar el formulario presencial por QR, precios por tipo de disfraz y formularios entrantes con notificaciones, seguí [docs/FORMULARIO_LOCAL.md](docs/FORMULARIO_LOCAL.md). Es independiente de la reserva web existente.

```sh
npm ci
npm run dev
npm run build
npm test
```

Render: **Static Site**, build `npm ci && npm run build`, directorio `out`.

Sin `NEXT_PUBLIC_APPS_SCRIPT_URL` hay demostración visual, sin escritura. Con la URL, se usa exclusivamente el backend configurado. No hay rutas API de Next ni secretos en React.

## Código

- `app/`: páginas estáticas y estilos responsive.
- `components/RentalForm.tsx`, `Signature.tsx`, `Upload.tsx`: formulario reutilizado y adaptado del proyecto entregado.
- `lib/model.ts`, `terms.ts`, `pdf.ts`: validación y contrato de la reserva original.
- `components/Admin.tsx`: productos, reservas, caja, estadísticas y datos de cobro.
- `backend/Code.gs`: API, almacenamiento, acceso y notificaciones.
- `backend/Validation.gs`: validación y condiciones compartidas compiladas para Apps Script.
- `tests/core.test.mjs`: reglas de negocio ejecutadas con servicios Google simulados.

Después de modificar validaciones o condiciones, ejecutá `node scripts/generate-backend.mjs` y copiá de nuevo `Validation.gs` a Apps Script. Cambiar las condiciones también requiere actualizar `VERSION` en `lib/model.ts`, revisar el modelo PDF y publicar la nueva versión del backend. Las reservas existentes conservan su texto contractual.

Las fotos de demostración provienen del catálogo público de la web de referencia del usuario. Sus nombres se documentan en `public/catalog/FUENTES.md`. Los precios y cantidades de `lib/catalog.ts` son ficticios. No se importaron clientes ni reservas de producción. La web anterior y su Apps Script no se modificaron.
