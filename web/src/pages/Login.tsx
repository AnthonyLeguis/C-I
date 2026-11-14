// Login horizontal (prototipo de Alejandro): a la izquierda la marca y los perfiles de prueba en 1 clic,
// a la derecha el acceso por credenciales. En pantallas menores a md el formulario es lo principal y los
// perfiles de prueba quedan en un desplegable. Sin selector de tema: el login respeta el último tema que
// el usuario dejó en su sesión (lo recuerda este equipo).
import { ArrowRight, ChevronDown, Info, Lock, UsersRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Eyebrow, Logo, PageTransition, Stagger, ROLE_LABEL } from "../components/ui";
import { useSession } from "../hooks/useSession";
import { api, ApiClientError } from "../services/apiClient";
import type { DemoUser, Role } from "../types/contracts";

const ACCENT: Record<Role, string> = { ADMIN: "var(--ai)", SUPERVISOR: "var(--sidebar-active)", ANALYST: "var(--low)" };
const ACCESS: Record<Role, string> = {
  ADMIN: "Acceso completo más la Consola de Soporte e infraestructura.",
  SUPERVISOR: "Panel ejecutivo, Buzón, Analizador, Bitácora y decisiones sobre la cuarentena.",
  ANALYST: "Triaje diario en Panel, Buzón, Analizador y Asistente.",
};
const ORDER: Role[] = ["ADMIN", "SUPERVISOR", "ANALYST"];
const DEMO_PASSWORD = "Demo-2026!";
const inputCls = "mt-1 w-full rounded-control border border-line bg-surface-2/80 px-3 py-2.5 text-ink transition-colors focus:border-brand focus:outline-none";

export function LoginPage({ onDone }: { onDone: () => void }) {
  const { login, quickLogin } = useSession();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfiles, setShowProfiles] = useState(false);

  useEffect(() => { api.demoUsers().then((r) => setUsers([...r.users].sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role)))).catch(() => setUsers([])); }, []);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError(null);
    try { await fn(); onDone(); }
    catch (e: unknown) { setError(e instanceof ApiClientError && e.status === 401 ? "Usuario o contraseña incorrectos." : "No pudimos iniciar sesión. Intente de nuevo."); }
    finally { setBusy(null); }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); void run("form", () => login(username.trim(), password)); };
  const quick = (u: DemoUser) => void run(u.username, () => quickLogin(u.username));

  return (
    <main className="flex min-h-dvh items-center justify-center p-4 sm:p-6 lg:p-10">
      <PageTransition className="grid w-full max-w-5xl gap-5 md:grid-cols-[1.05fr_1fr] md:items-stretch lg:gap-6">
        {/* Columna izquierda (md+): marca + perfiles de prueba */}
        <Card className="hidden flex-col md:flex">
          <Logo className="w-full max-w-[300px]" />
          <p className="mt-3 text-sm text-ink-2">Sistema inteligente contra el phishing en el correo corporativo de la banca venezolana.</p>
          <Eyebrow className="mt-6">Perfiles de prueba · entrar en 1 clic</Eyebrow>
          <ProfileList users={users} busy={busy} onPick={quick} />
        </Card>

        {/* Columna derecha: acceso por credenciales (en móvil es lo principal) */}
        <Card className="flex flex-col">
          <div className="mb-5 flex justify-center md:hidden"><Logo className="w-full max-w-[240px]" /></div>
          <Eyebrow>Acceso por credenciales</Eyebrow>
          <h1 className="mt-1 text-xl font-semibold text-ink">Iniciar sesión institucional</h1>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-ink-2">Usuario corporativo
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Ej. cmendoza, svalenzuela o jrios" className={inputCls} />
            </label>
            <label className="block text-sm font-medium text-ink-2">Contraseña
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Ingrese su contraseña" className={inputCls} />
            </label>
            {error && <p role="alert" className="animate-enter rounded-control border border-critical/40 bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
            <Button type="submit" variant="navy" block loading={busy === "form"} icon={<Lock size={16} />} disabled={!username || !password}>Iniciar sesión segura</Button>
          </form>

          <Eyebrow className="mt-6">Credenciales de demostración</Eyebrow>
          <div className="mt-2 overflow-hidden rounded-control border border-line bg-surface-2/70">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  <th className="px-3 py-2 font-medium">Usuario</th>
                  <th className="px-3 py-2 font-medium">Contraseña</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Perfil</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                {users.map((u) => (
                  <tr key={u.username} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-1.5 font-semibold text-ink">{u.username}</td>
                    <td className="px-3 py-1.5">{DEMO_PASSWORD}</td>
                    <td className="hidden px-3 py-1.5 font-sans text-ink-muted sm:table-cell">{ROLE_LABEL[u.role]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil: perfiles de prueba en un desplegable */}
          <div className="mt-4 md:hidden">
            <button type="button" onClick={() => setShowProfiles((v) => !v)} aria-expanded={showProfiles} aria-controls="perfiles-prueba"
              className="press flex w-full items-center gap-2 rounded-control border border-line bg-surface-2/70 px-3 py-2.5 text-sm font-semibold text-ink-2">
              <UsersRound size={16} aria-hidden /> <span className="flex-1 text-left">Perfiles de prueba (1 clic)</span>
              <ChevronDown size={16} aria-hidden className={`transition-transform duration-300 ${showProfiles ? "rotate-180" : ""}`} />
            </button>
            <div id="perfiles-prueba" className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${showProfiles ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden"><ProfileList users={users} busy={busy} onPick={quick} compact /></div>
            </div>
          </div>

          <p className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs text-ink-muted"><Info size={13} aria-hidden /> Sistema de demostración con datos sintéticos. Uso monitoreado.</p>
        </Card>
      </PageTransition>
    </main>
  );
}

function ProfileList({ users, busy, onPick, compact = false }: { users: DemoUser[]; busy: string | null; onPick: (u: DemoUser) => void; compact?: boolean }) {
  return (
    <Stagger className={`mt-3 ${compact ? "space-y-2" : "space-y-3"}`}>
      {users.map((u) => (
        <button key={u.username} type="button" onClick={() => onPick(u)} disabled={busy !== null}
          className={`lift press group flex w-full items-center gap-4 rounded-control border border-line border-l-4 bg-surface-2/70 text-left disabled:opacity-60 ${compact ? "p-3" : "p-4"}`} style={{ borderLeftColor: ACCENT[u.role] }}>
          <div className="min-w-0 flex-1">
            <Eyebrow>{ROLE_LABEL[u.role]}</Eyebrow>
            <p className="font-semibold text-ink">{u.display_name}</p>
            {!compact && <p className="text-sm text-ink-muted">{ACCESS[u.role]}</p>}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-control bg-sidebar px-3 py-1.5 text-xs font-bold text-white transition-colors group-hover:bg-sidebar-active">
            {busy === u.username ? "…" : "ENTRAR"} <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      ))}
    </Stagger>
  );
}
