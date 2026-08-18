import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSetupStatus } from "@/lib/env";

export async function proxy(request: NextRequest) {
  if (!getSetupStatus().ready) {
    return NextResponse.redirect(new URL("/setup", request.url));
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
