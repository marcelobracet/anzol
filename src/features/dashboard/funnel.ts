import type { Step } from "@/features/steps/schema";

export type EventCount = { type: string; stepId: string | null; sessions: number };
export type FunnelRow = { key: string; label: string; sessions: number; fromStart: number; dropFromPrevious: number };
export type Funnel = {
  rows: FunnelRow[];
  summary: { visitors: number; leads: number; checkouts: number; purchases: number; conversion: number };
};

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
const round = (value: number) => Math.round(value * 10_000) / 10_000;

// Funil por sessões únicas: cada step na ordem do quiz, depois checkout e compras.
export function buildFunnel(steps: Step[], counts: EventCount[], purchases: { count: number }): Funnel {
  const sessionsOf = (type: string, stepId?: string) =>
    counts.filter((c) => c.type === type && (stepId === undefined || c.stepId === stepId)).reduce((sum, c) => sum + c.sessions, 0);

  const base = [
    ...steps.map((s) => ({ key: s.id, label: s.name, sessions: sessionsOf("step_view", s.id) })),
    { key: "checkout", label: "Clicou no checkout", sessions: sessionsOf("checkout_click") },
    { key: "purchase", label: "Compras aprovadas", sessions: purchases.count },
  ];
  const start = base[0]?.sessions ?? 0;
  const rows = base.map((row, i) => {
    const previous = i === 0 ? row.sessions : base[i - 1].sessions;
    return {
      ...row,
      fromStart: round(ratio(row.sessions, start)),
      dropFromPrevious: i === 0 ? 0 : round(previous > 0 ? 1 - row.sessions / previous : 0),
    };
  });

  return {
    rows,
    summary: {
      visitors: start,
      leads: sessionsOf("lead"),
      checkouts: sessionsOf("checkout_click"),
      purchases: purchases.count,
      conversion: round(ratio(purchases.count, start)),
    },
  };
}
