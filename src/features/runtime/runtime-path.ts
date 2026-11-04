import { normalizeHost } from "@/features/routing/resolve-route";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type RuntimePath = { host: string; slug: string | null };

// Params da rota /r/[host]/[[...slug]]: raiz = quiz padrão do domínio, /{slug} = outro quiz.
export function parseRuntimePath(rawHost: string, segments: string[] | undefined): RuntimePath | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawHost);
  } catch {
    return null;
  }
  const host = normalizeHost(decoded);
  if (!host) return null;
  if (!segments || segments.length === 0) return { host, slug: null };
  if (segments.length > 1 || !SLUG.test(segments[0])) return null;
  return { host, slug: segments[0] };
}
