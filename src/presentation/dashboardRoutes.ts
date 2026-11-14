// Dueño: Gabriel (PR G4). F0: MOCK con el contrato completo de PLAN_UX.md §4.
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { MOCK_DASHBOARD } from "./mocks";

export const dashboardRoutes = new Hono<AppEnv>();

dashboardRoutes.get("/", (c) => c.json(MOCK_DASHBOARD));
