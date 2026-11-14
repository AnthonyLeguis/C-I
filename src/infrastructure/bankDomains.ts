// [CAPA 3 — INFRAESTRUCTURA] Dominios oficiales de las entidades bancarias venezolanas.
// Dueño: Williams (PR W1). Solo datos: aquí no se decide el riesgo; eso es emailHeuristics.ts (W3).
//
// ⚠️ Datos 100 % sintéticos salvo esta lista: los nombres y dominios reales se usan
// únicamente para detectar imitaciones (C&I.md §4.4). El banco de la demo es
// `banco-demo.com.ve`; ninguna persona ni correo de la demo usa datos reales.
//
// Cotejo de dominios: 13/11/2026 contra el sitio público de cada entidad. Banesco,
// Mercantil y Banco de Venezuela no respondieron desde la red de este entorno, pero
// su dominio consta en referencias públicas de la propia entidad.

export type BankEntityType = "ORGANISMO" | "BANCO" | "DEMO";

export interface BankEntity {
  /** Identificador estable para bitácora, dashboard y pruebas. */
  readonly id: string;
  /** Nombre visible de la entidad. */
  readonly nombre: string;
  readonly tipo: BankEntityType;
  /** Dominios canónicos, sin `www.` y en minúsculas. */
  readonly dominios: readonly string[];
}

export const BANK_ENTITIES = [
  {
    id: "BANCO_DEMO",
    nombre: "Banco Demo (banco sintético de la demostración)",
    tipo: "DEMO",
    dominios: ["banco-demo.com.ve"],
  },
  {
    id: "SUDEBAN",
    nombre: "SUDEBAN — Superintendencia de las Instituciones del Sector Bancario",
    tipo: "ORGANISMO",
    dominios: ["sudeban.gob.ve"],
  },
  {
    id: "BCV",
    nombre: "Banco Central de Venezuela",
    tipo: "ORGANISMO",
    dominios: ["bcv.org.ve"],
  },
  {
    id: "BANCO_DE_VENEZUELA",
    nombre: "Banco de Venezuela",
    tipo: "BANCO",
    dominios: ["bancodevenezuela.com"],
  },
  {
    id: "BANESCO",
    nombre: "Banesco Banco Universal",
    tipo: "BANCO",
    dominios: ["banesco.com"],
  },
  {
    id: "MERCANTIL",
    nombre: "Mercantil Banco Universal",
    tipo: "BANCO",
    dominios: ["mercantilbanco.com"],
  },
  {
    id: "BBVA_PROVINCIAL",
    nombre: "BBVA Provincial",
    tipo: "BANCO",
    dominios: ["provincial.com"],
  },
  {
    id: "BNC",
    nombre: "Banco Nacional de Crédito",
    tipo: "BANCO",
    dominios: ["bnc.com.ve"],
  },
  {
    id: "BANCO_EXTERIOR",
    nombre: "Banco Exterior",
    tipo: "BANCO",
    dominios: ["bancoexterior.com"],
  },
  {
    id: "SOFITASA",
    nombre: "Banco Sofitasa",
    tipo: "BANCO",
    dominios: ["sofitasa.com"],
  },
  {
    id: "BANCARIBE",
    nombre: "Bancaribe",
    tipo: "BANCO",
    dominios: ["bancaribe.com"],
  },
  {
    id: "BANCAMIGA",
    nombre: "Bancamiga",
    tipo: "BANCO",
    dominios: ["bancamiga.com"],
  },
  {
    id: "BANCO_CARONI",
    nombre: "Banco Caroní",
    tipo: "BANCO",
    dominios: ["bancocaroni.com"],
  },
  {
    id: "BANDES",
    nombre: "BANDES — Banco de Desarrollo Económico y Social de Venezuela",
    tipo: "BANCO",
    dominios: ["bandes.gob.ve"],
  },
  {
    id: "BANAVIH",
    nombre: "BANAVIH — Banco Nacional de Vivienda y Hábitat",
    tipo: "BANCO",
    dominios: ["banavih.gob.ve"],
  },
  {
    id: "BANGENTE",
    nombre: "Bangente, banco microfinanciero",
    tipo: "BANCO",
    dominios: ["bangente.com.ve"],
  },
] as const satisfies readonly BankEntity[];

/** Lista plana de dominios oficiales (sin `www.`). */
export const OFFICIAL_DOMAINS: readonly string[] = BANK_ENTITIES.flatMap((entity) => entity.dominios);

const OFFICIAL_DOMAIN_SET: ReadonlySet<string> = new Set(OFFICIAL_DOMAINS);

/**
 * Normaliza un dominio o una dirección de correo a su forma canónica:
 * minúsculas, sin esquema, sin ruta, sin puerto, sin usuario y sin punto final.
 * Devuelve `null` si no es un dominio válido.
 */
export function normalizeDomain(raw: string): string | null {
  let value = raw.trim().toLowerCase();
  if (value.length === 0) return null;

  // Admite "Nombre <usuario@dominio.com>" y "usuario@dominio.com".
  const at = value.lastIndexOf("@");
  if (at >= 0) value = value.slice(at + 1);

  // Admite URLs completas.
  const scheme = value.indexOf("://");
  if (scheme >= 0) value = value.slice(scheme + 3);

  const path = value.search(/[/?#]/);
  if (path >= 0) value = value.slice(0, path);

  const port = value.indexOf(":");
  if (port >= 0) value = value.slice(0, port);

  value = value.replace(/\.+$/, "");
  if (value.length === 0 || value.length > 253) return null;

  const labels = value.split(".");
  if (labels.length < 2) return null;

  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return null;
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)) return null;
  }

  return value;
}

function isSubdomainOf(domain: string, official: string): boolean {
  return domain.endsWith(`.${official}`);
}

/** Devuelve la entidad oficial a la que pertenece el dominio (o `null`). */
export function findOfficialEntity(raw: string): BankEntity | null {
  const domain = normalizeDomain(raw);
  if (domain === null) return null;

  for (const entity of BANK_ENTITIES) {
    for (const official of entity.dominios) {
      if (domain === official || isSubdomainOf(domain, official)) return entity;
    }
  }

  return null;
}

/** `true` si el dominio es exactamente uno oficial o un subdominio suyo. */
export function isOfficialDomain(raw: string): boolean {
  const domain = normalizeDomain(raw);
  if (domain === null) return false;
  if (OFFICIAL_DOMAIN_SET.has(domain)) return true;
  return findOfficialEntity(domain) !== null;
}
