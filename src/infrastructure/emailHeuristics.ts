// [CAPA 3 — INFRAESTRUCTURA] Reglas deterministas del motor de correo.
// Dueño: Williams (PR W3). Pesos de referencia: docs/C&I.md §4.2.1.
//
// "Las reglas deciden, la IA explica": este módulo produce un score 0–100 y los
// indicadores en español. No usa IA, no toca D1 y no inventa fundamento legal:
// deja las claves (`legalIndicators`) para que W4 las traduzca con W1.

import type { Indicator, IndicatorCategory } from "../domain/types";
import type { LegalIndicatorId } from "../domain/legalCatalog";
import { BANK_ENTITIES, findOfficialEntity, normalizeDomain } from "./bankDomains";
import type { BankEntity } from "./bankDomains";

/** Pesos oficiales de referencia (docs/C&I.md §4.2.1). */
export const HEURISTIC_WEIGHTS = {
  DOMAIN_IMITATION: 35,
  DANGEROUS_ATTACHMENT: 30,
  CREDENTIAL_REQUEST: 25,
  CEO_FRAUD: 25,
  AUTH_FAILURE: 20,
  SUSPICIOUS_LINK: 20,
  LINK_MISMATCH: 15,
  REPLY_TO: 15,
  URGENCY: 15,
  NAME_MISMATCH: 10,
  AUTH_ABSENT: 10,
  OFFICIAL_TRUST: -20,
} as const;

export interface HeuristicInput {
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  body: string;
  authResults?: string;
  attachments: string[];
  /** URLs ya extraídas por el parser (W2). */
  urls?: string[];
}

export interface HeuristicResult {
  /** Suma de pesos, acotada a 0–100. */
  score: number;
  indicators: Indicator[];
  /** Señales que W4 traducirá a fundamento legal con `legalCatalog` (W1). */
  legalIndicators: LegalIndicatorId[];
}

interface AuthResults {
  spf?: string;
  dkim?: string;
  dmarc?: string;
}

interface Imitation {
  entity: BankEntity;
  officialDomain: string;
  kind: "LEVENSHTEIN" | "CONTIENE";
}

interface LinkMismatch {
  textHost: string;
  hrefHost: string;
}

interface SuspiciousLink {
  kind: "FAKE" | "SHORTENER" | "IP";
  host: string;
  description: string;
}

interface LinkAssessment {
  mismatches: LinkMismatch[];
  suspicious: SuspiciousLink[];
  hasFake: boolean;
  hasShortener: boolean;
  hasIp: boolean;
}

const FREE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.es",
  "ymail.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "mail.ru",
]);

const SHORTENER_DOMAINS: ReadonlySet<string> = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "tiny.cc",
  "lnkd.in",
  "rebrand.ly",
  "s.id",
  "trib.al",
  "dlvr.it",
  "shorte.st",
  "adf.ly",
  "bit.do",
  "mcaf.ee",
  "qr.ae",
  "x.co",
  "v.gd",
  "clck.ru",
  "cutt.us",
  "soo.gd",
  "surl.li",
]);

const EXECUTABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  "exe",
  "js",
  "jse",
  "scr",
  "bat",
  "cmd",
  "com",
  "pif",
  "vbs",
  "vbe",
  "jar",
  "msi",
  "ps1",
  "hta",
  "lnk",
  "iso",
  "img",
  "reg",
  "wsf",
  "wsh",
  "cpl",
  "gadget",
  "application",
  "app",
  "dll",
]);

const MACRO_EXTENSIONS: ReadonlySet<string> = new Set([
  "docm",
  "xlsm",
  "pptm",
  "dotm",
  "xltm",
  "potm",
  "ppam",
  "sldm",
]);

const DOCUMENT_EXTENSIONS: ReadonlySet<string> = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "txt",
  "rtf",
  "csv",
  "zip",
  "rar",
  "7z",
  "odt",
  "ods",
  ...MACRO_EXTENSIONS,
]);

const URGENCY_TERMS = [
  "suspension",
  "suspendido",
  "suspendida",
  "ultimo aviso",
  "inspeccion",
  "bloqueo",
  "bloqueado",
  "bloqueada",
  "24 horas",
  "urgente",
  "inmediato",
  "inmediatamente",
  "amenaza",
  "penalizacion",
  "cancelacion",
  "vencimiento",
] as const;

const CREDENTIAL_REQUEST = new RegExp(
  "(?:ingrese|introduzca|envie|proporcione|confirme|actualice|actualizar|valide|verifique|complete|escriba|solicite|solicita)" +
    "[\\s\\S]{0,120}?(?:clave|contrasena|credenciales|datos de acceso|usuario|pin|token|codigo de verificacion|password)" +
    "|(?:clave|contrasena|credenciales|datos de acceso|usuario|pin|token|codigo de verificacion|password)" +
    "[\\s\\S]{0,120}?(?:ingrese|introduzca|envie|proporcione|confirme|actualice|actualizar|valide|verifique|complete|escriba|solicite|solicita)",
  "i",
);

const TRANSFER_REQUEST = /\b(transferencia|transferir|transfiera|pago)\b[\s\S]{0,60}?\b(urgente|urgentemente|inmediata|inmediato|hoy mismo)\b/i;
const BANK_CHANGE_REQUEST = /\b(cambio|cambiar|cambie|actualizacion|actualice|actualizar|modifique|modificar)\b[\s\S]{0,80}?\b(datos bancarios|cuenta bancaria|cuenta de deposito|numero de cuenta|datos de la cuenta|cuenta del proveedor|cuenta de proveedor)\b/i;
const NEW_ACCOUNT_REQUEST = /\b(nueva|nuevo)\b[\s\S]{0,60}?\b(cuenta bancaria|cuenta de deposito|numero de cuenta|datos bancarios|cuenta del proveedor|cuenta de proveedor)\b/i;

interface BrandTokens {
  entity: BankEntity;
  tokens: readonly string[];
}

const BRAND_TOKENS: readonly BrandTokens[] = BANK_ENTITIES.map((entity) => {
  const tokens = new Set<string>();
  for (const domain of entity.dominios) {
    const label = domain.split(".")[0] ?? "";
    if (label.length >= 3) {
      tokens.add(label);
      const compact = label.replace(/[^a-z0-9]/g, "");
      if (compact.length >= 3) tokens.add(compact);
    }
  }
  return { entity, tokens: [...tokens] };
});

/**
 * Analiza el correo ya parseado y devuelve el score de reglas y sus indicadores.
 * Las señales de confianza (peso negativo) también se incluyen para explicar el
 * score, pero no generan fundamento legal.
 */
export function analyzeHeuristics(email: HeuristicInput): HeuristicResult {
  const indicators: Indicator[] = [];
  const legalIndicators: LegalIndicatorId[] = [];

  const addIndicator = (
    category: IndicatorCategory,
    text: string,
    weight: number,
    legal?: LegalIndicatorId | readonly LegalIndicatorId[],
  ): void => {
    indicators.push({ category, text, weight });
    if (legal === undefined) return;
    const codes: readonly LegalIndicatorId[] = typeof legal === "string" ? [legal] : legal;
    for (const code of codes) {
      if (!legalIndicators.includes(code)) legalIndicators.push(code);
    }
  };

  const senderDomain = normalizeDomain(email.fromAddress);
  const senderEntity = senderDomain === null ? null : findOfficialEntity(senderDomain);
  const auth = parseAuthResults(email.authResults);
  const text = normalizeText(`${email.subject}\n${email.body}`);

  // 1. Remitente: dominio que imita a una entidad oficial.
  if (senderDomain !== null && senderEntity === null) {
    const imitation = findImitation(senderDomain);
    if (imitation !== null) {
      addIndicator(
        "REMITENTE",
        `Suplantación: el dominio ${senderDomain} imita a ${imitation.entity.nombre} sin ser el oficial (${imitation.officialDomain})`,
        HEURISTIC_WEIGHTS.DOMAIN_IMITATION,
        ["DOMINIO_SUPLANTADO", "SUPLANTACION_IDENTIDAD"],
      );
    }
  }

  // 2. Remitente: nombre visible que no corresponde al dominio.
  const nameMismatch = describeNameMismatch(email, senderDomain, senderEntity);
  if (nameMismatch !== null) {
    addIndicator(
      "REMITENTE",
      nameMismatch,
      HEURISTIC_WEIGHTS.NAME_MISMATCH,
      "NOMBRE_REMITENTE_INCONSISTENTE",
    );
  }

  // 3. Reply-To distinto o gratuito.
  const replyDomain = email.replyTo === undefined ? null : normalizeDomain(email.replyTo);
  if (senderDomain !== null && replyDomain !== null) {
    const replyEntity = findOfficialEntity(replyDomain);
    const sameEntity =
      senderEntity !== null && replyEntity !== null && senderEntity.id === replyEntity.id;
    if (!sameEntity && replyDomain !== senderDomain) {
      if (FREE_EMAIL_DOMAINS.has(replyDomain)) {
        addIndicator(
          "REMITENTE",
          `Reply-To desvía a un correo gratuito (${replyDomain})`,
          HEURISTIC_WEIGHTS.REPLY_TO,
          "REPLY_TO_GRATUITO",
        );
      } else {
        addIndicator(
          "REMITENTE",
          `Reply-To distinto al remitente (${replyDomain})`,
          HEURISTIC_WEIGHTS.REPLY_TO,
          "REPLY_TO_DISTINTO",
        );
      }
    }
  }

  // 4. Autenticación del remitente.
  const failedParts: string[] = [];
  if (auth.spf === "fail") failedParts.push("SPF fail");
  if (auth.dmarc === "fail") failedParts.push("DMARC fail");
  if (failedParts.length > 0) {
    addIndicator(
      "AUTENTICACION",
      `Autenticación fallida: ${failedParts.join(", ")}`,
      HEURISTIC_WEIGHTS.AUTH_FAILURE,
      "AUTENTICACION_FALLIDA",
    );
  }

  const absentParts: string[] = [];
  if (auth.spf === "none") absentParts.push("SPF none");
  if (auth.dkim === "none") absentParts.push("DKIM none");
  if (absentParts.length > 0) {
    addIndicator(
      "AUTENTICACION",
      `Autenticación ausente: ${absentParts.join(", ")}`,
      HEURISTIC_WEIGHTS.AUTH_ABSENT,
      "AUTENTICACION_FALLIDA",
    );
  }

  // 5. Enlaces.
  const links = assessLinks(email.urls ?? [], email.body);
  if (links.mismatches.length > 0) {
    const first = links.mismatches[0];
    if (first !== undefined) {
      addIndicator(
        "ENLACES",
        `El texto del enlace muestra ${first.textHost} pero el destino real es ${first.hrefHost}`,
        HEURISTIC_WEIGHTS.LINK_MISMATCH,
        "ENLACE_TEXTO_DESTINO_DISTINTO",
      );
    }
  }

  if (links.suspicious.length > 0) {
    const details = links.suspicious
      .slice(0, 3)
      .map((item) => item.description)
      .join("; ");
    const legalCodes: LegalIndicatorId[] = [];
    if (links.hasFake) legalCodes.push("DOMINIO_SUPLANTADO");
    if (links.hasShortener) legalCodes.push("ACORTADOR_URL");
    if (links.hasIp) legalCodes.push("URL_IP");
    addIndicator(
      "ENLACES",
      `Enlace sospechoso: ${details}${links.suspicious.length > 3 ? "…" : ""}`,
      HEURISTIC_WEIGHTS.SUSPICIOUS_LINK,
      legalCodes,
    );
  }

  // 6. Adjuntos peligrosos.
  const seenAttachments = new Set<string>();
  for (const filename of email.attachments) {
    const clean = filename.trim();
    if (clean === "" || seenAttachments.has(clean)) continue;
    seenAttachments.add(clean);

    const kind = classifyAttachment(clean);
    if (kind === null) continue;

    const text =
      kind === "DOUBLE"
        ? `Adjunto con doble extensión ejecutable: ${clean}`
        : kind === "MACRO"
          ? `Adjunto con macros: ${clean}`
          : `Adjunto ejecutable: ${clean}`;
    addIndicator("ADJUNTOS", text, HEURISTIC_WEIGHTS.DANGEROUS_ATTACHMENT, "ADJUNTO_PELIGROSO");
  }

  // 7. Ingeniería social: urgencia y amenazas.
  const urgencyHits = URGENCY_TERMS.filter((term) => text.includes(term));
  if (urgencyHits.length > 0) {
    addIndicator(
      "INGENIERIA_SOCIAL",
      `Urgencia o amenaza: ${urgencyHits.slice(0, 3).join(", ")}`,
      HEURISTIC_WEIGHTS.URGENCY,
      "URGENCIA_AMENAZA",
    );
  }

  // 8. Ingeniería social: petición de credenciales.
  if (CREDENTIAL_REQUEST.test(text)) {
    addIndicator(
      "INGENIERIA_SOCIAL",
      "Solicita credenciales o datos de acceso",
      HEURISTIC_WEIGHTS.CREDENTIAL_REQUEST,
      ["SOLICITUD_CREDENCIALES", "ACCESO_INDEBIDO"],
    );
  }

  // 9. Ingeniería social: fraude del CEO / cambio de datos bancarios.
  const transfer = TRANSFER_REQUEST.test(text);
  const bankChange = BANK_CHANGE_REQUEST.test(text);
  const newAccount = NEW_ACCOUNT_REQUEST.test(text);
  if (transfer || bankChange || newAccount) {
    const legalCodes: LegalIndicatorId[] = ["FRAUDE"];
    if (transfer || newAccount) legalCodes.push("TRANSFERENCIA_URGENTE");
    if (bankChange || newAccount) legalCodes.push("CAMBIO_DATOS_BANCARIOS");
    addIndicator(
      "INGENIERIA_SOCIAL",
      "Posible fraude del CEO: cambio de datos bancarios o transferencia urgente",
      HEURISTIC_WEIGHTS.CEO_FRAUD,
      legalCodes,
    );
  }

  // 10. Confianza: remitente oficial con autenticación completa.
  if (senderEntity !== null && auth.spf === "pass" && auth.dkim === "pass" && auth.dmarc === "pass") {
    addIndicator(
      "AUTENTICACION",
      `Remitente oficial (${senderEntity.nombre}) con SPF, DKIM y DMARC en pass`,
      HEURISTIC_WEIGHTS.OFFICIAL_TRUST,
    );
  }

  const total = indicators.reduce((sum, indicator) => sum + indicator.weight, 0);
  return {
    score: Math.max(0, Math.min(100, total)),
    indicators,
    legalIndicators,
  };
}

function parseAuthResults(value: string | undefined): AuthResults {
  if (value === undefined || value.trim() === "") return {};
  const lower = value.toLowerCase();
  const read = (name: string): string | undefined => {
    const match = new RegExp(`(?:^|[;\\s])${name}\\s*=\\s*([a-z]+)`).exec(lower);
    return match?.[1];
  };
  return { spf: read("spf"), dkim: read("dkim"), dmarc: read("dmarc") };
}

function findImitation(domain: string): Imitation | null {
  for (const entity of BANK_ENTITIES) {
    for (const official of entity.dominios) {
      if (levenshtein(domain, official) <= 2) {
        return { entity, officialDomain: official, kind: "LEVENSHTEIN" };
      }
    }
  }

  for (const brand of BRAND_TOKENS) {
    for (const token of brand.tokens) {
      if (domain.includes(token)) {
        return {
          entity: brand.entity,
          officialDomain: brand.entity.dominios[0] ?? "",
          kind: "CONTIENE",
        };
      }
    }
  }

  return null;
}

function describeNameMismatch(
  email: HeuristicInput,
  senderDomain: string | null,
  senderEntity: BankEntity | null,
): string | null {
  const fromName = email.fromName?.trim();
  if (fromName === undefined || fromName === "" || senderDomain === null) return null;

  const emailInName = /[^\s<>]+@[^\s<>]+/.exec(fromName);
  if (emailInName !== null) {
    const nameDomain = normalizeDomain(emailInName[0]);
    if (nameDomain !== null && nameDomain !== senderDomain) {
      return `El nombre visible muestra el correo ${nameDomain} pero el remitente real es ${senderDomain}`;
    }
  }

  const nameKey = normalizeText(fromName)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const nameCompact = nameKey.replace(/-/g, "");

  for (const brand of BRAND_TOKENS) {
    const mentioned = brand.tokens.some(
      (token) => nameKey.includes(token) || nameCompact.includes(token),
    );
    if (!mentioned) continue;
    if (senderEntity === null || senderEntity.id !== brand.entity.id) {
      return `El nombre visible menciona ${brand.entity.nombre} pero el dominio ${senderDomain} no le pertenece`;
    }
  }

  return null;
}

function assessLinks(urls: readonly string[], html: string): LinkAssessment {
  const mismatches: LinkMismatch[] = [];
  const suspicious: SuspiciousLink[] = [];
  const seenSuspicious = new Set<string>();
  const seenMismatch = new Set<string>();

  const addSuspicious = (kind: SuspiciousLink["kind"], host: string, description: string): void => {
    const key = `${kind}|${host}`;
    if (seenSuspicious.has(key)) return;
    seenSuspicious.add(key);
    suspicious.push({ kind, host, description });
  };

  for (const raw of urls) {
    const parsed = safeUrl(raw);
    if (parsed === null) continue;
    const host = normalizeHost(parsed.hostname);
    if (host === "" || findOfficialEntity(host) !== null) continue;

    if (isIpHost(host)) {
      addSuspicious("IP", host, `dirección IP ${host}`);
    } else if (isShortener(host)) {
      addSuspicious("SHORTENER", host, `acortador ${host}`);
    } else {
      const imitation = findImitation(host);
      if (imitation !== null) {
        addSuspicious(
          "FAKE",
          host,
          `dominio que imita a ${imitation.entity.nombre} (${host})`,
        );
      }
    }
  }

  for (const mismatch of findLinkMismatches(html)) {
    const key = `${mismatch.textHost}|${mismatch.hrefHost}`;
    if (seenMismatch.has(key)) continue;
    seenMismatch.add(key);
    mismatches.push(mismatch);
  }

  return {
    mismatches,
    suspicious,
    hasFake: suspicious.some((item) => item.kind === "FAKE"),
    hasShortener: suspicious.some((item) => item.kind === "SHORTENER"),
    hasIp: suspicious.some((item) => item.kind === "IP"),
  };
}

const ANCHOR_PATTERN = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

function findLinkMismatches(html: string): LinkMismatch[] {
  const result: LinkMismatch[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(ANCHOR_PATTERN)) {
    const href = match[1] ?? "";
    const visibleText = stripHtml(match[2] ?? "");
    const visibleHost = extractVisibleHost(visibleText);
    if (visibleHost === null) continue;

    const parsed = safeUrl(href);
    if (parsed === null) continue;
    const hrefHost = normalizeHost(parsed.hostname);
    if (hrefHost === "" || sameSite(visibleHost, hrefHost)) continue;

    const key = `${visibleHost}|${hrefHost}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ textHost: visibleHost, hrefHost });
  }

  return result;
}

function extractVisibleHost(text: string): string | null {
  const urlMatch = /https?:\/\/[^\s<>"']+/i.exec(text);
  if (urlMatch !== null) {
    const parsed = safeUrl(urlMatch[0]);
    return parsed === null ? null : normalizeHost(parsed.hostname);
  }

  const domainMatch = /(?:^|[^\w@])((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+)/i.exec(text);
  if (domainMatch === null) return null;
  return normalizeDomain(domainMatch[1] ?? "");
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function sameSite(a: string, b: string): boolean {
  const hostA = stripWww(a);
  const hostB = stripWww(b);
  return hostA === hostB || hostA.endsWith(`.${hostB}`) || hostB.endsWith(`.${hostA}`);
}

function stripWww(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}

function safeUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, "");
}

function isIpHost(host: string): boolean {
  if (host.startsWith("[") && host.endsWith("]")) return true;
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isShortener(host: string): boolean {
  for (const domain of SHORTENER_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return true;
  }
  return false;
}

function classifyAttachment(filename: string): "DOUBLE" | "MACRO" | "EXECUTABLE" | null {
  const base = filename.split(/[\\/]/).pop()?.toLowerCase() ?? "";
  const parts = base.split(".").filter((part) => part !== "");
  if (parts.length < 2) return null;

  const last = parts[parts.length - 1] ?? "";
  const previous = parts[parts.length - 2] ?? "";

  if (EXECUTABLE_EXTENSIONS.has(last) && DOCUMENT_EXTENSIONS.has(previous)) return "DOUBLE";
  if (MACRO_EXTENSIONS.has(last)) return "MACRO";
  if (EXECUTABLE_EXTENSIONS.has(last)) return "EXECUTABLE";
  return null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const deletion = (previous[j] ?? 0) + 1;
      const insertion = (current[j - 1] ?? 0) + 1;
      const substitution = (previous[j - 1] ?? 0) + cost;
      current[j] = Math.min(deletion, insertion, substitution);
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j] ?? 0;
  }

  return previous[b.length] ?? 0;
}
