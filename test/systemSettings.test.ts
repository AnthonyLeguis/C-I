// PR A6 · Modo del motor de IA: "RULES" apaga la IA en todo el sistema.
import { describe, expect, it } from "vitest";
import { effectiveAi, getAiMode } from "../src/infrastructure/systemSettings";

const fakeDb = (value: string | null, fail = false) => ({
  prepare: () => ({ first: async () => { if (fail) throw new Error("no table"); return value === null ? null : { value }; } }),
}) as unknown as D1Database;
const AI = {} as Ai;

describe("modo del motor de IA (A6)", () => {
  it("ONLINE por defecto y si falta la tabla", async () => {
    expect(await getAiMode(fakeDb(null))).toBe("ONLINE");
    expect(await getAiMode(fakeDb(null, true))).toBe("ONLINE");
  });
  it("RULES apaga la IA; ONLINE la deja disponible", async () => {
    expect(await effectiveAi({ DB: fakeDb("RULES"), AI })).toBeUndefined();
    expect(await effectiveAi({ DB: fakeDb("ONLINE"), AI })).toBe(AI);
  });
});
