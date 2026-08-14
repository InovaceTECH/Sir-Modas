import { toNextJsHandler } from "better-auth/next-js";

import { getSetupStatus } from "@/lib/env";

async function handle(request: Request) {
  if (!getSetupStatus().ready) {
    return Response.json(
      { message: "A autenticação ainda não foi configurada." },
      { status: 503 },
    );
  }

  const { auth } = await import("@/lib/auth/server");
  const handler = toNextJsHandler(auth);

  return request.method === "GET" ? handler.GET(request) : handler.POST(request);
}

export const GET = handle;
export const POST = handle;
