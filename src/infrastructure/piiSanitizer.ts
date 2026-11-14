// [CAPA 3 — INFRAESTRUCTURA] Anonimizador de datos personales venezolanos (PR A1 · Anthony).
// Regla Zero-Leak PII: NADA llega a la IA ni a D1 sin pasar por aquí (C&I.md §4.4, CA4).
import type { PiiType } from "../domain/types";

interface PiiRule {
  type: PiiType;
  pattern: RegExp;
  mask: string;
}

// El orden importa: la cuenta (20 dígitos) va primero para que sus fragmentos no se confundan con teléfonos o cédulas.
const RULES: readonly PiiRule[] = [
  {
    type: "CUENTA_BANCARIA",
    // 20 dígitos que empiezan por 01 (código de banco), con o sin guiones/espacios: 0102-0000-00-0000000001
    pattern: /\b01\d{2}[- ]?\d{4}[- ]?\d{2}[- ]?\d{10}\b/g,
    mask: "[CUENTA_BANCARIA_PROTEGIDA]",
  },
  {
    type: "TELEFONO",
    // Móviles venezolanos: 0412-0000000 · 0414 000 0000 · +58 424 0000000 · 584160000000
    pattern: /(?:\+?58[- ]?|\b0)4(?:12|14|16|22|24|26)[- ]?\d{3}[- ]?\d{4}\b/g,
    mask: "[TELEFONO_PROTEGIDO]",
  },
  {
    type: "CEDULA",
    // V-00.000.001 · E-00000001 · v 1234567 · V00000001 (7 u 8 dígitos, con o sin puntos)
    pattern: /\b[VEve][- ]?\d{1,2}\.?\d{3}\.?\d{3}\b/g,
    mask: "[CEDULA_PROTEGIDA]",
  },
  {
    type: "CORREO_PERSONAL",
    // Solo correos de proveedores gratuitos: los corporativos (remitentes) se analizan como indicadores.
    pattern: /\b[\w.+-]+@(?:gmail|hotmail|outlook|yahoo|live|icloud|proton(?:mail)?)\.[a-z.]{2,}\b/gi,
    mask: "[CORREO_PERSONAL_PROTEGIDO]",
  },
];

export interface SanitizeResult {
  sanitized: string;
  detected: PiiType[];
  count: number;
}

/** Reemplaza cédulas, teléfonos, cuentas y correos personales por marcadores. Es idempotente. */
export function sanitizePii(text: string): SanitizeResult {
  let sanitized = text;
  const detected: PiiType[] = [];
  let count = 0;
  for (const rule of RULES) {
    const matches = sanitized.match(rule.pattern);
    if (matches && matches.length > 0) {
      detected.push(rule.type);
      count += matches.length;
      sanitized = sanitized.replace(rule.pattern, rule.mask);
    }
  }
  return { sanitized, detected, count };
}

/** Aplica sanitizePii a varios textos y une los tipos detectados (útil para asunto + cuerpo). */
export function sanitizeMany(texts: readonly string[]): { sanitized: string[]; detected: PiiType[]; count: number } {
  const all = texts.map(sanitizePii);
  const detected = [...new Set(all.flatMap((r) => r.detected))];
  return { sanitized: all.map((r) => r.sanitized), detected, count: all.reduce((n, r) => n + r.count, 0) };
}

/** true si el texto todavía contiene algún dato personal reconocible (para tests y auditoría). */
export function containsPii(text: string): boolean {
  return RULES.some((r) => new RegExp(r.pattern.source, r.pattern.flags.replace("g", "")).test(text));
}
