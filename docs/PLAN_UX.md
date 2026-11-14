# 🎨 C&I — Plan de UX/UI (Alejandro Sánchez)

> **Flujo:** Alejandro diseña con este plan y envía todo por el **chat interno** (no usa GitHub). Anthony sube los diseños a `docs/design/`. Lo implementan: Anthony (tema y componentes), Williams (Analizador), Gabriel (Login, Buzón, Panel, Bitácora) y Anthony (Asistente). Ver `PLAN_PRS.md` §2.4.

> Complemento de [C&I.md](C%26I.md) y [PLAN_PRS.md](PLAN_PRS.md). Es la **especificación visual**: Gabriel, Williams y Anthony construyen sus pantallas con estas reglas, y el agente QA las verifica.

---

## 1. Principios

1. **El riesgo se entiende en 2 segundos:** color + icono + palabra + número. Nunca solo color (accesibilidad).
2. **Cada decisión se explica:** todo dictamen muestra *Hallazgo técnico · Fundamento legal · Acción*.
3. **La IA se declara:** cada texto generado por IA lleva su badge.
4. **El humano decide lo crítico:** los botones de confirmar o restaurar son visibles y claros.
5. **Pensado para proyector:** contraste alto, textos ≥ 15 px, nada importante en gris claro.
6. **Sobrio y bancario:** azul institucional, sin animaciones exageradas.

---

## 2. Sistema de diseño

### 2.1 Colores (tokens) — paleta oficial basada en `Dashboard_RC` (actualizada 13/11)

> **Decisión:** se adopta la escala de colores de `Dashboard_RC` (verde de marca, fondos salvia, tinta pizarra, contrastes validados) en **modo claro y oscuro**. El **azul marino del logo** (`#0B2545`) se conserva en el menú lateral y el **cian del logo** (`#00A8E8`) en los indicadores de IA, para que app y logo combinen.
> Cada token apunta a una variable que se redefine por tema: los componentes usan `bg-surface`, `text-ink`, etc., y el tema cambia sin tocar el marcado.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--page` | `#e7f0ea` | `#020617` | Fondo general |
| `--surface` | `#f4faf6` | `#0f172a` | Tarjetas, tablas, paneles |
| `--surface-2` | `#eaf3ed` | `#16203a` | Inputs, superficies secundarias |
| `--line` / `--line-strong` | `#d6e6db` / `#c0d5c7` | `#1e293b` / `#334155` | Bordes |
| `--ink` | `#0f172a` | `#f1f5f9` | Texto principal |
| `--ink-2` | `#334155` | `#cbd5e1` | Texto secundario |
| `--ink-muted` | `#64748b` | `#94a3b8` | Metadatos y fechas |
| `--brand` | `#008542` | `#00b050` | Botón primario, foco, elemento activo |
| `--on-brand` | `#ffffff` | `#04140a` | Texto sobre `--brand` |
| `--brand-soft` | `#e6f7ee` | `rgba(0,176,80,.16)` | Fondos suaves de marca |
| `--sidebar` (logo) | `#0B2545` | `#0B2545` | Menú lateral (texto blanco) |
| `--ai` (logo) | `#00A8E8` | `#00A8E8` | Badge "Generado por IA", análisis en curso |
| `--console` | `#0f172a` | `#020617` | Bitácora / hashes |

Gráficos (series categóricas): `#2a78d6 · #1baf7a · #eda100 · #008300 · #4a3aa7 · #e34948 · #e87ba4 · #eb6834` (claro) y `#3987e5 · #199e70 · #c98500 · #008300 · #9085e9 · #e66767 · #d55181 · #d95926` (oscuro).

Botón de tema (sol/luna) en el Topbar; al cambiar, transición suave de 0,4 s (respetar `prefers-reduced-motion`). Tema por defecto: **claro**; recordar la elección en `localStorage`.

### 2.2 Tipografía y espaciado

| Elemento | Fuente | Tamaño / peso |
|---|---|---|
| H1 título de pantalla | Inter | 28 / 700 |
| H2 sección | Inter | 22 / 600 |
| H3 tarjeta | Inter | 18 / 600 |
| Cuerpo y dictamen | Inter | 15 / 400, interlineado 1.6 |
| KPI (número grande) | Inter | 36 / 700 |
| Encabezados de correo, hashes, URLs | JetBrains Mono | 13 / 400 |
| Badges | Inter | 12 / 600, MAYÚSCULAS |

Espaciado en múltiplos de 8 px · padding de tarjeta 24 px · separación 16 px · radios: tarjeta 10 px, botón 6 px, badge 4 px · sombra suave solo en tarjetas.

---

## 3. Niveles de alerta (fuente única para todo el equipo)

### 3.1 Nivel de riesgo del correo

| Nivel (API) | Etiqueta | Score | Color claro (texto / fondo) | Color oscuro (texto) | Icono Lucide | Acción automática | Mensaje corto |
|---|---|---|---|---|---|---|---|
| `SAFE` | **SEGURO** | 0–19 | `#0a8f34` / `#e6f7ee` | `#0ca30c` | `ShieldCheck` | Queda en **Bandeja** | "Sin señales de amenaza" |
| `LOW` | **BAJO** | 20–49 | `#2a78d6` / `#ebf3fd` | `#3987e5` | `Info` | Queda en **Bandeja** con aviso | "Revise con atención antes de responder" |
| `HIGH` | **ALTO** | 50–79 | `#b7791f` / `#fdf3e1` | `#fab219` | `AlertTriangle` | Va a **Spam** | "Posible phishing: no abra enlaces ni adjuntos" |
| `CRITICAL` | **CRÍTICO** | 80–100 | `#dc2626` / `#fdecec` | `#d03b3b` | `ShieldAlert` | Va a **Cuarentena** + revisión humana | "Amenaza detectada por reglas: aislado" |

Estado extra **ESCALADO A CISO**: color `--serious` (`#c2410c` claro / `#ec835a` oscuro), icono `ArrowUpRight`.

> Componente `AlertBadge level="CRITICAL"` → icono + "CRÍTICO" + color. `RiskMeter score={97}` → barra 0–100 con las 4 zonas (verde, azul, ámbar, rojo) y un marcador ▲ en la posición del puntaje (como en el prototipo).

### 3.2 Carpeta del correo

| Carpeta (API) | Etiqueta | Icono | Color |
|---|---|---|---|
| `INBOX` | Bandeja | `Inbox` | `--primary` |
| `SPAM` | Spam | `MailWarning` | ámbar (`HIGH`) |
| `QUARANTINE` | Cuarentena | `Lock` | rojo (`CRITICAL`) |

### 3.3 Estado de revisión humana

| Estado (API) | Etiqueta | Icono | Color |
|---|---|---|---|
| `N/A` | — (no se muestra) | — | — |
| `PENDING` | **PENDIENTE DE REVISIÓN** | `Clock` | ámbar, con punto pulsante |
| `CONFIRMED` | **AMENAZA CONFIRMADA** | `CheckCircle2` | rojo |
| `RESTORED` | **RESTAURADO** | `Undo2` | verde |

### 3.4 Origen del análisis (transparencia IA)

| Caso | Badge | Color |
|---|---|---|
| `ai_used = true` | `Sparkles` "Explicación generada por IA · Llama 3.3 70B" | cian `--secondary` |
| `ai_used = false` | `Cpu` "Análisis determinista (reglas)" | gris azulado |
| Asistente bloqueado | `Ban` "Bloqueado por el guardián ético" | rojo |

### 3.5 Categorías de indicadores (para agrupar la lista del dictamen)

| Categoría | Icono | Ejemplos |
|---|---|---|
| Remitente / suplantación | `UserX` | dominio parecido al oficial, nombre visible falso, Reply-To gratuito |
| Autenticación | `KeyRound` | SPF/DKIM/DMARC en fail |
| Enlaces | `Link2Off` | dominio falso, acortador, IP, texto ≠ destino |
| Adjuntos | `Paperclip` | `.exe`, macros, doble extensión |
| Ingeniería social | `Megaphone` | urgencia, amenaza, petición de credenciales, transferencia urgente |
| Datos personales | `EyeOff` | PII anonimizada |

> Williams devuelve cada indicador con su categoría; si no, el frontend los muestra en "Otros".

---

## 4. Datos del Dashboard (contrato de `GET /api/v1/dashboard`)

Gabriel implementa **todos** estos campos (PR G4) y los dibuja (PR G6).

```json
{
  "generated_at": "2026-11-14T10:00:00Z",
  "kpis": {
    "emails_analyzed": 128,
    "quarantined": 21,
    "sent_to_spam": 34,
    "pending_review": 6,
    "threats_blocked_pct": 43.0,
    "avg_risk_score": 41.7,
    "pii_protected": 19,
    "blocked_assistant_requests": 4
  },
  "by_risk_level": { "SAFE": 50, "LOW": 23, "HIGH": 34, "CRITICAL": 21 },
  "by_folder": { "INBOX": 73, "SPAM": 34, "QUARANTINE": 21 },
  "by_indicator_category": { "REMITENTE": 40, "AUTENTICACION": 31, "ENLACES": 37, "ADJUNTOS": 12, "INGENIERIA_SOCIAL": 45, "DATOS_PERSONALES": 19 },
  "top_impersonated": [ { "entity": "SUDEBAN", "count": 9 }, { "entity": "BANCO_DEMO", "count": 7 }, { "entity": "PROVEEDOR", "count": 4 } ],
  "timeline": [ { "hour": "2026-11-14T08:00:00Z", "total": 12, "threats": 5 } ],
  "review_queue": [ { "email_id": "uuid", "subject": "URGENTE: …", "from_address": "…", "risk_score": 97, "received_at": "…" } ],
  "recent_events": [ { "id": "uuid", "created_at": "…", "module": "MAIL_ANALYZER", "actor": "SYSTEM", "risk_level": "CRITICAL", "action_taken": "QUARANTINE", "hash": "a3f9…" } ],
  "chain_ok": true,
  "ai_status": "ONLINE"
}
```

`ai_status`: `ONLINE` (la IA respondió en los últimos 5 min) · `FALLBACK` (usando solo reglas) · `UNKNOWN`.

### 4.1 Distribución visual del Dashboard

```text
┌ Sidebar ┐┌──────────────────────── Topbar: C&I · 🟢 IA en línea · 🔒 PII protegida · usuario (rol) ───────────────┐
│ ▣ Panel ││ FILA 1 — 4 KPI                                                                                       │
│ ✉ Buzón ││ [Correos analizados 128] [En cuarentena 21 🔴] [Enviados a spam 34 🟡] [Pendientes de revisión 6 ⏱]  │
│ 🔍 Anal.││ FILA 2                                                                                               │
│ 💬 Asis.││ [Donut: correos por nivel de riesgo]   [Barras: entidades más suplantadas]                          │
│ 📜 Bitá.││ FILA 3                                                                                               │
│         ││ [Línea: correos vs. amenazas por hora]  [Barras horizontales: tipos de indicador]                   │
│         ││ FILA 4                                                                                               │
│         ││ [Cola de revisión humana (top 5) → botón "Revisar"]  [Últimos eventos con hash · ✅ Cadena íntegra]  │
└─────────┘└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Bloque | Campo | Visualización | Nota |
|---|---|---|---|
| KPI 1 | `kpis.emails_analyzed` | Número grande | subtítulo: "% amenazas: `threats_blocked_pct`" |
| KPI 2 | `kpis.quarantined` | Número rojo + `Lock` | clic → Buzón › Cuarentena |
| KPI 3 | `kpis.sent_to_spam` | Número ámbar + `MailWarning` | clic → Buzón › Spam |
| KPI 4 | `kpis.pending_review` | Número + `Clock` pulsante si > 0 | clic → cola de revisión |
| Donut | `by_risk_level` | 4 segmentos con los colores de §3.1 | leyenda con etiquetas en español |
| Barras | `top_impersonated` | Barras horizontales (máx. 5) | |
| Línea | `timeline` | 2 series: total (azul) y amenazas (rojo) | |
| Barras | `by_indicator_category` | Barras con iconos de §3.5 | |
| Cola | `review_queue` | Lista con AlertBadge, asunto y botón | visible solo para SUPERVISOR y ADMIN |
| Bitácora | `recent_events` + `chain_ok` | Tabla oscura (`--console`), hash en monoespaciado, recortado `a3f9…` | sello "✅ Cadena íntegra" o "❌ Cadena alterada" |
| Topbar | `ai_status` | Punto verde "IA en línea" / ámbar "Modo reglas" | |

> Gráficos: **Recharts** (liviano y compatible con React). Si no da tiempo: barras hechas con `div` y Tailwind.

---

## 4.2 Prototipo de Alejandro (fuente visual oficial)

Prototipo interactivo en NotebookLM ("Especificación Visual del Sistema C&I"). Capturas en [`docs/design/prototipo/`](design/prototipo/). **Se construye siguiendo esas capturas**, con la paleta de §2.1.

**Decisiones sobre lo que trae el prototipo:**

| Elemento del prototipo | Decisión | Responsable |
|---|---|---|
| Login con **selección rápida de perfil (1 clic)** + formulario + credenciales de demostración visibles | ✅ Adoptado | Gabriel (G1, G5) |
| Nombres de rol en pantalla: **Analista de Seguridad · Gerente de Seguridad (CISO) · Master / Soporte Técnico** | ✅ Adoptado (en el código siguen `ANALYST · SUPERVISOR · ADMIN`) | Todos |
| Usuarios demo: `jrios` (Analista) · `svalenzuela` (CISO) · `cmendoza` (Master) | ✅ Adoptado (sintéticos) | Gabriel (G1) |
| Panel: 4 KPI, casos prioritarios para triaje, conteo por nivel, entidades más suplantadas | ✅ Adoptado | Gabriel (G4, G6) |
| Buzón: pestañas Todos/Bandeja/Spam/Cuarentena/**Pendientes**, buscador, selector de escenario + "Simular llegada", detalle con contenido difuminado y enlaces neutralizados | ✅ Adoptado | Gabriel (G3, G5) |
| Analizador: expediente técnico + **acciones en 1 clic: Aprobar/Marcar seguro · Escalar a CISO · Bloquear dominio** + "Evaluar correo manual" | ✅ Adoptado | Williams (X3) + Gabriel (G7) |
| Bitácora inmutable: sello "Cadena íntegra · N registros", Verificar integridad, filtros, **Exportar CSV** | ✅ Adoptado | Gabriel (G2, G6) |
| **Consola de Soporte** (solo Master): estado del motor IA / D1 / correo, **cambiar a modo reglas**, **restablecer demo**, lista de dominios bloqueados | ✅ Adoptado | Anthony (A6) |
| Badge "Explicación generada por IA · GLM-4.7 Flash" | ✏️ Cambia a **Llama 3.3 70B** (modelo real) | Todos |
| **IP de origen, país, ASN y "dominio creado hace 48 horas"** | ❌ **Descartado del MVP**: requiere consultas externas (WHOIS/geolocalización); sin ellas serían datos inventados y rompe la regla "cero invención". Queda en el roadmap. | — |
| Pantalla del **Asistente** | ⚠️ No está en el prototipo: se construye con §5.5 y el kit de componentes | Anthony (A4) |

## 5. Pantallas

### 5.1 Mapa de navegación y permisos por rol

| Pantalla | Ruta | Analista (ANALYST) | CISO (SUPERVISOR) | Master (ADMIN) | Dueño |
|---|---|---|---|---|---|
| Login | `/login` | ✅ | ✅ | ✅ | Gabriel |
| Panel | `/` | ✅ (sin cola de revisión) | ✅ | ✅ | Gabriel |
| Buzón | `/buzon` | ✅ ver | ✅ ver + confirmar/restaurar | ✅ | Gabriel |
| Analizador | `/analizar` | ✅ | ✅ | ✅ | Williams (diseño de Alejandro) |
| Asistente | `/asistente` | ✅ | ✅ | ✅ | Anthony |
| Bitácora | `/bitacora` | ❌ | ✅ ver | ✅ ver + verificar cadena | Gabriel |
| Consola de Soporte | `/soporte` | ❌ | ❌ | ✅ | Anthony |

Lo que el rol no permite **no se muestra** (no se deshabilita): el menú y los botones cambian según `GET /auth/me`.

### 5.2 Login

- Tarjeta centrada de 420 px sobre `--bg`. Logo **C&I**, slogan "Anticipamos el riesgo. Fortalecemos tu confianza.".
- Campos: usuario y contraseña. Botón primario "Iniciar sesión segura".
- **Caja "Usuarios de demostración"** con los 3 usuarios y su rol (para el jurado).
- Aviso pequeño: "Sistema de demostración con datos sintéticos. Uso monitoreado."
- Error: "Usuario o contraseña incorrectos" (nunca decir cuál de los dos falló).

### 5.3 Buzón institucional

```text
┌ Pestañas: [Bandeja 73] [Spam 34 🟡] [Cuarentena 21 🔴] ─────────── [+ Simular llegada de correo ▾] ┐
│ LISTA (40%)                                 │ DETALLE (60%)                                         │
│ ● [CRÍTICO] SUDEBAN - Supervisión  10:42    │ Asunto · De · Reply-To · Para (monoespaciado)         │
│   URGENTE: Actualice sus credenciales…      │ [CRÍTICO 97] [Cuarentena] [PENDIENTE DE REVISIÓN]    │
│   [PENDIENTE]                               │ ── Hallazgos técnicos (agrupados por categoría §3.5)   │
│ ○ [SEGURO] RRHH Banco Demo        09:15     │ ── Fundamento legal (tarjetas norma/referencia)       │
│   Recibo de pago disponible                 │ ── Explicación [badge IA]                             │
│                                             │ ── Acción recomendada                                 │
│                                             │ [Confirmar amenaza] [Restaurar a bandeja]  (SUPERVISOR)│
└─────────────────────────────────────────────┴───────────────────────────────────────────────────────┘
```

- Correos de cuarentena: el cuerpo se muestra **borroso** con el botón "Ver contenido (seguro, sin enlaces activos)". Los enlaces nunca son clicables.
- "Simular llegada de correo" despliega los 6 casos de `DEMO_CASES.md`. Al elegir uno se ve una animación corta de "Analizando…" (barra cian) y el correo aparece en su carpeta con un destello del color de su nivel. **Es el momento clave de la demo.**
- Al confirmar o restaurar: toast "Decisión registrada en la bitácora · hash a3f9…".

### 5.4 Analizador (diseño de Alejandro, código de Williams)

```text
┌ ENTRADA (50%) ───────────────────────────┐┌ DICTAMEN (50%) ───────────────────────────────┐
│ Ejemplos: [Falso SUDEBAN] [Fraude CEO]   ││ [RiskMeter 97 · CRÍTICO]  [→ Cuarentena]       │
│           [Correo legítimo]              ││ ① Hallazgos técnicos  (lista con iconos)       │
│ De: [____________]  Nombre: [_______]    ││ ② Fundamento legal    (tarjetas)               │
│ Reply-To: [________]                     ││ ③ Explicación         [badge IA]               │
│ Autenticación: [spf=… dkim=… dmarc=…]    ││ ④ Acción recomendada                           │
│ Asunto: [_____________________]          ││ 🔒 2 datos personales anonimizados             │
│ Cuerpo: [textarea monoespaciado]         ││                                               │
│ Adjuntos: [chip][chip][+]                ││                                               │
│ [ Analizar correo ]   o  [Pegar correo crudo] ││                                           │
└──────────────────────────────────────────┘└───────────────────────────────────────────────┘
```

- Estado vacío del dictamen: ilustración simple + "Pega un correo o elige un ejemplo para analizarlo".
- Mientras analiza: skeleton de las 4 tarjetas y el texto "Revisando remitente, enlaces y adjuntos…".

### 5.5 Asistente (Anthony construye, Alejandro diseña)

- Chat simple. Encima de cada pregunta enviada se muestra la **versión anonimizada** con los datos tapados resaltados (`[CEDULA_PROTEGIDA]` en chip gris).
- Respuesta normal: tarjeta con badge IA y estructura *Hallazgo · Riesgo · Acción*.
- Respuesta bloqueada: tarjeta roja `Ban` "Bloqueado por el guardián ético" + motivos (`Intento de manipulación`, `Petición ofensiva`) + texto "Puedo ayudarte a defenderte de esto, no a hacerlo".
- Sugerencias rápidas: "¿Por qué este correo es peligroso?", "¿Cómo reconozco un correo falso de SUDEBAN?".

### 5.6 Bitácora

- Tabla en fondo `--console`, texto claro, columnas: fecha · módulo · actor · nivel · acción · hash (monoespaciado, recortado y con botón para copiar).
- Botón (ADMIN) "Verificar integridad" → sello verde "✅ Cadena íntegra · 128 registros" o rojo "❌ Ruptura en el registro #57".

---

## 6. Estados de interfaz (obligatorios en cada pantalla)

| Estado | Diseño |
|---|---|
| Cargando | Skeleton gris con el contorno del contenido (no spinners sueltos) |
| Vacío | Icono + frase útil + acción ("No hay correos en cuarentena. ¡Bien!") |
| Error de red | Tarjeta `ErrorState` con "No pudimos conectar. Reintentar" |
| Sin permiso (403) | "Tu rol no permite esta acción" |
| Sesión vencida (401) | Redirige al login con el aviso "Tu sesión expiró" |
| IA en modo reglas | Banner ámbar en el Topbar "IA no disponible: análisis con reglas" (la app sigue funcionando) |

---

## 7. Textos (microcopy)

- Siempre en español, tono institucional y claro, sin tecnicismos en los mensajes al usuario final.
- Botones con verbo: "Analizar correo", "Confirmar amenaza", "Restaurar a bandeja", "Verificar integridad".
- Fechas en formato venezolano: `14/11/2026 10:42`.
- Números con coma decimal: `41,7`.
- Nunca mostrar datos personales reales: solo los sintéticos de la demo.

---

## 8. Checklist de calidad visual (lo revisa el agente QA en X4)

- [ ] Contraste WCAG AA (texto ≥ 4.5:1; usar un verificador de contraste).
- [ ] Todo se puede usar con teclado (Tab) y el foco se ve.
- [ ] Iconos con `aria-label`; badges con texto, no solo color.
- [ ] Se ve bien a 1366×768 (laptop), 1920×1080 (proyector) y 390 px (teléfono).
- [ ] En el proyector, el KPI y el nivel de riesgo se leen desde el fondo de la sala.
- [ ] Cada texto de IA lleva su badge.
- [ ] Los 6 estados de la §6 existen en Buzón, Analizador y Panel.
- [ ] Fuentes e iconos locales (sin depender de CDN durante la demo).

---

## 9. Entregables de Alejandro y horario (por chat interno; ver D0–D5 en `PLAN_PRS.md` §2.4)

| Hora | Entregable |
|---|---|
| Vie 23:00 (CP0) | **D0**: bocetos de Login, Panel, Buzón, Analizador, Asistente y Bitácora (por chat) |
| Sáb 01:00 (CP1) | **D1**: detalle de badges, RiskMeter, KPI, Topbar y Sidebar (por chat) |
| Sáb 01:00–04:00 | 😴 **Descanso obligatorio** (presentador) |
| Sáb 05:00–10:00 | **D2**: revisión visual de cada pantalla en el entorno QA y lista de ajustes |
| Sáb 08:00 (CP4) | **D5**: cifras del problema con fuente (con Williams) |
| Sáb 10:00 (CP5) | **D3**: textos del README y guion del pitch |
| Sáb 12:00 (CP6) | **D4**: deck y video desde producción |
| Sáb 13:00–15:30 | Ensayos del pitch (mínimo 5) |

### 9.1 Deck (6–8 diapositivas)

1. Portada: C&I + slogan.
2. Problema: el correo como puerta de entrada + cifras con fuente.
3. Solución: C&I en una frase + las 3 acciones (detecta, aísla, explica).
4. Demo (captura o video corto de respaldo).
5. IA responsable: cómo se calcula el puntaje (reglas 70 % + IA 30 %), PII protegida, revisión humana.
6. Arquitectura: Cloudflare (Workers, D1, Workers AI) + SDD.
7. **Instalable dentro del banco:** el mismo sistema en un contenedor sin internet, con IA local (datos que nunca salen de la institución) + conexión al correo real del banco.
8. Equipo C&I.

### 9.2 Video (2–3 min)

Login → Panel → "Simular llegada" de un falso SUDEBAN → cuarentena con dictamen → correo legítimo en bandeja → el oficial confirma → asistente bloquea una petición ofensiva → bitácora con "Cadena íntegra". Narración breve o subtítulos.
