// Tema claro/oscuro (PR X1 · Anthony). Por defecto: claro. La elección se recuerda en localStorage.
import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "ci-theme";

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light"; // modo privado o almacenamiento bloqueado
  }
}

function applyTheme(theme: Theme, animate: boolean): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-animating");
    window.setTimeout(() => root.classList.remove("theme-animating"), 450);
  }
  root.dataset.theme = theme;
}

export function useTheme(): { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme, false);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next, true);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* sin almacenamiento: el tema dura solo esta visita */
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return { theme, toggle, setTheme };
}
