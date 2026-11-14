// Botón base (PR X2). Variantes según PLAN_UX y el prototipo de Alejandro.
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "navy" | "secondary" | "ghost" | "success" | "warning" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-on-brand border-transparent hover:brightness-110",
  navy: "bg-sidebar text-white border-transparent hover:bg-sidebar-active",
  secondary: "bg-surface text-ink border-line-strong hover:border-ink-muted",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-surface-2",
  success: "bg-safe-soft text-safe border-safe/40 hover:border-safe",
  warning: "bg-high-soft text-high border-high/40 hover:border-high",
  danger: "bg-critical-soft text-critical border-critical/40 hover:border-critical",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

export function Button({ variant = "primary", size = "md", icon, loading = false, block = false, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`press inline-flex items-center justify-center rounded-control border font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55 ${VARIANT[variant]} ${SIZE[size]} ${block ? "w-full" : ""} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
