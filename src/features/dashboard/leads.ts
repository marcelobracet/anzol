import type { Step } from "@/features/steps/schema";

export type LeadContact = { name: string | null; email: string | null; phone: string | null };
export type SessionRow = {
  sessionId: string;
  startedAt: string;
  utm: Partial<Record<string, string>>;
  viewed: string[];
  answers: Record<string, string[]>;
  checkout: boolean;
  lead: LeadContact | null;
};
export type LeadKpis = {
  visitors: number;
  interacted: number;
  interactionRate: number;
  qualified: number;
  completed: number;
  contacts: number;
};
export type KpiThresholds = { qualifiedMin: number; lastStepId: string | null };

type EventLike = {
  sessionId: string;
  stepId: string | null;
  type: string;
  answer: { optionIds: string[] } | null;
  utm: Partial<Record<string, string>>;
  createdAt: string;
};
type LeadLike = { sessionId: string; name: string | null; email: string | null; phoneE164: string | null; createdAt: string };

// Interagiu = passou do 1º step; qualificado = viu ao menos metade dos steps; completo = viu o último.
// O SQL de lead_kpis (migration 0005) usa as mesmas regras.
export function kpiThresholds(steps: Step[]): KpiThresholds {
  return { qualifiedMin: Math.max(2, Math.ceil(steps.length / 2)), lastStepId: steps.at(-1)?.id ?? null };
}

export function computeKpis(rows: SessionRow[], { qualifiedMin, lastStepId }: KpiThresholds): LeadKpis {
  const count = (test: (row: SessionRow) => boolean) => rows.filter(test).length;
  const visitors = rows.length;
  const interacted = count((r) => r.viewed.length >= 2);
  return {
    visitors,
    interacted,
    interactionRate: visitors > 0 ? Math.round((interacted / visitors) * 10_000) / 10_000 : 0,
    qualified: count((r) => r.viewed.length >= qualifiedMin),
    completed: count((r) => lastStepId !== null && r.viewed.includes(lastStepId)),
    contacts: count((r) => r.lead !== null),
  };
}

// Versão em memória do lead_sessions: uma linha por sessão, mais recente primeiro.
export function summarizeSessions(events: EventLike[], leads: LeadLike[]): SessionRow[] {
  const ordered = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rows = new Map<string, SessionRow>();
  for (const e of ordered) {
    const row = rows.get(e.sessionId) ?? {
      sessionId: e.sessionId,
      startedAt: e.createdAt,
      utm: e.utm,
      viewed: [],
      answers: {},
      checkout: false,
      lead: null,
    };
    const viewed = e.type === "step_view" && e.stepId && !row.viewed.includes(e.stepId) ? [...row.viewed, e.stepId] : row.viewed;
    const answers = e.type === "answer" && e.stepId && e.answer ? { ...row.answers, [e.stepId]: e.answer.optionIds } : row.answers;
    rows.set(e.sessionId, { ...row, viewed, answers, checkout: row.checkout || e.type === "checkout_click" });
  }
  for (const l of [...leads].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const row = rows.get(l.sessionId);
    if (row) rows.set(l.sessionId, { ...row, lead: { name: l.name, email: l.email, phone: l.phoneE164 } });
  }
  return [...rows.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

const contactText = (lead: LeadContact) => [lead.name, lead.email, lead.phone].filter(Boolean).join(" · ");

// Uma célula por step, na ordem do quiz.
export function cellsFor(steps: Step[], row: SessionRow): string[] {
  return steps.map((step) => {
    if (step.type === "question" && row.answers[step.id]) {
      return row.answers[step.id].map((id) => step.options.find((o) => o.id === id)?.label ?? id).join(", ");
    }
    if (step.type === "leadForm" && row.lead) return contactText(row.lead);
    return row.viewed.includes(step.id) ? "visto" : "";
  });
}

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function matchingOptionIds(steps: Step[], term: string): string[] {
  const needle = normalize(term);
  if (!needle) return [];
  return steps.flatMap((s) => (s.type === "question" ? s.options.filter((o) => normalize(o.label).includes(needle)).map((o) => o.id) : []));
}

export function matchesSearch(row: SessionRow, steps: Step[], term: string): boolean {
  const needle = normalize(term);
  if (!needle) return true;
  if (row.lead && normalize(contactText(row.lead)).includes(needle)) return true;
  const options = new Set(matchingOptionIds(steps, term));
  return Object.values(row.answers).some((ids) => ids.some((id) => options.has(id)));
}

// Termo da busca como padrão ILIKE literal (% e _ do usuário não viram curinga).
export function ilikePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
