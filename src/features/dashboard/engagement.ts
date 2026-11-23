import type { Step } from "@/features/steps/schema";

/** Histograma: quantas sessões viram `viewed` steps diferentes. */
export type DepthRow = { viewed: number; sessions: number };

export type Engagement = {
  visitors: number; // acessaram o funil (viram o 1º step)
  interacted: number; // passaram do 1º step (responderam ou clicaram em algo)
  interactionRate: number;
  qualified: number; // viram mais de 50% dos steps
  qualifiedRate: number;
  completed: number; // chegaram ao último step
  completedRate: number;
};

const ratio = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 10_000) / 10_000 : 0);

// Mesmas definições do painel da Inlead, a partir da profundidade de cada sessão.
export function buildEngagement(depth: DepthRow[], totalSteps: number): Engagement {
  const atLeast = (n: number) => depth.filter((d) => d.viewed >= n).reduce((sum, d) => sum + d.sessions, 0);
  const visitors = atLeast(1);
  const interacted = totalSteps > 1 ? atLeast(2) : 0;
  // "Mais de 50%": com 10 steps, 6 ou mais; com 9 steps, 5 ou mais.
  const qualified = totalSteps > 0 ? atLeast(Math.floor(totalSteps / 2) + 1) : 0;
  const completed = totalSteps > 0 ? atLeast(totalSteps) : 0;
  return {
    visitors,
    interacted,
    interactionRate: ratio(interacted, visitors),
    qualified,
    qualifiedRate: ratio(qualified, visitors),
    completed,
    completedRate: ratio(completed, visitors),
  };
}

export type AnswerCount = { stepId: string; optionId: string; sessions: number };
export type QuestionReport = {
  stepId: string;
  title: string;
  multiple: boolean;
  answered: number; // sessões que responderam (na escolha múltipla, a soma das opções passa disso)
  options: { id: string; label: string; sessions: number; share: number }[];
};

// Distribuição por pergunta, na ordem do quiz. Opções removidas de versões antigas aparecem como "(opção removida)".
export function buildAnswerReport(steps: Step[], counts: AnswerCount[], answeredByStep: Record<string, number>): QuestionReport[] {
  return steps.flatMap((step) => {
    if (step.type !== "question") return [];
    const mine = counts.filter((c) => c.stepId === step.id);
    const answered = answeredByStep[step.id] ?? 0;
    const known = step.options.map((o) => ({ id: o.id, label: o.label }));
    const unknown = mine.filter((c) => !known.some((k) => k.id === c.optionId)).map((c) => ({ id: c.optionId, label: "(opção removida)" }));
    const options = [...known, ...unknown].map((o) => {
      const sessions = mine.filter((c) => c.optionId === o.id).reduce((sum, c) => sum + c.sessions, 0);
      return { ...o, sessions, share: ratio(sessions, answered) };
    });
    return [{ stepId: step.id, title: step.title, multiple: step.selection.mode === "multi", answered, options }];
  });
}

/** ids de opção → rótulos, para mostrar a resposta de uma sessão. */
export function answerLabels(steps: Step[], answers: Record<string, string[]>): { stepId: string; title: string; labels: string[] }[] {
  return steps.flatMap((step) => {
    if (step.type !== "question" || !answers[step.id]) return [];
    const labels = answers[step.id].map((id) => step.options.find((o) => o.id === id)?.label ?? "(opção removida)");
    return [{ stepId: step.id, title: step.title, labels }];
  });
}
