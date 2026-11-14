# SPEC — C&I

> Sistema inteligente contra el phishing en el correo corporativo de la banca venezolana.
> Equipo **C&I – Creatividad e Innovación** · Hackathon UNETI IA 2026 · Proyecto del banco **#24** (Motor de detección de phishing dirigido a funcionarios) con la capa ética del **#18** (Guardián de integridad de LLMs).
> Metodología: **SDD — "spec primero, código después"**.

**Propuesta de valor:** detectamos y aislamos el phishing que llega al correo del personal bancario antes de que alguien haga clic, y explicamos cada decisión con su fundamento legal venezolano.

---

## 1. Problema

El correo corporativo es la principal puerta de entrada de los ataques contra las instituciones financieras: un solo clic de un trabajador en un enlace falso puede comprometer credenciales internas, sistemas y el dinero de los clientes. En la banca venezolana el patrón típico es la **suplantación de SUDEBAN, del propio banco o de un proveedor** para robar la clave corporativa o desviar un pago. El personal opera bajo las normas de SUDEBAN y la Ley Especial contra los Delitos Informáticos, pero no siempre distingue un correo legítimo de uno que imita a su propia institución.

- `[CIFRA CON FUENTE PENDIENTE]` — cifra 1 (p. ej., alertas o comunicados de SUDEBAN sobre suplantación).
- `[CIFRA CON FUENTE PENDIENTE]` — cifra 2 (p. ej., comunicados de bancos venezolanos sobre correos falsos).
- `[CIFRA CON FUENTE PENDIENTE]` — cifra 3 (p. ej., informe internacional de phishing en el sector financiero).

## 2. Usuarios

| Rol en la API | Nombre en pantalla | Quién es en el banco | Qué hace en C&I |
|---|---|---|---|
| — | Trabajador del banco | Recibe correos; **beneficiario final** (no usa el panel) | Sus correos peligrosos nunca llegan a su bandeja |
| `ANALYST` | Analista de Seguridad | Personal del área de seguridad / SOC | Ve el panel y el buzón, simula llegadas, analiza correos y usa el asistente |
| `SUPERVISOR` | Gerente de Seguridad (CISO) | Responsable con autoridad para decidir sobre un correo | Todo lo anterior + **confirmar** o **restaurar** correos en cuarentena |
| `ADMIN` | Master / Soporte Técnico | Responsable técnico de la plataforma | Todo lo anterior + verificar la integridad de la bitácora |

Jerarquía: `ADMIN` ⊃ `SUPERVISOR` ⊃ `ANALYST`. Usuarios de demostración (datos ficticios): `jrios` (Analista), `svalenzuela` (CISO), `cmendoza` (Master).

## 3. Alcance del MVP

**Sí entra:**
1. Analizador de correo: riesgo, indicadores, explicación y fundamento legal.
2. Buzón institucional simulado con carpetas **Bandeja · Spam · Cuarentena**, alimentado con correos **sintéticos**; cada correo nuevo se analiza y se mueve solo ("Simular llegada").
3. Revisión humana: el CISO confirma o restaura los correos en cuarentena.
4. Panel con roles (RBAC): inicio de sesión, KPI y bitácora con hash encadenado.
5. Asistente con guardián ético: anonimiza la PII y bloquea la inyección de instrucciones y las peticiones ofensivas.

**No entra (roadmap):** conexión real con Exchange / Microsoft 365 / Gmail / Zimbra, versión on-premise con IA local (Ollama), análisis de configuraciones de red, PDF firmado, cifrado SQLCipher, otros canales (WhatsApp, SMS).

## 4. Requisitos funcionales

- **RF1** Analizar un correo y devolver riesgo (0–100 y nivel), indicadores, explicación y fundamento legal.
- **RF2** Mover automáticamente el correo a Bandeja, Spam o Cuarentena según el nivel de riesgo.
- **RF3** Permitir solo a `SUPERVISOR` (o superior) confirmar o restaurar correos en cuarentena.
- **RF4** Autenticar usuarios (contraseña PBKDF2, sesión HMAC en cookie `HttpOnly`) y restringir cada endpoint por rol.
- **RF5** Mostrar indicadores en un panel y una bitácora verificable con hash SHA-256 encadenado.
- **RF6** Anonimizar la PII (cédula, teléfono, cuenta bancaria, correos personales) antes de cualquier uso de IA y bloquear inyección y peticiones ofensivas en el asistente.

### Cómo se calcula el puntaje de riesgo

**Paso 1 · Reglas** (suma de indicadores, tope 100; pesos en `src/infrastructure/emailHeuristics.ts`):

| Indicador | Peso |
|---|---|
| Dominio que imita a una entidad oficial (SUDEBAN, un banco) | +35 |
| Adjunto peligroso o con doble extensión (`.pdf.exe`) | +30 |
| Pide claves, usuario o datos de acceso | +25 |
| Pide transferencia urgente o cambio de cuenta (fraude del CEO) | +25 |
| DMARC o SPF en `fail` | +20 |
| Enlace a dominio falso, IP o acortador | +20 |
| Texto del enlace distinto a su destino | +15 |
| Reply-To distinto al remitente o de correo gratuito | +15 |
| Urgencia o amenaza | +15 |
| Nombre visible que no coincide con el dominio | +10 |
| DKIM/SPF ausentes (`none`) | +10 |
| Dominio oficial con SPF, DKIM y DMARC en `pass` | −20 |

**Paso 2 · IA:** recibe el correo **ya anonimizado** y estima de 0 a 100 la probabilidad de ingeniería social.

**Paso 3 · Fusión:** `Puntaje final = Reglas × 0,7 + IA × 0,3` (si la IA no responde, `Puntaje final = Reglas`).

**Paso 4 · Nivel y acción:** 0–19 SEGURO (bandeja) · 20–49 BAJO (bandeja con aviso) · 50–79 ALTO (spam) · 80–100 CRÍTICO (cuarentena + revisión humana).

**Ejemplo (falso SUDEBAN):** 35 + 30 + 25 + 20 + 15 + 15 = 140 → tope **100**. IA = 90. Final = 100 × 0,7 + 90 × 0,3 = **97 → CRÍTICO → cuarentena**.

## 5. Criterios de aceptación

Cada CA está cubierto por pruebas automáticas en `test/` que corren en CI (`npm run check`).

- **CA1** **Dado** un correo de `banco-demo.com.ve` con SPF, DKIM y DMARC en `pass`, **cuando** se analiza, **entonces** queda en INBOX con riesgo SAFE o LOW.
- **CA2** **Dado** un correo de `sudeban-gob.com` con Reply-To gratuito y DMARC `fail`, **cuando** se analiza, **entonces** queda en QUARANTINE con riesgo CRITICAL.
- **CA3** **Dado** un adjunto `.pdf.exe`, **cuando** se analiza, **entonces** aparece el indicador de doble extensión.
- **CA4** **Dado** un texto con cédula, teléfono o cuenta, **cuando** se procesa, **entonces** ninguno aparece en claro en lo enviado a la IA ni en D1.
- **CA5** **Dado** un usuario ANALYST, **cuando** intenta restaurar un correo de la cuarentena, **entonces** recibe 403.
- **CA6** **Dado** que Workers AI falla, **cuando** se analiza un correo, **entonces** la API responde en menos de 1 s con el motor determinista.
- **CA7** **Dada** una petición para evadir un firewall, **cuando** llega al asistente, **entonces** se bloquea y queda registrada en la bitácora.
- **CA8** **Dado** un registro alterado en la bitácora, **cuando** se ejecuta `GET /api/v1/audit/verify`, **entonces** se reporta la ruptura de la cadena.

## 6. Arquitectura

```
Navegador (React) ──► Cloudflare Worker (Hono, /api/v1) ──► D1 (users, emails, audit_events)
                                    │
                                    ├─► Anonimizador PII ─► Workers AI (Llama 3.3 70B · Llama Guard 3)
                                    └─► Reglas deterministas + catálogo legal curado
```

| Servicio Cloudflare | Uso |
|---|---|
| **Workers** + Hono (TypeScript estricto) | API `/api/v1`, arquitectura por capas (dominio, aplicación, infraestructura, presentación) |
| **D1** (SQLite) | Usuarios, buzón y bitácora |
| **Workers AI** | Explicaciones y asistente (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, respaldo `@cf/meta/llama-4-scout-17b-16e-instruct`) y guardián ético (`@cf/meta/llama-guard-3-8b`) |
| **Static Assets** | Frontend Vite + React + Tailwind servido desde la misma URL (sin CORS) |

Seguridad: PBKDF2 (WebCrypto), sesión HMAC en cookie `HttpOnly`, RBAC en cada endpoint, hash SHA-256 encadenado. Respaldo: motor determinista si la IA falla o se agota la cuota. Entornos: `qa`, `production` y `offline` (sin internet ni IA, usado en Docker).

**Endpoints (`/api/v1`):**

| Método y ruta | Rol mínimo |
|---|---|
| `GET /health` | público |
| `POST /auth/login` · `POST /auth/quick-login` · `POST /auth/logout` · `GET /auth/me` | público / sesión |
| `POST /mail/analyze` | ANALYST |
| `GET /mailbox?folder=INBOX\|SPAM\|QUARANTINE` · `POST /mailbox/deliver` | ANALYST |
| `POST /mailbox/:id/review` `{ "decision": "CONFIRM" \| "RESTORE" }` | SUPERVISOR |
| `GET /dashboard` | ANALYST |
| `POST /assistant/ask` | ANALYST |
| `POST /domains/block` · `GET /domains/blocked` · `DELETE /domains/blocked/:domain` | SUPERVISOR |
| `GET /audit/export.csv` | SUPERVISOR |
| `GET /audit/verify` | ADMIN |

Planificados en el contrato (§5.2 de `docs/C&I.md`): `POST /mailbox/:id/approve` · `/escalate` y endpoints de soporte (`/support/*`).

Errores: `400 { "error": "..." }` · `401` sin sesión · `403` rol insuficiente. Nunca se devuelve una traza interna.

## 7. Modelo de datos

Ver `migrations/0001_schema.sql`.

| Tabla | Campos principales |
|---|---|
| `users` | `id`, `username`, `display_name`, `role` (ADMIN/SUPERVISOR/ANALYST), `password_hash`, `salt` |
| `emails` | `id`, `from_address`, `reply_to`, `subject`, `body_sanitized` (sin PII), `folder` (INBOX/SPAM/QUARANTINE), `risk_level`, `risk_score`, `indicators`, `legal_basis`, `xai_explanation`, `review_status` (N/A/PENDING/CONFIRMED/RESTORED) |
| `audit_events` | `id`, `module` (MAIL_ANALYZER/ASSISTANT_GUARD/REVIEW/AUTH), `actor`, `risk_level`, `action_taken`, `pii_detected`, `ai_used`, `ai_model`, `prev_hash`, `hash`, `created_at` |

## 8. Uso de IA (obligatorio)

| Pregunta | Respuesta |
|---|---|
| ¿Usas IA en tu solución? | Sí. |
| ¿Qué modelo y por qué? | **Llama 3.3 70B Instruct (fp8-fast)** para explicaciones y asistente: buen español y respuesta rápida. **Llama 4 Scout 17B** como respaldo. **Llama Guard 3 8B** para detectar peticiones dañinas o inyección. Todos en Workers AI: recomendados por el evento y sin enviar datos a terceros. Descartamos GLM-4.7 Flash porque es un modelo de razonamiento y tardaba ~7,6 s por respuesta. |
| ¿Qué problema resuelve? | Capta matices de ingeniería social en español y explica cada decisión en lenguaje claro para el analista. |
| ¿Qué datos procesa? | Solo texto **sintético y anonimizado**. La PII se reemplaza por marcadores (`[CEDULA_PROTEGIDA]`, etc.) antes de llegar al modelo. Nunca datos personales reales. |
| ¿Cómo evitas sesgos? | Las reglas verificables pesan 70 % y la IA 30 %: la IA sola no puede mandar un correo legítimo a cuarentena ni sacar uno peligroso. Probamos con correos de distintas entidades, estilos y niveles de riesgo. |
| ¿Cómo explicas las decisiones? | Indicadores técnicos con su peso + explicación en lenguaje claro + fundamento legal tomado de un **catálogo curado** (`src/domain/legalCatalog.ts`); la IA nunca inventa artículos. Cada respuesta de IA muestra el modelo usado. |
| ¿Qué decides tú y qué la IA? | Las reglas puntúan, la IA sugiere y explica, y **una persona (CISO)** confirma o revierte la cuarentena. |
| ¿Usaste IA para programar? | Sí. |
| ¿Qué herramientas? | Ver tabla siguiente. |

| Herramienta | Uso | Verificación humana |
|---|---|---|
| **Claude Code** (Anthony) | Generación de código desde la spec, integración, CI/CD, documentación y QA | Revisión del líder técnico en cada PR + pruebas automáticas en CI (`npm run check`) |
| **DeepSeek Harness** (Williams) | Motor de análisis de correo, heurísticas y catálogo legal | Revisión de Williams y Anthony en el PR + pruebas de CA1–CA3; referencias legales contrastadas en `docs/LEGAL_NOTES.md` |
| **Antigravity** (Gabriel) | Buzón, cuarentena, roles (RBAC) y panel | Revisión en el PR + pruebas de CA5 y CA8 + revisión visual en QA |
| **NotebookLM / Gemini** (Alejandro) | Investigación, textos del pitch y apoyo al diseño UX/UI | Revisión del equipo; las cifras solo se usan con fuente verificada |

## 9. Ética y privacidad

- **Anonimización previa** a la IA (cédula, teléfono, cuenta bancaria, correos personales); el cuerpo se guarda en D1 ya anonimizado (`body_sanitized`).
- **Datos 100 % sintéticos** en la demo; usuarios y entidades ficticios.
- **Transparencia:** toda respuesta de IA se marca como tal e indica el modelo.
- **Revisión humana obligatoria** en cuarentena: la IA nunca decide sola sobre un correo crítico.
- **Guardián ético:** el asistente rechaza inyección de instrucciones y peticiones ofensivas (p. ej., evadir el firewall) y lo registra.
- **Trazabilidad:** bitácora con hash SHA-256 encadenado, verificable por el rol Master.
- **Soberanía:** el mismo sistema corre en un contenedor sin internet; en producción bancaria, con IA local, los datos no salen de la institución.

## 10. Métricas de éxito

- ≥ 90 % de acierto en los casos de demostración (`src/application/demoScenarios.ts`).
- 0 fugas de PII en las pruebas.
- Respuesta < 1 s con el motor determinista y < 3 s con IA.
- 100 % de las peticiones ofensivas de prueba bloqueadas.
- Demo pública estable en https://c-i.equipo-ci.workers.dev.

## Riesgos y supuestos

| Riesgo / supuesto | Mitigación |
|---|---|
| Falsos positivos | Revisión humana del CISO; la IA pesa solo 30 % |
| Cuota o caída de Workers AI | Motor determinista de respaldo y modelo de respaldo (Llama 4 Scout) |
| Referencias legales imprecisas | Catálogo curado y verificado en `docs/LEGAL_NOTES.md` |
| Sin internet el día de la demo | Contenedor Docker en modo `offline` |
| Supuesto: el banco expone sus encabezados SPF/DKIM/DMARC | En el roadmap, el conector al servidor de correo los entrega tal cual |
