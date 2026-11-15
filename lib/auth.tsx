"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { UNAUTHORIZED_EVENT, api } from "@/lib/api";
import { clearApiCache } from "@/lib/useApi";
import type { ConsentStatus, SessionResponse, User } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  /** True quando a sessão caiu durante o uso (mostra aviso no login). */
  expired: boolean;
  /** Termo de Consentimento: null enquanto a sessão não foi carregada. */
  consent: ConsentStatus | null;
  acceptConsent: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  /** Entrada pública, sem credenciais: cria uma sessão real de visitante (somente leitura). */
  loginAsVisitor: () => Promise<User>;
  isVisitor: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [expired, setExpired] = useState(false);
  const [consent, setConsent] = useState<ConsentStatus | null>(null);

  // Sessão atual: o cookie é httpOnly, então só a API sabe se ele é válido.
  useEffect(() => {
    let alive = true;
    api
      .get<SessionResponse>("/api/auth/me", { silent401: true, retries: 1 })
      .then((session) => {
        if (!alive) return;
        setUser(session.user);
        setConsent(session.consent);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!alive) return;
        // Sem sessão (ou sem conexão): trata como anônimo e o login mostra o erro, se houver.
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      alive = false;
    };
  }, []);

  // 401 em qualquer chamada autenticada = sessão expirada.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
      setExpired(true);
      clearApiCache();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.post<SessionResponse>(
      "/api/auth/login",
      { email, password },
      { silent401: true },
    );
    setUser(session.user);
    setConsent(session.consent);
    setStatus("authenticated");
    setExpired(false);
    return session.user;
  }, []);

  const loginAsVisitor = useCallback(async () => {
    const session = await api.post<SessionResponse>("/api/auth/visitor", undefined, {
      silent401: true,
    });
    clearApiCache();
    setUser(session.user);
    setConsent(session.consent);
    setStatus("authenticated");
    setExpired(false);
    return session.user;
  }, []);

  const acceptConsent = useCallback(async () => {
    const required = consent?.required_version;
    if (!required) return;
    await api.post("/api/privacy/consent", { accepted: true, version: required });
    setConsent({
      accepted: true,
      required_version: required,
      accepted_version: required,
      accepted_at: new Date().toISOString(),
    });
  }, [consent]);

  const logout = useCallback(async () => {
    try {
      await api.post<void>("/api/auth/logout", undefined, { silent401: true, retries: 0 });
    } catch {
      // mesmo que a API falhe, encerramos a sessão local
    }
    clearApiCache();
    setUser(null);
    setConsent(null);
    setStatus("anonymous");
    setExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      expired,
      consent,
      acceptConsent,
      login,
      loginAsVisitor,
      isVisitor: user?.role === "visitante",
      logout,
    }),
    [status, user, expired, consent, acceptConsent, login, loginAsVisitor, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return ctx;
}
