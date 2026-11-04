import type { Step } from "@/features/steps/schema";
import type { Answers } from "./engine";

export type InterpolationContext = {
  steps: Step[];
  answers: Answers;
  lead?: { firstName?: string };
};

const VARIABLE = /\{\{\s*([a-zA-Z]+)\.([a-zA-Z0-9_-]+)\s*\}\}/g;

function answerLabels(stepId: string, ctx: InterpolationContext): string {
  const step = ctx.steps.find((s) => s.id === stepId);
  if (step?.type !== "question") return "";
  const chosen = ctx.answers[stepId] ?? [];
  return step.options
    .filter((o) => chosen.includes(o.id))
    .map((o) => o.label)
    .join(", ");
}

// Variáveis suportadas: {{answer.<stepId>}} e {{lead.firstName}}. O resto vira vazio.
export function interpolate(text: string, ctx: InterpolationContext): string {
  return text.replace(VARIABLE, (_, scope: string, key: string) => {
    if (scope === "answer") return answerLabels(key, ctx);
    if (scope === "lead" && key === "firstName") return ctx.lead?.firstName ?? "";
    return "";
  });
}
