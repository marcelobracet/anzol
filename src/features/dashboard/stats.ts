import "server-only";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { EventCount } from "./funnel";
import type { RetentionRow } from "./retention";

export type FunnelStats = {
  counts: EventCount[];
  purchases: { count: number; revenue: { currency: string; amount: number }[] };
};

type Filter = { versionId: string | null; from: string; to: string };

function devStats(quizId: string, { versionId }: Filter): FunnelStats {
  const events = devMemoryStore().tracking.events.filter((e) => e.quizId === quizId && (!versionId || e.versionId === versionId));
  const groups = new Map<string, Set<string>>();
  for (const e of events) {
    const key = `${e.type}|${e.stepId ?? ""}`;
    groups.set(key, (groups.get(key) ?? new Set()).add(e.sessionId));
  }
  const counts = [...groups].map(([key, sessions]) => {
    const [type, stepId] = key.split("|");
    return { type, stepId: stepId || null, sessions: sessions.size };
  });
  const approved = devMemoryStore().purchases.rows.filter((p) => p.quizId === quizId && p.status === "approved");
  return { counts, purchases: { count: approved.length, revenue: [] } };
}

export async function loadFunnelStats(quizId: string, filter: Filter): Promise<FunnelStats> {
  if (devMemoryEnabled()) return devStats(quizId, filter);
  const db = supabaseAdmin();
  const [events, purchases] = await Promise.all([
    db.rpc("funnel_stats", { p_quiz_id: quizId, p_version_id: filter.versionId, p_from: filter.from, p_to: filter.to }),
    db
      .from("purchases")
      .select("amount, currency")
      .eq("quiz_id", quizId)
      .eq("status", "approved")
      .gte("created_at", filter.from)
      .lt("created_at", filter.to),
  ]);
  if (events.error) throw new Error(`Supabase funnel_stats: ${events.error.message}`);
  if (purchases.error) throw new Error(`Supabase purchases: ${purchases.error.message}`);

  const revenue = new Map<string, number>();
  for (const p of purchases.data ?? []) {
    if (p.currency && p.amount != null) revenue.set(p.currency, (revenue.get(p.currency) ?? 0) + Number(p.amount));
  }
  return {
    counts: (events.data ?? []).map((r: { type: string; step_id: string | null; sessions: number }) => ({
      type: r.type,
      stepId: r.step_id,
      sessions: Number(r.sessions),
    })),
    purchases: {
      count: purchases.data?.length ?? 0,
      revenue: [...revenue].map(([currency, amount]) => ({ currency, amount })),
    },
  };
}

/** Por step VSL: histograma de segundo máximo assistido por sessão. */
export type RetentionStats = Record<string, RetentionRow[]>;

function toRetentionStats(rows: { stepId: string; maxSecond: number; sessions: number }[]): RetentionStats {
  const byStep: RetentionStats = {};
  for (const { stepId, ...row } of rows) byStep[stepId] = [...(byStep[stepId] ?? []), row];
  return byStep;
}

function devRetention(quizId: string, { versionId }: Filter): RetentionStats {
  const maxBySession = new Map<string, number>();
  for (const e of devMemoryStore().tracking.events) {
    if (e.quizId !== quizId || e.type !== "vsl_progress" || e.videoSecond === null || !e.stepId) continue;
    if (versionId && e.versionId !== versionId) continue;
    const key = `${e.stepId}|${e.sessionId}`;
    maxBySession.set(key, Math.max(maxBySession.get(key) ?? 0, e.videoSecond));
  }
  const histogram = new Map<string, number>();
  for (const [key, max] of maxBySession) {
    const histKey = `${key.split("|")[0]}|${max}`;
    histogram.set(histKey, (histogram.get(histKey) ?? 0) + 1);
  }
  return toRetentionStats(
    [...histogram].map(([key, sessions]) => {
      const [stepId, max] = key.split("|");
      return { stepId, maxSecond: Number(max), sessions };
    }),
  );
}

export async function loadRetentionStats(quizId: string, filter: Filter): Promise<RetentionStats> {
  if (devMemoryEnabled()) return devRetention(quizId, filter);
  const { data, error } = await supabaseAdmin().rpc("vsl_retention", {
    p_quiz_id: quizId,
    p_version_id: filter.versionId,
    p_from: filter.from,
    p_to: filter.to,
  });
  if (error) throw new Error(`Supabase vsl_retention: ${error.message}`);
  return toRetentionStats(
    (data ?? []).map((r: { step_id: string; max_second: number; sessions: number }) => ({
      stepId: r.step_id,
      maxSecond: Number(r.max_second),
      sessions: Number(r.sessions),
    })),
  );
}
