# 🎬 Casos de demostración — C&I (W5)

> Correos **100 % sintéticos** para el buzón de `analista@banco-demo.com.ve`.
> Ningún remitente, dominio, cuerpo o adjunto pertenece a una persona o institución real.
> El fundamento legal de cada caso sale de [`LEGAL_NOTES.md`](LEGAL_NOTES.md) y del
> catálogo curado de W1; la IA nunca inventa artículos.

## 1. Cómo se cargan

El seed completo tiene **20 correos** (12 maliciosos y 8 legítimos):

```bash
npx wrangler d1 execute c-i-db --local --file=seed/seed_mailbox.sql
```

El archivo borra primero los correos de `analista@banco-demo.com.ve` y luego inserta
los 20, así que se puede ejecutar varias veces sin duplicar. En QA/producción se usa
el mismo SQL con `--remote` y el entorno correspondiente.

En la demo, el botón **“Simular llegada de correo”** del Buzón usa los 6 casos de
esta guía a través de `POST /mailbox/deliver`.

## 2. Los 6 casos de la demo

| # | `case_id` | Caso | Nivel esperado | Carpeta | Señales principales |
|---|---|---|---|---|---|
| 1 | `sudeban-credenciales` | Falso SUDEBAN | **CRITICAL** | Cuarentena | Dominio que imita a SUDEBAN, Reply-To gratuito, SPF/DKIM/DMARC en fail, enlace falso, urgencia y pedido de clave |
| 2 | `fraude-ceo` | Fraude del CEO | **CRITICAL** | Cuarentena | Dominio con “banco-demo”, Reply-To externo, autenticación débil, transferencia urgente y cambio de cuenta |
| 3 | `factura-macro` | Factura con macro | **HIGH** | Spam | Adjunto `.xlsm`, “último aviso” y amenaza de suspensión |
| 4 | `tarjeta-acortador` | Alerta de tarjeta con acortador | **HIGH** | Spam | Dominio que contiene “bancodemo”, enlace `bit.ly` y amenaza de bloqueo |
| 5 | `rrhh-legitimo` | Recibo de pago legítimo | **SAFE** | Bandeja | Dominio oficial `banco-demo.com.ve` y SPF/DKIM/DMARC en pass |
| 6 | `conciliacion-legitima` | Conciliación diaria legítima | **SAFE** | Bandeja | Dominio oficial y autenticación completa, sin enlaces ni pedidos |

> El caso 3 se etiqueta **alto** (spam), no crítico: macro + urgencia suman 45 puntos
> con los pesos de `C&I.md` §4.2.1. La etiqueta del botón se corrigió a “alto” para
> que coincida con el motor determinista.

### 2.1 Guion corto para la demo (2 minutos)

1. Login como **svalenzuela** (Supervisor).
2. Buzón → **Simular llegada de correo** → `sudeban-credenciales`.
3. Mostrar el dictamen: **CRÍTICO 97/100**, cuarentena, indicadores, fundamento legal
   y explicación. Señalar que la PII aparece como `[CEDULA_PROTEGIDA]`.
4. Simular `rrhh-legitimo`: cae en **Bandeja** como **SEGURO**, sin fundamento legal.
5. Abrir la cuarentena y mostrar **Confirmar amenaza** (solo Supervisor+).
6. Cerrar con la bitácora: cada decisión tiene hash encadenado.

## 3. Detalle por caso

### 1. `sudeban-credenciales` — Falso SUDEBAN

- **De:** `notificaciones@sudeban-portal-seguro.com` · **Nombre:** “SUDEBAN - Supervisión Bancaria”
- **Reply-To:** `validacion.sudeban@gmail.com`
- **Asunto:** “URGENTE: Actualice sus credenciales de reporte bancario antes de 2 horas”
- **Señales:** dominio que imita a SUDEBAN, Reply-To gratuito, autenticación fallida,
  enlace a dominio falso, urgencia y solicitud de credenciales.
- **Resultado:** CRITICAL · QUARANTINE · revisión humana `PENDING`.
- **Fundamento:** LEDI arts. 6, 14 y 26; Ley de Mensajes de Datos art. 9.
- **Qué decir:** “El correo no viene de SUDEBAN: el dominio imita el nombre, la
  autenticación falla y pide la clave con una amenaza de suspensión.”

### 2. `fraude-ceo` — Fraude del CEO

- **De:** `presidencia.ejecutiva@banco-demo-corp.net` · **Nombre:** “Dr. Ricardo Alarcón — Presidencia”
- **Reply-To:** `r.alarcon.presidencia@outlook.com`
- **Asunto:** “CONFIDENCIAL: Transferencia inmediata a proveedor internacional”
- **Señales:** urgencia, confidencialidad, cambio de cuenta del proveedor y dominio
  que contiene “banco-demo” sin ser el oficial.
- **Resultado:** CRITICAL · QUARANTINE · revisión humana `PENDING`.
- **Fundamento:** LEDI arts. 14 y 15 (fraude y obtención indebida).
- **Qué decir:** “Es el patrón clásico del fraude del CEO: alguien se hace pasar por
  presidencia para cambiar la cuenta de un proveedor y mover dinero hoy.”

### 3. `factura-macro` — Factura con macro

- **De:** `cobranzas@servicios-integrales-ve.info` · **Nombre:** “Facturación Proveedores”
- **Asunto:** “Factura vencida #FAC-2026-8841 — Evite suspensión de servicio”
- **Adjunto:** `FAC-2026-8841.xlsm` (macro habilitada).
- **Resultado:** HIGH · SPAM.
- **Fundamento:** LEDI arts. 7 y 10 (sabotaje/daño y posesión de programas de sabotaje).
- **Qué decir:** “No hace falta abrir el archivo: una macro en un correo de cobranza
  es un vector de ejecución. Va a spam y no se habilita el contenido.”

### 4. `tarjeta-acortador` — Alerta de tarjeta con acortador

- **De:** `seguridad-tarjetas@bancodemo-alerta.org` · **Nombre:** “Centro de Seguridad Tarjetas”
- **Asunto:** “Bloqueo preventivo en tarjeta corporativa terminada en 4491”
- **Señales:** dominio que contiene “bancodemo”, enlace `bit.ly` y amenaza de bloqueo.
- **Resultado:** HIGH · SPAM.
- **Fundamento:** LEDI art. 26 (oferta engañosa); SUDEBAN 641.10 (canales oficiales).
- **Qué decir:** “El banco no manda enlaces acortados para revisar movimientos: el
  destino real queda oculto.”

### 5. `rrhh-legitimo` — Recibo de pago legítimo

- **De:** `talento.humano@banco-demo.com.ve` · **Nombre:** “Dirección de Talento Humano”
- **Autenticación:** `spf=pass; dkim=pass; dmarc=pass`
- **Resultado:** SAFE · INBOX · sin fundamento legal.
- **Qué decir:** “Mismo dominio oficial, autenticación completa y ningún pedido de
  datos: las reglas no lo castigan y la IA no lo mueve de la bandeja.”

### 6. `conciliacion-legitima` — Conciliación diaria legítima

- **De:** `operaciones@banco-demo.com.ve` · **Nombre:** “Operaciones Internacionales”
- **Autenticación:** `spf=pass; dkim=pass; dmarc=pass`
- **Resultado:** SAFE · INBOX · sin fundamento legal.
- **Qué decir:** “Un correo operativo normal del banco: no hay enlaces, adjuntos ni
  solicitudes; sirve para demostrar que el sistema no bloquea todo.”

## 4. Los 20 correos del seed

| Carpeta | Nivel | Cantidad | Uso |
|---|---|---|---|
| INBOX | SAFE | 8 | Legítimos variados (RRHH, operaciones, proveedor, BCV, cliente, capacitación) |
| SPAM | HIGH | 7 | Suplantaciones de bancos, adjuntos peligrosos, acortador e IP |
| QUARANTINE | CRITICAL | 5 | SUDEBAN, Banesco, Mercantil, fraude del CEO y credenciales |

Los 12 maliciosos cubren: imitación de SUDEBAN, Banesco, Banco de Venezuela,
Mercantil, BNC y Provincial; fraude del CEO; macro `.xlsm`; doble extensión
`.pdf.exe`; acortador; IP; y pedido de credenciales. Los 8 legítimos usan
`banco-demo.com.ve` y dominios de proveedores de la demo (`.com.ve`, `.org.ve`).

> **Criterio de acierto:** los 20 correos están etiquetados con el resultado del
> motor de reglas y los 6 casos de demo se validan en `test/seedMailbox.test.ts`.
> La meta del plan (≥ 90 %) queda cubierta: 20/20 etiquetas coherentes y 6/6 casos
> de demo con la carpeta esperada.

## 5. Datos y privacidad

- Cédulas: siempre `V-00.000.00X` o `[CEDULA_PROTEGIDA]`.
- Teléfonos: `0412-0000000`.
- Cuentas: `0102-0000-00-0000000001` o `[CUENTA_BANCARIA_PROTEGIDA]`.
- Correos personales de los atacantes: dominios gratuitos sintéticos; nunca se
  almacena una persona real.
- El cuerpo de los correos se guarda ya anonimizado (`body_sanitized`); la auditoría
  registra solo los tipos de PII detectados, nunca el dato en claro.
