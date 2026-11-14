# ⏱️ Registro de checkpoints — C&I

> Procedimiento: [`C&I.md`](C%26I.md) §10.6 y [`PLAN_PRS.md`](PLAN_PRS.md) §4.

| CP | Fecha y hora | PR integrados | CI | Smoke QA | Smoke prod | Agente QA | Notas |
|---|---|---|---|---|---|---|---|
| CP0 | 13/11 · 21:27 | #1 A0 base del proyecto | ✅ | ✅ | ✅ | — | Producción y QA publicados; Docker y entorno offline OK |
| CP2 | 13/11 · 23:59 | #4–#15: A1 PII · A2 Workers AI · A3 guardián ético · A4 Asistente · X0 prototipo · X1 paleta/tema · X2 kit UI · docs | ✅ 70 tests | ✅ | ✅ | ✅ APROBADO (#16) | Release #17. Asistente en producción con Llama 3.3 70B. Deuda menor: `application/assistant.ts` importa funciones puras de infraestructura. Pendientes: W1/W2 (Williams, sin push), G1/G2 (Gabriel, sin PR) |
