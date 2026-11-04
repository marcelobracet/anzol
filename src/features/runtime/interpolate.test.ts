import { describe, expect, it } from "vitest";
import { demoDocument } from "./demo-document";
import { playableSteps } from "./engine";
import { interpolate } from "./interpolate";

const steps = playableSteps(demoDocument());

describe("interpolate", () => {
  it("troca {{answer.<stepId>}} pelos rótulos escolhidos", () => {
    const answers = { q_goal: ["goal_money"], q_blockers: ["b_focus", "b_time"] };
    expect(interpolate("Você quer {{answer.q_goal}}", { steps, answers })).toBe("Você quer Ganhar mais dinheiro");
    expect(interpolate("{{ answer.q_blockers }}", { steps, answers })).toBe("Falta de foco, Pouco tempo");
  });

  it("variáveis desconhecidas ou sem resposta viram vazio", () => {
    expect(interpolate("Oi {{lead.firstName}}!", { steps, answers: {} })).toBe("Oi !");
    expect(interpolate("{{answer.q_goal}}", { steps, answers: {} })).toBe("");
  });

  it("usa o lead quando informado", () => {
    expect(interpolate("Oi {{lead.firstName}}", { steps, answers: {}, lead: { firstName: "Ana" } })).toBe("Oi Ana");
  });

  it("texto sem variáveis fica igual", () => {
    expect(interpolate("Sem {chaves} aqui", { steps, answers: {} })).toBe("Sem {chaves} aqui");
  });
});
