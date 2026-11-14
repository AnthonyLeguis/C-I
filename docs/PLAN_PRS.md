# 🧩 C&I — Plan de ramas y reparto de Pull Requests

> Complemento de [C&I.md](C%26I.md) (documento maestro) y [PLAN_UX.md](PLAN_UX.md).
> Repo: **`C-I`** (GitHub no permite `&` en el nombre de un repositorio; `C-I` es lo más cercano a "C&I". El nombre visible del proyecto sigue siendo **C&I**).

---

## 1. Modelo de ramas

```text
                    (solo Anthony)                (solo Anthony)              (solo Anthony)
 feat/anthony-* ─┐
 feat/williams-* ─┤   PR + CI automático     ┌──────┐  Agente QA   ┌─────────────┐  Release  ┌──────┐
 feat/gabriel-*  ─┼──────────────────────────►│  qa  │─────────────►│ development │──────────►│ main │
 feat/alejandro-*┘                            └──────┘  aprobado    └─────────────┘           └──────┘
                                                 │                                              │
                                                 ▼ deploy automático                            ▼ deploy automático
                                           c-i-qa.<subdominio>.workers.dev            c-i.<subdominio>.workers.dev
                                           (pruebas del agente QA)                    (PRODUCCIÓN · jurado)
```

| Rama | Se crea desde | Quién la modifica | Cómo entra el código | Se despliega en |
|---|---|---|---|---|
| `main` | — | **Solo Anthony** | PR `development → main` (release) | **Producción** |
| `development` | `main` | **Solo Anthony** | PR `qa → development` tras aprobar el agente QA | — (rama estable integrada) |
| `qa` | `development` | **Solo Anthony** (configura y hace merge) | PR de cada `feat/*` con CI verde | **Entorno QA** |
| `feat/<persona>-<tema>` | `qa` | Su dueño | push libre | — (solo CI) |

> 🧭 **Nuestro norte:** el PRD/TRD unificado ([C&I.md](C%26I.md): alcance, contratos, modelo de datos, arquitectura y reglas) más este plan y [PLAN_UX.md](PLAN_UX.md). Nada se construye fuera de lo que dicen.

**Regla de trabajo de los desarrolladores (Anthony, Williams y Gabriel):**
- **Una rama por cada punto (PR) asignado**: `feat/<persona>-<tema>`, creada desde `qa` actualizado.
- En cada rama se hace **solo lo que ese punto pide** en la tabla de la Sección 2 y en el PRD/TRD. Nada de adelantar otros puntos ni tocar archivos ajenos.
- Al terminar el punto: `npm run check` en verde → PR **hacia `qa`**. Ahí se prueba la integración (CI automático + entorno QA + agente QA).
- El merge a `qa` se completa cuando el CI está en verde y Anthony lo aprueba; luego se arranca el siguiente punto en una rama nueva.

**Reglas:**
1. Los desarrolladores **solo abren PR hacia `qa`**. Nunca hacia `development` ni `main`.
2. Un PR entra a `qa` solo si el **CI está en verde** y **Anthony lo aprueba** (CODEOWNERS).
3. Con `qa` desplegado, Anthony corre el **agente QA** (Sección 4). Si aprueba → PR `qa → development`. Si no → se revierte el PR culpable en `qa` y se devuelve al autor.
4. `development → main` solo en los checkpoints con todo verde (release).
5. Cada rama nueva de trabajo se crea **desde `qa` actualizado**: `git checkout qa && git pull && git checkout -b feat/<persona>-<tema>`.

### 1.1 Cómo se garantiza que solo Anthony toque `qa`, `development` y `main`

En un repo personal, GitHub no permite restringir push por usuario. Se logra así:

- **CODEOWNERS** (`.github/CODEOWNERS`) con `* @AnthonyLeguis` → todo PR necesita la aprobación de Anthony.
- **Protección de rama** en `main`, `development` y `qa`: PR obligatorio, 1 aprobación del code owner, CI `qa` en verde, sin push directo.
- Los compañeros tienen permiso **write** (para crear sus ramas), pero no pueden hacer merge sin la aprobación de Anthony.

> 🔒 **Opción más estricta (5 minutos):** crear una **organización gratuita** en GitHub (`c-i-team`) y el repo dentro de ella. Ahí sí existe "Restrict who can push" y se pone solo a Anthony en `main`, `development` y `qa`.

`.github/CODEOWNERS`:

```text
* @AnthonyLeguis
```

`.github/protection.json` (se aplica a las tres ramas):

```json
{
  "required_status_checks": { "strict": false, "contexts": ["qa"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1, "require_code_owner_reviews": true, "dismiss_stale_reviews": false },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### 1.2 Comandos de creación (Anthony)

```bash
gh repo create C-I --public --clone
```

```bash
cd C-I && git commit --allow-empty -m "chore: inicio C&I" && git push -u origin main
```

```bash
git checkout -b development && git push -u origin development
```

```bash
git checkout -b qa && git push -u origin qa
```

```bash
gh repo edit --default-branch qa
```

> Rama por defecto = `qa`: así los PR de los compañeros apuntan a `qa` sin que tengan que elegirla.

Protección de las tres ramas:

```bash
for b in main development qa; do gh api -X PUT repos/AnthonyLeguis/C-I/branches/$b/protection --input .github/protection.json; done
```

Invitar a cada compañero:

```bash
gh api -X PUT repos/AnthonyLeguis/C-I/collaborators/<usuario> -f permission=push
```

### 1.3 Ciclo de un desarrollador (lo único que necesitan saber)

```bash
git checkout qa && git pull && git checkout -b feat/williams-parser
```

```bash
npm run check
```

```bash
git add -A && git commit -m "feat(W2): parser de correo" && git push -u origin feat/williams-parser
```

```bash
gh pr create --base qa --title "W2: Parser de correo" --body "Cierra W2. Criterio: ver PLAN_PRS.md"
```

Después del merge, para el siguiente PR: volver al primer comando con un nombre nuevo.

---

## 2. Reparto de PR (en orden de ejecución)

**Leyenda:** 🧱 bloquea a otros · ⏱️ checkpoint objetivo · ✅ criterio de aceptación (lo que revisa el agente QA).

### 2.0 Anthony — F0 (directo, antes de abrir las ramas)

| PR | Contenido | ⏱️ | ✅ Criterio |
|---|---|---|---|
| **A0** 🧱 | Esqueleto Hono + Vite/React/Tailwind, `domain/types.ts`, `ports.ts`, `web/src/types/contracts.ts`, `apiClient.ts`, **rutas mock** con el JSON exacto de todos los contratos, `migrations/0001_schema.sql`, CI/CD, Docker, CODEOWNERS, protección de ramas, entornos QA y producción | CP0 | `/api/v1/health` responde en QA y producción; todos los endpoints mock devuelven el contrato; CI verde |

> A0 es la única excepción: Anthony lo sube directo para crear la base sobre la que todos trabajan.

### 2.1 Anthony — M0 Núcleo, IA y guardián ético

| PR | Rama | Contenido | Depende de | ⏱️ | ✅ Criterio |
|---|---|---|---|---|---|
| **A1** 🧱 | `feat/anthony-pii` | `piiSanitizer.ts` + tests (cédula, teléfono, cuenta de 20 dígitos, correo personal) | A0 | CP1 | CA4: ningún dato en claro; 6+ tests |
| **A2** 🧱 | `feat/anthony-ai-gateway` | `WorkersAiGateway` (GLM-4.7 Flash + Llama Guard 3, timeout, fallback) + tests con IA simulada | A0 | CP1 | CA6: responde < 1 s si la IA falla |
| **A3** | `feat/anthony-ethics-guard` | `ethicsGuard.ts` (inyección + peticiones ofensivas), `assistant.ts`, `POST /assistant/ask` real | A1, A2 | CP2 | CA7: bloquea y registra en bitácora |
| **A4** | `feat/anthony-assistant-ui` | `pages/Assistant.tsx` + `components/assistant/*` (usa el kit de UI de X2) | A3, X2 | CP3 | Vista pregunta/respuesta con badge IA y bloqueo visible |
| **A5** | `feat/anthony-docs` | `SPEC.md` final, sección técnica del README, declaración de IA | todos | CP5 | Checklist del evento completo |

### 2.2 Williams — M1 Motor de correo y marco legal

| PR | Rama | Contenido | Depende de | ⏱️ | ✅ Criterio |
|---|---|---|---|---|---|
| **W1** 🧱 | `feat/williams-catalogs` | `bankDomains.ts` (dominios oficiales + `banco-demo.com.ve`) y `domain/legalCatalog.ts` (indicador → norma) + `docs/LEGAL_NOTES.md` con fuentes | A0 | CP1 | Cada referencia legal tiene fuente o va sin número de artículo |
| **W2** | `feat/williams-parser` | `emailParser.ts`: JSON o correo crudo → remitente, Reply-To, Return-Path, Authentication-Results, URLs, adjuntos + tests | A0 | CP1 | 5+ tests con correos crudos y JSON |
| **W3** 🧱 | `feat/williams-heuristics` | `emailHeuristics.ts`: todos los indicadores con pesos y score 0–100 + tests | W1, W2 | CP2 | CA1, CA2, CA3 en verde |
| **W4** 🧱 | `feat/williams-analyze` | `analyzeEmail.ts` (anonimiza → reglas → IA → fusión 0.7/0.3 → carpeta → legal → bitácora) + `POST /mail/analyze` real (reemplaza el mock) | W3, A1, A2, G2 | CP2 | Contrato exacto; smoke de análisis en verde |
| **W5** | `feat/williams-seed` | `seed/seed_mailbox.sql` (20 correos: 12 maliciosos variados, 8 legítimos) + `docs/DEMO_CASES.md` (6 casos) | W3 | CP3 | ≥ 90 % de acierto sobre los 20 correos |

### 2.3 Gabriel — M2 Buzón, roles, bitácora y panel

| PR | Rama | Contenido | Depende de | ⏱️ | ✅ Criterio |
|---|---|---|---|---|---|
| **G1** 🧱 | `feat/gabriel-auth` | `hash.ts` (PBKDF2 + SHA-256), `auth.ts` (cookie HMAC, `requireRole`), `0002_demo_users.sql`, `/auth/login · logout · me` + tests | A0 | CP1 | Login de los 3 roles; 401 sin sesión |
| **G2** 🧱 | `feat/gabriel-repos` | `d1Repos.ts` (correos + bitácora con hash encadenado) + `GET /audit/verify` | A0 | CP1 | CA8: detecta un registro alterado |
| **G3** | `feat/gabriel-mailbox-api` | `mailbox.ts` + `GET /mailbox`, `POST /mailbox/deliver`, `POST /mailbox/:id/review` | G1, G2, W4 | CP2 | CA5: ANALYST recibe 403 al restaurar |
| **G4** | `feat/gabriel-dashboard-api` | `dashboard.ts` + `GET /dashboard` con **todos** los campos de `PLAN_UX.md` §4 | G2 | CP2 | Contrato del dashboard completo |
| **G5** | `feat/gabriel-login-mailbox-ui` | `pages/Login.tsx`, `pages/Mailbox.tsx`, `components/mailbox/*`, hooks | G1, G3, X2 | CP3 | Flujo completo: llegar → cuarentena → confirmar/restaurar |
| **G6** | `feat/gabriel-dashboard-ui` | `pages/Dashboard.tsx`, `components/dashboard/*` según `PLAN_UX.md` §4 | G4, X2 | CP4 | KPI, gráficos y tabla con datos reales |

### 2.4 UX/UI — Alejandro diseña, los desarrolladores implementan

> **Alejandro no usa GitHub.** Diseña según `PLAN_UX.md` y envía todo por el **chat interno** del equipo. Anthony sube sus archivos a `docs/design/` (punto **X0**) y los desarrolladores convierten sus diseños en código. Alejandro **aprueba visualmente** cada pantalla en el entorno QA antes de pasarla a producción.

**Entregables de Alejandro (por chat interno):**

| Código | Entregable | ⏱️ | ✅ Criterio |
|---|---|---|---|
| **D0** | Bocetos de las 6 pantallas (Login, Panel, Buzón, Analizador, Asistente, Bitácora) siguiendo `PLAN_UX.md` (foto, Figma, Canva o Excalidraw) | CP0 | Anthony, Williams y Gabriel los aprueban |
| **D1** | Detalle visual de componentes: badges de alerta, RiskMeter, tarjetas KPI, Topbar y Sidebar | CP1 | Coincide con los niveles de `PLAN_UX.md` §3 |
| **D2** | Revisión visual de cada pantalla en el entorno QA (lista de ajustes por chat) | CP3–CP5 | Ajustes resueltos |
| **D3** | Textos del README ("Qué hace", "Cómo se usa") y guion del pitch (3 y 5 min) | CP5 | Anthony los sube al repo |
| **D4** | **Deck** (6–8 diapositivas) y **video** (2–3 min, grabado desde producción) | CP6 | Enlaces públicos en el README y en `/remoto` |
| **D5** | Cifras del problema con fuente (junto con Williams) | CP4 | Agregadas al `SPEC.md` |

**Puntos de código de UX (los implementan los desarrolladores a partir de los diseños):**

| PR | Responsable | Rama | Contenido | Depende de | ⏱️ | ✅ Criterio |
|---|---|---|---|---|---|---|
| **X0** | Anthony | `feat/anthony-design-docs` | Subir a `docs/design/` los bocetos y archivos que Alejandro envía por chat | D0 | CP0 | Bocetos visibles en el repo |
| **X1** 🧱 | Anthony | `feat/anthony-tokens` | `styles/index.css` (tema completo), fuentes Inter y JetBrains Mono locales, iconos Lucide | A0, D0 | CP1 | Colores y tipografía de `PLAN_UX.md` §2 |
| **X2** 🧱 | Anthony | `feat/anthony-ui-kit` | `components/ui/*`: Button, Card, AlertBadge, RiskMeter, FolderBadge, ReviewBadge, AiBadge, KpiCard, Topbar, Sidebar, EmptyState, ErrorState, Skeleton | X1, D1 | CP2 | Página `/ui` de muestra con todos los componentes y estados |
| **X3** | **Williams** | `feat/williams-analyzer-ui` | `pages/Analyzer.tsx` + `components/analyzer/*` (formulario + dictamen) | X2, W4 | CP3 | Dictamen separado en Riesgo · Indicadores · Legal · Acción |
| **X4** | Gabriel + Anthony | `feat/gabriel-polish` / `feat/anthony-polish` | Estados vacíos, carga y error; responsive; modo proyector; accesibilidad; ajustes de D2 | G5, G6, X3, D2 | CP5 | Checklist de `PLAN_UX.md` §8 + visto bueno de Alejandro |
| **X5** | Anthony | `feat/anthony-docs-ux` | README y `docs/PITCH_SCRIPT.md` con los textos de D3 | D3 | CP5 | README con las secciones obligatorias |

### 2.5 Vista por checkpoint

| ⏱️ | Anthony | Williams | Gabriel | Alejandro (chat) |
|---|---|---|---|---|
| **CP0 · Vie 23:00** | A0, X0 | (estudia normativa y dominios) | (diseña tablas y login en papel) | D0 |
| **CP1 · Sáb 01:00** | A1, A2, X1 | W1, W2 | G1, G2 | D1 |
| **CP2 · Sáb 03:00** | A3, X2 | W3, W4 | G3, G4 | (descansa: es el presentador) |
| **CP3 · Sáb 05:00** | A4 | W5, X3 | G5 | D2 |
| **CP4 · Sáb 08:00** | integración | ajustes de reglas, D5 | G6 | D2, D5 |
| **CP5 · Sáb 10:00** | A5, X4, X5 | verificación legal | X4 | D2, D3 |
| **CP6 · Sáb 12:00** | release final | casos de demo | correcciones | D4 (video + deck) |

**Orden de merge a `qa` dentro de cada checkpoint:** UX base (X) → Williams → Gabriel → Anthony (de menor a mayor riesgo de romper la integración).

---

## 3. Plantilla de PR (`.github/pull_request_template.md`)

```markdown
## PR: <código, p. ej. W3> — <título>

**Qué hace:**

**Cómo probarlo:**
1.

**Criterio de aceptación (PLAN_PRS.md):**
- [ ]

**Checklist del autor**
- [ ] `npm run check` en verde en mi PC
- [ ] Solo toqué mis archivos asignados
- [ ] Sin `any`, sin `fetch` fuera de `apiClient.ts`
- [ ] Solo datos sintéticos (V-00.000.00X, 0412-0000000, banco-demo.com.ve)
- [ ] Capturas (si es UI)
```

---

## 4. Agente QA (Anthony, en la rama `qa`)

### 4.1 Automático (GitHub Actions, en cada PR hacia `qa`)

`.github/workflows/ci.yml`:

```yaml
name: qa
on:
  push: { branches: ["feat/**"] }
  pull_request: { branches: [qa, development, main] }
jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run check
      - name: Smoke local
        run: |
          echo 'SESSION_SECRET="ci-only-secret"' > .dev.vars
          npx wrangler d1 migrations apply c-i-db --local
          npx wrangler dev --port 8787 > wrangler.log 2>&1 &
          npx wait-on -t 60000 http://localhost:8787/api/v1/health
          npm run smoke
```

`.github/workflows/deploy.yml`: push a `qa` → entorno **qa**; push a `main` → **production**.

```yaml
name: deploy
on:
  push: { branches: [qa, main] }
concurrency: deploy-${{ github.ref_name }}
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      ENV_NAME: ${{ github.ref_name == 'main' && 'production' || 'qa' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci && npm run check
      - run: npx wrangler d1 migrations apply DB --remote --env $ENV_NAME
      - run: npx wrangler deploy --env $ENV_NAME
      - name: Smoke contra la URL desplegada
        run: |
          if [ "$ENV_NAME" = "production" ]; then URL="${{ vars.PROD_URL }}"; else URL="${{ vars.QA_URL }}"; fi
          SMOKE_URL="$URL" npm run smoke
```

### 4.2 Agente QA con IA (Anthony lo ejecuta con Claude Code tras cada merge a `qa`)

```text
Actúa como Ingeniero Principal de QA del proyecto C&I.
1. Lee C&I.md, PLAN_PRS.md, PLAN_UX.md y SPEC.md.
2. Revisa `git diff development..qa` y los PR que entraron (gh pr list --base qa --state merged --limit 10).
3. Verifica para cada PR su criterio de aceptación de PLAN_PRS.md §2, además de:
   - contratos exactos (C&I.md §5.2 y PLAN_UX.md §4);
   - Clean Architecture, cero `any`, fetch solo en apiClient.ts;
   - Zero-Leak PII, fallback de IA, RBAC en cada ruta, cadena de hash;
   - niveles de alerta, colores y textos de PLAN_UX.md;
   - sin secretos ni datos reales.
4. Ejecuta `npm run check` y `SMOKE_URL=<QA_URL> npm run smoke`.
5. Responde:
   - `QA: APROBADO → qa puede pasar a development`, o
   - `QA: RECHAZADO` con: PR culpable, archivo, problema y corrección exacta para pegar al autor.
```

Si aprueba:

```bash
gh pr create --base development --head qa --title "QA aprobado CPx" --body "Agente QA: APROBADO" && gh pr merge --merge
```

Release en checkpoint:

```bash
gh pr create --base main --head development --title "Release CPx" --body "Producción CPx" && gh pr merge --merge
```

Si rechaza: `git revert <commit del PR>` en `qa` y se le envía al autor el texto del agente.
