# Copy maestro — ES

Estado: v2, listo para visto bueno del orquestador.

## Criterios de lectura

- Las cifras `palabras` cuentan solo el texto visible de esa pantalla; no cuentan la clave, la ruta de media, el pie ni el alt text.
- Cada pantalla queda por debajo de 45 palabras y cada capítulo por debajo de 120 palabras de texto visible.
- `media`: propuesta editorial. Las rutas parten de `media-originales/`; los originales no se publican sin optimizar ni limpiar metadatos.
- Los videos deben publicarse sin audio, con revisión final de rostros, matrículas, pantallas y música.

## SEO y metadatos

```yaml
seo.title: "Jorge — algunas cosas que hago"
seo.description: "Una pequeña ventana al mundo de Jorge: música, viajes, código, animales y planes que todavía están en borrador."
seo.og.title: "Jorge — algunas cosas que hago"
seo.og.description: "Música, viajes, código, animales y planes en borrador."
seo.og.image.alt: "Jorge en un paisaje de viaje, junto a un cuerpo de agua"
seo.robots: "noindex, nofollow"
```

## Interfaz

```yaml
ui.enter: "Entrar"
ui.skip: "Saltar"
ui.chapter_menu: "Capítulos"
ui.chapter_menu_close: "Cerrar capítulos"
ui.progress: "Capítulo {current} de {total}"
ui.next: "Siguiente capítulo"
ui.previous: "Capítulo anterior"
ui.language_selector: "EN | PT | 中文"
ui.language_selector_label: "Seleccionar idioma"
ui.open_media: "Abrir media a pantalla completa"
ui.close_media: "Cerrar media"
ui.pause_motion: "Pausar movimiento"
ui.reduced_motion_notice: "Movimiento reducido activado. La historia continúa con transiciones simples."
ui.video_unavailable: "El video no está disponible; se muestra una imagen fija."
ui.loading: "Cargando"
ui.aria.scroll_story: "Desplazar por la historia"
ui.aria.chapter_navigation: "Navegación de capítulos"
ui.aria.media_strip: "Tira de imágenes y videos"
```

## Equivalencia de capítulos v1 → v2

| Clave v1 | Clave v2 | Capítulo |
|---|---|---|
| `ch0` | `ch0` | Entrada |
| `ch1` | `ch1` | Un día normal |
| `ch2` | `ch2` | Música |
| `ch3` | `ch3` | China |
| `ch7` | `ch4` | Dos verdades y una mentira |
| `ch4` | `ch5` | Adrenalina |
| `ch5` | `ch6` | Los míos |
| `ch6` | `ch7` | Ahora mismo |
| `ch8` | `ch8` | Lo que sigue |
| `ch9` | `ch9` | Cierre |

---

## ch0 — Entrada

### Pantallas

`ch0.s1.text` — **Oi.** (1 palabra)

`ch0.s2.text` — **Hablar por mensajes con un diccionario abierto da tiempo para pensar, pero no para explicarse. Entonces: esto.** (17 palabras)

`ch0.s3.text` — **Soy Jorginho. En México me dicen Jorge, Jorch o Yorch, según la confianza. Programo, estudio y toco varios instrumentos.**

`ch0.s4.text` — **México.** (1 palabra)

`ch0.cta` — **Entrar** (1 palabra)

### Media

`ch0.photo1.media` — `media-originales/retratos/IMG_5044.jpeg`  
`ch0.photo1.caption` — **Una entrada con reflejos.**  
`ch0.photo1.alt` — **Jorge aparece de pie junto a un cuerpo de agua, con luces urbanas reflejadas al fondo.**

`ch0.photo2.media` — `media-originales/retratos/IMG_9290.jpeg`  
`ch0.photo2.caption` — **El paisaje llegó primero.**  
`ch0.photo2.alt` — **Jorge aparece ante un valle montañoso amplio desde un mirador.**

`ch0.photo3.media` — `media-originales/tocando/IMG_6084.JPG`  
`ch0.photo3.caption` — **Después apareció el chelo.**  
`ch0.photo3.alt` — **Jorge toca el chelo sobre un escenario frente a un público.**

### Variantes de apertura

`ch0.variant_a` — **Oi. Hablar por mensajes con un diccionario abierto da tiempo para pensar, pero no para explicarse. Entonces: esto.**

`ch0.variant_b` — **Oi. Soy Jorge. El portugués todavía pasa por un diccionario; esta es la versión con más contexto.**

`ch0.variant_c` — **Oi. Soy Jorge. Entre instrumentos, viajes y un diccionario abierto, resumirme parecía poco práctico.**

---

## ch1 — Un día normal

### Pantallas

`ch1.s1.title` — **Un día normal** (3 palabras)

`ch1.s2.text` — **Al despertar: entrenar. Correr, nadar, gimnasio o bici. El menú cambia; la decisión suele llegar antes que las ganas.** (19 palabras)

`ch1.s3.text` — **Después: trabajar. Programo páginas web, me gusta el IoT y quedé tercero en un hackathon con un semáforo inteligente con IA. Un BMO con Raspberry Pi sigue en planes.** (29 palabras)

`ch1.s4.text` — **Luego: estudiar. Voy a la escuela y estudio chelo cuando puedo. A veces las dos cosas coinciden.** (17 palabras)

`ch1.s5.text` — **Este año entreno para un maratón. Los medios maratones fueron el ensayo.** (12 palabras)

`ch1.s6.text` — **A veces ceno atún con plátano y aguacate. También como kiwi con cáscara.** (13 palabras)

### Media

`ch1.photo1.media` — `media-originales/corriendo/IMG_2662.jpeg`  
`ch1.photo1.caption` — **El día empieza en movimiento.**  
`ch1.photo1.alt` — **Jorge corre por un sendero con vegetación y paisaje abierto.**

`ch1.video2.media` — `media-originales/corriendo/IMG_9913.MOV`  
`ch1.video2.caption` — **Video en primera persona del entrenamiento.**  
`ch1.video2.alt` — **Video en primera persona de una carrera por un sendero arbolado.**

`ch1.photo3.media` — `media-originales/mascotas/IMG_4058.jpeg`  
`ch1.photo3.caption` — **Una parte de la rutina.**  
`ch1.photo3.alt` — **Retrato cercano de un hurón de pelaje claro.**

---

## ch2 — Música

### Pantallas

`ch2.s1.title` — **Música** (1 palabra)

`ch2.s2.text` — **Mi orden fue batería, guitarra, piano y chelo. Casi todos llegaron por cuenta propia. El chelo exige más atención. El piano sigue ganando.** (23 palabras)

`ch2.s3.text` — **Tocar en público me pone nervioso. También me gusta esa parte.** (11 palabras)

`ch2.s4.text` — **Una vez quise hacer un truco en un concierto, golpeé el platillo y no sonó.** (15 palabras)

`ch2.s5.text` — **Un par de cosas que sí quedaron grabadas.** (8 palabras)

`ch2.video_link_1.label` — **Ver en YouTube**
`ch2.video_link_1.url` — `https://youtu.be/zOT2gkNug-w`
`ch2.video_link_1.title` — **Say Yes To Heaven**
`ch2.video_link_1.artist` — **Lana Del Rey (cover)**
`ch2.video_link_1.alt` — **Cover de piano de Jorge: Say Yes To Heaven, de Lana Del Rey.**

`ch2.video_link_2.label` — **Ver en YouTube**
`ch2.video_link_2.url` — `https://youtu.be/vj4y_2EkJtc`
`ch2.video_link_2.title` — **what falling in love feels like**
`ch2.video_link_2.artist` — **jake25.17**
`ch2.video_link_2.alt` — **Cover de piano de Jorge: what falling in love feels like, de jake25.17.**

### Media

`ch2.video1.media` — `media-originales/tocando/Blue Over You .mp4`  
`ch2.video1.caption` — **La batería, primera en la fila.**  
`ch2.video1.alt` — **Video de Jorge tocando una batería electrónica.**

`ch2.video2.media` — `media-originales/tocando/IMG_6764.MOV`  
`ch2.video2.caption` — **El piano: favorito declarado.**  
`ch2.video2.alt` — **Video cercano de las manos de Jorge tocando un piano junto a una partitura.**

`ch2.video3.media` — `media-originales/tocando/IMG_0174.MOV`  
`ch2.video3.caption` — **El chelo pide concentración y público.**  
`ch2.video3.alt` — **Video de Jorge tocando el chelo frente a un público.**

---

## ch3 — China

### Pantallas

`ch3.s1.title` — **China** (1 palabra)

`ch3.s2.text` — **Viví y estudié chino unos cinco o seis meses en Wuhan, en HUST. Después llegaron Furongzhen, Beijing, Chongqing, Guangzhou y Zhangjiajie.** (21 palabras)

`ch3.s3.text` — **Volviendo de Guangzhou a Wuhan, perdimos el tren por quedarnos comiendo pizza italiana. Ni siquiera estaba tan buena.** (18 palabras)

`ch3.s4.text` — **Tomamos otra línea, compramos otro boleto en unos quince minutos y no se lo contamos a nadie por vergüenza.** (19 palabras)

`ch3.s5.text` — **En los trenes chinos la gente roncaba. Llegábamos quejándonos de no haber dormido. Yo llegué a HSK 1.** (18 palabras)

### Media

`ch3.video1.media` — `media-originales/china/IMG_1654.MOV`  
`ch3.video1.caption` — **Un tren de China. No sé si es el que perdí.**  
`ch3.video1.alt` — **Video de un paisaje urbano visto desde un tren, con vías, árboles y edificios al fondo.**

`ch3.video2.media` — `media-originales/china/IMG_1656.MOV`  
`ch3.video2.caption` — **Las vías sí son reales. El tren que perdí, no lo sé.**  
`ch3.video2.alt` — **Video de vías ferroviarias y edificios residenciales observados desde un tren.**

`ch3.photo3.media` — `media-originales/china/IMG_5626.jpeg`  
`ch3.photo3.caption` — **Una carretera entre montañas.**  
`ch3.photo3.alt` — **Vista elevada de una carretera de curvas cerradas entre montañas.**

`ch3.photo4.media` — `media-originales/retratos/IMG_1990.jpeg`  
`ch3.photo4.caption` — **Un rótulo de Chongqing.**  
`ch3.photo4.alt` — **Jorge aparece de noche frente a una arquitectura iluminada; hay un rótulo que identifica Chongqing.**

---

## ch4 — Dos verdades y una mentira

### Pantallas

`ch4.s1.title` — **Dos verdades y una mentira** (5 palabras)

`ch4.s2.text` — **Tres afirmaciones. Una es mentira.** (5 palabras)

`ch4.set_main.label` — **Set principal**

`ch4.set_main.statement_1` — **Como kiwi con cáscara.**

`ch4.set_main.statement_2` — **Me lancé de uno de los bungees más altos del mundo.**

`ch4.set_main.statement_3` — **Ya corrí un maratón completo.**

`ch4.reveal.text` — **La mentira es la tercera: entreno para un maratón, pero todavía no he corrido uno completo.** (16 palabras)

---

## ch5 — Adrenalina

### Pantallas

`ch5.s1.title` — **Adrenalina** (1 palabra)

`ch5.s2.text` — **En Zhangjiajie me lancé de uno de los bungees más altos del mundo. El cuerpo no quería saltar.** (14 palabras)

`ch5.s3.text` — **En Puerto Vallarta, aproximadamente en junio de 2025, salté en paracaídas desde una avioneta. El suelo se iba separando despacio y, al abrirse la compuerta, no había nada.** (28 palabras)

`ch5.paracaidas.label` — **PARACAÍDAS · PUERTO VALLARTA · JUN 2025 (aprox.)**

`ch5.s4.text` — **El instructor dijo: “Saca los pies, pero no los pongas en ningún lado. Déjalos colgando.” Horrible. Lo volvería a hacer.** (20 palabras)

`ch5.s5.text` — **Subí el Nevado de Colima sin querer rendirme.** (8 palabras)

### Media

`ch5.video1.media` — `media-originales/bungee/42b9307970527fcfa55069fe4ac99440.mp4`  
`ch5.video1.caption` — **Ángulo uno del salto.**  
`ch5.video1.alt` — **Video vertical de un salto de bungee con la cuerda, un parque y agua al fondo.**

`ch5.video2.media` — `media-originales/bungee/DJI_20251122151936_0047_D.MP4`  
`ch5.video2.caption` — **Descenso completo.**  
`ch5.video2.alt` — **Video lateral de un salto de bungee frente a una pared rocosa.**

`ch5.video3.media` — `media-originales/bungee/GX011892.MP4`  
`ch5.video3.caption` — **Vista amplia del puente.**  
`ch5.video3.alt` — **Video de plano amplio de un puente desde el que se realiza un salto de bungee.**

`ch5.photo4.media` — `media-originales/viajes-europa/IMG_8605.JPG`  
`ch5.photo4.caption` — **Salto en tándem en Puerto Vallarta.**  
`ch5.photo4.alt` — **Jorge realiza un salto en tándem sobre un paisaje visto desde el aire.**

`ch5.photo5.media` — `media-originales/viajes-europa/IMG_8582.JPG`  
`ch5.photo5.caption` — **La avioneta antes del salto.**  
`ch5.photo5.alt` — **Interior de una avioneta sobre un paisaje montañoso.**

`ch5.photo6.media` — `media-originales/colima/IMG_3423.jpeg`  
`ch5.photo6.caption` — **Nevado de Colima.**  
`ch5.photo6.alt` — **Jorge en una ladera de montaña, con el Nevado de Colima a la vista.**

---

## ch6 — Los míos

### Pantallas

`ch6.s1.title` — **Los míos** (2 palabras)

`ch6.s2.text` — **Elian escucha mis chistes malos con una paciencia que ya debería contar como deporte.** (14 palabras)

`ch6.s3.text` — **En casa hay dos hurones, una tortuga, un chihuahua, una gata y un pajarito. Los hurones muerden mis tobillos cuando salen al patio.** (23 palabras)

`ch6.s4.text` — **Me gusta reírme con amigos y compartir experiencias. Me gusta estar. Quiero que la gente sepa que tiene un hombro dónde apoyarse.** (22 palabras)

### Media

`ch6.video1.media` — `media-originales/mascotas/IMG_1185.MOV`  
`ch6.video1.caption` — **Un hurón explorando el patio.**  
`ch6.video1.alt` — **Video de un hurón explorando un jardín.**

`ch6.video2.media` — `media-originales/mascotas/IMG_4056.MOV`  
`ch6.video2.caption` — **Otro hurón en el patio.**  
`ch6.video2.alt` — **Video cercano de un hurón gris mientras una persona lo acaricia.**

`ch6.photo3.media` — `media-originales/mascotas/dd31f5f8-ef10-42a5-8673-080971578833.jpg`  
`ch6.photo3.caption` — **Dos hurones descansando juntos.**  
`ch6.photo3.alt` — **Dos hurones acurrucados juntos.**

---

## ch7 — Ahora mismo

### Pantallas

`ch7.s1.title` — **Ahora mismo** (2 palabras)

`ch7.s2.title` — **Cuatro películas que dicen algo, aunque no necesariamente lo mismo.** (10 palabras)

`ch7.poster1.title` — **Incantation**

`ch7.poster2.title` — **Loco México Mágico**

`ch7.poster3.title` — **Los insólitos peces gato**

`ch7.poster4.title` — **Tropic Thunder**

`ch7.s3.text` — **Café americano. No tomo café en la tarde: como un señor.** (11 palabras)

`ch7.s4.title` — **Comida** (1 palabra)

`ch7.s4.text` — **Amo la farofa. De la comida mexicana: chilaquiles, sotol y carne seca. Quien venga tiene que probarlos. El sushi sigue apareciendo.** (20 palabras)

`ch7.s4.layout` — **Tarjeta tipográfica, sin fotografía de comida.**

`ch7.s5.text` — **Ahora armo un viaje a Brasil: São Paulo y Río de Janeiro. El itinerario ya tiene más personalidad que yo.** (20 palabras)

### Media

`ch7.photo1.media` — `media-originales/viajes-europa/IMG_1116.jpeg`  
`ch7.photo1.caption` — **Una pausa entre películas y planes.**  
`ch7.photo1.alt` — **Poza de agua turquesa entre formaciones rocosas.**

`ch7.photo2.media` — `media-originales/china/IMG_5747.jpeg`  
`ch7.photo2.caption` — **Un viaje puede empezar antes de salir.**  
`ch7.photo2.alt` — **Edificios tradicionales iluminados que se reflejan en el agua durante la noche.**

---

## ch8 — Lo que sigue

### Pantallas

`ch8.s1.title` — **Lo que sigue** (3 palabras)

`ch8.s2.text` — **Trabajo remoto: más margen para viajar, programar páginas y construir cosas como un BMO con Raspberry Pi.** (17 palabras)

`ch8.s3.text` — **Un Ironman. La meta suena ambiciosa; por eso mismo sigue escrita.** (11 palabras)

`ch8.s4.text` — **Más idiomas. El portugués va con diccionario y conjugaciones.** (9 palabras)

`ch8.s5.text` — **Después: Armenia, Pakistán, Medio Oriente, Rusia y más Latinoamérica. La lista no tiene prisa.** (14 palabras)

### Media

`ch8.photo1.media` — `media-originales/viajes-europa/IMG_0394.jpeg`  
`ch8.photo1.caption` — **Un lugar de otro viaje.**  
`ch8.photo1.alt` — **Arquitectura histórica de piedra y madera.**

`ch8.photo2.media` — `media-originales/corriendo/e14c0f20-0b97-486a-b683-f22fe0dc00ba.jpg`  
`ch8.photo2.caption` — **El entrenamiento sigue.**  
`ch8.photo2.alt` — **Jorge aparece en un podio con una medalla junto a un arco de meta.**

---

## ch9 — Cierre

### Pantallas

`ch9.s1.text` — **¿Crees que ya me conoces? ¿Falta algo?** (7 palabras)

`ch9.s2.text` — **Ya viste que soy muy cool. {{ch9.emoji}}** (8 palabras)

`ch9.emoji` — **😎**

`ch9.note` — **El portugués de esta página tuvo ayuda. El de los mensajes es todo mío (y del diccionario).**

No hay botón, CTA ni texto posterior.

### Media

`ch9.photo1.media` — `media-originales/retratos/IMG_5762.jpeg`
`ch9.photo1.alt` — **Jorge aparece de noche frente a arquitectura iluminada y agua.**

### Variantes de cierre

`ch9.variant_a` — **¿Crees que ya me conoces? ¿Qué falta?**

`ch9.variant_b` — **¿Ya me conoces un poco? Seguro falta algo.**

`ch9.variant_c` — **¿Alguna duda? Ya viste que soy muy cool.**

`ui.footer_copyright` — **Jorge**
`ui.footer_languages` — **EN · PT · 中文**
`ui.reset` — **Otra vez**
`ch1.paper.label` — **Cosas que hago y no sé defender**

---

## Preguntas abiertas

1. `ch0`: ¿qué variante de apertura se aprueba y la entrada será foto, tira de fotos o retrato con chelo?
2. `ch2`: ¿qué instrumento, título y artista corresponden a cada enlace de YouTube?
3. `ch3`: ¿`IMG_1654.MOV` o `IMG_1656.MOV` corresponde al tren del viaje perdido?
4. `ch5`: ¿se confirma que la fecha de Puerto Vallarta se publique como aproximadamente junio de 2025?
5. `ch6`: ¿existe una foto aprobada de Gabi que deba identificarse antes de nombrarla?
6. `ch7`: ¿se aprueban los cuatro títulos de películas y la tarjeta tipográfica de comida?
7. `ch9`: ¿se mantiene una sola foto final sin caption y cuál variante de cierre se usará?
