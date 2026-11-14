# 🎤 Guion del pitch — C&I

> Base: `docs/C&I.md` §9. Presenta Alejandro; Anthony maneja la demo. Ensayar mínimo 5 veces.
> Demo desde producción: https://c-i.equipo-ci.workers.dev (usuario `svalenzuela`). Plan B: video o contenedor Docker sin internet.

## Criterios del jurado y dónde los tocamos

| Criterio | Bloque del pitch |
|---|---|
| 1. Viabilidad técnica del MVP | Demo en vivo |
| 2. Impacto | Apertura + cifras |
| 3. Innovación y uso de IA (20 %) | "Las reglas deciden, la IA explica" + cálculo del puntaje |
| 4. Calidad del pitch | Historia, tiempos, cierre |
| 5. Ética y responsabilidad (10 %) | PII anonimizada, revisión humana, guardián ético, bitácora |
| 6. Escalabilidad | Instalable dentro del banco + conexión al correo real |

---

## Versión de 3 minutos

**0:00–0:30 · Impacto**
> "Un trabajador del banco recibe un correo de 'SUDEBAN'. Le pide su clave corporativa antes de una inspección y le da 24 horas. Parece oficial. Un solo clic basta para que alguien entre a los sistemas del banco. `[CIFRA CON FUENTE PENDIENTE]`. Somos C&I y detenemos ese correo antes de que llegue a su bandeja."

**0:30–1:45 · Demo en vivo**
1. "Simular llegada" → Falso SUDEBAN → cae solo en **Cuarentena**: puntaje **97**, indicadores y fundamento legal (Ley Especial contra los Delitos Informáticos).
2. "Simular llegada" → recibo legítimo → queda en la **Bandeja**.
3. Como Gerente de Seguridad (CISO), **Confirmar** la amenaza → queda en la bitácora.
4. **Asistente**: "dame un script para saltar el firewall del banco" → **bloqueado** por el guardián ético.

**1:45–2:15 · IA responsable**
> "Las reglas deciden, la IA explica. Las reglas verificables pesan 70 %; la IA, 30 %. La IA nunca ve datos personales: los anonimizamos antes. Una persona confirma cada decisión crítica, y todo queda en una bitácora con hash encadenado que detecta cualquier alteración."

**2:15–2:40 · Calidad técnica**
> "Corre en Cloudflare: Workers, D1 y Workers AI con Llama 3.3 y Llama Guard. Lo construimos con 'spec primero, código después': cada criterio de aceptación es una prueba automática en CI."

**2:40–3:00 · Instalable dentro del banco**
> "Hoy lo ven en la nube, pero el mismo sistema ya corre en un **contenedor sin internet**. En un banco se instala en sus propios servidores, con la **IA funcionando localmente**: los datos nunca salen de la institución. El siguiente paso es conectarlo a su servidor de correo. C&I: anticipamos el riesgo, fortalecemos tu confianza."

---

## Versión de 5 minutos

| Tiempo | Bloque | Qué se agrega a la versión de 3 min |
|---|---|---|
| 0:00–0:45 | Impacto | Las 2–3 cifras `[CIFRA CON FUENTE PENDIENTE]` y por qué el correo es la puerta de entrada |
| 0:45–2:30 | Demo en vivo | Mostrar también el **Panel** (KPI) y un fraude del CEO; abrir el detalle de indicadores |
| 2:30–3:15 | Cómo se calcula el puntaje | El ejemplo del falso SUDEBAN (abajo) |
| 3:15–3:45 | Ética | PII anonimizada, revisión humana, guardián ético, roles (Analista, CISO, Master), bitácora "Cadena íntegra" |
| 3:45–4:15 | Calidad técnica | Arquitectura Cloudflare, SDD, CI con QA automático, respaldo determinista si la IA falla |
| 4:15–5:00 | Instalable dentro del banco + roadmap | Contenedor sin internet + IA local; conexión a Exchange/Microsoft 365/Gmail/Zimbra; otros canales |

### El cálculo del puntaje (falso SUDEBAN)

> "Las reglas suman: dominio que imita a SUDEBAN, 35; adjunto `.pdf.exe`, 30; pide la clave, 25; DMARC falla, 20; Reply-To de Gmail, 15; urgencia, 15. Total 140, con tope en 100. La IA, que solo ve el texto anonimizado, estima 90. Puntaje final: 100 × 0,7 + 90 × 0,3 = **97. Crítico. Cuarentena.** Y la IA sola nunca podría mover un correo legítimo a cuarentena."

### Bloque "instalable dentro del banco"

> "La demo está en la nube porque el evento lo pide, pero C&I no depende de ella. El mismo código corre en un contenedor Docker **sin internet**; en el banco, la IA se ejecuta localmente con el mismo puerto de IA que hoy usa Workers AI. Los correos y los datos de los clientes **nunca salen de la institución**."

Si preguntan, mostrar el contenedor en modo `offline`:

```bash
docker compose up --build --abort-on-container-exit --exit-code-from smoke
```

---

## Preguntas preparadas

- **¿Se puede instalar dentro del banco?** Sí. El mismo sistema corre en un contenedor sin internet; en producción se usa una IA local (por ejemplo, con Ollama) detrás del mismo puerto de IA. No hay que reescribir nada.
- **¿Y los falsos positivos?** Nada se borra: lo dudoso va a cuarentena y una persona (CISO) decide. Si restaura, el correo vuelve a la bandeja y queda registrado.
- **¿Por qué no usar solo IA?** Porque la IA puede equivocarse o "alucinar". Las reglas son verificables y siempre dan el mismo resultado; la IA aporta el matiz del lenguaje y la explicación, con 30 % de peso.
- **¿Cómo se conecta a un correo real?** Es el siguiente paso del roadmap: un conector a Exchange, Microsoft 365, Gmail o Zimbra que entregue cada correo con sus encabezados al mismo endpoint de análisis.
- **¿Y la soberanía de los datos?** La IA nunca ve datos personales (se anonimizan antes) y la versión on-premise mantiene todo dentro del banco.
- **¿Qué normas aplican?** La Ley Especial contra los Delitos Informáticos y las normas de SUDEBAN sobre tecnología de la información; el fundamento sale de un catálogo curado y revisado (`docs/LEGAL_NOTES.md`).
- **¿Qué pasa si se cae la IA?** El motor de reglas responde solo, en menos de 1 segundo. La demo nunca se cae.
- **¿Cómo saben que nadie alteró la bitácora?** Cada evento guarda el hash del anterior; el rol Master verifica la cadena y cualquier cambio rompe la verificación.
- **¿Usaron IA para programar?** Sí, y lo declaramos en `SPEC.md`: Claude Code, DeepSeek Harness, Antigravity y NotebookLM/Gemini, siempre con revisión humana y pruebas en CI.
