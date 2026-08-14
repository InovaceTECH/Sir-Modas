import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/env";
import { isLocalAuthBypassEnabled } from "@/lib/auth/local-bypass";

export async function proxy(request: NextRequest) {
  if (!getSetupStatus().ready) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  if (isLocalAuthBypassEnabled(request.nextUrl.hostname)) {
    return NextResponse.next();
  }

  const { auth } = await import("@/lib/auth/server");
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const loginUrl = new URL("/entrar", request.url);
    loginUrl.searchParams.set("retorno", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inicio/:path*",
    "/vendas/:path*",
    "/produtos/:path*",
    "/estoque/:path*",
    "/caixa/:path*",
    "/clientes/:path*",
    "/trocas/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
  ],
};
