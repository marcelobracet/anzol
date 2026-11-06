const RANGES = [7, 30, 90] as const;
export type FunnelQuery = { days: (typeof RANGES)[number]; scope: "current" | "all"; from: string; to: string };

type SearchParams = Record<string, string | string[] | undefined>;

export function parseFunnelQuery(params: SearchParams, now: Date): FunnelQuery {
  const days = RANGES.find((d) => String(d) === params.range) ?? 7;
  const scope = params.scope === "all" ? "all" : "current";
  return {
    days,
    scope,
    from: new Date(now.getTime() - days * 86_400_000).toISOString(),
    to: now.toISOString(),
  };
}

export type LeadsQuery = FunnelQuery & { page: number; q: string | null };
const MAX_SEARCH = 100;

export function parseLeadsQuery(params: SearchParams, now: Date): LeadsQuery {
  const page = Number(params.page);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, MAX_SEARCH) : "";
  return {
    ...parseFunnelQuery(params, now),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    q: q || null,
  };
}
