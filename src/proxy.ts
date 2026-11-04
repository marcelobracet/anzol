import { NextResponse, type NextRequest } from "next/server";
import { authenticateStudio } from "@/features/auth/studio-auth";
import { resolveRoute } from "@/features/routing/resolve-route";
import { routingEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const env = routingEnv();
  const decision = resolveRoute(
    { host: request.headers.get("host"), pathname },
    { studioHost: env.STUDIO_HOST, blockedHosts: env.BLOCKED_HOSTS },
  );

  switch (decision.kind) {
    case "not-found":
      return new NextResponse("Not found", { status: 404 });
    case "webhook":
    case "runtime-api":
      return NextResponse.next();
    case "runtime":
      return NextResponse.rewrite(new URL(`${decision.rewrite}${search}`, request.url));
    case "studio": {
      const auth = await authenticateStudio(request.headers);
      if (!auth.ok) {
        const status = auth.reason === "forbidden" ? 403 : 401;
        return NextResponse.json({ success: false, error: "Não autorizado" }, { status });
      }
      if (!decision.rewrite) return NextResponse.next();
      return NextResponse.rewrite(new URL(`${decision.rewrite}${search}`, request.url));
    }
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
