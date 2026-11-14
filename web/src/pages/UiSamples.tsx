// Muestras del kit de UI (PR X2). Contenido de la página /ui.
import { Clock, Lock, MailCheck, MailWarning, Send } from "lucide-react";
import { useState } from "react";
import {
  AiBadge, AlertBadge, Button, Card, CardHeader, EmptyState, ErrorState, EscalatedBadge, Eyebrow, FolderBadge,
  ForbiddenState, KpiCard, ReviewBadge, RiskMeter, SkeletonCard, Stagger, useToast,
} from "../components/ui";

export function KpiSamples() {
  return (
    <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Correos analizados" value={128} hint="% amenazas contenidas: 43,0%" icon={MailCheck} />
      <KpiCard label="En cuarentena" value={21} hint="Aislados · clic para inspeccionar" icon={Lock} tone="critical" onClick={() => undefined} />
      <KpiCard label="Enviados a spam" value={34} hint="Riesgo alto · clic para filtrar" icon={MailWarning} tone="high" onClick={() => undefined} />
      <KpiCard label="Pendientes de revisión" value={5} hint="Requieren decisión operativa" icon={Clock} tone="low" pulse />
    </Stagger>
  );
}

export function BadgeSamples() {
  return (
    <Card>
      <CardHeader title="Badges y niveles" subtitle="Fuente única: components/ui/levels.ts" />
      <div className="flex flex-wrap gap-2">
        <AlertBadge level="SAFE" score={6} /> <AlertBadge level="LOW" score={32} /> <AlertBadge level="HIGH" score={68} /> <AlertBadge level="CRITICAL" score={97} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <FolderBadge folder="INBOX" /> <FolderBadge folder="SPAM" /> <FolderBadge folder="QUARANTINE" />
        <ReviewBadge status="PENDING" /> <ReviewBadge status="CONFIRMED" /> <ReviewBadge status="RESTORED" /> <EscalatedBadge />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <AiBadge aiUsed model="@cf/meta/llama-3.3-70b-instruct-fp8-fast" /> <AiBadge aiUsed={false} /> <AiBadge aiUsed={false} blocked />
      </div>
    </Card>
  );
}

export function MeterSamples() {
  const [score, setScore] = useState(97);
  return (
    <Card>
      <CardHeader title="Medidor de riesgo" subtitle="El marcador se desliza y el número cuenta" action={
        <div className="flex gap-2">
          {[6, 32, 68, 97].map((s) => <Button key={s} size="sm" variant="secondary" onClick={() => setScore(s)}>{s}</Button>)}
        </div>
      } />
      <RiskMeter score={score} />
    </Card>
  );
}

export function ButtonSamples() {
  const toast = useToast();
  return (
    <Card>
      <CardHeader title="Botones y avisos" subtitle="Acciones en 1 clic del Analizador" />
      <div className="flex flex-wrap gap-2">
        <Button icon={<Send size={16} />}>Simular llegada de correo</Button>
        <Button variant="navy">Iniciar sesión segura</Button>
        <Button variant="secondary">Ver todos en Buzón</Button>
        <Button variant="ghost">Cancelar</Button>
        <Button loading>Analizando…</Button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Button variant="success" block onClick={() => toast.notify("success", "Correo marcado como seguro", "hash a3f9c2d1…")}>Aprobar / Marcar seguro</Button>
        <Button variant="warning" block onClick={() => toast.notify("info", "Caso escalado a CISO", "hash 7b21e9f0…")}>Escalar a CISO</Button>
        <Button variant="danger" block onClick={() => toast.notify("error", "Dominio bloqueado", "sudeban-portal-seguro.com")}>Bloquear dominio</Button>
      </div>
    </Card>
  );
}

export function StateSamples() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SkeletonCard />
      <EmptyState title="No hay correos en cuarentena. ¡Bien!" text="Cuando llegue un correo crítico aparecerá aquí." />
      <ErrorState onRetry={() => undefined} />
      <ForbiddenState />
      <Card className="lg:col-span-2">
        <Eyebrow>Contenido del mensaje (enlaces neutralizados)</Eyebrow>
        <p className="mt-2 select-none blur-[3px]">Estimado funcionario, su usuario será suspendido en 24 horas. Ingrese aquí para validar.</p>
        <p className="mt-2 inline-block rounded-badge border border-critical/40 bg-critical-soft px-2 py-0.5 font-mono text-xs text-critical">URL desactivada: https://sudeban-portal-seguro.com/auth</p>
      </Card>
    </div>
  );
}
