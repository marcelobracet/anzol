import { scoreOf, tagCounts, type Answers } from "@/features/runtime/engine";
import type { Step } from "../schema";
import type { ResultStep } from "./schema";

export type ResultContent = Pick<ResultStep["fallback"], "title" | "body" | "media">;

// A primeira variante cuja condição casar vence; sem match usa o fallback.
export function pickResult(step: ResultStep, steps: Step[], answers: Answers): ResultContent {
  const score = scoreOf(steps, answers);
  const tags = tagCounts(steps, answers);
  const variant = step.variants.find(({ when }) =>
    when.type === "tag"
      ? (tags[when.tag] ?? 0) >= when.minCount
      : score >= (when.min ?? -Infinity) && score <= (when.max ?? Infinity),
  );
  return variant ?? step.fallback;
}
