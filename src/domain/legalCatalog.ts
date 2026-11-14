// [CAPA 1 — DOMINIO] Catálogo legal curado: indicador técnico → norma aplicable.
// Dueño: Williams (PR W1). Sin imports externos (C&I.md §4.4).
//
// Regla de oro (cero invención legal): la IA NUNCA escribe números de artículo ni
// nombres de normas. Todo fundamento sale de este catálogo, que solo cita artículos
// cotejados con el texto publicado. La trazabilidad de cada fuente está en
// `docs/LEGAL_NOTES.md` y en `LEGAL_SOURCES`.
//
// Este catálogo es orientativo y no constituye asesoría jurídica: la calificación
// definitiva de un caso corresponde a la autoridad competente.

import type { LegalBasis } from "./types";

/** Indicadores técnicos que pueden producir un fundamento legal. */
export const LEGAL_INDICATOR_IDS = [
  "DOMINIO_SUPLANTADO",
  "NOMBRE_REMITENTE_INCONSISTENTE",
  "REPLY_TO_DISTINTO",
  "REPLY_TO_GRATUITO",
  "AUTENTICACION_FALLIDA",
  "ENLACE_TEXTO_DESTINO_DISTINTO",
  "ACORTADOR_URL",
  "URL_IP",
  "ADJUNTO_PELIGROSO",
  "URGENCIA_AMENAZA",
  "SOLICITUD_CREDENCIALES",
  "CAMBIO_DATOS_BANCARIOS",
  "TRANSFERENCIA_URGENTE",
  "SUPLANTACION_IDENTIDAD",
  "EXPOSICION_DATOS_PERSONALES",
  "ACCESO_INDEBIDO",
  "FRAUDE",
  "INTERCEPCION_COMUNICACIONES",
] as const;

export type LegalIndicatorId = (typeof LEGAL_INDICATOR_IDS)[number];

/** Claves de las fuentes legales verificadas. */
export const LEGAL_SOURCE_IDS = [
  "LEDI",
  "CONSTITUCION",
  "MENSAJES_DATOS",
  "INFOGOBIERNO",
  "SUDEBAN_01907",
  "SUDEBAN_641_10",
  "SUDEBAN_FINTECH",
] as const;

export type LegalSourceId = (typeof LEGAL_SOURCE_IDS)[number];

export interface LegalSource {
  readonly id: LegalSourceId;
  readonly titulo: string;
  readonly publicacion: string;
  /** Enlace consultado para cotejar el texto. */
  readonly url: string;
  /** Fecha ISO de la última verificación. */
  readonly verificadoEl: string;
  /** `true` solo si se cotejó el texto articulado; habilita citar artículos. */
  readonly articulosVerificados: boolean;
  readonly nota: string;
}

export interface LegalCatalogEntry {
  readonly norma: string;
  readonly referencia: string;
  readonly relacion: string;
  readonly sourceId: LegalSourceId;
}

export const LEGAL_SOURCES = {
  LEDI: {
    id: "LEDI",
    titulo: "Ley Especial contra los Delitos Informáticos",
    publicacion: "Gaceta Oficial N° 37.313 del 30/10/2001",
    url: "https://historico.tsj.gob.ve/legislacion/ledi.htm",
    verificadoEl: "2026-11-13",
    articulosVerificados: true,
    nota: "Texto sancionado publicado por el TSJ. Se cotejaron los artículos 6, 7, 10, 14, 15, 20, 21, 26 y 27.",
  },
  CONSTITUCION: {
    id: "CONSTITUCION",
    titulo: "Constitución de la República Bolivariana de Venezuela",
    publicacion:
      "Gaceta Oficial N° 36.860 del 30/12/1999; reforma: Gaceta Oficial Extraordinaria N° 5.908 del 19/02/2009",
    url: "https://pdba.georgetown.edu/Constitutions/Venezuela/vigente.html",
    verificadoEl: "2026-11-13",
    articulosVerificados: true,
    nota: "Texto consolidado de PDBA (Georgetown). Se cotejaron los artículos 28, 48 y 60.",
  },
  MENSAJES_DATOS: {
    id: "MENSAJES_DATOS",
    titulo: "Ley sobre Mensajes de Datos y Firmas Electrónicas",
    publicacion: "Gaceta Oficial N° 37.148 del 28/02/2001",
    url: "https://historico.tsj.gob.ve/legislacion/dmdfe.htm",
    verificadoEl: "2026-11-13",
    articulosVerificados: true,
    nota: "Decreto-Ley publicado por el TSJ. Se cotejaron los artículos 5, 9 y 16.",
  },
  INFOGOBIERNO: {
    id: "INFOGOBIERNO",
    titulo: "Ley de Infogobierno",
    publicacion: "Gaceta Oficial N° 40.274 del 17/10/2013",
    url: "https://es.wikisource.org/wiki/Ley_de_Infogobierno",
    verificadoEl: "2026-11-13",
    articulosVerificados: true,
    nota: "Texto publicado en Wikisource con la referencia de Gaceta. Se cotejaron los artículos 23 y 25.",
  },
  SUDEBAN_01907: {
    id: "SUDEBAN_01907",
    titulo:
      "SUDEBAN — Normativa de tecnología de la información, servicios financieros desmaterializados, banca electrónica, virtual y en línea",
    publicacion: "Circular N° SBIF-DSB-II-GGTI-GRT-01907 del 30/01/2008",
    url: "https://sudeban.gob.ve/wp-content/uploads/NORMAS_PRUDENCIALES/26-LA-ADECUADA-TECNOLOGIA-DE-LA-INFORMACION/26-4-CC-SBIF-DSB-II-GGTI-GRT-01907.pdf",
    verificadoEl: "2026-11-13",
    articulosVerificados: false,
    nota: "Norma citada completa. No se cita número de artículo porque no se cotejó el texto articulado.",
  },
  SUDEBAN_641_10: {
    id: "SUDEBAN_641_10",
    titulo: "SUDEBAN — Normas que regulan el uso de los servicios de Banca Electrónica",
    publicacion: "Resolución N° 641.10 del 23/12/2010, Gaceta Oficial N° 39.597 del 19/01/2011",
    url: "https://sudeban.gob.ve/wp-content/uploads/NORMAS_PRUDENCIALES/26-LA-ADECUADA-TECNOLOGIA-DE-LA-INFORMACION/26-5-RES-641-10.pdf",
    verificadoEl: "2026-11-13",
    articulosVerificados: false,
    nota: "Norma citada completa. No se cita número de artículo porque no se cotejó el texto articulado.",
  },
  SUDEBAN_FINTECH: {
    id: "SUDEBAN_FINTECH",
    titulo: "SUDEBAN — Normas que regulan los servicios de tecnología financiera (FINTECH)",
    publicacion: "Resolución N° 001.21 del 04/01/2021, Gaceta Oficial N° 42.162 del 06/07/2021",
    url: "https://sudeban.gob.ve/index.php/normativas/",
    verificadoEl: "2026-11-13",
    articulosVerificados: false,
    nota: "Norma citada completa. El enlace corresponde al índice oficial de normativas de SUDEBAN.",
  },
} as const satisfies Record<LegalSourceId, LegalSource>;

/**
 * Mapa curado. Cada indicador apunta a una o más normas; `getLegalBasis` elimina
 * duplicados para que el dictamen no repita la misma referencia.
 */
export const LEGAL_CATALOG = {
  DOMINIO_SUPLANTADO: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion:
        "El dominio que imita a una entidad financiera presenta una identidad falsa y puede inducir a error a la persona destinataria.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.MENSAJES_DATOS.titulo,
      referencia: "Art. 9 (Verificación de la emisión del mensaje de datos)",
      relacion:
        "Un mensaje solo se atribuye a su emisor cuando consta que provino de él o de una persona autorizada; la suplantación del dominio rompe esa atribución.",
      sourceId: "MENSAJES_DATOS",
    },
  ],
  NOMBRE_REMITENTE_INCONSISTENTE: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion:
        "El nombre visible que no coincide con el dominio real oculta la identidad de quien envía y puede constituir una alegación falsa.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.MENSAJES_DATOS.titulo,
      referencia: "Art. 9 (Verificación de la emisión del mensaje de datos)",
      relacion:
        "La inconsistencia entre nombre y dominio impide verificar que el mensaje provenga efectivamente de la entidad que aparenta.",
      sourceId: "MENSAJES_DATOS",
    },
  ],
  REPLY_TO_DISTINTO: [
    {
      norma: LEGAL_SOURCES.MENSAJES_DATOS.titulo,
      referencia: "Art. 9 (Verificación de la emisión del mensaje de datos)",
      relacion:
        "El Reply-To desvía la respuesta a una dirección distinta de la emisora, lo que impide confirmar la procedencia real del mensaje.",
      sourceId: "MENSAJES_DATOS",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion: "La dirección de respuesta ajena a la entidad aparentada puede inducir a error sobre quién recibe la información.",
      sourceId: "LEDI",
    },
  ],
  REPLY_TO_GRATUITO: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion:
        "Una entidad bancaria no gestiona comunicaciones institucionales desde un correo gratuito; hacerlo supone aparentar una identidad que no corresponde.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.SUDEBAN_641_10.titulo,
      referencia: "Norma completa (sin número de artículo)",
      relacion:
        "Los servicios de banca electrónica deben operar por canales oficiales y controlados; un correo gratuito como Reply-To es ajeno a ese canal.",
      sourceId: "SUDEBAN_641_10",
    },
  ],
  AUTENTICACION_FALLIDA: [
    {
      norma: LEGAL_SOURCES.MENSAJES_DATOS.titulo,
      referencia: "Art. 9 (Verificación de la emisión del mensaje de datos)",
      relacion:
        "SPF, DKIM o DMARC fallidos debilitan la atribución del mensaje al dominio emisor y contradicen la verificación de procedencia que exige la norma.",
      sourceId: "MENSAJES_DATOS",
    },
    {
      norma: LEGAL_SOURCES.SUDEBAN_641_10.titulo,
      referencia: "Norma completa (sin número de artículo)",
      relacion:
        "La normativa de banca electrónica exige controles de seguridad sobre los canales; un correo bancario sin autenticación no supera esos controles.",
      sourceId: "SUDEBAN_641_10",
    },
    {
      norma: LEGAL_SOURCES.SUDEBAN_01907.titulo,
      referencia: "Norma completa (sin número de artículo)",
      relacion:
        "La normativa de tecnología de la información exige controles de seguridad en los canales electrónicos; la falta de autenticación del remitente contradice ese deber.",
      sourceId: "SUDEBAN_01907",
    },
  ],
  ENLACE_TEXTO_DESTINO_DISTINTO: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion:
        "Un enlace cuyo texto visible no coincide con el destino real presenta información falsa sobre el sitio al que lleva.",
      sourceId: "LEDI",
    },
  ],
  ACORTADOR_URL: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion:
        "El acortador oculta el destino real del enlace e impide que la persona verifique a dónde se dirige antes de hacer clic.",
      sourceId: "LEDI",
    },
  ],
  URL_IP: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion:
        "Un enlace a una dirección IP en lugar de un dominio institucional oculta la identidad del sitio y puede inducir a error.",
      sourceId: "LEDI",
    },
  ],
  ADJUNTO_PELIGROSO: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 7 (Sabotaje o daño a sistemas)",
      relacion:
        "Un adjunto ejecutable o con macros puede destruir, dañar o alterar el funcionamiento de un sistema o de la información que contiene.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 10 (Posesión de equipos o prestación de servicios de sabotaje)",
      relacion:
        "Distribuir programas destinados a vulnerar la seguridad de un sistema está tipificado como delito informático.",
      sourceId: "LEDI",
    },
  ],
  URGENCIA_AMENAZA: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 26 (Oferta engañosa)",
      relacion:
        "La urgencia y la amenaza son maniobras para que la persona actúe sin verificar y pueden formar parte de una oferta o comunicación engañosa.",
      sourceId: "LEDI",
    },
  ],
  SOLICITUD_CREDENCIALES: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 6 (Acceso indebido)",
      relacion:
        "Solicitar la clave corporativa para acceder a un sistema sin autorización prepara un acceso indebido a sistemas que utilizan tecnologías de información.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 27, numeral 1 (Agravante por uso de contraseña ajena)",
      relacion:
        "El uso de una contraseña ajena indebidamente obtenida agrava la pena de los delitos informáticos.",
      sourceId: "LEDI",
    },
  ],
  CAMBIO_DATOS_BANCARIOS: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 14 (Fraude)",
      relacion:
        "El cambio de datos bancarios de un proveedor con instrucciones falsas busca obtener un provecho injusto en perjuicio ajeno.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 15 (Obtención indebida de bienes o servicios)",
      relacion:
        "La manipulación para obtener un pago o un bien sin la contraprestación debida encuadra en la obtención indebida de bienes o servicios.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.SUDEBAN_FINTECH.titulo,
      referencia: "Norma completa (sin número de artículo)",
      relacion:
        "Los servicios de tecnología financiera deben gestionar las órdenes y los datos de pago con controles de seguridad; un cambio de datos bancarios por un canal no oficial es ajeno a ese marco.",
      sourceId: "SUDEBAN_FINTECH",
    },
  ],
  TRANSFERENCIA_URGENTE: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 14 (Fraude)",
      relacion:
        "La orden de transferencia urgente con datos falsos puede producir un provecho injusto en perjuicio de la entidad o de un tercero.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 15 (Obtención indebida de bienes o servicios)",
      relacion:
        "El fraude del CEO busca que se pague o se transfiera un bien sin asumir la contraprestación debida.",
      sourceId: "LEDI",
    },
  ],
  SUPLANTACION_IDENTIDAD: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 6 (Acceso indebido)",
      relacion:
        "Hacerse pasar por otra persona para acceder a un sistema o a su información es una vía de acceso indebido.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.MENSAJES_DATOS.titulo,
      referencia: "Art. 9 (Verificación de la emisión del mensaje de datos)",
      relacion:
        "La suplantación impide acreditar que el mensaje provino del emisor que aparece en los encabezados.",
      sourceId: "MENSAJES_DATOS",
    },
  ],
  EXPOSICION_DATOS_PERSONALES: [
    {
      norma: LEGAL_SOURCES.CONSTITUCION.titulo,
      referencia: "Art. 60 (Protección de la vida privada, intimidad y confidencialidad)",
      relacion:
        "La exposición de datos personales afecta el derecho a la protección del honor, la vida privada, la intimidad y la confidencialidad.",
      sourceId: "CONSTITUCION",
    },
    {
      norma: LEGAL_SOURCES.CONSTITUCION.titulo,
      referencia: "Art. 28 (Acceso a la información y a los datos personales)",
      relacion:
        "Toda persona tiene derecho a acceder a los datos que sobre sí misma consten en registros y a conocer su uso y finalidad; la exposición no consentida afecta ese control.",
      sourceId: "CONSTITUCION",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 20 (Violación de la privacidad de la data o información de carácter personal)",
      relacion:
        "Apoderarse, utilizar, modificar o eliminar datos personales sin consentimiento está tipificado como delito informático.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.INFOGOBIERNO.titulo,
      referencia: "Art. 25 (De la protección de datos personales)",
      relacion:
        "El uso de tecnologías de información debe proteger el honor, la vida privada, la intimidad y la confidencialidad de las personas (marco del sector público).",
      sourceId: "INFOGOBIERNO",
    },
  ],
  ACCESO_INDEBIDO: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 6 (Acceso indebido)",
      relacion:
        "Acceder, interceptar, interferir o usar un sistema sin autorización o excediendo la autorización es un delito informático.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 27, numeral 1 (Agravante por uso de contraseña ajena)",
      relacion:
        "El uso de una contraseña ajena indebidamente obtenida agrava la responsabilidad penal.",
      sourceId: "LEDI",
    },
  ],
  FRAUDE: [
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 14 (Fraude)",
      relacion:
        "Insertar instrucciones falsas mediante tecnologías de información para obtener un provecho injusto en perjuicio ajeno es fraude informático.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 15 (Obtención indebida de bienes o servicios)",
      relacion:
        "Usar indebidamente tecnologías de información para obtener bienes o servicios sin pagar la contraprestación debida está tipificado como delito.",
      sourceId: "LEDI",
    },
  ],
  INTERCEPCION_COMUNICACIONES: [
    {
      norma: LEGAL_SOURCES.CONSTITUCION.titulo,
      referencia: "Art. 48 (Secreto e inviolabilidad de las comunicaciones privadas)",
      relacion:
        "Las comunicaciones privadas en todas sus formas son inviolables; solo pueden interferirse por orden de un tribunal competente.",
      sourceId: "CONSTITUCION",
    },
    {
      norma: LEGAL_SOURCES.LEDI.titulo,
      referencia: "Art. 21 (Violación de la privacidad de las comunicaciones)",
      relacion:
        "Acceder, capturar, interceptar, interferir, reproducir, modificar, desviar o eliminar un mensaje de datos ajeno es delito informático.",
      sourceId: "LEDI",
    },
    {
      norma: LEGAL_SOURCES.MENSAJES_DATOS.titulo,
      referencia: "Art. 5 (Sometimiento a la Constitución y a la ley)",
      relacion:
        "Los mensajes de datos están sometidos a las normas que garantizan la privacidad de las comunicaciones y el acceso a la información personal.",
      sourceId: "MENSAJES_DATOS",
    },
  ],
} as const satisfies Record<LegalIndicatorId, readonly LegalCatalogEntry[]>;

/**
 * Devuelve el fundamento legal del contrato (`norma`, `referencia`, `relacion`)
 * para los indicadores dados, sin duplicados y sin inventar referencias.
 */
export function getLegalBasis(indicators: readonly LegalIndicatorId[]): LegalBasis[] {
  const viewed = new Set<string>();
  const basis: LegalBasis[] = [];

  for (const indicator of indicators) {
    for (const entry of LEGAL_CATALOG[indicator]) {
      const key = `${entry.sourceId}|${entry.referencia}`;
      if (viewed.has(key)) continue;
      viewed.add(key);
      basis.push({
        norma: entry.norma,
        referencia: entry.referencia,
        relacion: entry.relacion,
      });
    }
  }

  return basis;
}
