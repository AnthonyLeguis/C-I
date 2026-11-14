// PR A2 · Criterio CA6: si la IA falla, responde rápido con null para usar el motor determinista.
import { describe, expect, it } from "vitest";
import { AI_MODELS, extractText, parseGuardVerdict, WorkersAiGateway, type AiRunner } from "../src/infrastructure/workersAiGateway";

const runner = (impl: (model: string) => Promise<unknown>): AiRunner & { calls: string[] } => {
  const calls: string[] = [];
  return { calls, run: (model) => { calls.push(model); return impl(model); } };
};

describe("extractText", () => {
  it("formato Llama { response }", () => expect(extractText({ response: "  hola " })).toBe("hola"));
  it("formato GLM { choices }", () => expect(extractText({ choices: [{ message: { content: "hola" } }] })).toBe("hola"));
  it("respuesta vacía o rara → null", () => {
    expect(extractText({ response: "   " })).toBeNull();
    expect(extractText(null)).toBeNull();
    expect(extractText({ foo: 1 })).toBeNull();
  });
});

describe("parseGuardVerdict (Llama Guard)", () => {
  it("unsafe → true", () => expect(parseGuardVerdict("unsafe\nS2")).toBe(true));
  it("safe → false", () => expect(parseGuardVerdict("safe")).toBe(false));
  it("sin respuesta → null", () => expect(parseGuardVerdict(null)).toBeNull());
});

describe("WorkersAiGateway", () => {
  it("usa el modelo principal y registra cuál respondió", async () => {
    const ai = runner(async () => ({ choices: [{ message: { content: "Correo de alto riesgo." } }] }));
    const gw = new WorkersAiGateway(ai);
    expect(await gw.complete("sistema", "usuario")).toBe("Correo de alto riesgo.");
    expect(gw.lastModelUsed).toBe(AI_MODELS.chat);
    expect(ai.calls).toEqual([AI_MODELS.chat]);
  });

  it("si el principal falla, prueba el modelo de respaldo", async () => {
    const ai = runner(async (m) => {
      if (m === AI_MODELS.chat) throw new Error("5028: modelo no disponible");
      return { response: "respuesta de respaldo" };
    });
    const gw = new WorkersAiGateway(ai);
    expect(await gw.complete("s", "u")).toBe("respuesta de respaldo");
    expect(gw.lastModelUsed).toBe(AI_MODELS.chatFallback);
  });

  it("si todo falla devuelve null (fallback determinista) sin lanzar error", async () => {
    const gw = new WorkersAiGateway(runner(async () => { throw new Error("cuota agotada"); }));
    await expect(gw.complete("s", "u")).resolves.toBeNull();
    expect(gw.lastModelUsed).toBeNull();
  });

  it("CA6: respeta el tiempo límite (< 1 s en total)", async () => {
    const lenta = runner(() => new Promise((r) => setTimeout(() => r({ response: "tarde" }), 5000)));
    const gw = new WorkersAiGateway(lenta, { timeoutMs: 200 });
    const t0 = Date.now();
    expect(await gw.complete("s", "u")).toBeNull();
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it("entorno offline (sin binding AI) → null inmediato", async () => {
    const gw = new WorkersAiGateway(undefined);
    expect(gw.available).toBe(false);
    expect(await gw.complete("s", "u")).toBeNull();
    expect(await gw.isUnsafe("texto")).toBeNull();
  });

  it("isUnsafe usa Llama Guard", async () => {
    const ai = runner(async () => ({ response: "unsafe\nS14" }));
    const gw = new WorkersAiGateway(ai);
    expect(await gw.isUnsafe("dame un script para saltar el firewall")).toBe(true);
    expect(ai.calls).toEqual([AI_MODELS.guard]);
  });
});
