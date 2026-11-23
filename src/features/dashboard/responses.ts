import "server-only";
import { devMemoryEnabled, devMemoryStore } from "@/lib/dev/memory-store";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AnswerCount, DepthRow } from "./engagement";

type Filter = { versionId: string | null; from: string; to: string };

import type { AnswerStats, ResponsePage, ResponseRow } from "./responses-types";

export type { AnswerStats, ResponsePage, ResponseRow };

const rpcParams = (quizId: string, f: Filter) => ({ p_quiz_id: quizId, p_version_id: f.versionId, p_from: f.from, p_to: f.to });

// ---- dev (memória, sem Supabase): ignora o período, como o restante do painel em dev ----

function devEvents(quizId: string, { versionId }: Filter) {
  return devMemoryStore().tracking.events.filter((e) => e.quizId === quizId && (!versionId || e.versionId === versionId));
}

function devLatestAnswers(quizId: string, filter: Filter): Map<string, Record<string, string[]>> {
  const bySession = new Map<string, Record<string, string[]>>();
  for (const e of devEvents(quizId, filter)) {
    if (e.type !== "answer" || !e.stepId || !e.optionIds) continue;
    bySession.set(e.sessionId, { ...(bySession.get(e.sessionId) ?? {}), [e.stepId]: e.optionIds });
  }
  return bySession;
}

// ---- consultas ----

export async function loadDepth(quizId: string, filter: Filter): Promise<DepthRow[]> {
  if (devMemoryEnabled()) {
    const viewed = new Map<string, Set<string>>();
    for (const e of devEvents(quizId, filter)) {
      if (e.type === "step_view" && e.stepId) viewed.set(e.sessionId, (viewed.get(e.sessionId) ?? new Set()).add(e.stepId));
    }
    const histogram = new Map<number, number>();
    for (const steps of viewed.values()) histogram.set(steps.size, (histogram.get(steps.size) ?? 0) + 1);
    return [...histogram].map(([viewedCount, sessions]) => ({ viewed: viewedCount, sessions }));
  }
  const { data, error } = await supabaseAdmin().rpc("session_depth", rpcParams(quizId, filter));
  if (error) throw new Error(`Supabase session_depth: ${error.message}`);
  return (data ?? []).map((r: { viewed: number; sessions: number }) => ({ viewed: Number(r.viewed), sessions: Number(r.sessions) }));
}

export async function loadAnswerStats(quizId: string, filter: Filter): Promise<AnswerStats> {
  const counts: AnswerCount[] = [];
  const answeredByStep: Record<string, number> = {};
  if (devMemoryEnabled()) {
    const optionSessions = new Map<string, number>();
    for (const answers of devLatestAnswers(quizId, filter).values()) {
      for (const [stepId, optionIds] of Object.entries(answers)) {
        answeredByStep[stepId] = (answeredByStep[stepId] ?? 0) + 1;
        for (const optionId of new Set(optionIds)) optionSessions.set(`${stepId}|${optionId}`, (optionSessions.get(`${stepId}|${optionId}`) ?? 0) + 1);
      }
    }
    for (const [key, sessions] of optionSessions) {
      const [stepId, optionId] = key.split("|");
      counts.push({ stepId, optionId, sessions });
    }
    return { counts, answeredByStep };
  }
  const { data, error } = await supabaseAdmin().rpc("answer_distribution", rpcParams(quizId, filter));
  if (error) throw new Error(`Supabase answer_distribution: ${error.message}`);
  for (const r of (data ?? []) as { step_id: string; option_id: string | null; sessions: number }[]) {
    if (r.option_id === null) answeredByStep[r.step_id] = Number(r.sessions);
    else counts.push({ stepId: r.step_id, optionId: r.option_id, sessions: Number(r.sessions) });
  }
  return { counts, answeredByStep };
}

export async function loadResponses(
  quizId: string,
  filter: Filter,
  page: { search: string; limit: number; offset: number },
): Promise<ResponsePage> {
  if (devMemoryEnabled()) {
    const answers = devLatestAnswers(quizId, filter);
    const leads = devMemoryStore().tracking.leads.filter((l) => l.quizId === quizId);
    const sessions = new Map<string, { steps: Set<string>; utm: Record<string, string> }>();
    for (const e of devEvents(quizId, filter)) {
      const s = sessions.get(e.sessionId) ?? { steps: new Set<string>(), utm: e.utm as Record<string, string> };
      if (e.type === "step_view" && e.stepId) s.steps.add(e.stepId);
      sessions.set(e.sessionId, s);
    }
    const search = page.search.toLowerCase();
    const rows: ResponseRow[] = [...sessions]
      .map(([sessionId, s]) => {
        const lead = leads.findLast((l) => l.sessionId === sessionId);
        return {
          sessionId,
          startedAt: null,
          lastAt: null,
          stepsViewed: s.steps.size,
          answers: answers.get(sessionId) ?? {},
          lead: lead ? { name: lead.name, email: lead.email, phone: lead.phoneE164 } : null,
          utm: s.utm,
        };
      })
      .filter((r) => Object.keys(r.answers).length > 0 || r.lead || r.stepsViewed > 1)
      .filter((r) => !search || [r.lead?.name, r.lead?.email, r.lead?.phone].some((v) => v?.toLowerCase().includes(search)))
      .reverse();
    return { rows: rows.slice(page.offset, page.offset + page.limit), total: rows.length };
  }
  const { data, error } = await supabaseAdmin().rpc("recent_responses", {
    ...rpcParams(quizId, filter),
    p_search: page.search,
    p_limit: page.limit,
    p_offset: page.offset,
  });
  if (error) throw new Error(`Supabase recent_responses: ${error.message}`);
  type Raw = {
    session_id: string;
    started_at: string;
    last_at: string;
    steps_viewed: number;
    answers: Record<string, string[]> | null;
    lead_name: string | null;
    lead_email: string | null;
    lead_phone: string | null;
    utm: Record<string, string> | null;
    total: number;
  };
  const raw = (data ?? []) as Raw[];
  return {
    total: Number(raw[0]?.total ?? 0),
    rows: raw.map((r) => ({
      sessionId: r.session_id,
      startedAt: r.started_at,
      lastAt: r.last_at,
      stepsViewed: Number(r.steps_viewed),
      answers: r.answers ?? {},
      lead: r.lead_name || r.lead_email || r.lead_phone ? { name: r.lead_name, email: r.lead_email, phone: r.lead_phone } : null,
      utm: r.utm ?? {},
    })),
  };
}
