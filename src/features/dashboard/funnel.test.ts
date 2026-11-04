import { describe, expect, it } from "vitest";
import { demoDocument } from "@/features/runtime/demo-document";
import { playableSteps } from "@/features/runtime/engine";
import { buildFunnel } from "./funnel";

const steps = playableSteps(demoDocument());
const counts = [
  { type: "step_view", stepId: "intro", sessions: 1000 },
  { type: "step_view", stepId: "q_goal", sessions: 800 },
  { type: "step_view", stepId: "q_blockers", sessions: 600 },
  { type: "step_view", stepId: "loading", sessions: 590 },
  { type: "step_view", stepId: "result", sessions: 500 },
  { type: "step_view", stepId: "removido", sessions: 3 },
  { type: "lead", stepId: "lead_x", sessions: 120 },
  { type: "checkout_click", stepId: "result", sessions: 100 },
];

describe("buildFunnel", () => {
  const funnel = buildFunnel(steps, counts, { count: 20 });

  it("segue a ordem dos steps e calcula taxa desde o início e perda do anterior", () => {
    expect(funnel.rows.slice(0, 3)).toEqual([
      { key: "intro", label: "Abertura", sessions: 1000, fromStart: 1, dropFromPrevious: 0 },
      { key: "q_goal", label: "Objetivo", sessions: 800, fromStart: 0.8, dropFromPrevious: 0.2 },
      { key: "q_blockers", label: "Obstáculos", sessions: 600, fromStart: 0.6, dropFromPrevious: 0.25 },
    ]);
  });

  it("termina com clique no checkout e compras; ignora steps que não existem mais", () => {
    expect(funnel.rows.map((r) => r.key)).toEqual(["intro", "q_goal", "q_blockers", "loading", "result", "checkout", "purchase"]);
    expect(funnel.rows.at(-2)).toMatchObject({ label: "Clicou no checkout", sessions: 100, fromStart: 0.1 });
    expect(funnel.rows.at(-1)).toMatchObject({ label: "Compras aprovadas", sessions: 20, fromStart: 0.02, dropFromPrevious: 0.8 });
  });

  it("resume leads e conversão", () => {
    expect(funnel.summary).toEqual({ visitors: 1000, leads: 120, checkouts: 100, purchases: 20, conversion: 0.02 });
  });

  it("sem dados não divide por zero", () => {
    const empty = buildFunnel(steps, [], { count: 0 });
    expect(empty.summary.conversion).toBe(0);
    expect(empty.rows.every((r) => r.fromStart === 0 && r.dropFromPrevious === 0)).toBe(true);
  });
});
