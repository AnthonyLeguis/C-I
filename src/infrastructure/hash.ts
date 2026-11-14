// [CAPA 3 — INFRAESTRUCTURA] Funciones criptográficas WebCrypto (PR G1 · Gabriel).
// C&I.md §5.3: PBKDF2-SHA256 (100 000 iteraciones) y SHA-256 para auditoría.

export const PBKDF2_ITERATIONS = 100_000;

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b !== undefined) {
      hex += b.toString(16).padStart(2, "0");
    }
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const len = cleanHex.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    const val = parseInt(cleanHex.substring(i, i + 2), 16);
    bytes[i / 2] = Number.isNaN(val) ? 0 : val;
  }
  return bytes;
}

/** Genera un salt criptográfico en formato hexadecimal (por defecto 16 bytes = 32 hex). */
export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

/** Calcula el resumen SHA-256 en minúsculas para cadenas o eventos de auditoría. */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

/**
 * Deriva un hash de contraseña usando PBKDF2 con HMAC-SHA-256 y 100 000 iteraciones.
 * Si no se proporciona un salt, genera uno nuevo aleatorio.
 */
export async function hashPassword(
  password: string,
  saltHex?: string,
  iterations = PBKDF2_ITERATIONS
): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ?? generateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const saltBytes = hexToBytes(salt);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256 // 32 bytes
  );

  const hash = bufferToHex(derivedBits);
  return { hash, salt };
}

/** Compara una contraseña en texto plano contra un hash y salt almacenados. */
export async function verifyPassword(
  password: string,
  expectedHash: string,
  saltHex: string,
  iterations = PBKDF2_ITERATIONS
): Promise<boolean> {
  const { hash } = await hashPassword(password, saltHex, iterations);
  return constantTimeEqual(hash.toLowerCase(), expectedHash.toLowerCase());
}

/** Comparación en tiempo constante (no se corta en el primer carácter distinto). */
export function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
