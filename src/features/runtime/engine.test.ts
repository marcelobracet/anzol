import { describe, expect, it } from "vitest";
import { QuizDocument } from "@/features/quiz/document/schema";
import { demoDocument } from "./demo-document";
import { canAdvance, initialState, playableSteps, progress, reduce, scoreOf, tagCounts, type QuizState } from "./engine";

const doc = demoDocument();
const steps = playableSteps(doc);
const at = (index: number, answers: QuizState["answers"] = {}): QuizState => ({ index, answers });
const run = (state: QuizState, ...actions: Parameters<typeof reduce>[1][]) =>
  actions.reduce((s, a) => reduce(s, a, steps, { allowBack: true }), state);

describe("playableSteps", () => {
  it("ignora steps ocultos", () => {
    const input = structuredClone(doc);
    input.steps[1] = { ...input.steps[1], hidden: true };
    expect(playableSteps(QuizDocument.parse(input)).map((s) => s.id)).not.toContain("q_goal");
  });
});

describe("reduce", () => {
  it("começa no primeiro step sem respostas", () => {
    expect(initialState()).toEqual({ index: 0, answers: {} });
  });

  it("next avança em step info", () => {
    expect(run(initialState(), { type: "next" }).index).toBe(1);
  });

  it("escolha única com autoAdvance grava e avança", () => {
    const state = run(at(1), { type: "select", stepId: "q_goal", optionId: "goal_time" });
    expect(state).toEqual({ index: 2, answers: { q_goal: ["goal_time"] } });
  });

  it("escolha única troca a resposta anterior", () => {
    const state = run(at(1, { q_goal: ["goal_time"] }), { type: "select", stepId: "q_goal", optionId: "goal_money" });
    expect(state.answers.q_goal).toEqual(["goal_money"]);
  });

  it("múltipla escolha alterna e não avança sozinha", () => {
    const state = run(
      at(2),
      { type: "select", stepId: "q_blockers", optionId: "b_focus" },
      { type: "select", stepId: "q_blockers", optionId: "b_time" },
      { type: "select", stepId: "q_blockers", optionId: "b_focus" },
    );
    expect(state).toEqual({ index: 2, answers: { q_blockers: ["b_time"] } });
  });

  it("múltipla escolha respeita o máximo", () => {
    const state = run(
      at(2),
      { type: "select", stepId: "q_blockers", optionId: "b_focus" },
      { type: "select", stepId: "q_blockers", optionId: "b_time" },
      { type: "select", stepId: "q_blockers", optionId: "b_fear" },
    );
    expect(state.answers.q_blockers).toEqual(["b_focus", "b_time"]);
  });

  it("ignora opção inexistente e step diferente do atual", () => {
    expect(run(at(1), { type: "select", stepId: "q_goal", optionId: "nope" })).toEqual(at(1));
    expect(run(at(1), { type: "select", stepId: "q_blockers", optionId: "b_focus" })).toEqual(at(1));
  });

  it("next não passa de pergunta sem resposta mínima", () => {
    expect(run(at(2), { type: "next" }).index).toBe(2);
    expect(run(at(2, { q_blockers: ["b_focus"] }), { type: "next" }).index).toBe(3);
  });

  it("next não passa do último step", () => {
    expect(run(at(steps.length - 1), { type: "next" }).index).toBe(steps.length - 1);
  });

  it("back volta mantendo respostas, só se permitido", () => {
    const answers = { q_goal: ["goal_time"] };
    expect(run(at(2, answers), { type: "back" })).toEqual(at(1, answers));
    expect(run(at(0), { type: "back" }).index).toBe(0);
    expect(reduce(at(2), { type: "back" }, steps, { allowBack: false }).index).toBe(2);
  });
});

describe("canAdvance", () => {
  it("escolha única exige uma resposta", () => {
    expect(canAdvance(steps[1], {})).toBe(false);
    expect(canAdvance(steps[1], { q_goal: ["goal_time"] })).toBe(true);
  });

  it("steps sem resposta sempre podem avançar", () => {
    expect(canAdvance(steps[0], {})).toBe(true);
  });
});

describe("pontuação e tags", () => {
  const answers = { q_goal: ["goal_both"], q_blockers: ["b_method", "b_time"] };

  it("soma o score das opções escolhidas", () => {
    expect(scoreOf(steps, answers)).toBe(3 + 2 + 1);
  });

  it("conta tags das opções escolhidas", () => {
    expect(tagCounts(steps, answers)).toEqual({ money: 2, time: 2 });
  });

  it("ignora respostas de opções que não existem mais", () => {
    expect(scoreOf(steps, { q_goal: ["removida"] })).toBe(0);
  });
});

describe("progress", () => {
  it("vai de 0 no primeiro step a 1 no último", () => {
    expect(progress(at(0), steps)).toBe(0);
    expect(progress(at(steps.length - 1), steps)).toBe(1);
    expect(progress(at(2), steps)).toBeCloseTo(0.5);
  });

  it("quiz de um step só está completo", () => {
    expect(progress(at(0), steps.slice(0, 1))).toBe(1);
  });
});

describe("playableSteps no modo só VSL", () => {
  const withVsl = () => {
    const input = structuredClone(doc);
    input.offers = [{ id: "offer_x", provider: "hotmart", fullPriceUrl: "https://pay.hotmart.com/X" }];
    input.steps.push({
      id: "vsl_only",
      type: "vsl",
      name: "VSL",
      cta: { label: "Comprar", showAt: 60, offerId: "offer_x" },
    } as never);
    return input;
  };

  it("mostra só o primeiro step VSL visível", () => {
    const input = { ...withVsl(), settings: { ...doc.settings, mode: "vsl" as const } };
    expect(playableSteps(QuizDocument.parse(input)).map((s) => s.id)).toEqual(["vsl_only"]);
  });

  it("no modo quiz mantém todos os steps visíveis", () => {
    const parsed = QuizDocument.parse(withVsl());
    expect(parsed.settings.mode).toBe("quiz");
    expect(playableSteps(parsed).length).toBe(doc.steps.length + 1);
  });
});
