import { beforeEach, describe, expect, it } from "vitest";
import { fullDocumentInput } from "@/features/quiz/document/fixtures";
import { QuizDocument } from "@/features/quiz/document/schema";
import { createInMemoryQuizRepository } from "@/features/quiz/in-memory-repository";
import { createQuizService, type QuizService } from "@/features/quiz/service";
import { createInMemoryTemplateRepository } from "./in-memory-repository";
import { BUILT_IN_TEMPLATES, createTemplateService, type TemplateService } from "./service";

const USER = "marcelo@example.com";
const META = { name: "Novo", slug: "novo", locale: "es-MX", currency: "MXN" };

let quizzes: QuizService;
let templates: TemplateService;

beforeEach(() => {
  quizzes = createQuizService(createInMemoryQuizRepository());
  templates = createTemplateService(createInMemoryTemplateRepository(), quizzes);
});

async function quizWithDoc() {
  const created = await quizzes.create({ ...META, slug: "origem" }, USER);
  if (!created.success) throw new Error(created.error);
  const saved = await quizzes.saveDraft(created.data.id, QuizDocument.parse(fullDocumentInput()), 1);
  if (!saved.success) throw new Error(saved.error);
  return saved.data;
}

describe("templates", () => {
  it("lista os padrões primeiro, válidos", async () => {
    const list = await templates.list();
    expect(list.slice(0, BUILT_IN_TEMPLATES.length).every((t) => t.builtIn)).toBe(true);
    for (const t of BUILT_IN_TEMPLATES) expect(QuizDocument.safeParse(t.document).success).toBe(true);
  });

  it("salva o rascunho de um quiz como template", async () => {
    const quiz = await quizWithDoc();
    const result = await templates.saveFromQuiz(quiz.id, "  Meu funil  ", USER);
    expect(result).toMatchObject({ success: true, data: { name: "Meu funil", builtIn: false, createdBy: USER } });
    expect((await templates.list()).some((t) => t.name === "Meu funil")).toBe(true);
  });

  it("recusa nome vazio e quiz inexistente", async () => {
    const quiz = await quizWithDoc();
    expect(await templates.saveFromQuiz(quiz.id, "  ", USER)).toEqual({ success: false, error: "Informe o nome do template" });
    expect(await templates.saveFromQuiz("00000000-0000-4000-8000-000000000000", "X", USER)).toEqual({ success: false, error: "Quiz não encontrado" });
  });

  it("cria quiz a partir de template com cópia do documento", async () => {
    const quiz = await quizWithDoc();
    const saved = await templates.saveFromQuiz(quiz.id, "Base", USER);
    if (!saved.success) throw new Error(saved.error);
    const created = await templates.createQuiz(META, saved.data.id, USER);
    expect(created.success && created.data.draftDocument.steps.map((s) => s.id)).toEqual(quiz.draftDocument.steps.map((s) => s.id));
    expect(created.success && created.data.status).toBe("draft");
  });

  it("cria quiz de template padrão e, sem template, documento vazio", async () => {
    const fromBuiltIn = await templates.createQuiz(META, BUILT_IN_TEMPLATES[0].id, USER);
    expect(fromBuiltIn.success && fromBuiltIn.data.draftDocument.steps.length).toBeGreaterThan(1);
    const empty = await templates.createQuiz({ ...META, slug: "vazio" }, null, USER);
    expect(empty.success && empty.data.draftDocument.steps).toHaveLength(1);
    expect(await templates.createQuiz({ ...META, slug: "x" }, "nao-existe", USER)).toEqual({ success: false, error: "Template não encontrado" });
  });

  it("exclui template do usuário, não o padrão", async () => {
    const quiz = await quizWithDoc();
    const saved = await templates.saveFromQuiz(quiz.id, "Base", USER);
    if (!saved.success) throw new Error(saved.error);
    expect(await templates.remove(saved.data.id)).toEqual({ success: true, data: null });
    expect(await templates.remove(BUILT_IN_TEMPLATES[0].id)).toEqual({ success: false, error: "Template padrão não pode ser excluído" });
  });
});
