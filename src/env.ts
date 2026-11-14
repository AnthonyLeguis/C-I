import type { Hono } from "hono";

export type Bindings = {
  DB: D1Database;
  /** Puede faltar (entorno offline o modo "solo reglas"): el sistema debe usar el fallback determinista. */
  AI?: Ai;
  SESSION_SECRET: string;
};

/** aiBound: si el Worker tiene Workers AI conectado, aunque el modo "solo reglas" lo haya apagado (A6). */
export type AppEnv = { Bindings: Bindings; Variables: { aiBound?: boolean } };
export type App = Hono<AppEnv>;
