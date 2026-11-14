# ⏱️ Registro de checkpoints — C&I

> Procedimiento: [`C&I.md`](C%26I.md) §10.6 y [`PLAN_PRS.md`](PLAN_PRS.md) §4.

| CP | Fecha y hora | PR integrados | CI | Smoke QA | Smoke prod | Agente QA | Notas |
|---|---|---|---|---|---|---|---|
| CP0 | 13/11 · 21:27 | #1 A0 base del proyecto | ✅ | ✅ | ✅ | — | Producción y QA publicados; Docker y entorno offline OK |
| CP2 | 13/11 · 23:59 | #4–#15: A1 PII · A2 Workers AI · A3 guardián ético · A4 Asistente · X0 prototipo · X1 paleta/tema · X2 kit UI · docs | ✅ 70 tests | ✅ | ✅ | ✅ APROBADO (#16) | Release #17. Asistente en producción con Llama 3.3 70B. Deuda menor: `application/assistant.ts` importa funciones puras de infraestructura. Pendientes: W1/W2 (Williams, sin push), G1/G2 (Gabriel, sin PR) |
| CP3 | 14/11 · 00:28 | #19–#24: W1 catálogo legal · W2 parser (Williams) · logo claro/oscuro · URL equipo-ci · timeline-qa · promoción automática · portada QA | ✅ 94 tests | ✅ | ✅ | ✅ APROBADO (comentario en #26) | Primera promoción automática qa→development (#25). Release #26 aprobado por Anthony. W3/W4 pendientes: /mail/analyze sigue simulado. Gabriel sin PR de G1 |
