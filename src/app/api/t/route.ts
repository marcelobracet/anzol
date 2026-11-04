import { NextResponse, type NextRequest } from "next/server";
import { createRateLimiter } from "@/features/tracking/rate-limit";
import { requestMeta } from "@/features/tracking/request-meta";
import { trackService } from "@/features/tracking/server";

const MAX_BODY_BYTES = 8 * 1024;
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

// Eventos do quiz (funil + Pixel/CAPI). Só no domínio da oferta.
export async function POST(request: NextRequest) {
  const meta = requestMeta(request.headers);
  if (!meta.host) return NextResponse.json({ success: false, error: "Host inválido" }, { status: 400 });
  if (!limiter.allow(meta.ip ?? "unknown")) {
    return NextResponse.json({ success: false, error: "Muitas requisições" }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ success: false, error: "Corpo grande demais" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
  }

  try {
    const result = await trackService().track({ body, host: meta.host, ip: meta.ip, userAgent: meta.userAgent, country: meta.country });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 202 });
  } catch (error) {
    console.error("[track] falha ao registrar evento", { host: meta.host, error: String(error) });
    return NextResponse.json({ success: false, error: "Indisponível" }, { status: 500 });
  }
}
