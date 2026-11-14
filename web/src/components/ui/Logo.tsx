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
