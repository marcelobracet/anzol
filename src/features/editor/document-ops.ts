import { z } from "zod";
import { QuizDocument, type Theme } from "@/features/quiz/document/schema";
import type { Step, StepType } from "@/features/steps/schema";
import { newId } from "@/features/steps/shared/primitives";

// Tipos com renderer no runtime. Os demais entram junto com as entregas deles.
export const ADDABLE_STEP_TYPES = [
  "question",
  "info",
  "socialProof",
  "loading",
  "leadForm",
  "result",
  "vsl",
  "offerTimer",
] as const satisfies StepType[];
export type AddableStepType = (typeof ADDABLE_STEP_TYPES)[number];
// Precisam de uma oferta existente para apontar.
export const OFFER_STEP_TYPES: ReadonlySet<StepType> = new Set(["vsl", "offerTimer"]);

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  question: "Pergunta",
  info: "Informação",
  socialProof: "Prova social",
  loading: "Carregamento",
  leadForm: "Captura de lead",
  result: "Resultado",
  vsl: "VSL",
  offerTimer: "Oferta com prazo",
};

export function defaultStep(type: AddableStepType, offerId = ""): Step {
  // Os tipos podem nascer incompletos (ex.: sem itens); o editor mostra o que falta.
  const base = { id: newId(), hidden: false };
  switch (type) {
    case "question":
      return {
        ...base,
        type,
        name: "Pergunta",
        title: "Escreva a pergunta",
        selection: { mode: "single", autoAdvance: true },
        layout: "list",
        options: ["Opção A", "Opção B"].map((label) => ({ id: newId(), label, score: 0, tags: [] })),
      };
    case "info":
      return { ...base, type, name: "Informação", title: "Escreva o título", ctaLabel: "Continuar" };
    case "loading":
      return {
        ...base,
        type,
        name: "Carregamento",
        title: "Analisando suas respostas…",
        messages: [{ text: "Calculando seu resultado", durationMs: 2000 }],
      };
    case "result":
      return {
        ...base,
        type,
        name: "Resultado",
        variants: [],
        fallback: { title: "Seu resultado" },
        ctaLabel: "Continuar",
      };
    case "socialProof":
      // Nasce sem depoimentos: o editor marca a lista até o primeiro upload.
      return { ...base, type, name: "Prova social", title: "Quem já fez, aprova", layout: "carousel", items: [], ctaLabel: "Continuar" };
    case "leadForm":
      return {
        ...base,
        type,
        name: "Captura de lead",
        title: "Para onde enviamos seu resultado?",
        fields: {
          name: { enabled: true, required: true, label: "Nome" },
          email: { enabled: true, required: true, label: "E-mail" },
          phone: { enabled: false, required: false, label: "WhatsApp" },
        },
        ctaLabel: "Ver meu resultado",
      };
    case "vsl":
      // Nasce sem vídeo (a página mostra um espaço reservado) e em pé, para o celular.
      return {
        ...base,
        type,
        name: "VSL",
        aspect: "9:16",
        bannerStyle: { icon: "none", animation: "pulse" },
        pauseScreen: { opacity: 55, blur: false },
        progressBar: { enabled: true, k: 3 },
        cta: { label: "Quero garantir minha vaga", showAt: 0, offerId },
        toast: { enabled: false, leadSeconds: 0, windowHours: 48 },
      };
    case "offerTimer":
      return {
        ...base,
        type,
        name: "Oferta com prazo",
        offerId,
        title: "Sua oferta especial termina em",
        expiredText: "A oferta especial terminou.",
        ctaLabel: "Quero aproveitar",
      };
  }
}

const indexOf = (doc: QuizDocument, id: string) => doc.steps.findIndex((s) => s.id === id);

function insertAt(doc: QuizDocument, index: number, step: Step): QuizDocument {
  return { ...doc, steps: [...doc.steps.slice(0, index), step, ...doc.steps.slice(index)] };
}

// null quando o tipo precisa de oferta e o quiz ainda não tem nenhuma.
export function addStep(doc: QuizDocument, type: AddableStepType, afterId?: string): { doc: QuizDocument; id: string } | null {
  const offerId = doc.offers[0]?.id;
  if (OFFER_STEP_TYPES.has(type) && !offerId) return null;
  const step = defaultStep(type, offerId);
  const after = afterId ? indexOf(doc, afterId) : -1;
  const index = after === -1 ? doc.steps.length : after + 1;
  return { doc: insertAt(doc, index, step), id: step.id };
}

export function removeStep(doc: QuizDocument, id: string): QuizDocument {
  if (doc.steps.length <= 1) return doc;
  return { ...doc, steps: doc.steps.filter((s) => s.id !== id) };
}

// Ids internos (opções, variantes, itens) precisam ser novos para o documento seguir íntegro.
function withFreshIds(step: Step): Step {
  const copy = { ...structuredClone(step), id: newId(), name: `${step.name} (cópia)` };
  switch (copy.type) {
    case "question":
      return { ...copy, options: copy.options.map((o) => ({ ...o, id: newId() })) };
    case "result":
      return { ...copy, variants: copy.variants.map((v) => ({ ...v, id: newId() })) };
    case "socialProof":
      return { ...copy, items: copy.items.map((i) => ({ ...i, id: newId() })) };
    default:
      return copy;
  }
}

export function duplicateStep(doc: QuizDocument, id: string) {
  const index = indexOf(doc, id);
  if (index === -1) return { doc, id };
  const copy = withFreshIds(doc.steps[index]);
  return { doc: insertAt(doc, index + 1, copy), id: copy.id };
}

export function moveStep(doc: QuizDocument, fromId: string, toId: string): QuizDocument {
  const from = indexOf(doc, fromId);
  const to = indexOf(doc, toId);
  if (from === -1 || to === -1 || from === to) return doc;
  const rest = doc.steps.filter((_, i) => i !== from);
  return { ...doc, steps: [...rest.slice(0, to), doc.steps[from], ...rest.slice(to)] };
}

export function replaceStep(doc: QuizDocument, step: Step): QuizDocument {
  return { ...doc, steps: doc.steps.map((s) => (s.id === step.id ? step : s)) };
}

export function toggleHidden(doc: QuizDocument, id: string): QuizDocument {
  return { ...doc, steps: doc.steps.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)) };
}

export function updateTheme(doc: QuizDocument, theme: Theme): QuizDocument {
  return { ...doc, theme };
}

export function updateSettings(doc: QuizDocument, settings: QuizDocument["settings"]): QuizDocument {
  return { ...doc, settings };
}

export type EditorIssue = { path: PropertyKey[]; message: string };

// Problemas de validação agrupados por step (caminho relativo ao step); o resto fica em _doc.
export function issuesByStep(doc: QuizDocument): Record<string, EditorIssue[]> {
  const result = QuizDocument.safeParse(doc);
  if (result.success) return {};
  return result.error.issues.reduce<Record<string, EditorIssue[]>>((groups, issue: z.core.$ZodIssue) => {
    const [root, index, ...rest] = issue.path;
    const stepId = root === "steps" && typeof index === "number" ? doc.steps[index]?.id : undefined;
    const key = stepId && rest.length > 0 ? stepId : "_doc";
    const path = key === "_doc" ? issue.path : rest;
    return { ...groups, [key]: [...(groups[key] ?? []), { path, message: issue.message }] };
  }, {});
}

export function errorAt(issues: EditorIssue[] | undefined, ...path: PropertyKey[]): string | undefined {
  const key = path.map(String).join(".");
  return issues?.find((issue) => issue.path.map(String).join(".") === key)?.message;
}
