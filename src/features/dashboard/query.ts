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
