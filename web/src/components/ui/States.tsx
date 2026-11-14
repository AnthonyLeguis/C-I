// Estados obligatorios de interfaz (PR X2 · PLAN_UX §6): carga, vacío, error y sin permiso.
import { Inbox, ShieldOff, WifiOff, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Bloque de carga con forma de tarjeta (n líneas). */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card" role="status" aria-label="Cargando">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="mt-4 h-8 w-1/2" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="mt-3 h-3 w-full" />
      ))}
    </div>
  );
}

function StateBox({ icon: Icon, title, text, action, tone }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode; tone: string }) {
  return (
    <div className="animate-enter flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}>
        <Icon size={22} aria-hidden />
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="max-w-sm text-sm text-ink-muted">{text}</p>}
      {action}
    </div>
  );
}

export function EmptyState({ title, text, icon = Inbox, action }: { title: string; text?: string; icon?: LucideIcon; action?: ReactNode }) {
  return <StateBox icon={icon} title={title} text={text} action={action} tone="bg-brand-soft text-brand" />;
}

export function ErrorState({ text = "No pudimos conectar con el servidor.", onRetry }: { text?: string; onRetry?: () => void }) {
  return (
    <StateBox
      icon={WifiOff}
      title="Algo salió mal"
      text={text}
      tone="bg-critical-soft text-critical"
      action={onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Reintentar</Button>}
    />
  );
}

export function ForbiddenState() {
  return <StateBox icon={ShieldOff} title="Tu rol no permite esta acción" text="Pide a un Gerente de Seguridad (CISO) o al Master que la realice." tone="bg-high-soft text-high" />;
}
