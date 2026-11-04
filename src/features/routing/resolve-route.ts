export type RoutingConfig = {
  studioHost: string;
  // Hosts (e seus subdomínios) que nunca servem quiz. O Studio é a única exceção.
  blockedHosts: readonly string[];
};

export type RouteDecision =
  | { kind: "studio"; rewrite: string | null }
  | { kind: "webhook" }
  | { kind: "runtime"; rewrite: string }
  | { kind: "runtime-api" }
  | { kind: "not-found" };

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
const NOT_FOUND: RouteDecision = { kind: "not-found" };
const RUNTIME_API_PATHS = ["/api/t"];

export function normalizeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const host = raw.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return HOST_PATTERN.test(host) ? host : null;
}

const startsWithSegment = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const isBlocked = (host: string, blocked: readonly string[]) =>
  blocked.some((b) => host === b || host.endsWith(`.${b}`));

function resolveStudio(pathname: string): RouteDecision {
  if (startsWithSegment(pathname, "/api/webhooks")) return { kind: "webhook" };
  if (startsWithSegment(pathname, "/api/studio")) return { kind: "studio", rewrite: null };
  if (startsWithSegment(pathname, "/api") || startsWithSegment(pathname, "/r")) return NOT_FOUND;
  if (startsWithSegment(pathname, "/studio")) return { kind: "studio", rewrite: null };
  return { kind: "studio", rewrite: pathname === "/" ? "/studio" : `/studio${pathname}` };
}

function resolveRuntime(host: string, pathname: string): RouteDecision {
  if (RUNTIME_API_PATHS.includes(pathname)) return { kind: "runtime-api" };
  const internal = ["/api", "/studio", "/r"].some((p) => startsWithSegment(pathname, p));
  if (internal) return NOT_FOUND;
  return { kind: "runtime", rewrite: pathname === "/" ? `/r/${host}` : `/r/${host}${pathname}` };
}

export function resolveRoute(
  request: { host: string | null; pathname: string },
  config: RoutingConfig,
): RouteDecision {
  const host = normalizeHost(request.host);
  if (!host) return NOT_FOUND;
  if (host === normalizeHost(config.studioHost)) return resolveStudio(request.pathname);
  if (isBlocked(host, config.blockedHosts)) return NOT_FOUND;
  return resolveRuntime(host, request.pathname);
}
