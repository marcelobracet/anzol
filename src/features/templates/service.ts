import { createEmptyDocument } from "@/features/quiz/document/schema";
import type { QuizService } from "@/features/quiz/service";
import type { QuizRecord, Result } from "@/features/quiz/types";
import { demoDocument, demoVslOnlyDocument } from "@/features/runtime/demo-document";
import { toSummary, type Template, type TemplateRepository, type TemplateSummary } from "./repository";

// Padrões no código: sempre disponíveis e versionados com o app.
export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "builtin-diagnostico",
    name: "Diagnóstico com perguntas e resultado",
    createdBy: "Anzol",
    createdAt: "2026-11-04T00:00:00.000Z",
    builtIn: true,
    document: demoDocument(),
  },
  {
    id: "builtin-vsl",
    name: "Página só VSL (faixa, headline, vídeo em pé e botão)",
    createdBy: "Anzol",
    createdAt: "2026-11-07T00:00:00.000Z",
    builtIn: true,
    document: demoVslOnlyDocument(),
  },
];

const NOT_FOUND = { success: false, error: "Template não encontrado" } as const;

export function createTemplateService(repo: TemplateRepository, quizzes: QuizService) {
  const find = async (id: string) => BUILT_IN_TEMPLATES.find((t) => t.id === id) ?? (await repo.findById(id));

  return {
    async list(): Promise<TemplateSummary[]> {
      const builtIns = BUILT_IN_TEMPLATES.map(toSummary);
      return [...builtIns, ...(await repo.list())];
    },

    async saveFromQuiz(quizId: string, rawName: string, user: string): Promise<Result<TemplateSummary>> {
      const name = rawName.trim().slice(0, 80);
      if (!name) return { success: false, error: "Informe o nome do template" };
      const quiz = await quizzes.findById(quizId);
      if (!quiz) return { success: false, error: "Quiz não encontrado" };
      const template = await repo.create({ name, document: structuredClone(quiz.draftDocument), createdBy: user });
      return { success: true, data: toSummary(template) };
    },

    async createQuiz(meta: unknown, templateId: string | null, user: string): Promise<Result<QuizRecord>> {
      if (!templateId) return quizzes.create(meta, user, createEmptyDocument());
      const template = await find(templateId);
      if (!template) return NOT_FOUND;
      return quizzes.create(meta, user, structuredClone(template.document));
    },

    async remove(id: string): Promise<Result<null>> {
      if (BUILT_IN_TEMPLATES.some((t) => t.id === id)) return { success: false, error: "Template padrão não pode ser excluído" };
      return (await repo.remove(id)) ? { success: true, data: null } : NOT_FOUND;
    },
  };
}

export type TemplateService = ReturnType<typeof createTemplateService>;
