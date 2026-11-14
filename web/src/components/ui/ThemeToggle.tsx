// Tema claro/oscuro (PR X1 · Anthony). Botón sol/luna para páginas públicas y un interruptor deslizante
// para el pie del menú lateral. La elección se recuerda en este equipo.
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-surface text-ink-2 shadow-card transition hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}

/** Interruptor sol ↔ luna con perilla que se desliza. `compact`: solo la perilla (riel contraído). */
export function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Modo oscuro activado · cambiar a claro" : "Modo claro activado · cambiar a oscuro";
  const knob = (
    <span className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_6px_rgba(2,6,23,0.25)] transition-[left,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${isDark ? "left-[calc(100%-1.625rem)] rotate-[360deg]" : "left-0.5 rotate-0"}`}>
      {isDark ? <Moon size={13} aria-hidden /> : <Sun size={13} aria-hidden className="text-high" />}
    </span>
  );
  return (
    <button type="button" role="switch" aria-checked={isDark} onClick={toggle} aria-label={label} title={label}
      className={`press group flex items-center gap-3 rounded-control text-sm font-medium text-ink-2 transition-colors hover:text-ink ${compact ? "justify-center" : "w-full px-2 py-1.5 hover:bg-surface-2"}`}>
      {!compact && <span className="flex-1 text-left">{isDark ? "Modo oscuro" : "Modo claro"}</span>}
      <span className={`relative inline-block h-7 shrink-0 rounded-full border transition-colors duration-300 ${compact ? "w-[54px]" : "w-[54px]"} ${isDark ? "border-[var(--logo-accent)]/40 bg-sidebar-active" : "border-line-strong bg-surface-2"}`}>
        <Sun size={12} aria-hidden className={`absolute left-2 top-1/2 -translate-y-1/2 transition-opacity ${isDark ? "text-white/50 opacity-100" : "opacity-0"}`} />
        <Moon size={12} aria-hidden className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity ${isDark ? "opacity-0" : "text-ink-muted opacity-100"}`} />
        {knob}
      </span>
    </button>
  );
}
