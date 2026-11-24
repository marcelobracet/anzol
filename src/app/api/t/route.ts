import { NextResponse, type NextRequest } from "next/server";
import { createTrackLimiter } from "@/features/tracking/rate-limit";
import { requestMeta } from "@/features/tracking/request-meta";
import { trackService } from "@/features/tracking/server";

const MAX_BODY_BYTES = 8 * 1024;
// Uma pessoa manda ~13 marcos de vídeo no 1º minuto; 600 dá folga para ~40 assistindo juntas no mesmo IP.
const limiter = createTrackLimiter({ eventsPerMinute: 60, progressPerMinute: 600 });

// Eventos do quiz (funil + Pixel/CAPI). Só no domínio da oferta.
export async function POST(request: NextRequest) {
  const meta = requestMeta(request.headers);
  if (!meta.host) return NextResponse.json({ success: false, error: "Host inválido" }, { status: 400 });
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ success: false, error: "Corpo grande demais" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
  }
  // O tipo só escolhe a cota; a validação de verdade é no trackService.
  const type = typeof body === "object" && body !== null && "type" in body && typeof body.type === "string" ? body.type : undefined;
  if (!limiter.allow(meta.ip ?? "unknown", type)) {
    return NextResponse.json({ success: false, error: "Muitas requisições" }, { status: 429 });
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
