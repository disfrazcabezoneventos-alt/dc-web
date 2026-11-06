# Typecheck desde un checkout limpio

`npm run typecheck` ejecuta `next typegen` para generar los tipos de rutas de Next.js sin compilar la aplicación. Los dos JSON del catálogo generados durante el build tienen declaraciones específicas en `types/generated-catalog.d.ts`; no se usa `any` ni se genera un catálogo ficticio para esta comprobación.

Verificación: con `.next` y `generated` eliminados, y `NEXT_PUBLIC_APPS_SCRIPT_URL=http://127.0.0.1:9/typecheck-no-fetch`, typecheck pasó dos veces. `generated` siguió sin existir: no necesita leer Apps Script. Después, `npm ci` y build limpio con la muestra aislada pasaron, incluyendo la auditoría de dos fichas y nueve URLs. El build de producción conserva la generación y validación obligatorias del catálogo real.
