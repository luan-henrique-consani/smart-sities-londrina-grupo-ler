/** Envio de erros do navegador para POST /api/logs/client (limitado e sem dados pessoais). */

const MAX_REPORTS_PER_SESSION = 10;
let sent = 0;

export function reportClientError(input: {
  message: string;
  stack?: string | null;
  component?: string;
  level?: "error" | "warning" | "info";
}): void {
  if (typeof window === "undefined" || sent >= MAX_REPORTS_PER_SESSION) return;
  sent += 1;
  const body = {
    level: input.level ?? "error",
    message: input.message.slice(0, 2000) || "Erro sem mensagem",
    stack: input.stack ? input.stack.slice(0, 6000) : null,
    url: window.location.pathname.slice(0, 500),
    user_agent: navigator.userAgent.slice(0, 300),
    component: input.component?.slice(0, 120) ?? null,
  };
  try {
    void fetch("/api/logs/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // o envio de logs nunca pode quebrar a interface
  }
}
