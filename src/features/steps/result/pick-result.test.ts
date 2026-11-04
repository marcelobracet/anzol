import { describe, expect, it } from "vitest";
import { demoDocument } from "@/features/runtime/demo-document";
import { playableSteps } from "@/features/runtime/engine";
import { pickResult } from "./pick-result";
import type { ResultStep } from "./schema";

const steps = playableSteps(demoDocument());
const result = steps.find((s): s is ResultStep => s.type === "result")!;

describe("pickResult", () => {
  it("primeira variante que casar vence (tag com contagem mínima)", () => {
    const answers = { q_goal: ["goal_both"], q_blockers: ["b_method"] };
    expect(pickResult(result, steps, answers).title).toBe("Perfil Acelerador");
  });

  it("faixa de score quando a tag não casa", () => {
    const answers = { q_goal: ["goal_money"], q_blockers: ["b_focus", "b_fear"] };
    expect(pickResult(result, steps, answers).title).toBe("Perfil Construtor");
  });

  it("sem match usa fallback", () => {
    expect(pickResult(result, steps, { q_goal: ["goal_time"] }).title).toBe("Perfil Explorador");
  });

  it("faixa de score respeita min e max inclusivos", () => {
    const ranged: ResultStep = {
      ...result,
      variants: [{ id: "mid", when: { type: "scoreRange", min: 2, max: 3 }, title: "Meio" }],
    };
    expect(pickResult(ranged, steps, { q_goal: ["goal_money"] }).title).toBe("Meio");
    expect(pickResult(ranged, steps, { q_goal: ["goal_both"] }).title).toBe("Meio");
    expect(pickResult(ranged, steps, { q_goal: ["goal_time"] }).title).toBe("Perfil Explorador");
  });
});
