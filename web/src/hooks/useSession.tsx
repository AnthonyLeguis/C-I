// Sesión del usuario (PR G5): consulta /auth/me al cargar y expone login, quick-login y logout.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../services/apiClient";
import type { User } from "../types/contracts";

interface SessionApi {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  quickLogin: (username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (u: string, p: string) => setUser((await api.login(u, p)).user), []);
  const quickLogin = useCallback(async (u: string) => setUser((await api.quickLogin(u)).user), []);
  const logout = useCallback(async () => { await api.logout().catch(() => undefined); setUser(null); }, []);

  const value = useMemo(() => ({ user, loading, login, quickLogin, logout }), [user, loading, login, quickLogin, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
