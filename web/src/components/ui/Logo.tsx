// Logo de C&I con versión para modo claro y oscuro, fondo transparente (cambia solo con el tema).
export function Logo({ className = "w-full max-w-sm" }: { className?: string }) {
  const alt = "C&I · Anticipamos el riesgo. Fortalecemos tu confianza.";
  return (
    <span className={`inline-block ${className}`}>
      <img src="/logo-ci-light.png" alt={alt} className="block w-full dark:hidden" width={900} height={341} />
      <img src="/logo-ci-dark.png" alt={alt} className="hidden w-full dark:block" width={900} height={341} />
    </span>
  );
}

/** Solo el emblema (globo de red + sobre), para el menú lateral y espacios pequeños. */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`inline-block shrink-0 ${className}`} aria-hidden>
      <img src="/logo-ci-mark-light.png" alt="" className="block h-full w-full object-contain dark:hidden" width={144} height={138} />
      <img src="/logo-ci-mark-dark.png" alt="" className="hidden h-full w-full object-contain dark:block" width={144} height={138} />
    </span>
  );
}

/** Emblema + «C&I» + lema corto, como el logo del login pero compacto. */
export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <LogoMark className="h-11 w-11" />
      {!compact && (
        <span className="min-w-0 border-l border-line-strong/70 pl-3">
          <span className="block text-[26px] font-extrabold leading-none tracking-tight text-[var(--logo-ink)]">
            C<span className="text-[var(--logo-accent)]">&amp;</span>I
          </span>
          <span className="mt-1 block truncate text-[11px] font-medium text-ink-muted">Anticipamos el riesgo.</span>
        </span>
      )}
    </span>
  );
}
