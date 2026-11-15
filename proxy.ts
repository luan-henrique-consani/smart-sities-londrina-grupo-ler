import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Verificação otimista de sessão: sem o cookie, vai direto para o login.
 * A validação real (assinatura, expiração, perfil) é sempre da API; se o cookie
 * existir mas for inválido, a primeira chamada devolve 401 e o app volta ao login.
 */
const SESSION_COOKIE = "ll_session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = request.nextUrl.clone();
  const target = request.nextUrl.pathname;
  url.pathname = "/login";
  url.search = target && target !== "/" ? `?next=${encodeURIComponent(target)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  // Protege as telas do sistema. /login, /api, arquivos estáticos e _next ficam de fora.
  matcher: [
    "/",
    "/mapa/:path*",
    "/alertas/:path*",
    "/previsoes/:path*",
    "/pontos/:path*",
    "/conscientizacao/:path*",
    "/saude/:path*",
    "/meus-dados/:path*",
  ],
};
