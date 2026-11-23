import { describe, expect, it } from "vitest";
import { QuizDocument } from "@/features/quiz/document/schema";
import { fullDocumentInput } from "@/features/quiz/document/fixtures";
import { answerLabels, buildAnswerReport, buildEngagement } from "./engagement";

describe("engajamento (visitantes, interação, qualificados)", () => {
  // 10 sessões viram só o 1º step, 5 viram 3, 3 viram 6, 2 viram os 10.
  const depth = [
    { viewed: 1, sessions: 10 },
    { viewed: 3, sessions: 5 },
    { viewed: 6, sessions: 3 },
    { viewed: 10, sessions: 2 },
  ];

  it("segue as definições da Inlead", () => {
    expect(buildEngagement(depth, 10)).toEqual({
      visitors: 20,
      interacted: 10,
      interactionRate: 0.5,
      qualified: 5, // mais de 50% de 10 steps = 6 ou mais
      qualifiedRate: 0.25,
      completed: 2,
      completedRate: 0.1,
    });
  });

  it("sem dados não divide por zero", () => {
    expect(buildEngagement([], 5)).toMatchObject({ visitors: 0, interactionRate: 0, qualifiedRate: 0 });
  });
});

describe("relatório de respostas", () => {
  const steps = QuizDocument.parse(fullDocumentInput()).steps;

  it("percentual por opção sobre quem respondeu, com opção removida no fim", () => {
    const [age] = buildAnswerReport(
      steps,
      [
        { stepId: "q_age", optionId: "opt_18", sessions: 30 },
        { stepId: "q_age", optionId: "opt_30", sessions: 60 },
        { stepId: "q_age", optionId: "opt_old", sessions: 10 },
      ],
      { q_age: 100 },
    );
    expect(age.answered).toBe(100);
    expect(age.options.map((o) => [o.label, o.sessions, o.share])).toEqual([
      ["18-29", 30, 0.3],
      ["30+", 60, 0.6],
      ["(opção removida)", 10, 0.1],
    ]);
  });

  it("traduz ids da sessão para os rótulos das opções", () => {
    expect(answerLabels(steps, { q_age: ["opt_30"] })).toEqual([{ stepId: "q_age", title: "Qual a sua idade?", labels: ["30+"] }]);
  });
});
