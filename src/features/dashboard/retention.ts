import { milestoneAt, milestonesUpTo } from "@/features/steps/vsl/milestones";

/** Quantas sessões pararam em cada segundo máximo assistido (um step VSL). */
export type RetentionRow = { maxSecond: number; sessions: number };
export type RetentionPoint = { second: number; sessions: number; share: number };
export type RetentionDrop = { from: number; to: number; lost: number; share: number };
export type Retention = {
  views: number; // viram a página do vídeo
  starts: number; // tocaram para ouvir (base da curva)
  playRate: number;
  points: RetentionPoint[];
  halfSecond: number | null; // primeiro marco com metade ou menos assistindo
  reachedCta: number;
  drops: RetentionDrop[];
};

const round = (value: number) => Math.round(value * 10_000) / 10_000;
const TOP_DROPS = 3;

// Retenção no marco m = sessões cujo máximo assistido é >= m.
export function buildRetention(rows: RetentionRow[], opts: { views: number; ctaAt: number }): Retention {
  const starts = rows.reduce((sum, r) => sum + r.sessions, 0);
  const empty = { views: opts.views, starts, playRate: 0, points: [], halfSecond: null, reachedCta: 0, drops: [] };
  if (starts === 0) return empty;

  const share = (n: number) => round(n / starts);
  const lastObserved = Math.max(...rows.map((r) => r.maxSecond));
  const last = Math.max(lastObserved, milestoneAt(opts.ctaAt));
  const watching = (second: number) => rows.filter((r) => r.maxSecond >= second).reduce((sum, r) => sum + r.sessions, 0);
  const points = milestonesUpTo(last).map((second) => {
    const sessions = watching(second);
    return { second, sessions, share: share(sessions) };
  });

  const drops = points
    .slice(1)
    .map((p, i) => ({ from: points[i].second, to: p.second, lost: points[i].sessions - p.sessions }))
    .filter((d) => d.lost > 0)
    .sort((a, b) => b.lost - a.lost || a.from - b.from)
    .slice(0, TOP_DROPS)
    .map((d) => ({ ...d, share: share(d.lost) }));

  return {
    views: opts.views,
    starts,
    playRate: round(Math.min(1, opts.views > 0 ? starts / opts.views : 1)),
    points,
    halfSecond: points.find((p) => p.share <= 0.5)?.second ?? null,
    reachedCta: share(watching(opts.ctaAt)),
    drops,
  };
}
