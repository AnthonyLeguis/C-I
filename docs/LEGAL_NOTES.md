# ⚖️ Notas legales de C&I (trazabilidad del catálogo)

> Dueño: Williams (PR **W1**). Este documento respalda `src/domain/legalCatalog.ts`:
> **cada referencia del catálogo tiene aquí su fuente**. Si una norma no se pudo
> cotejar, se cita **sin número de artículo**.

- **Última verificación:** 13/11/2026.
- **Método:** se consultó el texto publicado de cada norma y se copió el artículo
  pertinente. La columna “¿Artículos?” indica si el catálogo puede citar números de
  artículo (`articulosVerificados: true` en `LEGAL_SOURCES`).
- **Advertencia:** este material es orientativo y no constituye asesoría jurídica.
  La calificación definitiva de un caso corresponde a la autoridad competente.

## 1. Fuentes verificadas

| Clave | Norma | Publicación | Enlace consultado | ¿Artículos? |
|---|---|---|---|---|
| `LEDI` | Ley Especial contra los Delitos Informáticos | Gaceta Oficial N° 37.313 del 30/10/2001 | [TSJ — texto sancionado](https://historico.tsj.gob.ve/legislacion/ledi.htm) | Sí |
| `CONSTITUCION` | Constitución de la República Bolivariana de Venezuela | Gaceta Oficial N° 36.860 del 30/12/1999; reforma: Gaceta Oficial Extraordinaria N° 5.908 del 19/02/2009 | [PDBA — texto consolidado](https://pdba.georgetown.edu/Constitutions/Venezuela/vigente.html) | Sí |
| `MENSAJES_DATOS` | Ley sobre Mensajes de Datos y Firmas Electrónicas | Gaceta Oficial N° 37.148 del 28/02/2001 | [TSJ — texto del Decreto-Ley](https://historico.tsj.gob.ve/legislacion/dmdfe.htm) | Sí |
| `INFOGOBIERNO` | Ley de Infogobierno | Gaceta Oficial N° 40.274 del 17/10/2013 | [Wikisource — texto con referencia de Gaceta](https://es.wikisource.org/wiki/Ley_de_Infogobierno) | Sí |
| `SUDEBAN_01907` | SUDEBAN — Normativa de tecnología de la información, servicios financieros desmaterializados, banca electrónica, virtual y en línea | Circular N° SBIF-DSB-II-GGTI-GRT-01907 del 30/01/2008 | [PDF en el sitio de SUDEBAN](https://sudeban.gob.ve/wp-content/uploads/NORMAS_PRUDENCIALES/26-LA-ADECUADA-TECNOLOGIA-DE-LA-INFORMACION/26-4-CC-SBIF-DSB-II-GGTI-GRT-01907.pdf) | No |
| `SUDEBAN_641_10` | SUDEBAN — Normas que regulan el uso de los servicios de Banca Electrónica | Resolución N° 641.10 del 23/12/2010, Gaceta Oficial N° 39.597 del 19/01/2011 | [PDF en el sitio de SUDEBAN](https://sudeban.gob.ve/wp-content/uploads/NORMAS_PRUDENCIALES/26-LA-ADECUADA-TECNOLOGIA-DE-LA-INFORMACION/26-5-RES-641-10.pdf) | No |
| `SUDEBAN_FINTECH` | SUDEBAN — Normas que regulan los servicios de tecnología financiera (FINTECH) | Resolución N° 001.21 del 04/01/2021, Gaceta Oficial N° 42.162 del 06/07/2021 | [Índice oficial de normativas de SUDEBAN](https://sudeban.gob.ve/index.php/normativas/) | No |

> Los enlaces de SUDEBAN se localizaron en el índice oficial de
> [normativas prudenciales](https://sudeban.gob.ve/index.php/normativas/), sección
> “La adecuada tecnología de la información” (26) y “Servicios de Tecnología
> Financiera (FINTECH)” (43.1).

## 2. Ley Especial contra los Delitos Informáticos (`LEDI`)

Texto cotejado en el portal del TSJ. Artículos usados por el catálogo:

| Artículo | Contenido verificado (síntesis) | Indicadores del catálogo |
|---|---|---|
| **Art. 6** | *Acceso indebido:* quien sin autorización o excediéndola acceda, intercepte, interfiera o use un sistema que utilice tecnologías de información. | `SOLICITUD_CREDENCIALES`, `SUPLANTACION_IDENTIDAD`, `ACCESO_INDEBIDO` |
| **Art. 7** | *Sabotaje o daño a sistemas:* destruir, dañar, modificar o alterar el funcionamiento de un sistema o de la data que contiene. | `ADJUNTO_PELIGROSO` |
| **Art. 10** | *Posesión de equipos o prestación de servicios de sabotaje:* importar, fabricar, poseer, distribuir, vender o usar equipos o programas destinados a vulnerar la seguridad de un sistema, u ofrecer servicios con ese fin. | `ADJUNTO_PELIGROSO` |
| **Art. 14** | *Fraude:* mediante uso indebido de tecnologías de información, insertar instrucciones falsas o fraudulentas que produzcan un provecho injusto en perjuicio ajeno. | `FRAUDE`, `CAMBIO_DATOS_BANCARIOS`, `TRANSFERENCIA_URGENTE` |
| **Art. 15** | *Obtención indebida de bienes o servicios:* usar indebidamente tecnologías de información para obtener bienes o servicios sin asumir la contraprestación debida. | `FRAUDE`, `CAMBIO_DATOS_BANCARIOS`, `TRANSFERENCIA_URGENTE` |
| **Art. 20** | *Violación de la privacidad de la data o información de carácter personal:* apoderarse, usar, modificar o eliminar datos personales sin consentimiento. | `EXPOSICION_DATOS_PERSONALES` |
| **Art. 21** | *Violación de la privacidad de las comunicaciones:* acceder, capturar, interceptar, interferir, reproducir, modificar, desviar o eliminar un mensaje de datos o señal ajena. | `INTERCEPCION_COMUNICACIONES` |
| **Art. 26** | *Oferta engañosa:* ofrecer, comercializar o proveer bienes o servicios mediante tecnologías de información con alegaciones falsas o características inciertas que puedan perjudicar a los consumidores. | `DOMINIO_SUPLANTADO`, `NOMBRE_REMITENTE_INCONSISTENTE`, `REPLY_TO_DISTINTO`, `REPLY_TO_GRATUITO`, `ENLACE_TEXTO_DESTINO_DISTINTO`, `ACORTADOR_URL`, `URL_IP`, `URGENCIA_AMENAZA` |
| **Art. 27, numeral 1** | *Agravante:* se incrementa la pena si para el hecho se usó una contraseña ajena indebidamente obtenida, quitada, retenida o perdida. | `SOLICITUD_CREDENCIALES`, `ACCESO_INDEBIDO` |

> **Nota de curación:** la ley venezolana no tipifica la “suplantación de identidad”
> como delito autónomo con ese nombre. Por eso el catálogo relaciona la suplantación
> con acceso indebido (Art. 6), verificación de la emisión (Ley de Mensajes de Datos,
> Art. 9) y, cuando hay engaño o provecho, con fraude (Art. 14) u oferta engañosa
> (Art. 26). No se inventa un artículo inexistente.

## 3. Constitución de la República Bolivariana de Venezuela (`CONSTITUCION`)

Texto consolidado consultado en PDBA (Georgetown). Artículos usados:

| Artículo | Contenido verificado (síntesis) | Indicadores del catálogo |
|---|---|---|
| **Art. 28** | Derecho de acceso a la información y a los datos sobre sí mismo que consten en registros oficiales o privados, con las excepciones de ley; derecho a conocer su uso y finalidad y a solicitar actualización, rectificación o destrucción. | `EXPOSICION_DATOS_PERSONALES` |
| **Art. 48** | Se garantiza el secreto e inviolabilidad de las comunicaciones privadas en todas sus formas; solo pueden interferirse por orden de un tribunal competente. | `INTERCEPCION_COMUNICACIONES` |
| **Art. 60** | Derecho a la protección del honor, vida privada, intimidad, propia imagen, confidencialidad y reputación; la ley limitará el uso de la informática para garantizar esos derechos. | `EXPOSICION_DATOS_PERSONALES` |

> El catálogo usa los artículos 28 y 60 como anclas constitucionales del control y
> la protección de los datos personales.

## 4. Ley sobre Mensajes de Datos y Firmas Electrónicas (`MENSAJES_DATOS`)

Texto del Decreto-Ley consultado en el portal del TSJ. Artículos usados:

| Artículo | Contenido verificado (síntesis) | Indicadores del catálogo |
|---|---|---|
| **Art. 5** | Los mensajes de datos están sometidos a las disposiciones constitucionales y legales que garantizan la privacidad de las comunicaciones y el acceso a la información personal. | `INTERCEPCION_COMUNICACIONES` |
| **Art. 9** | El mensaje de datos se atribuye al emisor cuando fue enviado por él, por una persona autorizada o por un sistema programado por él. | `DOMINIO_SUPLANTADO`, `NOMBRE_REMITENTE_INCONSISTENTE`, `REPLY_TO_DISTINTO`, `AUTENTICACION_FALLIDA`, `SUPLANTACION_IDENTIDAD` |
| **Art. 16** | La firma electrónica que vincula al signatario con el mensaje tiene la misma validez y eficacia probatoria que la firma autógrafa, si cumple los requisitos de confidencialidad, no falsificación e integridad. | `AUTENTICACION_FALLIDA` (apoyo) |

> El catálogo no cita el Art. 16 en el mapa para no confundir “firma electrónica”
> con “autenticación de correo” (SPF/DKIM/DMARC). Se deja documentado como refuerzo
> del principio de atribución e integridad.

## 5. Ley de Infogobierno (`INFOGOBIERNO`)

Texto publicado en Wikisource con la referencia de la Gaceta Oficial N° 40.274.
Artículos usados:

| Artículo | Contenido verificado (síntesis) | Indicadores del catálogo |
|---|---|---|
| **Art. 23** | En las actuaciones electrónicas del Poder Público y el Poder Popular se debe garantizar la integridad, confidencialidad, autenticidad y disponibilidad de la información, documentos y comunicaciones electrónicas. | `EXPOSICION_DATOS_PERSONALES` (apoyo) |
| **Art. 25** | El uso de tecnologías de información comprende la protección del honor, vida privada, intimidad, propia imagen, confidencialidad y reputación de las personas. | `EXPOSICION_DATOS_PERSONALES` |

> **Alcance:** la Ley de Infogobierno rige al Poder Público y al Poder Popular. Se
> usa como **marco de referencia** de seguridad y protección de datos personales;
> no se presenta como norma que obligue directamente a un banco privado.

## 6. Normativa SUDEBAN (`SUDEBAN_01907`, `SUDEBAN_641_10`, `SUDEBAN_FINTECH`)

Estas normas se citan **completas, sin número de artículo**, porque en la
verificación del 13/11/2026 se localizó su ficha oficial y su PDF, pero no se
cotejó el texto articulado completo. El catálogo las usa para el deber de operar
los canales electrónicos con controles de seguridad y por canales oficiales.

| Clave | Norma y publicación | Uso en el catálogo |
|---|---|---|
| `SUDEBAN_01907` | Circular N° SBIF-DSB-II-GGTI-GRT-01907 del 30/01/2008 — Normativa de tecnología de la información, servicios financieros desmaterializados, banca electrónica, virtual y en línea. | Marco general de seguridad de canales electrónicos (apoyo). |
| `SUDEBAN_641_10` | Resolución N° 641.10 del 23/12/2010, Gaceta Oficial N° 39.597 del 19/01/2011 — Normas que regulan el uso de los servicios de Banca Electrónica. | `REPLY_TO_GRATUITO`, `AUTENTICACION_FALLIDA`: canales oficiales y controles de seguridad. |
| `SUDEBAN_FINTECH` | Resolución N° 001.21 del 04/01/2021, Gaceta Oficial N° 42.162 del 06/07/2021 — Normas que regulan los servicios de tecnología financiera (FINTECH). | Marco de referencia para canales digitales; no se usa en el mapa para no forzar su alcance. |

> Si en el futuro se coteja el texto articulado, se puede actualizar
> `articulosVerificados` a `true` y añadir el artículo exacto. Mientras tanto, la
> referencia debe decir “Norma completa (sin número de artículo)”.

## 7. Criterios de curación (para el jurado y para el agente QA)

1. **Cero invención:** la IA solo recibe el texto ya redactado de este catálogo; no
   puede añadir artículos ni normas. Si un indicador no tiene fundamento claro, se
   deja fuera del mapa antes que inventarlo.
2. **Fuente por referencia:** cada entrada de `LEGAL_CATALOG` apunta a una clave de
   `LEGAL_SOURCES`, y cada clave tiene publicación, URL y fecha de verificación.
3. **Artículos solo si se cotejaron:** las pruebas (`test/legalCatalog.test.ts`)
   fallan si una referencia con “Art.” apunta a una fuente con
   `articulosVerificados: false`.
4. **SUDEBAN sin artículo:** se prefiere una referencia normativa general correcta a
   un número de artículo no verificado.
5. **Datos sintéticos:** los ejemplos de correo usan `banco-demo.com.ve`, cédulas
   `V-00.000.00X` y teléfonos `0412-0000000`; nunca datos de personas reales.

## 8. Cómo mantener este documento

1. Añadir la norma a `LEGAL_SOURCES` en `src/domain/legalCatalog.ts` con su URL,
   publicación y `verificadoEl`.
2. Cotejar el artículo en el texto publicado y anotarlo en la tabla correspondiente.
3. Añadir la entrada al indicador en `LEGAL_CATALOG`.
4. Ejecutar `npm run check`; las pruebas verifican fuentes, duplicados y que no se
   cite un artículo sin respaldo.
