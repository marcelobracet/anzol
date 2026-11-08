import type { QuizDocument } from "@/features/quiz/document/schema";
import type { Step } from "@/features/steps/schema";

export type Answers = Readonly<Record<string, readonly string[]>>;
export type QuizState = { readonly index: number; readonly answers: Answers };
export type QuizAction =
  | { type: "select"; stepId: string; optionId: string }
  | { type: "next" }
  | { type: "back" };
export type EngineOptions = { allowBack: boolean };

export function playableSteps(doc: QuizDocument): Step[] {
  const visible = doc.steps.filter((step) => !step.hidden);
  if (doc.settings.mode !== "vsl") return visible;
  const vsl = visible.find((step) => step.type === "vsl");
  return vsl ? [vsl] : [];
}

export function initialState(): QuizState {
  return { index: 0, answers: {} };
}

export function canAdvance(step: Step, answers: Answers): boolean {
  if (step.type !== "question") return true;
  const count = answers[step.id]?.length ?? 0;
  return step.selection.mode === "single" ? count === 1 : count >= step.selection.min;
}

function withAnswer(state: QuizState, stepId: string, optionIds: readonly string[]): QuizState {
  return { ...state, answers: { ...state.answers, [stepId]: optionIds } };
}

function select(state: QuizState, steps: Step[], stepId: string, optionId: string): QuizState {
  const step = steps[state.index];
  if (step?.type !== "question" || step.id !== stepId) return state;
  if (!step.options.some((o) => o.id === optionId)) return state;

  if (step.selection.mode === "single") {
    const answered = withAnswer(state, stepId, [optionId]);
    const isLast = state.index >= steps.length - 1;
    return step.selection.autoAdvance && !isLast ? { ...answered, index: state.index + 1 } : answered;
  }

  const current = state.answers[stepId] ?? [];
  if (current.includes(optionId)) return withAnswer(state, stepId, current.filter((id) => id !== optionId));
  const max = step.selection.max ?? step.options.length;
  return current.length >= max ? state : withAnswer(state, stepId, [...current, optionId]);
}

export function reduce(state: QuizState, action: QuizAction, steps: Step[], options: EngineOptions): QuizState {
  switch (action.type) {
    case "select":
      return select(state, steps, action.stepId, action.optionId);
    case "next": {
      const step = steps[state.index];
      if (!step || state.index >= steps.length - 1 || !canAdvance(step, state.answers)) return state;
      return { ...state, index: state.index + 1 };
    }
    case "back":
      return options.allowBack && state.index > 0 ? { ...state, index: state.index - 1 } : state;
  }
}

function chosenOptions(steps: Step[], answers: Answers) {
  return steps.flatMap((step) =>
    step.type === "question" ? step.options.filter((o) => answers[step.id]?.includes(o.id)) : [],
  );
}

export function scoreOf(steps: Step[], answers: Answers): number {
  return chosenOptions(steps, answers).reduce((sum, option) => sum + option.score, 0);
}

export function tagCounts(steps: Step[], answers: Answers): Record<string, number> {
  return chosenOptions(steps, answers)
    .flatMap((option) => option.tags)
    .reduce<Record<string, number>>((counts, tag) => ({ ...counts, [tag]: (counts[tag] ?? 0) + 1 }), {});
}

export function progress(state: QuizState, steps: Step[]): number {
  return steps.length <= 1 ? 1 : state.index / (steps.length - 1);
}
