import { normalizeHost } from "@/features/routing/resolve-route";

// Dados do visitante vindos da borda da Vercel.
export function requestMeta(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    host: normalizeHost(headers.get("host")),
    ip: forwarded || headers.get("x-real-ip") || undefined,
    userAgent: headers.get("user-agent")?.slice(0, 500) || undefined,
    country: headers.get("x-vercel-ip-country")?.toUpperCase() || null,
  };
}
