import "server-only";
import type { Step } from "@/features/steps/schema";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  computeKpis,
  ilikePattern,
  kpiThresholds,
  matchesSearch,
  matchingOptionIds,
  summarizeSessions,
  type LeadKpis,
  type SessionRow,
} from "./leads";

export const LEADS_PAGE_SIZE = 50;

type Filter = { versionId: string | null; from: string; to: string; q: string | null; page: number };
export type LeadsData = { kpis: LeadKpis; rows: SessionRow[]; total: number };

function devLeads(quizId: string, steps: Step[], f: Filter): LeadsData {
  const { tracking } = devMemoryStore();
  const inRange = (e: { quizId: string; createdAt: string }) => e.quizId === quizId && e.createdAt >= f.from && e.createdAt < f.to;
  const events = tracking.events.filter((e) => inRange(e) && (!f.versionId || e.versionId === f.versionId));
  const all = summarizeSessions(events, tracking.leads.filter((l) => l.quizId === quizId));
  const matching = f.q ? all.filter((row) => matchesSearch(row, steps, f.q!)) : all;
  const start = (f.page - 1) * LEADS_PAGE_SIZE;
  return { kpis: computeKpis(all, kpiThresholds(steps)), rows: matching.slice(start, start + LEADS_PAGE_SIZE), total: matching.length };
}

type SessionRecord = {
  session_id: string;
  started_at: string;
  utm: Record<string, string> | null;
  viewed: string[] | null;
  answers: Record<string, string[]> | null;
  checkout: boolean | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  total: number;
};

const toRow = (r: SessionRecord): SessionRow => ({
  sessionId: r.session_id,
  startedAt: r.started_at,
  utm: r.utm ?? {},
  viewed: r.viewed ?? [],
  answers: r.answers ?? {},
  checkout: Boolean(r.checkout),
  lead: r.lead_name || r.lead_email || r.lead_phone ? { name: r.lead_name, email: r.lead_email, phone: r.lead_phone } : null,
});

export async function loadLeads(quizId: string, steps: Step[], f: Filter): Promise<LeadsData> {
  if (devMemoryEnabled()) return devLeads(quizId, steps, f);
  const db = supabaseAdmin();
  const range = { p_quiz_id: quizId, p_version_id: f.versionId, p_from: f.from, p_to: f.to };
  const { qualifiedMin, lastStepId } = kpiThresholds(steps);
  const [kpis, sessions] = await Promise.all([
    db.rpc("lead_kpis", { ...range, p_qualified_min: qualifiedMin, p_last_step: lastStepId }).single(),
    db.rpc("lead_sessions", {
      ...range,
      p_pattern: f.q ? ilikePattern(f.q) : null,
      p_option_ids: f.q ? matchingOptionIds(steps, f.q) : null,
      p_limit: LEADS_PAGE_SIZE,
      p_offset: (f.page - 1) * LEADS_PAGE_SIZE,
    }),
  ]);
  if (kpis.error) throw new Error(`Supabase lead_kpis: ${kpis.error.message}`);
  if (sessions.error) throw new Error(`Supabase lead_sessions: ${sessions.error.message}`);

  const k = kpis.data as { visitors: number; interacted: number; qualified: number; completed: number; contacts: number };
  const visitors = Number(k.visitors);
  const interacted = Number(k.interacted);
  const records = (sessions.data ?? []) as SessionRecord[];
  return {
    kpis: {
      visitors,
      interacted,
      interactionRate: visitors > 0 ? Math.round((interacted / visitors) * 10_000) / 10_000 : 0,
      qualified: Number(k.qualified),
      completed: Number(k.completed),
      contacts: Number(k.contacts),
    },
    rows: records.map(toRow),
    total: Number(records[0]?.total ?? 0),
  };
}
