// Portada temporal del entorno QA: mapa de pantallas construidas y pendientes (para revisión de Alejandro).
// Se reemplaza por el Login real cuando entre G5 (Gabriel).
import { ArrowRight, Clock, ImageIcon, LayoutDashboard, Lock, Mail, MessageSquareText, Palette, ScanSearch, ScrollText, ShieldAlert, Wrench, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, Eyebrow, Logo, PageTransition, Stagger, ThemeToggle } from "../components/ui";
import { api } from "../services/apiClient";

interface Screen { name: string; desc: string; icon: LucideIcon; href?: string; owner: string; point: string; mock?: string }

const PROTO = "https://github.com/AnthonyLeguis/C-I/blob/qa/docs/design/prototipo/";
const READY: Screen[] = [
  { name: "Login con perfiles", desc: "Entrada en 1 clic por rol y formulario.", icon: Lock, href: "/login", owner: "Gabriel", point: "G1 + G5" },
  { name: "Panel Principal", desc: "KPI, gráficas, triaje y eventos con sello de cadena.", icon: LayoutDashboard, href: "/panel", owner: "Gabriel", point: "G4 + G6" },
  { name: "Buzón de Alertas", desc: "Simular llegada, cuarentena, decisiones y bloqueo.", icon: Mail, href: "/buzon", owner: "Gabriel + Williams", point: "G3 + G5 + G7 + W4" },
  { name: "Bitácora de Eventos", desc: "Filtros, verificación de integridad y CSV.", icon: ScrollText, href: "/bitacora", owner: "Gabriel", point: "G2 + G6" },
  { name: "Asistente IA", desc: "Preguntas con datos tapados y guardián ético (IA real).", icon: MessageSquareText, href: "/asistente", owner: "Anthony", point: "A3 + A4" },
  { name: "Kit de componentes", desc: "Colores, niveles de alerta, medidor, KPI y animaciones.", icon: Palette, href: "/ui", owner: "Anthony", point: "X1 + X2" },
];
const PENDING: Screen[] = [
  { name: "Analizador de Casos", desc: "Expediente y acciones en 1 clic.", icon: ScanSearch, owner: "Williams", point: "X3", mock: "10-analizador-expediente.jpg" },
  { name: "Consola de Soporte", desc: "Estado del sistema y modo reglas.", icon: Wrench, owner: "Anthony", point: "A6", mock: "14-consola-soporte.jpg" },
];

export function Home() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => { api.health().then(() => setOnline(true)).catch(() => setOnline(false)); }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex justify-end"><ThemeToggle /></div>
      <PageTransition className="space-y-6">
        <Card className="text-center">
          <div className="flex justify-center"><Logo className="w-full max-w-sm" /></div>
          <p className={`mt-4 inline-flex items-center gap-2 rounded-badge border px-3 py-1 text-xs font-semibold ${online === false ? "border-critical/40 bg-critical-soft text-critical" : "border-safe/40 bg-safe-soft text-safe"}`}>
            {online === false ? <ShieldAlert size={14} aria-hidden /> : <span className="h-2 w-2 rounded-full bg-current animate-ci-pulse" aria-hidden />}
            {online === false ? "API NO DISPONIBLE" : "ENTORNO QA · SISTEMA EN LÍNEA"}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-muted">
            Mapa de pantallas del entorno QA: entra con un perfil de demostración desde el Login. Las pantallas pendientes muestran su diseño del prototipo.
          </p>
        </Card>

        <section>
          <Eyebrow className="mb-3">Pantallas listas para revisar</Eyebrow>
          <Stagger className="grid gap-4 md:grid-cols-3">
            {READY.map((s) => <ScreenCard key={s.name} s={s} ready />)}
          </Stagger>
        </section>

        <section>
          <Eyebrow className="mb-3">En construcción (diseño de Alejandro)</Eyebrow>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PENDING.map((s) => <ScreenCard key={s.name} s={s} ready={false} />)}
          </Stagger>
        </section>
      </PageTransition>
    </main>
  );
}

function ScreenCard({ s, ready }: { s: Screen; ready: boolean }) {
  const Icon = s.icon;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-control ${ready ? "bg-brand-soft text-brand" : "bg-surface-2 text-ink-muted"}`}><Icon size={20} aria-hidden /></span>
        <span className={`inline-flex items-center gap-1 rounded-badge border px-2 py-0.5 text-[11px] font-semibold ${ready ? "border-safe/40 bg-safe-soft text-safe" : "border-high/40 bg-high-soft text-high"}`}>
          {ready ? "LISTA" : <><Clock size={11} aria-hidden /> PENDIENTE</>}
        </span>
      </div>
      <p className="mt-3 font-semibold text-ink">{s.name}</p>
      <p className="mt-1 text-sm text-ink-muted">{s.desc}</p>
      <p className="mt-3 font-mono text-[11px] text-ink-muted">{s.owner} · {s.point}</p>
    </>
  );
  if (ready && s.href) {
    return (
      <a href={s.href} className="lift group block h-full rounded-card border border-line bg-surface p-5 shadow-card">
        {body}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">Abrir <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
      </a>
    );
  }
  return (
    <div className="h-full rounded-card border border-dashed border-line-strong bg-surface p-5">
      {body}
      {s.mock && (
        <a href={`${PROTO}${s.mock}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ai">
          <ImageIcon size={15} aria-hidden /> Ver diseño del prototipo
        </a>
      )}
    </div>
  );
}
