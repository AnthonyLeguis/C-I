// test/d1Repos.test.ts — G2 (Gabriel)
// Prueba AuditRepository con un mock en memoria de D1Database.
// CA8: detectar un registro alterado en la cadena de hash.

import { describe, expect, it } from "vitest";
import { AuditRepository } from "../src/infrastructure/d1Repos";
import type { AuditEventInput } from "../src/domain/ports";

// ---------------------------------------------------------------------------
// Mock de D1Database en memoria
// ---------------------------------------------------------------------------

interface MockAuditRow {
  id: string;
  module: string;
  email_id: string | null;
  actor: string;
  risk_level: string | null;
  risk_score: number | null;
  action_taken: string;
  indicators: string;
  legal_basis: string;
  pii_detected: string;
  xai_explanation: string | null;
  ai_used: number;
  ai_model: string | null;
  prev_hash: string | null;
  hash: string;
  created_at: string;
}

function makeMockD1(rows: MockAuditRow[] = []): D1Database {
  const store: MockAuditRow[] = [...rows];

  // Genera un timestamp ISO creciente para mantener el orden de inserción
  let seq = 0;
  const nextTs = () => new Date(Date.now() + seq++ * 1000).toISOString();

  const makeStmt = (sql: string, params: unknown[]): D1PreparedStatement => {
    const stmt = {
      bind: (...args: unknown[]) => makeStmt(sql, args),
      first: async <T>(): Promise<T | null> => {
        const up = sql.trim().toUpperCase();
        if (up.startsWith("SELECT") && up.includes("ORDER BY CREATED_AT DESC LIMIT 1")) {
          if (store.length === 0) return null;
          const last = store[store.length - 1];
          return last as T;
        }
        if (up.startsWith("SELECT") && up.includes("ORDER BY CREATED_AT ASC")) {
          return null; // first() no se usa en ese query
        }
        return null;
      },
      all: async <T>(): Promise<D1Result<T>> => {
        const up = sql.trim().toUpperCase();
        if (up.startsWith("SELECT") && up.includes("ORDER BY CREATED_AT ASC")) {
          return { results: [...store] as unknown as T[], success: true, meta: {} as unknown as D1Meta & Record<string, unknown> };
        }
        return { results: [] as T[], success: true, meta: {} as unknown as D1Meta & Record<string, unknown> };
      },
      run: async (): Promise<D1Result<unknown>> => {
        const up = sql.trim().toUpperCase();
        if (up.startsWith("INSERT INTO AUDIT_EVENTS")) {
          // params: id, module, email_id, actor, risk_level, risk_score,
          //         action_taken, indicators, legal_basis, pii_detected,
          //         xai_explanation, ai_used, ai_model, prev_hash, hash
          const p = params as (string | number | null)[];
          store.push({
            id: p[0] as string,
            module: p[1] as string,
            email_id: p[2] as string | null,
            actor: p[3] as string,
            risk_level: p[4] as string | null,
            risk_score: p[5] as number | null,
            action_taken: p[6] as string,
            indicators: p[7] as string,
            legal_basis: p[8] as string,
            pii_detected: p[9] as string,
            xai_explanation: p[10] as string | null,
            ai_used: p[11] as number,
            ai_model: p[12] as string | null,
            prev_hash: p[13] as string | null,
            hash: p[14] as string,
            created_at: nextTs(),
          });
        }
        return { results: [] as unknown[], success: true, meta: {} as unknown as D1Meta & Record<string, unknown> };
      },
    } as unknown as D1PreparedStatement;
    return stmt;
  };

  return {
    prepare: (sql: string) => makeStmt(sql, []),
    batch: async () => [],
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;
}

// ---------------------------------------------------------------------------
// Evento de prueba
// ---------------------------------------------------------------------------

function makeEvent(actor: string): AuditEventInput {
  return {
    module: "AUTH",
    emailId: null,
    actor,
    riskLevel: null,
    riskScore: null,
    actionTaken: `login de ${actor}`,
    indicators: [],
    legalBasis: [],
    piiDetected: [],
    xaiExplanation: null,
    aiUsed: false,
    aiModel: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("G2 — AuditRepository (hash encadenado)", () => {
  it("cadena vacía → chain_ok: true, total: 0", async () => {
    const db = makeMockD1([]);
    const repo = new AuditRepository(db);
    const result = await repo.verifyChain();
    expect(result.chain_ok).toBe(true);
    expect(result.total).toBe(0);
    expect(result.broken_at).toBeNull();
  });

  it("append un evento y verifica la cadena correctamente", async () => {
    const db = makeMockD1([]);
    const repo = new AuditRepository(db);

    const { id, hash } = await repo.append(makeEvent("jrios"));
    expect(id).toHaveLength(36); // UUID
    expect(hash).toHaveLength(64); // SHA-256 hex

    const result = await repo.verifyChain();
    expect(result.chain_ok).toBe(true);
    expect(result.total).toBe(1);
    expect(result.broken_at).toBeNull();
  });

  it("append dos eventos y la cadena está íntegra", async () => {
    const db = makeMockD1([]);
    const repo = new AuditRepository(db);

    await repo.append(makeEvent("svalenzuela"));
    await repo.append(makeEvent("cmendoza"));

    const result = await repo.verifyChain();
    expect(result.chain_ok).toBe(true);
    expect(result.total).toBe(2);
    expect(result.broken_at).toBeNull();
  });

  it("CA8 — detecta un registro alterado en la cadena", async () => {
    // 1. Insertar 2 eventos con el repo (hashes correctos)
    const db = makeMockD1([]);
    const repo = new AuditRepository(db);

    const r1 = await repo.append(makeEvent("jrios"));
    await repo.append(makeEvent("svalenzuela"));

    // 2. Acceder al store interno del mock y corromper el hash del primer registro
    //    La DB del mock expone su store via el método prepare → all
    //    Para simplificar, creamos un nuevo mock con los mismos rows pero hash alterado.
    const verifyResult = await repo.verifyChain();
    // Primero confirmamos que la cadena está bien antes de alterar
    expect(verifyResult.chain_ok).toBe(true);
    expect(verifyResult.total).toBe(2);

    // 3. Crear una DB con el primer registro con hash adulterado
    //    Reutilizamos el store expuesto via la closure del mock.
    //    Creamos un mock que devuelve los mismos datos pero con hash corrupto en el primer row.
    const corruptedRows: MockAuditRow[] = [];
    // Volvemos a hacer append en un nuevo mock para capturar los rows originales
    const db2 = makeMockD1([]);
    const repo2 = new AuditRepository(db2);
    await repo2.append(makeEvent("jrios"));
    await repo2.append(makeEvent("svalenzuela"));

    // Obtenemos los rows del store (via verifyChain que los lee todos)
    // y los manipulamos directamente. Usamos un tercer mock que ya contiene
    // los rows con el hash del primero adulterado.
    //
    // Estrategia: Creamos un MockAuditRow manualmente con hash incorrecto
    // para simular un registro alterado en la DB.

    const fakeHash1 = "a".repeat(64); // hash incorrecto para el primer registro
    // Para construir un row realista necesitamos los datos originales.
    // Los reproducimos directamente:
    const tampered: MockAuditRow[] = [
      {
        id: r1.id,
        module: "AUTH",
        email_id: null,
        actor: "jrios",
        risk_level: null,
        risk_score: null,
        action_taken: "login de jrios",
        indicators: "[]",
        legal_basis: "[]",
        pii_detected: "[]",
        xai_explanation: null,
        ai_used: 0,
        ai_model: null,
        prev_hash: "0".repeat(64), // genesis
        hash: fakeHash1, // ← ADULTERADO
        created_at: new Date(Date.now()).toISOString(),
      },
      {
        id: "00000000-0000-4000-b000-000000000002",
        module: "AUTH",
        email_id: null,
        actor: "svalenzuela",
        risk_level: null,
        risk_score: null,
        action_taken: "login de svalenzuela",
        indicators: "[]",
        legal_basis: "[]",
        pii_detected: "[]",
        xai_explanation: null,
        ai_used: 0,
        ai_model: null,
        prev_hash: fakeHash1, // apunta al hash adulterado (como si fuera consistente internamente)
        hash: "b".repeat(64), // también adulterado
        created_at: new Date(Date.now() + 1000).toISOString(),
      },
    ];

    const db3 = makeMockD1(tampered);
    const repo3 = new AuditRepository(db3);

    // 4. verifyChain debe detectar la alteración en el primer registro
    const result = await repo3.verifyChain();
    expect(result.chain_ok).toBe(false);
    expect(result.total).toBe(2);
    // broken_at debe ser el id del primer registro adulterado
    expect(result.broken_at).toBe(r1.id);
  });
});
