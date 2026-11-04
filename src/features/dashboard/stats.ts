import "server-only";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { EventCount } from "./funnel";

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
