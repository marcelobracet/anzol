import type { Step } from "@/features/steps/schema";
import type { QuizState } from "./engine";

// Resposta a registrar quando o visitante sai de uma pergunta para a frente; voltar não conta.
export function answerToTrack(
  steps: Step[],
  fromIndex: number,
  toIndex: number,
  answers: QuizState["answers"],
): { stepId: string; optionIds: string[] } | null {
  const step = steps[fromIndex];
  if (toIndex <= fromIndex || step?.type !== "question") return null;
  const optionIds = answers[step.id] ?? [];
  return optionIds.length > 0 ? { stepId: step.id, optionIds: [...optionIds] } : null;
}
