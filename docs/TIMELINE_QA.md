# ⏱️ Módulo eliminable "timeline-qa"

Página **`/timeline-qa`** y endpoint **`GET /api/v1/timeline-qa`** con el avance de cada desarrollador (0–100 %) y la línea de tiempo de los PR que faltan por llegar a `development`.

## Cómo funciona
1. Cada vez que **`development` recibe un push** (un PR que pasó QA), corre `.github/workflows/timeline-qa.yml`.
2. `scripts/timeline-qa/build.mjs` lee GitHub: un punto cuenta como **completado** solo si su commit (`feat(W1): …` o `W1: …`) está en `development`. Si está en `qa` → "En QA", si hay PR abierto → "PR abierto"; si no → "Pendiente".
3. El resultado se guarda en la tabla `timeline_qa` de D1 (QA y producción). La página se refresca sola cada 30 s.
4. Para recalcular a mano: GitHub → Actions → **timeline-qa** → *Run workflow*.

La lista de puntos por persona está en `scripts/timeline-qa/points.mjs` (copia de `PLAN_PRS.md` §2).

## Cómo eliminarlo por completo
Borrar estos archivos y las líneas marcadas `// MÓDULO ELIMINABLE`:
- `scripts/timeline-qa/` (carpeta completa)
- `.github/workflows/timeline-qa.yml`
- `src/presentation/timelineQaRoutes.ts` + 2 líneas en `src/index.ts`
- `web/src/pages/TimelineQa.tsx` + 2 líneas en `web/src/App.tsx`
- Bloque "timeline-qa" en `web/src/types/contracts.ts` y la línea `timelineQa` en `web/src/services/apiClient.ts`
- Crear `migrations/00XX_drop_timeline_qa.sql` con `DROP TABLE IF EXISTS timeline_qa;` (no borrar la migración 0010 ya aplicada).
