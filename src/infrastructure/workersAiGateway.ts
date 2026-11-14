// [CAPA 3 — INFRAESTRUCTURA] Adaptador de Workers AI (PR A2 · Anthony).
// Implementa AiGatewayPort. Nunca lanza errores: si la IA falla, tarda o no existe (entorno offline),
// devuelve null y el caso de uso aplica el motor determinista (CA6).
// Futuro on-premise: un OllamaGateway implementará el mismo puerto.
import type { AiGatewayPort } from "../domain/ports";

/** Interfaz mínima del binding de Workers AI que usamos (facilita los tests con un doble). */
export interface AiRunner {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export const AI_MODELS = {
  /** Explicaciones y asistente: rápido (~0,9 s) y con buen español. Verificado el 13/11/2026.
   *  Nota: GLM-4.7 Flash se descartó como principal porque es un modelo de razonamiento:
   *  tarda ~7,6 s y con 400 tokens devuelve el contenido vacío (solo "reasoning"). */
  chat: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  /** Respaldo de chat si el principal falla (~2,6 s). */
  chatFallback: "@cf/meta/llama-4-scout-17b-16e-instruct",
  /** Clasificador de seguridad: detecta peticiones dañinas o manipulación. */
  guard: "@cf/meta/llama-guard-3-8b",
} as const;

export interface GatewayOptions {
  timeoutMs?: number;
  maxTokens?: number;
}

const DEFAULT_TIMEOUT_MS = 6000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Extrae el texto de las distintas formas de respuesta: { response } (Llama) o { choices[0].message.content } (GLM). */
export function extractText(result: unknown): string | null {
  if (typeof result !== "object" || result === null) return null;
  const r = result as { response?: unknown; choices?: { message?: { content?: unknown } }[] };
  const text = typeof r.response === "string" ? r.response : r.choices?.[0]?.message?.content;
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Interpreta la salida de Llama Guard ("safe" / "unsafe\nS2"). */
export function parseGuardVerdict(text: string | null): boolean | null {
  if (text === null) return null;
  const first = text.trim().toLowerCase().split(/\s+/)[0] ?? "";
  if (first.startsWith("unsafe")) return true;
  if (first.startsWith("safe")) return false;
  return null;
}

export class WorkersAiGateway implements AiGatewayPort {
  readonly modelName: string = AI_MODELS.chat;
  private lastModel: string | null = null;
  private readonly timeoutMs: number;
  private readonly maxTokens: number;

  constructor(private readonly ai: AiRunner | undefined, options: GatewayOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxTokens = options.maxTokens ?? 400;
  }

  /** Modelo que respondió en la última llamada exitosa (para ai_model en las respuestas). */
  get lastModelUsed(): string | null {
    return this.lastModel;
  }

  get available(): boolean {
    return this.ai !== undefined;
  }

  async complete(system: string, user: string): Promise<string | null> {
    this.lastModel = null;
    for (const model of [AI_MODELS.chat, AI_MODELS.chatFallback]) {
      const text = await this.call(model, {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: this.maxTokens,
        temperature: 0.2,
      });
      if (text !== null) {
        this.lastModel = model;
        return text;
      }
    }
    return null;
  }

  async isUnsafe(text: string): Promise<boolean | null> {
    const out = await this.call(AI_MODELS.guard, { messages: [{ role: "user", content: text }] });
    return parseGuardVerdict(out);
  }

  private async call(model: string, input: Record<string, unknown>): Promise<string | null> {
    if (!this.ai) return null; // entorno offline: sin IA
    try {
      const result = await withTimeout(this.ai.run(model, input), this.timeoutMs);
      return extractText(result);
    } catch (err) {
      console.warn(`[C&I] Workers AI (${model}) falló: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }
}
