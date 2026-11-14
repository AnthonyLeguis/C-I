// Enrutado mínimo por ruta (sin librerías) — PR G5.
import { useEffect, useState } from "react";

export type RouteKey = "login" | "panel" | "buzon" | "analizar" | "asistente" | "bitacora" | "soporte" | "mapa" | "ui" | "timeline-qa";

const PATHS: Record<RouteKey, string> = {
  login: "/login", panel: "/panel", buzon: "/buzon", analizar: "/analizar", asistente: "/asistente",
  bitacora: "/bitacora", soporte: "/soporte", mapa: "/mapa", ui: "/ui", "timeline-qa": "/timeline-qa",
};

export function routeFromPath(path: string): RouteKey | null {
  const hit = (Object.entries(PATHS) as [RouteKey, string][]).find(([, p]) => p === path);
  return hit ? hit[0] : null;
}

export function navigate(key: RouteKey, replace = false): void {
  const url = PATHS[key];
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const on = () => setPath(window.location.pathname);
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return path;
}
