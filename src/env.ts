import type { Hono } from "hono";

export type Bindings = {
  DB: D1Database;
  /** Puede faltar (entorno offline): el sistema debe usar el fallback determinista. */
  AI?: Ai;
  SESSION_SECRET: string;
};

export type AppEnv = { Bindings: Bindings };
export type App = Hono<AppEnv>;
