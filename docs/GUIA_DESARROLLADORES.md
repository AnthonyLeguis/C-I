# 👩‍💻 C&I — Guía paso a paso para desarrolladores

> Para Williams, Gabriel y Alejandro (y Anthony). Sigue los pasos **en orden**. Si algo falla más de 20 minutos, avisa a Anthony.
> Repo: **https://github.com/AnthonyLeguis/C-I**
> Documentos: [C&I.md](C%26I.md) (PRD/TRD, nuestro norte) · [PLAN_PRS.md](PLAN_PRS.md) (tus puntos) · [PLAN_UX.md](PLAN_UX.md) (diseño) · [GLOSARIO.md](GLOSARIO.md) (siglas)

---

## Parte 1 · Preparar tu computadora (una sola vez, ~15 min)

### 1.1 Instalar las herramientas

| Herramienta | Para qué | Cómo comprobarlo |
|---|---|---|
| **Node.js 20 o superior** (https://nodejs.org, versión LTS) | Ejecutar el proyecto | `node -v` |
| **Git** (https://git-scm.com) | Guardar y subir tu trabajo | `git --version` |
| **VS Code** (https://code.visualstudio.com) | Editar código | — |
| **Tu asistente de IA** (el que sepas usar) | Escribir el código a partir de tu orden de trabajo | — |

En **Canaima / Debian / Ubuntu**:

```bash
sudo apt update && sudo apt install -y git curl
```

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
```

### 1.2 Presentarte ante Git (una vez)

```bash
git config --global user.name "Tu Nombre"
```

```bash
git config --global user.email "el-correo-de-tu-cuenta-github@ejemplo.com"
```

### 1.3 Cuenta de GitHub e invitación

1. Si no tienes cuenta: https://github.com/signup
2. Dale tu **usuario de GitHub** a Anthony.
3. Acepta la invitación que llega a tu correo o en https://github.com/notifications.

### 1.4 Descargar el proyecto

```bash
git clone https://github.com/AnthonyLeguis/C-I.git
```

```bash
cd C-I && npm install
```

> La primera vez que hagas `git push`, Git te pedirá iniciar sesión en GitHub. En Windows se abre el navegador. En Linux, usa tu usuario y, como contraseña, un **token personal**: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token, con el permiso `repo`.

### 1.5 Preparar y probar el entorno local

```bash
cp .dev.vars.example .dev.vars
```

```bash
npx wrangler d1 migrations apply c-i-db-offline --local --env offline
```

```bash
npm run check
```

Debe terminar con `✅ GUARD` y el build sin errores. **Si sale verde, tu computadora está lista.**

---

## Parte 2 · La base de datos (no usamos XAMPP)

**No hace falta XAMPP, MySQL ni instalar ninguna base de datos.** Usamos **Cloudflare D1**, que es SQLite:

- **En tu PC:** `wrangler` crea la base automáticamente dentro de la carpeta `.wrangler/` del proyecto (paso 1.5). No hay que instalar nada más.
- **En QA y producción:** la base vive en Cloudflare y la administra Anthony.
- **Las tablas** se definen en `migrations/` (archivos `.sql`). Nunca se crean a mano.

Comandos útiles (siempre con `--local --env offline`):

| Quiero… | Comando |
|---|---|
| Aplicar las migraciones nuevas | `npx wrangler d1 migrations apply c-i-db-offline --local --env offline` |
| Ver las tablas | `npx wrangler d1 execute c-i-db-offline --local --env offline --command "SELECT name FROM sqlite_master WHERE type='table'"` |
| Consultar datos | `npx wrangler d1 execute c-i-db-offline --local --env offline --command "SELECT * FROM emails LIMIT 5"` |
| Cargar los correos de demo | `npx wrangler d1 execute c-i-db-offline --local --env offline --file=seed/seed_mailbox.sql` |
| Empezar de cero | borrar la carpeta `.wrangler/` y volver a aplicar las migraciones |

> Si tu punto necesita una tabla o columna nueva, **no cambies `0001_schema.sql`**: crea un archivo nuevo, por ejemplo `migrations/0002_demo_users.sql`, como indica tu punto en `PLAN_PRS.md`.

---

## Parte 3 · Ejecutar la aplicación en tu PC

**Opción A · Todo junto (API + pantallas):**

```bash
npm run build:web && npx wrangler dev --env offline
```

Abre http://localhost:8787. Para ver cambios del frontend, vuelve a ejecutar el comando.

**Opción B · Diseñando pantallas (recarga instantánea, ideal para Alejandro y Gabriel):** dos terminales.

Terminal 1 (API):

```bash
npx wrangler dev --env offline
```

Terminal 2 (pantallas):

```bash
npm run dev:web
```

Abre la dirección que muestra Vite (normalmente http://localhost:5173). Cada vez que guardas, la pantalla se actualiza sola.

> El entorno `offline` no usa la IA de Cloudflare: el sistema funciona con el motor de reglas. La IA real se prueba en el entorno QA.

---

## Parte 4 · El ciclo de trabajo (se repite por cada punto)

Tus puntos están en **`PLAN_PRS.md` §2** (W1, W2… / G1, G2… / X1, X2…). **Una rama por punto.** En cada rama haces **solo** lo que pide ese punto, según el PRD/TRD.

### Paso 1 · Crear la rama del punto desde `qa` actualizado

```bash
git checkout qa && git pull
```

```bash
git checkout -b feat/<tu-nombre>-<tema>
```

Ejemplos: `feat/williams-catalogs` (W1), `feat/gabriel-auth` (G1), `feat/alejandro-tokens` (X1).

### Paso 2 · Pedirle el código a tu IA

Copia y pega en tu asistente de IA:

```text
Lee docs/C&I.md, docs/PLAN_PRS.md y docs/PLAN_UX.md.
Implementa SOLO el punto <código, p. ej. W1> de PLAN_PRS.md §2, usando únicamente los archivos asignados a ese punto
y la orden de trabajo de C&I.md §5.3. Respeta exactamente los contratos de C&I.md §5.2 y PLAN_UX.md §4.
Reglas: TypeScript estricto, sin `any`, fetch solo en web/src/services/apiClient.ts, solo datos sintéticos
(V-00.000.00X, 0412-0000000, banco-demo.com.ve). Incluye los tests que pide el criterio de aceptación.
Al final, ejecuta `npm run check` y corrige hasta que pase.
```

### Paso 3 · Probar en tu PC

```bash
npm run check
```

Si sale rojo, copia el error y pégaselo a tu IA: "Corrige este error sin tocar archivos que no son de mi punto".

### Paso 4 · Guardar y subir (mínimo cada hora, aunque no hayas terminado)

```bash
git add -A
```

```bash
git commit -m "feat(W1): catálogo legal y dominios oficiales"
```

```bash
git push -u origin feat/<tu-nombre>-<tema>
```

> El commit empieza con el código de tu punto: `feat(W1): …`, `fix(G3): …`.

### Paso 5 · Abrir el Pull Request hacia `qa` (cuando el punto esté terminado)

1. Entra a https://github.com/AnthonyLeguis/C-I. Aparece un botón amarillo **"Compare & pull request"**: haz clic.
2. Verifica arriba: **base: `qa`** ← compare: tu rama.
3. Título: `W1: Catálogo legal y dominios` (código del punto + nombre).
4. Rellena la plantilla (qué hace, cómo probarlo, checklist) y pulsa **Create pull request**.
5. Avísale a Anthony en el grupo: "PR W1 listo".

### Paso 6 · Esperar el QA automático

En tu PR verás el check **qa**:
- 🟢 **Verde:** Anthony lo revisa, lo aprueba y lo une a `qa`. Ahí se prueba la integración con el trabajo de todos.
- 🔴 **Rojo:** abre "Details", copia el error, corrígelo con tu IA **en la misma rama**, y repite el Paso 4. El PR se actualiza solo.

### Paso 7 · Siguiente punto

Cuando Anthony te confirme el merge, vuelve al **Paso 1** con el siguiente punto.

---

## Parte 5 · Reglas de oro

1. **Una rama por punto.** Nunca trabajes en `qa`, `development` ni `main`.
2. **Solo tus archivos.** Si necesitas cambiar un archivo compartido (`src/index.ts`, `package.json`, `wrangler.toml`, `web/src/types/contracts.ts`, `web/src/services/apiClient.ts`), pídeselo a Anthony.
3. **¿Necesitas una librería nueva?** Pídesela a Anthony; no hagas `npm install <paquete>` por tu cuenta.
4. **Nunca datos reales.** Ni tu cédula, ni tu teléfono, ni correos reales.
5. **Nunca subas `.dev.vars`** ni claves (ya está en `.gitignore`).
6. **Antes de dormir:** commit + push, briefing de 3 minutos a Anthony (qué quedó, qué falla, qué sigue).

---

## Parte 6 · Problemas frecuentes

| Problema | Solución |
|---|---|
| `npm: command not found` | Node no está instalado o hay que reiniciar la terminal |
| `Permission denied` al hacer push | No aceptaste la invitación del repo o falta el token (1.3 y 1.4) |
| `Your branch is behind` | `git pull` |
| Conflicto al hacer `git pull` | No lo resuelvas solo: avisa a Anthony |
| `Address already in use :8787` | Ya hay un `wrangler dev` abierto: ciérralo (Ctrl + C) |
| `no such table` | Aplica las migraciones (Parte 2) |
| Me equivoqué de rama | `git stash`, `git checkout <rama-correcta>`, `git stash pop` |
| El check `qa` está rojo y no entiendo el error | Pégalo a tu IA; si en 20 min no se resuelve, avisa a Anthony |

---

## Parte 7 · Enlaces

| Qué | Enlace |
|---|---|
| Repositorio | https://github.com/AnthonyLeguis/C-I |
| Tus PR y su estado | https://github.com/AnthonyLeguis/C-I/pulls |
| QA automático (Actions) | https://github.com/AnthonyLeguis/C-I/actions |
| Entorno QA (integración de todos) | https://c-i-qa.anthony-leguisamo-g.workers.dev |
| Producción (jurado) | https://c-i.anthony-leguisamo-g.workers.dev |
