# Agregar tienda.disfrazcabezon.com.ar

Guía preparada el 28/10/2026. No se modificaron Render, DNS ni Apps Script.

## Configuración comprobada en Render

Servicio **dc-web**, tipo **Static Site**, repositorio
`disfrazcabezoneventos-alt/dc-web`, rama `main`, directorio raíz vacío,
build `npm ci && npm run build`, publicación `out`. Destino público:
`https://dc-web-8ai4.onrender.com`. Auto-Deploy: On Commit; PR Previews: Off.
Se consultó Settings en la sesión existente. El bloque dinámico Custom Domains
quedó en Loading: no se pudo confirmar su lista actual. Antes de agregar,
comprobar allí si el subdominio ya existe y evitar duplicarlo.

DNS observado: `www` es CNAME de `disfrazcabezon.com.ar`; el dominio raíz
resuelve a `52.44.154.118`. Los NS actuales son `ns1.aliasdns.net`,
`ns2.aliasdns.net`, `ns3.aliasdns.net`, `ns4.aliasdns.net`. `tienda` no existe
en DNS en esta lectura. Son datos de referencia, no valores para sobrescribir.

## Procedimiento, pendiente de autorización

1. En Render abrir el servicio **dc-web → Settings → Custom Domains**.
   Si sigue Loading, resolver esa carga antes de continuar; no crear otro servicio.
2. Elegir **Add Custom Domain**, escribir únicamente
   `tienda.disfrazcabezon.com.ar` y guardar. No incluir protocolo ni ruta.
3. Abrir el panel que administra la zona DNS actual. La delegación está en
   AliasDNS; no cambiar los nameservers en NIC Argentina para esta operación.
4. Crear este único registro:

| Campo | Valor |
| --- | --- |
| Tipo | CNAME |
| Nombre / Host | tienda |
| Nombre completo, si el panel lo exige | tienda.disfrazcabezon.com.ar |
| Destino / Valor | dc-web-8ai4.onrender.com |
| TTL | 300 segundos, o el mínimo permitido por el proveedor |

   El valor no lleva `https://`, `/` ni IP. Si el proveedor exige un nombre
   absoluto con punto final, usar `dc-web-8ai4.onrender.com.`. No duplicar
   el sufijo de zona en un campo que ya lo agrega. Un CNAME no puede coexistir
   con A/AAAA u otros registros del mismo nombre exacto `tienda`: revisar
   antes de reemplazar cualquier valor si el estado cambió desde esta lectura.
5. Esperar propagación. En PowerShell comprobar:

```powershell
Resolve-DnsName tienda.disfrazcabezon.com.ar -Type CNAME -Server 1.1.1.1
Resolve-DnsName tienda.disfrazcabezon.com.ar -Type CNAME -Server 8.8.8.8
Resolve-DnsName www.disfrazcabezon.com.ar -Type CNAME
Resolve-DnsName disfrazcabezon.com.ar -Type A
```

   `tienda` debe apuntar al destino Render; `www` y raíz deben conservar su
   configuración anterior. Comparar registros, no solo una IP que podría rotar.
6. Volver a Custom Domains y pulsar **Verify** junto a `tienda`. Esperar dominio
   verificado y certificado emitido. Si falla, comprobar propagación y los
   registros del nombre `tienda`; no borrar registros de otros hosts.
7. Abrir `https://tienda.disfrazcabezon.com.ar/`: comprobar certificado válido,
   rutas directas, logo y favicon. Render gestiona el certificado y HTTPS.

El procedimiento se basa en las guías oficiales de
[dominios propios](https://render.com/docs/custom-domains) y
[DNS para subdominios](https://render.com/docs/configure-other-dns).

## Mantener www intacto

Agregar exclusivamente `tienda`. No agregar a este servicio `www`, el dominio
raíz ni un wildcard; Render vincula automáticamente raíz/www cuando se añade
uno de esos dos. No cambiar A/CNAME de raíz o www, NS, MX ni TXT de correo.
Tampoco configurar redirecciones del sitio actual hacia la tienda. Mantener
habilitado el subdominio onrender mientras se valida la transición.
La recomendación de revisar AAAA se limita al host nuevo `tienda`; no borrar
AAAA de www/raíz u otros servicios. Verificar restricciones CAA si la emisión
del certificado falla y preparar ese ajuste por separado, sin cambiar la zona
completa. Con estos límites, el nuevo host tiene un registro independiente.

## La conexión DNS no completa la migración de la aplicación

El código actual de `backend/Code.gs`, función `reply_`, permite un solo origen
mediante `SITE_URL` (por defecto el de Render). El dominio nuevo puede mostrar
HTML pero fallar al cargar el catálogo/formularios si esa propiedad sigue
apuntando al host anterior. No dar la migración por terminada solo porque carga
la portada. No cambiar `NEXT_PUBLIC_APPS_SCRIPT_URL`: el endpoint no cambia.

En una intervención posterior autorizada habrá que configurar `SITE_URL` como
`https://tienda.disfrazcabezon.com.ar`, verificar los enlaces de notificación y
el transporte de iframe. Esto hará que el backend actual rechace el origen
onrender anterior. Si se requiere que ambos funcionen a la vez, preparar primero
otro cambio con una lista explícita de ambos orígenes y pruebas; no usar `*`.
Además `lib/page-metadata.ts` fija el dominio canónico actual: preparar su
actualización y rebuild autorizado para canonical/Open Graph. Esta guía no
modifica ninguno de esos archivos ni propiedades.

## Verificación funcional posterior

Con autorización para esa etapa, comprobar catálogo, navegación, carrito,
entrada al formulario y lectura de solicitudes desde el nuevo origen. No crear
reservas reales como prueba. En otra ventana abrir la web actual `www` y
confirmar que conserva su contenido y su destino DNS. Si aparece un problema,
informar antes de revertir. La reversión de este cambio de dominio sería quitar
únicamente el CNAME `tienda` y su asociación en Render, con autorización.
