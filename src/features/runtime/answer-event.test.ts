import { describe, expect, it } from "vitest";
import { demoDocument } from "./demo-document";
import { playableSteps } from "./engine";
import { answerToTrack } from "./answer-event";

const steps = playableSteps(demoDocument());
const goal = steps.findIndex((s) => s.id === "q_goal");
const optionId = steps[goal].type === "question" ? steps[goal].options[0].id : "";

describe("answerToTrack", () => {
  it("ao avançar de uma pergunta respondida devolve o step e as opções", () => {
    expect(answerToTrack(steps, goal, goal + 1, { q_goal: [optionId] })).toEqual({ stepId: "q_goal", optionIds: [optionId] });
  });

  it("não envia ao voltar, ao sair de step que não é pergunta ou sem resposta", () => {
    expect(answerToTrack(steps, goal + 1, goal, { q_goal: [optionId] })).toBeNull();
    expect(answerToTrack(steps, 0, 1, { intro: ["x"] })).toBeNull();
    expect(answerToTrack(steps, goal, goal + 1, {})).toBeNull();
  });
});
