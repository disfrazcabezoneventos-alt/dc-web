# Quién administra el DNS de disfrazcabezon.com.ar

Consulta pública de solo lectura realizada el **28 de octubre de 2026**. No se inició sesión ni se modificó ningún registro. El objetivo posterior es crear únicamente `tienda.disfrazcabezon.com.ar`.

## Titularidad y delegación

El WHOIS del servidor oficial `whois.nic.ar` devuelve:

| Dato | Resultado |
| --- | --- |
| Titular, tal como figura | **UGHETTI LORENA SOLEDAD** |
| Alta | 2019-07-25 11:13:19 (la respuesta WHOIS no indica zona horaria) |
| Vencimiento | 2027-07-25 00:00:00 (la respuesta WHOIS no indica zona horaria) |
| Registrador | `nicar` |
| Delegación | `ns1.aliasdns.net`, `ns2.aliasdns.net`, `ns3.aliasdns.net`, `ns4.aliasdns.net` |

**Fuente y reproducción:** [NIC Argentina explica su WHOIS](https://nic.ar/index.php/en/whois). Consulta directa, sin autenticación: `whois -h whois.nic.ar disfrazcabezon.com.ar` (o cualquier cliente TCP al puerto 43). El [RDAP oficial](https://rdap.nic.ar/domain/disfrazcabezon.com.ar) es otra vía pública, pero no respondió desde esta conexión durante la investigación; los datos de arriba provienen del WHOIS, que sí respondió. Se omite el identificador personal del titular porque no hace falta para gestionar este cambio.

## Quién presta el DNS y dónde está la web actual

`aliasdns.net` corresponde a **WNPower**, marca de **Webhosting S.R.L.**: [Tiendanube identifica `aliasdns.net` como WNPower](https://ayuda.tiendanube.com/es_ES/123275-dominio-propio/como-saber-en-que-hosting-esta-alojado-mi-dominio-propio) y [WNPower identifica su razón social](https://www.wnpower.com/housing-servidores-datacenter/). WNPower ofrece [hosting con cPanel](https://www.wnpower.com/web-hosting/) y [planes para revendedores con WHM/cPanel](https://www.wnpower.com/web-hosting-reseller/). Por eso estos servidores pueden corresponder a una cuenta directa de WNPower o a la de un revendedor: **los NS no revelan quién tiene el usuario del panel de esta zona**. Como ejemplo de uso por otro proveedor, [Páginas Web SAC indica esos cuatro NS a sus clientes](https://paginaswebsac.com.ar/como-delegar-el-dominio-al-hosting-paso-a-paso/).

La web `www.disfrazcabezon.com.ar` resuelve, a través del CNAME al dominio raíz, a **`52.44.154.118`**. Su PTR público es **`cpanel167.wnpservers.net`**; la respuesta HTTPS anuncia **`Server: nginx`**. Esto apunta a un servidor de WNPower con panel cPanel, sobre un bloque de red atribuido a Amazon; **no prueba qué persona o agencia paga o administra esa cuenta**. Fuentes: consultas DNS y `curl -I` reproducibles descritas abajo, [RDAP de ARIN para la IP](https://rdap.arin.net/registry/ip/52.44.154.118) y [descripción del hosting AWS/cPanel de WNPower](https://www.wnpower.com/web-hosting/).

El [pie de la web actual](https://www.disfrazcabezon.com.ar/) acredita “Diseño y Programación: EstudioBlue”. [Estudio Blue anuncia hosting/servidor](https://estudioblue.com.ar/) y publica [correo `info@estudioblue.com.ar` y WhatsApp `+54 9 11 7074-1565`](https://estudioblue.com.ar/contacto/). No encontré una afirmación pública de que gestione **este** DNS ni una oferta explícita de registro de dominios. Su crédito y su servicio de hosting la convierten en el **primer contacto probable**, no en un administrador confirmado.

## Estado DNS observado antes de cualquier cambio

Consulté el servidor autoritativo `ns1.aliasdns.net` el 28-10-2026. `ns2`, `ns3` y `ns4` devolvieron el mismo A del raíz y CNAME de `www`. Los TTL son los observados, no valores permanentes.

| Nombre | Tipo | Valor | TTL |
| --- | --- | --- | ---: |
| `disfrazcabezon.com.ar` | A | `52.44.154.118` | 900 s |
| `www.disfrazcabezon.com.ar` | CNAME | `disfrazcabezon.com.ar` | 900 s |
| `disfrazcabezon.com.ar` | MX 0 | `disfrazcabezon.com.ar` | 900 s |
| `disfrazcabezon.com.ar` | MX 1000 | `mxbackup.wnpower.com` | 900 s |
| `disfrazcabezon.com.ar` | TXT (SPF) | `v=spf1 ip4:52.44.154.118 include:_spf.wnpservers.net +a +mx +ip4:3.216.165.73 ~all` | 900 s |
| `disfrazcabezon.com.ar` | NS | `ns1.aliasdns.net`, `ns2.aliasdns.net`, `ns3.aliasdns.net`, `ns4.aliasdns.net` | 86400 s |
| `tienda.disfrazcabezon.com.ar` | A/CNAME | No existe en las consultas realizadas | — |

**Fuente reproducible de cada fila:** `Resolve-DnsName -Name disfrazcabezon.com.ar -Type A|MX|TXT|NS -Server ns1.aliasdns.net` y `Resolve-DnsName -Name www.disfrazcabezon.com.ar -Type CNAME -Server ns1.aliasdns.net` en PowerShell, cambiando `-Type` por cada tipo de la tabla; para `tienda`, consultar A y CNAME. También puede usarse un [consultor DNS público](https://dns.google/) con los mismos nombres y tipos. Esto documenta esos nombres consultados, **no es una exportación completa de la zona**. Para el servidor: `Resolve-DnsName -Name 52.44.154.118 -Type PTR` y `curl -I https://www.disfrazcabezon.com.ar/`.

## A quién pedir el cambio

La titular pública es Lorena Ughetti. NIC Argentina administra el **registro y la delegación**, pero los registros A, CNAME y MX de esta zona se editan probablemente en el **Zone Editor de cPanel de WNPower**, o en la cuenta de un revendedor. [WNPower documenta esa ubicación del editor](https://help.wnpower.com/hc/es/articles/360033272991-Editar-la-zona-o-registros-DNS-de-tu-dominio). **Estudio Blue es el primer contacto razonable** por el crédito en la web y su oferta de hosting. Si confirma que no gestiona el panel, el dueño puede revisar quién factura el servicio WNPower o preguntar a su soporte quién tiene la cuenta, sin compartir contraseñas.

Mensaje listo para enviar **por el dueño** (no se envió):

> Hola, soy titular de `disfrazcabezon.com.ar`. ¿Administran ustedes la zona DNS del dominio en WNPower/cPanel? Necesito agregar **solo** este registro: **tipo CNAME**, **nombre/host `tienda`** (nombre completo `tienda.disfrazcabezon.com.ar`), **destino `dc-web-8ai4.onrender.com`** (sin `https://` ni `/`; si el panel pide FQDN, `dc-web-8ai4.onrender.com.`), **TTL 900 segundos o el predeterminado**. Por favor, no modifiquen `www`, el dominio raíz, los registros MX/TXT ni la delegación NS. Si ya existe algún registro para `tienda`, avísenme antes de reemplazarlo. Confirmen cuando esté creado y envíen una captura o el valor final del registro.

La configuración de `tienda.disfrazcabezon.com.ar` como dominio personalizado en Render sería un paso posterior y separado; no se realizó aquí.
