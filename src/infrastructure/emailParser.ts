// [CAPA 3 — INFRAESTRUCTURA] Parser de correo: JSON del contrato o correo crudo.
// Dueño: Williams (PR W2).
//
// Extrae lo que necesitan las reglas (W3) y el analizador (W4): remitente,
// nombre visible, Reply-To, Return-Path, Authentication-Results, asunto, cuerpo,
// URLs y nombres de adjuntos. No decide riesgo ni toca la base de datos.
//
// El correo crudo se interpreta como RFC 5322 + MIME básico (multipart,
// base64, quoted-printable y palabras codificadas RFC 2047).

export interface ParsedEmail {
  /** Dirección del remitente (sin el nombre visible). */
  fromAddress: string;
  /** Nombre visible del remitente, si lo trae. */
  fromName?: string;
  replyTo?: string;
  returnPath?: string;
  authResults?: string;
  subject: string;
  body: string;
  /** URLs http(s) del cuerpo, sin duplicados y en orden de aparición. */
  urls: string[];
  /** Nombres de archivo adjuntos, sin duplicados. */
  attachments: string[];
}

/** Error de entrada controlado: el llamador puede responder 400 sin filtrar detalles. */
export class EmailParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailParseError";
  }
}

interface Mailbox {
  address: string;
  name?: string;
}

interface MimeContent {
  text?: string;
  html?: string;
  attachments: string[];
}

type HeaderMap = ReadonlyMap<string, readonly string[]>;

const EMAIL_ADDRESS = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"'`]+/gi;
const RFC_2047 = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;

/**
 * Punto de entrada único:
 * - un objeto (o un string JSON) con el contrato de `POST /mail/analyze`;
 * - un correo crudo con encabezados y cuerpo.
 */
export function parseEmail(input: unknown): ParsedEmail {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        return parseEmailJson(parsed);
      } catch (error) {
        if (error instanceof EmailParseError) throw error;
        // Si no es JSON válido, se intenta como correo crudo.
      }
    }
    return parseRawEmail(input);
  }

  return parseEmailJson(input);
}

/** Interpreta el JSON de `POST /mail/analyze` (nombres snake_case del contrato). */
export function parseEmailJson(input: unknown): ParsedEmail {
  if (!isRecord(input)) {
    throw new EmailParseError("El JSON del correo debe ser un objeto.");
  }

  const fromAddress = readRequiredString(input, "from_address");
  const body = readOptionalString(input, "body") ?? "";
  const subject = readOptionalString(input, "subject") ?? "";
  const fromName = readOptionalString(input, "from_name");
  const replyTo = readOptionalString(input, "reply_to");
  const returnPath = readOptionalString(input, "return_path");
  const authResults = readOptionalString(input, "auth_results");
  const attachments = readStringArray(input, "attachments");

  return {
    fromAddress,
    fromName,
    replyTo,
    returnPath,
    authResults,
    subject,
    body,
    urls: extractUrls(body),
    attachments,
  };
}

/** Interpreta un correo crudo (encabezados + cuerpo). */
export function parseRawEmail(raw: string): ParsedEmail {
  if (raw.trim() === "") {
    throw new EmailParseError("El correo está vacío.");
  }

  const { headerBlock, body } = splitMessage(raw);
  const headers = parseHeaders(headerBlock);
  const from = parseMailbox(getHeader(headers, "from"));

  if (from === undefined || !isEmailAddress(from.address)) {
    throw new EmailParseError("El correo no tiene un remitente (From) válido.");
  }

  const content = parseMimeContent(headers, body);
  const replyTo = parseMailbox(getHeader(headers, "reply-to"))?.address;
  const returnPath = parseMailbox(getHeader(headers, "return-path"))?.address;
  const authResults = getHeader(headers, "authentication-results");
  const subject = decodeHeaderValue(getHeader(headers, "subject") ?? "");

  return {
    fromAddress: from.address,
    fromName: from.name === undefined ? undefined : decodeHeaderValue(from.name),
    replyTo,
    returnPath,
    authResults,
    subject,
    body: content.text ?? content.html ?? "",
    urls: extractUrls(`${content.text ?? ""}\n${content.html ?? ""}`),
    attachments: dedupe(content.attachments),
  };
}

function splitMessage(raw: string): { headerBlock: string; body: string } {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const separator = normalized.indexOf("\n\n");
  if (separator === -1) {
    return { headerBlock: normalized, body: "" };
  }
  return {
    headerBlock: normalized.slice(0, separator),
    body: normalized.slice(separator + 2),
  };
}

function parseHeaders(block: string): Map<string, string[]> {
  const headers = new Map<string, string[]>();
  let current: string | undefined;

  for (const line of block.split("\n")) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      if (current !== undefined) {
        const values = headers.get(current);
        if (values !== undefined && values.length > 0) {
          const last = values.length - 1;
          values[last] = `${values[last] ?? ""} ${line.trim()}`;
        }
      }
      continue;
    }

    const colon = line.indexOf(":");
    if (colon <= 0) continue;

    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    const existing = headers.get(name);
    if (existing === undefined) headers.set(name, [value]);
    else existing.push(value);
    current = name;
  }

  return headers;
}

function getHeader(headers: HeaderMap, name: string): string | undefined {
  const values = headers.get(name.toLowerCase());
  if (values === undefined || values.length === 0) return undefined;
  return values[0];
}

function parseMailbox(value: string | undefined): Mailbox | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;

  const angle = /<([^<>]+)>/.exec(trimmed);
  if (angle !== null) {
    const address = (angle[1] ?? "").trim();
    if (!isEmailAddress(address)) return undefined;
    const before = trimmed.slice(0, angle.index).replace(/,\s*$/, "").trim();
    const name = stripQuotes(before);
    return name === "" ? { address } : { address, name };
  }

  const withComment = /^([^\s()]+@[^\s()]+)\s*\(([^)]*)\)/.exec(trimmed);
  if (withComment !== null) {
    const address = (withComment[1] ?? "").trim();
    if (!isEmailAddress(address)) return undefined;
    const name = (withComment[2] ?? "").trim();
    return name === "" ? { address } : { address, name };
  }

  const bare = /[^\s<>,;"]+@[^\s<>,;"]+/.exec(trimmed);
  if (bare !== null) {
    const address = bare[0] ?? "";
    if (isEmailAddress(address)) return { address };
  }

  return undefined;
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isEmailAddress(value: string): boolean {
  return EMAIL_ADDRESS.test(value);
}

function parseMimeContent(headers: HeaderMap, body: string): MimeContent {
  const contentType = getHeader(headers, "content-type");

  if (contentType !== undefined && /^multipart\//i.test(contentType.trim())) {
    const content: MimeContent = { attachments: [] };
    collectMultipart(body, contentType, content);
    return content;
  }

  const disposition = getHeader(headers, "content-disposition");
  const filename = extractFilename(headers);
  if (disposition !== undefined && /^attachment/i.test(disposition)) {
    return { attachments: filename === undefined ? [] : [filename] };
  }

  const isText = contentType === undefined || /^text\//i.test(contentType.trim());
  if (!isText) {
    return { attachments: filename === undefined ? [] : [filename] };
  }

  const decoded = decodeBody(body, getHeader(headers, "content-transfer-encoding"));
  const isHtml = contentType !== undefined && /^text\/html/i.test(contentType.trim());
  return {
    ...(isHtml ? { html: decoded } : { text: decoded }),
    attachments: filename === undefined ? [] : [filename],
  };
}

function collectMultipart(body: string, contentType: string, out: MimeContent): void {
  const boundary = parseHeaderParams(contentType).params.get("boundary");
  if (boundary === undefined || boundary === "") return;

  for (const rawPart of body.split(`--${boundary}`)) {
    const part = rawPart.replace(/^\n+/, "").replace(/\n+$/, "");
    if (part === "" || part === "--") continue;

    const { headerBlock, body: partBody } = splitMessage(part);
    if (!/^[A-Za-z][A-Za-z0-9-]*:/.test(headerBlock)) continue;

    const partHeaders = parseHeaders(headerBlock);
    const partType = getHeader(partHeaders, "content-type");

    if (partType !== undefined && /^multipart\//i.test(partType.trim())) {
      collectMultipart(partBody, partType, out);
      continue;
    }

    const disposition = getHeader(partHeaders, "content-disposition");
    const filename = extractFilename(partHeaders);
    if (filename !== undefined) out.attachments.push(filename);
    if (disposition !== undefined && /^attachment/i.test(disposition)) continue;

    const isText = partType === undefined || /^text\//i.test(partType.trim());
    if (!isText) continue;

    const decoded = decodeBody(partBody, getHeader(partHeaders, "content-transfer-encoding"));
    const isHtml = partType !== undefined && /^text\/html/i.test(partType.trim());
    if (isHtml) {
      if (out.html === undefined) out.html = decoded;
    } else if (out.text === undefined) {
      out.text = decoded;
    }
  }
}

function extractFilename(headers: HeaderMap): string | undefined {
  const fromDisposition = filenameFromParams(getHeader(headers, "content-disposition"));
  if (fromDisposition !== undefined) return fromDisposition;
  return filenameFromParams(getHeader(headers, "content-type"));
}

function filenameFromParams(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const params = parseHeaderParams(value).params;

  const extended = params.get("filename*");
  if (extended !== undefined) {
    const decoded = decodeExtendedValue(extended);
    if (decoded !== undefined) return decoded;
  }

  const plain = params.get("filename") ?? params.get("name");
  if (plain === undefined) return undefined;
  const decoded = decodeHeaderValue(plain).trim();
  return decoded === "" ? undefined : decoded;
}

function parseHeaderParams(value: string): { value: string; params: Map<string, string> } {
  const segments = value.split(";");
  const main = (segments[0] ?? "").trim().toLowerCase();
  const params = new Map<string, string>();

  for (const segment of segments.slice(1)) {
    const equals = segment.indexOf("=");
    if (equals <= 0) continue;
    const key = segment.slice(0, equals).trim().toLowerCase();
    let paramValue = segment.slice(equals + 1).trim();
    if (paramValue.length >= 2 && paramValue.startsWith("\"") && paramValue.endsWith("\"")) {
      paramValue = paramValue.slice(1, -1);
    }
    params.set(key, paramValue);
  }

  return { value: main, params };
}

function decodeExtendedValue(value: string): string | undefined {
  const parts = value.split("''");
  const encoded = parts.length > 1 ? parts.slice(1).join("''") : value;
  try {
    const decoded = decodeURIComponent(encoded).trim();
    return decoded === "" ? undefined : decoded;
  } catch {
    return undefined;
  }
}

function decodeBody(body: string, encoding: string | undefined): string {
  const normalized = (encoding ?? "").toLowerCase();
  let decoded = body;

  if (normalized.includes("base64")) decoded = decodeBase64Text(body);
  else if (normalized.includes("quoted-printable")) decoded = decodeQuotedPrintableText(body);

  return decoded.replace(/\n$/, "");
}

function decodeHeaderValue(value: string): string {
  return value.replace(
    RFC_2047,
    (_match: string, _charset: string, encoding: string, text: string): string => {
      if (encoding.toUpperCase() === "B") return decodeBase64Text(text);
      return decodeQuotedPrintableText(text.replace(/_/g, " "));
    },
  );
}

function decodeBase64Text(value: string): string {
  try {
    const binary = atob(value.replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder("utf-8", { fatal: false, ignoreBOM: false }).decode(bytes);
  } catch {
    return value;
  }
}

function decodeQuotedPrintableText(value: string): string {
  const withoutSoftBreaks = value.replace(/=\r?\n/g, "");
  const bytes: number[] = [];

  for (let index = 0; index < withoutSoftBreaks.length; index += 1) {
    const char = withoutSoftBreaks.charAt(index);
    if (char === "=") {
      const hex = withoutSoftBreaks.slice(index + 1, index + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(Number.parseInt(hex, 16));
        index += 2;
        continue;
      }
    }

    const code = char.charCodeAt(0);
    if (code <= 0x7f) {
      bytes.push(code);
    } else {
      for (const byte of new TextEncoder().encode(char)) bytes.push(byte);
    }
  }

  return new TextDecoder("utf-8", { fatal: false, ignoreBOM: false }).decode(Uint8Array.from(bytes));
}

function extractUrls(text: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const match of text.match(URL_PATTERN) ?? []) {
    const cleaned = cleanupUrl(match);
    if (cleaned === "" || seen.has(cleaned)) continue;
    seen.add(cleaned);
    urls.push(cleaned);
  }

  return urls;
}

function cleanupUrl(value: string): string {
  let url = value.trim();
  while (/[),.;:!?\]}]$/.test(url)) url = url.slice(0, -1);
  return url.replace(/&amp;/g, "&").replace(/&#38;/g, "&");
}

function dedupe(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new EmailParseError(`El correo no tiene el campo obligatorio "${key}".`);
  }
  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new EmailParseError(`El campo "${key}" debe ser texto.`);
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function readStringArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new EmailParseError(`El campo "${key}" debe ser una lista de textos.`);
  }

  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      throw new EmailParseError(`El campo "${key}" debe ser una lista de textos.`);
    }
    const trimmed = item.trim();
    if (trimmed !== "") result.push(trimmed);
  }
  return dedupe(result);
}
