// Utilidades de movimiento compartidas (PR X2 · PLAN_UX §1.1). Nadie escribe animaciones propias fuera de aquí.
import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/** Envuelve el contenido de una pantalla: fundido + subida corta al montar. Cambia `key` para re-animar. */
export function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`animate-page ${className}`}>{children}</div>;
}

/** Aparición escalonada: cada hijo entra 40 ms después del anterior (máx. 12 escalones). */
export function Stagger({ children, step = 40, className = "" }: { children: ReactNode; step?: number; className?: string }) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <div key={i} className="animate-enter" style={{ animationDelay: `${Math.min(i, 12) * step}ms` }}>
          {child}
        </div>
      ))}
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Hook: cuenta de 0 (o del valor anterior) hasta `value` con ease-out. */
export function useCountUp(value: number, durationMs = 600): number {
  const [display, setDisplay] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(origin + (value - origin) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return display;
}

/** Número animado con formato venezolano (coma decimal, punto de miles). */
export function CountUp({ value, decimals = 0, suffix = "", className = "" }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const n = useCountUp(value);
  const text = n.toLocaleString("es-VE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span className={`tabular ${className}`} aria-label={`${value.toLocaleString("es-VE", { maximumFractionDigits: decimals })}${suffix}`}>
      {text}
      {suffix}
    </span>
  );
}
