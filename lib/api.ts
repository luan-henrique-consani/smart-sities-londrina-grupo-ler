/**
 * Cliente da API: timeout, nova tentativa (só em GET) e erros padronizados.
 * O backend responde erros como {"error": {"code", "message", "request_id"}}.
 */

export const UNAUTHORIZED_EVENT = "prevora:unauthorized";

export type ApiErrorKind =
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "server"
  | "unknown";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly kind: ApiErrorKind;
  readonly requestId: string | null;

  constructor(opts: {
    message: string;
    status: number;
    code: string;
    kind: ApiErrorKind;
    requestId?: string | null;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.kind = opts.kind;
    this.requestId = opts.requestId ?? null;
  }

  /** Falha de conexão (sem resposta do servidor): permite usar dados em cache. */
  get isConnectivity(): boolean {
    return this.kind === "network" || this.kind === "timeout";
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 422 || status === 400) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

const FRIENDLY: Record<ApiErrorKind, string> = {
  network: "Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.",
  timeout: "O servidor demorou demais para responder. Tente novamente.",
  unauthorized: "Sua sessão expirou. Entre novamente.",
  forbidden: "Seu perfil não tem permissão para acessar este recurso.",
  not_found: "O recurso solicitado não foi encontrado.",
  validation: "Os dados enviados são inválidos. Revise e tente de novo.",
  rate_limited: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
  server: "Ocorreu um erro inesperado no servidor. Tente novamente em instantes.",
  unknown: "Não foi possível concluir a operação.",
};

export function friendlyMessage(kind: ApiErrorKind): string {
  return FRIENDLY[kind];
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
  /** Tentativas extras (padrão: 2 em GET, 0 nas demais). */
  retries?: number;
  /** Não dispara o evento global de sessão expirada em 401 (ex.: login). */
  silent401?: boolean;
  signal?: AbortSignal;
};

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function attempt<T>(path: string, opts: RequestOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), opts.timeoutMs ?? 12000);
  const onAbort = () => controller.abort(opts.signal?.reason);
  opts.signal?.addEventListener("abort", onAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? "GET",
      headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) throw err; // cancelado pelo chamador
    const timedOut = controller.signal.aborted;
    throw new ApiError({
      message: friendlyMessage(timedOut ? "timeout" : "network"),
      status: 0,
      code: timedOut ? "timeout" : "network",
      kind: timedOut ? "timeout" : "network",
    });
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  let code = "error";
  let message: string | null = null;
  let requestId = res.headers.get("x-request-id");
  try {
    const payload = (await res.json()) as {
      error?: { code?: string; message?: string; request_id?: string };
    };
    code = payload.error?.code ?? code;
    message = payload.error?.message ?? null;
    requestId = payload.error?.request_id ?? requestId;
  } catch {
    // corpo não-JSON: usa a mensagem amigável padrão
  }
  const kind = kindFromStatus(res.status);
  if (kind === "unauthorized" && !opts.silent401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }
  throw new ApiError({
    message: message ?? friendlyMessage(kind),
    status: res.status,
    code,
    kind,
    requestId,
  });
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const retries = opts.retries ?? (method === "GET" ? 2 : 0);
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await attempt<T>(path, opts);
    } catch (err) {
      lastError = err;
      if (!(err instanceof ApiError)) throw err;
      const retryable = err.isConnectivity || RETRYABLE_STATUS.has(err.status);
      if (!retryable || i === retries) throw err;
      await sleep(500 * (i + 1));
    }
  }
  throw lastError;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: "POST", body: body ?? {} }),
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}
