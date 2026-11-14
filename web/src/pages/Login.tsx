// Login con perfiles en 1 clic + formulario (PR G5 · prototipo de Alejandro, PLAN_UX §5.2).
import { ArrowRight, Info, Lock } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Eyebrow, Logo, PageTransition, Stagger, ThemeToggle, ROLE_LABEL } from "../components/ui";
import { useSession } from "../hooks/useSession";
import { api, ApiClientError } from "../services/apiClient";
import type { DemoUser, Role } from "../types/contracts";

const ACCENT: Record<Role, string> = { ADMIN: "var(--ai)", SUPERVISOR: "var(--sidebar)", ANALYST: "var(--low)" };
const ACCESS: Record<Role, string> = {
  ADMIN: "Acceso completo más la Consola de Soporte e infraestructura.",
  SUPERVISOR: "Panel ejecutivo, Buzón, Analizador, Bitácora y decisiones sobre la cuarentena.",
  ANALYST: "Triaje diario en Panel, Buzón, Analizador y Asistente.",
};
const ORDER: Role[] = ["ADMIN", "SUPERVISOR", "ANALYST"];

export function LoginPage({ onDone }: { onDone: () => void }) {
  const { login, quickLogin } = useSession();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.demoUsers().then((r) => setUsers([...r.users].sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role)))).catch(() => setUsers([])); }, []);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError(null);
    try { await fn(); onDone(); }
    catch (e: unknown) { setError(e instanceof ApiClientError && e.status === 401 ? "Usuario o contraseña incorrectos." : "No pudimos iniciar sesión. Intente de nuevo."); }
    finally { setBusy(null); }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); void run("form", () => login(username.trim(), password)); };

  return (
    <main className="mx-auto max-w-xl space-y-5 p-4 sm:p-8">
      <div className="flex justify-end"><ThemeToggle /></div>
      <PageTransition className="space-y-5">
        <Card>
          <div className="flex justify-center"><Logo className="w-full max-w-xs" /></div>
          <Eyebrow className="mt-6">Selección rápida de perfil (1 clic)</Eyebrow>
          <Stagger className="mt-3 space-y-3">
            {users.map((u) => (
              <button key={u.username} type="button" onClick={() => void run(u.username, () => quickLogin(u.username))} disabled={busy !== null}
                className="lift press flex w-full items-center gap-4 rounded-control border border-line border-l-4 bg-surface-2 p-4 text-left disabled:opacity-60" style={{ borderLeftColor: ACCENT[u.role] }}>
                <div className="min-w-0 flex-1">
                  <Eyebrow>{ROLE_LABEL[u.role]}</Eyebrow>
                  <p className="font-semibold text-ink">{u.display_name}</p>
                  <p className="text-sm text-ink-muted">{ACCESS[u.role]}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-control bg-sidebar px-3 py-1.5 text-xs font-bold text-white">{busy === u.username ? "…" : "ENTRAR"} <ArrowRight size={14} aria-hidden /></span>
              </button>
            ))}
          </Stagger>
        </Card>

        <Card>
          <Eyebrow>Acceso por credenciales</Eyebrow>
          <h1 className="mt-1 text-lg font-semibold text-ink">Iniciar sesión institucional</h1>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-ink-2">Usuario corporativo
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Ej. cmendoza, svalenzuela o jrios"
                className="mt-1 w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-ink focus:border-brand focus:outline-none" />
            </label>
            <label className="block text-sm font-medium text-ink-2">Contraseña
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Ingrese su contraseña"
                className="mt-1 w-full rounded-control border border-line bg-surface-2 px-3 py-2 text-ink focus:border-brand focus:outline-none" />
            </label>
            {error && <p role="alert" className="rounded-control border border-critical/40 bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
            <Button type="submit" variant="navy" block loading={busy === "form"} icon={<Lock size={16} />} disabled={!username || !password}>Iniciar sesión segura</Button>
          </form>
          <Eyebrow className="mt-5">Credenciales de demostración</Eyebrow>
          <pre className="mt-2 rounded-control border border-line bg-surface-2 p-3 font-mono text-xs text-ink-2">{users.map((u) => `${u.username} / Demo-2026!  (${ROLE_LABEL[u.role]})`).join("\n")}</pre>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-muted"><Info size={13} aria-hidden /> Sistema de demostración con datos sintéticos. Uso monitoreado.</p>
        </Card>
      </PageTransition>
    </main>
  );
}
