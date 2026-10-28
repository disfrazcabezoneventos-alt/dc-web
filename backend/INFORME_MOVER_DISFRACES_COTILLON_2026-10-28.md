# Informe: mover disfraces desde Cotillón (CSV corregido, 28/10/2026)

## Alcance y bloqueo

Este PR está en borrador. No se escribió en producción, no se tocó `Code.gs` ni los importadores existentes. La ejecución productiva va después de retirar las cinco fichas de prueba de Disfraces. Al auditar, esas cinco todavía estaban presentes; el importador productivo se niega a correr mientras exista cualquiera de esos IDs.

Fuente: `Mover-disfraces-de-cotillon-2026-10-28.csv` de `excel-tienda/entradas`, vuelto a leer después de su reemplazo. SHA-256 del CSV: `3c202e8bb6c35263ffdf8b49b8b55c0193caaa247f012341f36ed895bd6eacfd`. Son 117 IDs únicos: **74 niño, 31 adulto, 12 REVISAR**. Los 12 REVISAR quedan en Cotillón. No se usó la clasificación previa.

Los 117 IDs existen en la hoja Cotillón actual y coinciden en nombre, precio y stock; ninguno existe con el mismo ID en Disfraces. Los 105 movimientos conservan modo venta, 55 activos y 50 inactivos, foto, miniatura, descripción y stock. Solo cambia el precio de **Tunica Negra Niño**, de $11.600 a **$20.000**, tal como indica el CSV. En producción las pestañas `reservas` y `movimientos` tenían solo el encabezado, así que no había referencias almacenadas a estos IDs. No existe una pestaña de pedidos: el carrito de Cotillón arma un mensaje de WhatsApp.

## Categorías propuestas

La categoría **Niños** se crea en `categorias_disfraces` si falta. Su ID interno se genera una sola vez y se reutiliza. Los 31 adultos van a categorías de Disfraces existentes. Revisar estas propuestas antes de autorizar ejecución.

| Categoría destino | Cantidad |
| --- | ---: |
| Personajes | 12 |
| Profesiones | 3 |
| Superheroes y Princesas | 1 |
| Halloween | 9 |
| Históricos | 3 |
| Otros | 2 |
| Mujeres | 1 |
| Niños | 74 |

### Propuesta individual para adultos

| ID Rappi | Producto | Categoría propuesta |
| --- | --- | --- |
| 2115151683 | Disfraz Angel | Personajes |
| 2115151560 | Disfraz Bombero Negro | Profesiones |
| 2115151703 | Disfraz Boxeador T1 | Profesiones |
| 2115179181 | Disfraz Boxeador Usa- Party Store | Profesiones |
| 2115427434 | Disfraz Caperucita Roja Talle M | Personajes |
| 2115179182 | Disfraz Cardenal | Personajes |
| 2115427432 | Disfraz Cat Woman Talle M | Superheroes y Princesas |
| 2115151704 | Disfraz Cura | Personajes |
| 2115427150 | Disfraz De Freddy Kruger Talle L | Halloween |
| 2115179183 | Disfraz Diosa Griega | Personajes |
| 2115427144 | Disfraz Dracula Talle L | Halloween |
| 2115427152 | Disfraz Espectro Talle M | Halloween |
| 2115427437 | Disfraz Esqueleto Sexy Talle M | Halloween |
| 2115151725 | Disfraz Esqueleto T1 | Halloween |
| 2115179184 | Disfraz Faraon | Históricos |
| 2115179187 | Disfraz Freddy Cantante | Personajes |
| 2115179188 | Disfraz Gladiador | Históricos |
| 2115179189 | Disfraz Gladiadora | Históricos |
| 2115376775 | Disfraz Inflable De Alien | Personajes |
| 2115427435 | Disfraz Malefica Talle M | Personajes |
| 2115179190 | Disfraz Medusa | Personajes |
| 2115427438 | Disfraz Monja Sexy Talle M | Halloween |
| 2115427142 | Disfraz Monje Oscuro T/m | Halloween |
| 2115061671 | Disfraz Papa Noel Friselina | Personajes |
| 2115427149 | Disfraz Payaso It Talle L | Halloween |
| 2115151750 | Disfraz Payaso T 2 | Personajes |
| 2115345635 | Disfraz Preso Adulto Enterito Naranja | Otros |
| 2115427148 | Disfraz Thriller Talle L | Halloween |
| 2115151758 | Disfraz Tunica Harry Potter Grande | Personajes |
| 2115272356 | Disfraz Vaquera M - Incluye Sombrero + Chaleco + Pantalón | Mujeres |
| 2115427145 | Mameluco Preso Naranja Talle L | Otros |

### Sin mover: requieren decisión

| ID Rappi | Producto | Sugerencia | Motivo |
| --- | --- | --- | --- |
| 2115415896 | Combo Harry Potter Tunica + Antifaz + Lentes + Varita + Gorro Seleccionador | niño | Combo temático sin talle; confirmar tamaño y si se vende como disfraz completo. |
| 2115415900 | Combo Harry Potter Tunica + Varita + Lentes + Corbata | niño | Combo temático sin talle; confirmar tamaño y si se vende como disfraz completo. |
| 2115415947 | Combo Pirata Sombrero + Garfio + Espada + Parche | niño | Kit de accesorios sin prenda ni talle; confirmar si corresponde moverlo de Cotillón. |
| 2115176293 | Disfraz Coya Varon | niño | La descripción indica talles de 2 a 16. |
| 2115176387 | Disfraz Patrio Negrita | niño | La descripción indica talles de 2 a 16. |
| 2115176386 | Disfraz Patrio Negrito | niño | La descripción indica talles de 2 a 16. |
| 2115176388 | Disfraz Patrio Paisana | niño | La descripción indica talles de 2 a 16. |
| 2115053599 | Disfraz Coya Mujer T3- Candela | niño | La descripción dice niña T3; confirmar equivalencia del talle Candela. |
| 2115053600 | Disfraz Coya Mujer T4- Candela | niño | La descripción dice niña T4; confirmar equivalencia del talle Candela. |
| 2115053601 | Disfraz Dama Antigua Rosa T3- Candela | niño | Talle Candela T3; confirmar tabla de talles antes de mover. |
| 2115053589 | Disfraz Gaucho T3- Candela | niño | Talle Candela T3; confirmar tabla de talles antes de mover. |
| 2115053590 | Disfraz Gaucho T4- Candela | niño | Talle Candela T4; confirmar tabla de talles antes de mover. |

En particular, los tres combos Harry Potter/Pirata podrían seguir en Cotillón si se comercializan como accesorios. Los talles Candela T3/T4 quedan en revisión aunque parecen infantiles: se necesita confirmar la tabla de talles.

## Prueba en copia

Copia independiente: https://docs.google.com/spreadsheets/d/1OgzMA90LyT0s3M-AUKTbOmZX2UiR9tOeuyPWCSQkLBY/edit

Se duplicaron allí las pestañas Cotillón, Disfraces y categorías para respaldo. En **esa copia únicamente** se retiraron primero las cinco fichas manuales de prueba para simular el orden pedido. Se aplicaron los 105 movimientos en **7 lotes de 15** y se leyó de nuevo el contenido de las tres pestañas.

| Verificación | Resultado |
| --- | ---: |
| Cotillón final | 1.208 |
| Disfraces final | 546 |
| Categorías Disfraces | 10 |
| Movidos a Niños / adultos | 74 / 31 |
| REVISAR que siguen en Cotillón | 12 |
| Fotos y miniaturas conservadas | 105 / 105 |
| Estado activo conservado | 105 / 105 |
| IDs duplicados / diferencias no previstas | 0 / 0 |

**Límite de la prueba:** la operación en la copia se hizo mediante el conector de Google Sheets, siguiendo el mismo plan y las mismas transformaciones de datos. No se ejecutó este archivo `.gs` dentro del runtime de Apps Script porque hacerlo exigiría instalarlo en un proyecto de Google. Por eso quedan pendientes la prueba de ejecución real del módulo y la verificación pública posterior a una eventual carga productiva.

## Seguridad y recuperación

El módulo verifica SHA-256 del manifiesto, identidad y hash de cada fila de origen antes de escribir, IDs duplicados, categorías y referencias en reservas/movimientos. Frena ante cualquier edición posterior a esta auditoría. Hace respaldo de ambas pestañas de productos y de `categorias_disfraces` antes del primer lote. Es reanudable si una ejecución se interrumpe entre añadir a Disfraces y quitar de Cotillón. Exige permiso explícito de producción mediante propiedad con el SHA del manifiesto; además exige que ya no existan las cinco fichas de prueba. La guía describe el rollback por renombrado de las tres pestañas respaldadas.
