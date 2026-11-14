// Pantalla del Buzón de Alertas (PR G5 · PLAN_UX §5.3, prototipo de Alejandro).
import { MailDetail } from "../components/mailbox/MailDetail";
import { MailboxToolbar } from "../components/mailbox/MailboxToolbar";
import { MailList } from "../components/mailbox/MailList";
import { EmptyState, ErrorState, SkeletonCard, useToast } from "../components/ui";
import { useMailbox } from "../hooks/useMailbox";
import { useSession } from "../hooks/useSession";

export function MailboxPage() {
  const m = useMailbox();
  const { user } = useSession();
  const toast = useToast();

  const simulate = async (id: string) => {
    try {
      const r = await m.simulate(id);
      toast.notify("info", "Correo analizado y clasificado", `hash ${r.audit_hash.slice(0, 12)}…`);
    } catch { toast.notify("error", "No se pudo simular la llegada"); }
  };
  const review = async (d: "CONFIRM" | "RESTORE") => {
    if (!m.selected) return;
    try {
      const r = await m.review(m.selected.id, d);
      toast.notify("success", d === "CONFIRM" ? "Amenaza confirmada · registrada en bitácora" : "Correo restaurado a bandeja · registrado en bitácora", `hash ${r.audit_hash.slice(0, 12)}…`);
    } catch { toast.notify("error", "Tu rol no permite esta acción o hubo un error"); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <MailboxToolbar view={m.view} onView={m.setView} data={m.data} scenarios={m.scenarios} busy={m.busy} onSimulate={(id) => void simulate(id)} />
      {m.error && <ErrorState text={m.error} onRetry={() => void m.reload()} />}
      {!m.data && !m.error && <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"><SkeletonCard lines={6} /><SkeletonCard lines={8} /></div>}
      {m.data && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MailList emails={m.data.emails} selectedId={m.selectedId} freshId={m.freshId} onSelect={m.setSelectedId} />
          {m.selected && user
            ? <MailDetail email={m.selected} role={user.role} onReview={(d) => void review(d)} />
            : <EmptyState title="Selecciona un correo" text="Elige un correo de la lista para ver su dictamen." />}
        </div>
      )}
    </div>
  );
}
