// Tarjeta y encabezado de tarjeta (PR X2).
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ interactive = false, accent, className = "", children, ...rest }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; accent?: string }) {
  return (
    <div
      {...rest}
      style={accent ? { borderTopColor: accent, borderTopWidth: 3, ...rest.style } : rest.style}
      className={`rounded-card border border-line bg-surface/90 p-5 shadow-card sm:p-6 ${interactive ? "lift cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
      <div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Etiqueta pequeña en mayúsculas y monoespaciada, como en el prototipo ("NIVEL DE RIESGO (0-100)"). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted ${className}`}>{children}</p>;
}
