// [CAPA 3 — INFRAESTRUCTURA] Funciones criptográficas con WebCrypto (PR G1 · Gabriel).
// C&I.md §5.3: PBKDF2 para contraseñas, HMAC para cookies, SHA-256 para auditoría.

/** Convierte ArrayBuffer a string hexadecimal. */
function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => {
      const byte = b;
      if (byte !== undefined) {
        return byte.toString(16).padStart(2, "0");
      }
      return "00";
    })
    .join("");
}

/** Genera salt aleatorio de 16 bytes (32 hex). */
function randomSalt(): string {
  return bufferToHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

/**
 * Genera hash PBKDF2-SHA-256 de una contraseña.
 * 100 000 iteraciones; salt de 32 caracteres hex.
 */
export async function hashPassword(
  password: string
): Promise<{ hash: string; salt: string }> {
  const salt = randomSalt();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations: 100_000,
    },
    keyMaterial,
    256
  );
  return { hash: bufferToHex(bits), salt };
}

/**
 * Verifica una contraseña contra un hash PBKDF2 ya almacenado.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations: 100_000,
    },
    keyMaterial,
    256
  );
  const derived = bufferToHex(bits);
  // Comparación en tiempo constante
  if (derived.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) {
    const a = derived.charCodeAt(i);
    const b = storedHash.charCodeAt(i);
    if (b !== undefined) {
      diff |= a ^ b;
    }
  }
  return diff === 0;
}

/**
 * SHA-256 de un string arbitrario; devuelve 64 caracteres hex.
 * Usado para la cadena de hash en audit_events.
 */
export async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return bufferToHex(buf);
}
