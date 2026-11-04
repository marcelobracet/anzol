import { beforeEach, describe, expect, it } from "vitest";
import { createInMemoryDomainRepository } from "@/features/domains/in-memory-repository";
import { fullDocumentInput } from "@/features/quiz/document/fixtures";
import { QuizDocument } from "@/features/quiz/document/schema";
import { createInMemoryQuizRepository } from "@/features/quiz/in-memory-repository";
import { createQuizService } from "@/features/quiz/service";
import { createRepositorySource } from "./repository-source";

let quizzes: ReturnType<typeof createInMemoryQuizRepository>;
let domains: ReturnType<typeof createInMemoryDomainRepository>;

async function publishedQuiz(slug: string) {
  const service = createQuizService(quizzes);
  const created = await service.create({ name: slug, slug, locale: "es-MX", currency: "MXN" }, "u@x.com");
  if (!created.success) throw new Error(created.error);
  const saved = await service.saveDraft(created.data.id, QuizDocument.parse(fullDocumentInput()), 1);
  if (!saved.success) throw new Error(saved.error);
  const published = await service.publish(created.data.id, 2, "u@x.com", new Date("2026-11-04T00:00:00Z"));
  if (!published.success) throw new Error(published.error);
  return { id: created.data.id, versionId: published.data.versionId };
}

beforeEach(() => {
  quizzes = createInMemoryQuizRepository();
  domains = createInMemoryDomainRepository();
});

describe("createRepositorySource", () => {
  it("raiz do domínio serve o quiz padrão publicado", async () => {
    const quiz = await publishedQuiz("principal");
    await domains.link("oferta.com", quiz.id, true);
    const found = await createRepositorySource(quizzes, domains).find("oferta.com", null);
    expect(found).toMatchObject({ quizId: quiz.id, versionId: quiz.versionId, slug: "principal", locale: "es-MX" });
  });

  it("/{slug} serve só quiz ligado ao domínio", async () => {
    const quiz = await publishedQuiz("outro");
    await domains.link("oferta.com", quiz.id, false);
    const source = createRepositorySource(quizzes, domains);
    expect((await source.find("oferta.com", "outro"))?.quizId).toBe(quiz.id);
    expect(await source.find("outra.com", "outro")).toBeNull();
    expect(await source.find("oferta.com", null)).toBeNull();
  });

  it("rascunho nunca é servido", async () => {
    const service = createQuizService(quizzes);
    const draft = await service.create({ name: "r", slug: "rascunho", locale: "es-MX", currency: "MXN" }, "u@x.com");
    if (!draft.success) throw new Error(draft.error);
    await domains.link("oferta.com", draft.data.id, true);
    expect(await createRepositorySource(quizzes, domains).find("oferta.com", null)).toBeNull();
  });
});
