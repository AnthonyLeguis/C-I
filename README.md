# 🛡️ C&I

![C&I · Anticipamos el riesgo. Fortalecemos tu confianza.](web/public/logo-ci-light.png)

Sistema inteligente contra el phishing en el correo corporativo de la banca venezolana.
Equipo **C&I – Creatividad e Innovación** · Hackathon UNETI IA 2026 · Proyecto **#24** (+ capa ética **#18**).

## Qué hace

C&I revisa cada correo que llega al personal del banco **antes de que alguien haga clic**:

1. **Analiza** remitente, dominio, encabezados SPF/DKIM/DMARC, enlaces, adjuntos y contenido.
2. **Clasifica** el riesgo de 0 a 100 (seguro, bajo, alto, crítico) y **explica por qué**, con el fundamento legal venezolano aplicable.
3. **Actúa:** deja el correo en la bandeja, lo manda a **spam** o lo pone en **cuarentena**.
4. **Protege la privacidad:** anonimiza cédulas, teléfonos y cuentas antes de usar IA.
5. **Pone a una persona al mando:** el Gerente de Seguridad (CISO) confirma o restaura cada correo en cuarentena, y todo queda en una bitácora con hash SHA-256 encadenado.

Regla de oro: **las reglas deciden, la IA explica** (puntaje = reglas × 0,7 + IA × 0,3).

## Cómo se instala

Requisitos: **Node.js 20+** y Git. No hace falta cuenta de Cloudflare ni base de datos aparte (D1 corre localmente con SQLite).

### Local y sin internet (entorno `offline`, motor de reglas sin IA)

```bash
git clone https://github.com/AnthonyLeguis/C-I.git
```

```bash
cd C-I && npm ci
```

```bash
cp .dev.vars.example .dev.vars
```

```bash
npx wrangler d1 migrations apply c-i-db-offline --local --env offline
```

```bash
npx wrangler d1 execute c-i-db-offline --local --env offline --file=seed/seed_mailbox.sql
```

```bash
npm run build:web
```

```bash
npx wrangler dev --env offline
```

Abrir http://localhost:8787.

Verificar que todo está en verde (tipos, pruebas, guardia y build):

```bash
npm run check
```

### Con Docker (máquina limpia, sin internet en ejecución)

```bash
docker compose up --build --abort-on-container-exit --exit-code-from smoke
```

Levanta la app en el puerto 8787 en modo `offline` y ejecuta la prueba de humo contra ella.

## Cómo se usa

**Usuarios de demostración** (datos ficticios, contraseña `Demo-2026!`; en el login también hay acceso rápido):

| Usuario | Rol | Puede |
|---|---|---|
| `jrios` | Analista de Seguridad | Ver panel y buzón, simular llegadas, usar el asistente |
| `svalenzuela` | Gerente de Seguridad (CISO) | Lo anterior + confirmar o restaurar la cuarentena |
| `cmendoza` | Master / Soporte Técnico | Lo anterior + verificar la integridad de la bitácora |

**Recorrido de 1 minuto:**

1. **Login** como `svalenzuela` (CISO).
2. Entrar al **Buzón**.
3. Pulsar **Simular llegada** y elegir "Falso SUDEBAN (crítico)": el correo cae solo en **Cuarentena** con su puntaje, indicadores y fundamento legal.
4. Simular "Recibo de pago legítimo (seguro)": queda en la **Bandeja**.
5. Abrir el correo en cuarentena y **Confirmar** la amenaza (queda registrado en la bitácora).
6. Ir al **Asistente**, preguntar cómo saltar el firewall del banco: el guardián ético **bloquea** la petición y anonimiza cualquier dato personal.

## Arquitectura Cloudflare usada

| Servicio | Uso |
|---|---|
| **Workers** + Hono | API REST `/api/v1` con roles en cada endpoint |
| **D1** | Usuarios, buzón y bitácora con hash encadenado |
| **Workers AI** | Llama 3.3 70B (explicaciones y asistente), Llama 4 Scout (respaldo), Llama Guard 3 (guardián ético) |
| **Static Assets** | Frontend Vite + React + Tailwind en la misma URL |

Entornos: QA https://c-i-qa.equipo-ci.workers.dev · Producción https://c-i.equipo-ci.workers.dev.

## Uso de IA

- La IA recibe **solo texto anonimizado y sintético**.
- Pesa el **30 %** del puntaje; las reglas verificables, el 70 %. Si la IA falla, decide el motor de reglas.
- El fundamento legal sale de un **catálogo curado**: la IA no inventa artículos.
- Cada respuesta de IA indica el modelo que la generó, y una persona confirma las decisiones críticas.
- Programamos con ayuda de IA (Claude Code, DeepSeek Harness, Antigravity, NotebookLM/Gemini), siempre con revisión humana y pruebas en CI.

Declaración completa en [`SPEC.md`](SPEC.md) §8.

## Enlaces

- Demo: https://c-i.equipo-ci.workers.dev
- Video: `[pendiente]`
- Presentación: `[pendiente]`
- Guion del pitch: [`docs/PITCH_SCRIPT.md`](docs/PITCH_SCRIPT.md)

## Equipo

**C&I – Creatividad e Innovación**

- Anthony Leguisamo — Líder técnico: núcleo, IA, guardián ético, CI/CD e integración
- Williams Mejía — Motor de análisis de correo y marco legal venezolano
- Gabriel Flores — Buzón, cuarentena, roles y panel
- Alejandro Sánchez — UX/UI, deck, video y pitch

## Para el equipo

- Documento maestro: [`docs/C&I.md`](docs/C%26I.md)
- Reparto de PR y ramas: [`docs/PLAN_PRS.md`](docs/PLAN_PRS.md)
- Plan de UX/UI: [`docs/PLAN_UX.md`](docs/PLAN_UX.md)
- Guía para desarrolladores: [`docs/GUIA_DESARROLLADORES.md`](docs/GUIA_DESARROLLADORES.md)
- Glosario: [`docs/GLOSARIO.md`](docs/GLOSARIO.md)
