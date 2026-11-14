// [CAPA 3 — INFRAESTRUCTURA] Guardián ético por reglas (PR A3 · Anthony).
// Primera barrera, determinista y auditable: detecta manipulación de instrucciones (prompt injection)
// y peticiones ofensivas ("ética blindada": C&I solo defiende). Llama Guard 3 actúa después como segunda opinión.

export type BlockReason = "PROMPT_INJECTION" | "OFFENSIVE_REQUEST";

interface GuardRule {
  reason: BlockReason;
  label: string;
  pattern: RegExp;
}

/** Normaliza para que las reglas no dependan de tildes ni mayúsculas. */
export function normalize(text: string): string {
  // NFKC unifica variantes tipográficas (letras de ancho completo, ligaduras) y se eliminan caracteres invisibles
  // (espacios de ancho cero) que se usan para esquivar las reglas.
  return text.normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const RULES: readonly GuardRule[] = [
  // ── Manipulación de instrucciones (prompt injection) ──
  { reason: "PROMPT_INJECTION", label: "Pide ignorar u olvidar las instrucciones", pattern: /\b(ignora|ignorar|olvida|olvidar|omite|descarta)\b.{0,30}\b(instrucciones|reglas|indicaciones|directivas|restricciones|politicas|lo anterior)\b/ },
  { reason: "PROMPT_INJECTION", label: "Pide ignorar instrucciones (inglés)", pattern: /\b(ignore|disregard|forget)\b.{0,30}\b(instructions|rules|guidelines|above|previous)\b/ },
  { reason: "PROMPT_INJECTION", label: "Intenta cambiar el rol del asistente", pattern: /\b(actua como|finge (ser|que)|haz de cuenta|a partir de ahora eres|ahora eres|you are now|pretend to be)\b/ },
  { reason: "PROMPT_INJECTION", label: "Pide revelar instrucciones o datos internos", pattern: /\b(revela|muestrame|muestra|dime|imprime|repite|reveal|show me|print)\b.{0,30}\b(prompt|instrucciones (internas|del sistema)|system prompt|claves internas|contrasenas|credenciales|configuracion interna)\b/ },
  { reason: "PROMPT_INJECTION", label: "Intenta activar un modo sin restricciones", pattern: /\b(modo (desarrollador|dios|sin restricciones|sin filtros)|developer mode|jailbreak|dan mode|modo dan|do anything now)\b/ },

  // ── Peticiones ofensivas (C&I es solo defensa) ──
  { reason: "OFFENSIVE_REQUEST", label: "Pide evadir controles de seguridad", pattern: /\b(saltar|saltarme|salto|evadir|evado|evito|burlar|burlo|bypass(ear)?|desactivar|desactivo|deshabilitar|enganar|vulnerar|romper)\b.{0,40}\b(firewall|cortafuegos|antivirus|controles?|autenticacion|2fa|doble factor|seguridad|ids|ips|waf|filtros?|sudeban|auditoria)\b/ },
  { reason: "OFFENSIVE_REQUEST", label: "Pide crear malware o exploits", pattern: /\b(crea|crear|escribe|escribir|genera|generar|hazme|dame|programa|codigo|script)\b.{0,40}\b(malware|virus|ransomware|troyano|keylogger|exploit|backdoor|puerta trasera|payload|botnet|rootkit)\b/ },
  { reason: "OFFENSIVE_REQUEST", label: "Pide atacar o hackear un sistema", pattern: /\b(hackear|hackea|atacar|ataca|vulnera|explotar|explota|inyeccion sql|sql injection|fuerza bruta|brute force|ddos|denegacion de servicio)\b.{0,40}\b(banco|servidor|sistema|cuenta|red|pagina|sitio|base de datos|usuario)\b/ },
  { reason: "OFFENSIVE_REQUEST", label: "Pide redactar un correo de phishing", pattern: /\b(redacta|redactar|escribe|escribir|crea|crear|hazme|genera|disena)\b.{0,40}\b(phishing|correo falso|correo fraudulento|suplantar|suplantacion|pagina falsa|sitio clon)\b/ },
  { reason: "OFFENSIVE_REQUEST", label: "Pide robar u obtener credenciales ajenas", pattern: /\b(robar|obtener|sacar|conseguir|capturar|crackear|descifrar)\b.{0,30}\b(claves?|contrasenas?|credenciales|tokens?|tarjetas?|datos bancarios)\b.{0,30}\b(de (otros|otra persona|clientes|usuarios|empleados|alguien))\b/ },
];

export interface GuardVerdict {
  blocked: boolean;
  reasons: BlockReason[];
  matches: string[];
}

/** Evalúa el texto (idealmente ya anonimizado) con las reglas del guardián. */
export function evaluateGuardRules(text: string): GuardVerdict {
  const n = normalize(text);
  const hits = RULES.filter((r) => r.pattern.test(n));
  const reasons = [...new Set(hits.map((h) => h.reason))];
  return { blocked: hits.length > 0, reasons, matches: hits.map((h) => h.label) };
}
