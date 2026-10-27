# Revisión de la importación incremental de Cotillón

Fuente: Excel corregido el 27/10/2026 y copia CSV de 1.206 registros. Este archivo no ejecuta cambios en Google Sheets.

- Lote principal: 661 IDs de Rappi; 554 existentes, 107 altas. Los 24 globos de Mini no forman parte de este lote.
- Altas Halloween primero: 24. Sorbetes Halloween está incluido con foto local verificada.
- Actualizaciones propuestas: 87 registros, todos con cambio de stock y solo uno también con cambio de precio. El importador verifica cada campo contra su valor original antes de escribir; respeta ediciones manuales.
- Los 14 productos inactivos que recuperaron stock se reactivan solo si conservan las URL originales y ambas responden HTTP 200 como imagen al ejecutar el lote. Si falla una, la ficha completa queda sin escribir e inactiva.

## 87 actualizaciones propuestas

Marca **>30 %** cuando cambia el precio o el stock en más de 30 %. `base 0` señala un stock anterior de cero.

| ID Rappi | Producto | Precio actual | Precio nuevo | Δ precio | Stock actual | Stock nuevo | Δ stock | Marca |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 2115053567 | Escoba Paja | $ 7.500 | $ 7.500 | +0.0 % | 11 | 10 | -9.1 % |  |
| 2115053576 | Set Animalitos Modelos Varios | $ 7.000 | $ 7.000 | +0.0 % | 4 | 2 | -50.0 % | **>30 %** |
| 2115053617 | Copa Champagne Nancy X 10 Transparente | $ 500 | $ 5.000 | +900.0 % | 80 | 8 | -90.0 % | **>30 %** |
| 2115053620 | Velon 10 Cm Gibre | $ 500 | $ 500 | +0.0 % | 14 | 114 | +714.3 % | **>30 %** |
| 2115056555 | Bengala Holográfica | $ 1.500 | $ 1.500 | +0.0 % | 151 | 149 | -1.3 % |  |
| 2115061705 | Glitter Grande | $ 2.000 | $ 2.000 | +0.0 % | 22 | 21 | -4.5 % |  |
| 2115062841 | Careta De La Monja | $ 2.000 | $ 2.000 | +0.0 % | 10 | 9 | -10.0 % |  |
| 2115067778 | Murcielagos X 12 | $ 5.500 | $ 5.500 | +0.0 % | 3 | 1 | -66.7 % | **>30 %** |
| 2115067803 | Vincha Serrucho | $ 1.500 | $ 1.500 | +0.0 % | 3 | 2 | -33.3 % | **>30 %** |
| 2115067811 | Mascara De Scream Semi Rigida | $ 6.000 | $ 6.000 | +0.0 % | 27 | 21 | -22.2 % |  |
| 2115088426 | Adhesivo Comestible | $ 3.500 | $ 3.500 | +0.0 % | 4 | 2 | -50.0 % | **>30 %** |
| 2115088435 | Bandeja Car Rec Dorada 23x28 | $ 1.500 | $ 1.500 | +0.0 % | 3 | 2 | -33.3 % | **>30 %** |
| 2115088437 | Bandeja Car Rec Dorada 28x30 | $ 1.500 | $ 1.500 | +0.0 % | 56 | 54 | -3.6 % |  |
| 2115088442 | Bandeja Car Rec Plateada 28x30cm | $ 1.500 | $ 1.500 | +0.0 % | 11 | 10 | -9.1 % |  |
| 2115088457 | Bandeja Plas Rec 2kg | $ 2.500 | $ 2.500 | +0.0 % | 17 | 15 | -11.8 % |  |
| 2115089612 | Botones Redondelas Marroc | $ 2.000 | $ 2.000 | +0.0 % | 11 | 9 | -18.2 % |  |
| 2115089761 | Colorante Fleibor Rosa N | $ 3.500 | $ 3.500 | +0.0 % | 5 | 4 | -20.0 % |  |
| 2115089771 | Colorante Rojo Bloch | $ 3.500 | $ 3.500 | +0.0 % | 5 | 4 | -20.0 % |  |
| 2115119883 | Mousse Choco Ledevit | $ 6.000 | $ 6.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115119898 | Pasta Ballina Blanca Choco | $ 5.500 | $ 5.500 | +0.0 % | 8 | 6 | -25.0 % |  |
| 2115119900 | Pasta Ballina Blanca Vainilla | $ 5.500 | $ 5.500 | +0.0 % | 12 | 10 | -16.7 % |  |
| 2115119919 | Pasta Ballina Negra | $ 6.500 | $ 6.500 | +0.0 % | 3 | 2 | -33.3 % | **>30 %** |
| 2115121855 | Drops Perlas 35g | $ 3.000 | $ 3.000 | +0.0 % | 6 | 4 | -33.3 % | **>30 %** |
| 2115126715 | Pirotin Cupcake Dorado Grd X20 | $ 2.500 | $ 2.500 | +0.0 % | 68 | 67 | -1.5 % |  |
| 2115126732 | Pirotin Grande N10 Blanco X20 | $ 2.000 | $ 2.000 | +0.0 % | 119 | 112 | -5.9 % |  |
| 2115438702 | Careta Leon | $ 2.000 | $ 2.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115438714 | Careta Caballo | $ 1.500 | $ 1.500 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115438760 | Gorro Cowboy | $ 8.000 | $ 8.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115438802 | Mascara Jason Top | $ 8.000 | $ 8.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115450780 | Colgante Con Esqueleto | $ 2.500 | $ 2.500 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115450784 | Capa Dracula Larga | $ 20.000 | $ 20.000 | +0.0 % | 7 | 4 | -42.9 % | **>30 %** |
| 2115450804 | Careta Blanca Lisa Sangre | $ 2.000 | $ 2.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115450816 | Narix Bruja Latex | $ 2.500 | $ 2.500 | +0.0 % | 4 | 3 | -25.0 % |  |
| 2115450819 | Telaraña Brilla En La Oscuridad | $ 3.000 | $ 3.000 | +0.0 % | 800 | 798 | -0.2 % |  |
| 2115450837 | Bucanera Rombo Calada | $ 8.000 | $ 8.000 | +0.0 % | 4 | 3 | -25.0 % |  |
| 2115450849 | Capa Elfo | $ 18.000 | $ 18.000 | +0.0 % | 13 | 12 | -7.7 % |  |
| 2115450860 | Peluca Belatrix | $ 20.000 | $ 20.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115450864 | Corona Rey Dorada | $ 3.000 | $ 3.000 | +0.0 % | 3 | 2 | -33.3 % | **>30 %** |
| 2115450867 | Maquillaje Fluo Naranja | $ 1.500 | $ 1.500 | +0.0 % | 14 | 13 | -7.1 % |  |
| 2115450875 | Diadema Elfo | $ 15.000 | $ 15.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115450876 | Vincha Plastica | $ 500 | $ 500 | +0.0 % | 14 | 13 | -7.1 % |  |
| 2115450882 | Cuernitos Vincha | $ 2.000 | $ 2.000 | +0.0 % | 6 | 5 | -16.7 % |  |
| 2115450918 | Set Hippie | $ 12.000 | $ 12.000 | +0.0 % | 3 | 2 | -33.3 % | **>30 %** |
| 2115450920 | Set Charleston | $ 12.000 | $ 12.000 | +0.0 % | 6 | 4 | -33.3 % | **>30 %** |
| 2115450923 | Media Bucanera Moño | $ 8.000 | $ 8.000 | +0.0 % | 4 | 3 | -25.0 % |  |
| 2115450930 | Pulsera Magica X10 | $ 2.000 | $ 2.000 | +0.0 % | 10 | 7 | -30.0 % | **>30 %** |
| 2115450945 | Lentes Vintage Negros | $ 5.000 | $ 5.000 | +0.0 % | 4 | 3 | -25.0 % |  |
| 2115450975 | Set Princesa Corona Cetro Peluca | $ 7.000 | $ 7.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115450978 | Media Entera Cicatriz | $ 8.000 | $ 8.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115450982 | Set Harry Potter 3 Piezas | $ 12.000 | $ 12.000 | +0.0 % | 11 | 6 | -45.5 % | **>30 %** |
| 2115450994 | Vincha Led Corona | $ 3.000 | $ 3.000 | +0.0 % | 10 | 8 | -20.0 % |  |
| 2115450997 | Vincha De Cuchillo | $ 2.000 | $ 2.000 | +0.0 % | 12 | 11 | -8.3 % |  |
| 2115451011 | Peluca Corta Varias Economica | $ 9.000 | $ 9.000 | +0.0 % | 16 | 14 | -12.5 % |  |
| 2115451016 | Anteojos Hp | $ 3.500 | $ 3.500 | +0.0 % | 7 | 6 | -14.3 % |  |
| 2115451018 | Set Pirata 1 | $ 4.500 | $ 4.500 | +0.0 % | 5 | 4 | -20.0 % |  |
| 2115451020 | Lentes Stark | $ 5.000 | $ 5.000 | +0.0 % | 4 | 3 | -25.0 % |  |
| 2115451025 | Guante Red Largo Fucsia | $ 3.000 | $ 3.000 | +0.0 % | 3 | 2 | -33.3 % | **>30 %** |
| 2115451032 | Anteojo Led Corazon | $ 2.000 | $ 2.000 | +0.0 % | 3 | 1 | -66.7 % | **>30 %** |
| 2115451038 | Guante Blanco Corto | $ 5.000 | $ 5.000 | +0.0 % | 13 | 11 | -15.4 % |  |
| 2115451039 | Vincha Oreja Gato | $ 1.500 | $ 1.500 | +0.0 % | 4 | 2 | -50.0 % | **>30 %** |
| 2115451042 | Orejas Elfo | $ 5.000 | $ 5.000 | +0.0 % | 24 | 22 | -8.3 % |  |
| 2115451055 | Capa De Niño Tela Negra Chica | $ 10.000 | $ 10.000 | +0.0 % | 20 | 19 | -5.0 % |  |
| 2115451058 | Alas Angel Negro | $ 10.000 | $ 10.000 | +0.0 % | 13 | 12 | -7.7 % |  |
| 2115451062 | Capa Reversible Larga | $ 20.000 | $ 20.000 | +0.0 % | 6 | 4 | -33.3 % | **>30 %** |
| 2115451067 | Capa Con Estrellas | $ 11.000 | $ 11.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115451068 | Capa Con Capucha Adulto | $ 15.000 | $ 15.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115451069 | Capa Caperucita | $ 15.000 | $ 15.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115451086 | Corona Monarca | $ 22.000 | $ 22.000 | +0.0 % | 2 | 1 | -50.0 % | **>30 %** |
| 2115451087 | Maquillaje Verde Fluo | $ 1.500 | $ 1.500 | +0.0 % | 24 | 23 | -4.2 % |  |
| 2115451088 | Maquillaje Rosa | $ 1.500 | $ 1.500 | +0.0 % | 17 | 16 | -5.9 % |  |
| 2115451090 | Esponja Maquillaje | $ 300 | $ 300 | +0.0 % | 98 | 96 | -2.0 % |  |
| 2115451093 | Baston Diamante | $ 8.000 | $ 8.000 | +0.0 % | 5 | 3 | -40.0 % | **>30 %** |
| 2115451095 | Tutu Naranja | $ 8.000 | $ 8.000 | +0.0 % | 3 | 2 | -33.3 % | **>30 %** |
| 2115451969 | Mini Calabaza Violeta | $ 1.500 | $ 1.500 | +0.0 % | 0 | 6 | base 0 | **>30 %** |
| 2115451970 | Careta Bruja Con Pelo | $ 2.500 | $ 2.500 | +0.0 % | 0 | 6 | base 0 | **>30 %** |
| 2115451972 | Máscara Chucky Rigida | $ 9.500 | $ 9.500 | +0.0 % | 0 | 5 | base 0 | **>30 %** |
| 2115451973 | Careta Calavera Con Tela | $ 2.500 | $ 2.500 | +0.0 % | 0 | 5 | base 0 | **>30 %** |
| 2115451975 | Caldero De Bruja Mini | $ 1.500 | $ 1.500 | +0.0 % | 0 | 5 | base 0 | **>30 %** |
| 2115451976 | Bolsitas De Halloween | $ 2.500 | $ 2.500 | +0.0 % | 0 | 20 | base 0 | **>30 %** |
| 2115451977 | Vinchas Halloween Formas | $ 1.500 | $ 1.500 | +0.0 % | 0 | 5 | base 0 | **>30 %** |
| 2115451978 | Cuchillo Retráctil | $ 3.000 | $ 3.000 | +0.0 % | 0 | 18 | base 0 | **>30 %** |
| 2115451979 | Plato Halloween | $ 3.500 | $ 3.500 | +0.0 % | 0 | 6 | base 0 | **>30 %** |
| 2115451981 | Vaso Calabaza Fucsia | $ 3.000 | $ 3.000 | +0.0 % | 0 | 7 | base 0 | **>30 %** |
| 2115451983 | Gorro De Bruja Tela Económico | $ 3.000 | $ 3.000 | +0.0 % | 0 | 7 | base 0 | **>30 %** |
| 2115451984 | Gorro De Bruja Negro Tela | $ 3.000 | $ 3.000 | +0.0 % | 0 | 7 | base 0 | **>30 %** |
| 2115451986 | Guadaña Con Sangre | $ 5.000 | $ 5.000 | +0.0 % | 0 | 9 | base 0 | **>30 %** |
| 2115451987 | Sangre Negra | $ 2.000 | $ 2.000 | +0.0 % | 0 | 12 | base 0 | **>30 %** |

## 14 reactivaciones condicionadas

El 27/10/2026 se hizo un GET HTTP de ambas URL de cada ficha: las 28 respondieron 200 con contenido de imagen. Apps Script volverá a comprobarlas al ejecutar; una falla deja esa ficha inactiva.

| ID Rappi | Producto | Stock nuevo | Imagen | Miniatura |
|---|---|---:|---|---|
| 2115451969 | Mini Calabaza Violeta | 6 | HTTP 200 | HTTP 200 |
| 2115451970 | Careta Bruja Con Pelo | 6 | HTTP 200 | HTTP 200 |
| 2115451972 | Máscara Chucky Rigida | 5 | HTTP 200 | HTTP 200 |
| 2115451973 | Careta Calavera Con Tela | 5 | HTTP 200 | HTTP 200 |
| 2115451975 | Caldero De Bruja Mini | 5 | HTTP 200 | HTTP 200 |
| 2115451976 | Bolsitas De Halloween | 20 | HTTP 200 | HTTP 200 |
| 2115451977 | Vinchas Halloween Formas | 5 | HTTP 200 | HTTP 200 |
| 2115451978 | Cuchillo Retráctil | 18 | HTTP 200 | HTTP 200 |
| 2115451979 | Plato Halloween | 6 | HTTP 200 | HTTP 200 |
| 2115451981 | Vaso Calabaza Fucsia | 7 | HTTP 200 | HTTP 200 |
| 2115451983 | Gorro De Bruja Tela Económico | 7 | HTTP 200 | HTTP 200 |
| 2115451984 | Gorro De Bruja Negro Tela | 7 | HTTP 200 | HTTP 200 |
| 2115451986 | Guadaña Con Sangre | 9 | HTTP 200 | HTTP 200 |
| 2115451987 | Sangre Negra | 12 | HTTP 200 | HTTP 200 |

## Altas Halloween al principio del lote

| ID Rappi | Producto | Foto origen |
|---|---|---|
| 2115454069 | Sangre En Spray | Rappi |
| 2115454075 | Bolsas Calabaza | Rappi |
| 2115454076 | Guantes De Esqueleto | Rappi |
| 2115454077 | Mantel Aluminio Halloween | Rappi |
| 2115454079 | Sorbetes Halloween | local-revisada |
| 2115454080 | Set Halloween Calabaza Globo | Rappi |
| 2115454081 | Vaso Halloween | Rappi |
| 2115454089 | Máscara Led Esqueleto | Rappi |
| 2115454092 | Set Globos Sangre | Rappi |
| 2115454093 | Set Globo Murciélago X 10 | Rappi |
| 2115454094 | Set Globos Halloween E.m. Jack | Rappi |
| 2115454095 | Set Esqueleto Niño | Rappi |
| 2115454098 | Plato Halloween Tornasolado | Rappi |
| 2115454099 | Careta Chucky Con Tela | Rappi |
| 2115454102 | Máscara De Látex Bruja | Rappi |
| 2115454103 | Máscara Calabaza Loca Led | Rappi |
| 2115454104 | Mantel Ensangrentado | Rappi |
| 2115454105 | Llave Francesa Sangrienta Wrench | Rappi |
| 2115454106 | Guirnalda Halloween Payaso | Rappi |
| 2115454108 | Chupetines Halloween Scream | Rappi |
| 2115454187 | Careta Con Tela Scary Movie | Rappi |
| 2115454191 | Vincha Diablita Strass | Rappi |
| 2115454202 | Máscara It Látex | Rappi |
| 2115456050 | Máscara De La Purga Cosido | Rappi |
