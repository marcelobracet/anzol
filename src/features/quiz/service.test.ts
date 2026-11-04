import { beforeEach, describe, expect, it } from "vitest";
import { fullDocumentInput } from "./document/fixtures";
import { QuizDocument } from "./document/schema";
import { createInMemoryQuizRepository } from "./in-memory-repository";
import type { QuizRepository } from "./repository";
import { createQuizService, type QuizService } from "./service";

const USER = "marcelo@example.com";
const META = { name: "Quiz Emagrecimento", slug: "emagrecimento-mx", locale: "es-MX", currency: "MXN" };

let repo: QuizRepository;
let service: QuizService;

beforeEach(() => {
  repo = createInMemoryQuizRepository();
  service = createQuizService(repo);
});

async function createOk(meta = META) {
  const result = await service.create(meta, USER);
  if (!result.success) throw new Error(result.error);
  return result.data;
}

describe("create", () => {
  it("cria rascunho com documento inicial válido e autor", async () => {
    const quiz = await createOk();
    expect(quiz).toMatchObject({ ...META, status: "draft", createdBy: USER, draftRevision: 1 });
    expect(quiz.draftDocument.steps).toHaveLength(1);
  });

  it("normaliza slug para minúsculas e apara espaços", async () => {
    const quiz = await createOk({ ...META, slug: "  Emagrecimento-MX " });
    expect(quiz.slug).toBe("emagrecimento-mx");
  });

  it("recusa entrada inválida com mensagem do campo", async () => {
    const result = await service.create({ ...META, slug: "com espaço" }, USER);
    expect(result).toEqual({ success: false, error: "Slug: letras minúsculas, números e hífen" });
  });

  it("recusa locale fora da lista", async () => {
    const result = await service.create({ ...META, locale: "xx-XX" }, USER);
    expect(result.success).toBe(false);
  });

  it("recusa slug repetido", async () => {
    await createOk();
    const result = await service.create(META, USER);
    expect(result).toEqual({ success: false, error: "Esse slug já está em uso" });
  });
});

describe("updateMeta", () => {
  it("atualiza nome, slug, locale e moeda", async () => {
    const quiz = await createOk();
    const result = await service.updateMeta(quiz.id, { ...META, name: "Novo nome", locale: "es-ES", currency: "EUR" });
    expect(result).toMatchObject({ success: true, data: { name: "Novo nome", locale: "es-ES", currency: "EUR" } });
  });

  it("devolve erro para quiz inexistente", async () => {
    const result = await service.updateMeta("00000000-0000-0000-0000-000000000000", META);
    expect(result).toEqual({ success: false, error: "Quiz não encontrado" });
  });
});

describe("duplicate", () => {
  it("copia o rascunho com novo nome, slug e locale", async () => {
    const original = await createOk();
    const doc = (await repo.saveDraft(original.id, QuizDocument.parse(fullDocumentInput()), 1)).draftDocument;

    const result = await service.duplicate(
      original.id,
      { name: "Quiz Emagrecimento ES", slug: "emagrecimento-es", locale: "es-ES", currency: "EUR" },
      "joao@example.com",
    );
    if (!result.success) throw new Error(result.error);
    expect(result.data).toMatchObject({ slug: "emagrecimento-es", locale: "es-ES", createdBy: "joao@example.com", status: "draft" });
    expect(result.data.id).not.toBe(original.id);
    expect(result.data.draftDocument).toEqual(doc);
    expect(result.data.draftDocument).not.toBe(doc);
  });

  it("não cria cópia de quiz inexistente", async () => {
    const result = await service.duplicate("00000000-0000-0000-0000-000000000000", META, USER);
    expect(result).toEqual({ success: false, error: "Quiz não encontrado" });
  });
});

describe("saveDraft", () => {
  it("valida o documento e incrementa a revisão", async () => {
    const quiz = await createOk();
    const result = await service.saveDraft(quiz.id, fullDocumentInput(), 1);
    expect(result).toMatchObject({ success: true, data: { draftRevision: 2 } });
  });

  it("recusa documento inválido sem salvar", async () => {
    const quiz = await createOk();
    const result = await service.saveDraft(quiz.id, { ...fullDocumentInput(), steps: [] }, 1);
    expect(result).toEqual({ success: false, error: "Documento inválido" });
    expect((await repo.findById(quiz.id))?.draftRevision).toBe(1);
  });

  it("recusa revisão desatualizada (outra pessoa salvou antes)", async () => {
    const quiz = await createOk();
    await service.saveDraft(quiz.id, fullDocumentInput(), 1);
    const result = await service.saveDraft(quiz.id, fullDocumentInput(), 1);
    expect(result).toEqual({ success: false, error: "O rascunho foi alterado por outra pessoa. Recarregue." });
  });
});

describe("archive", () => {
  it("tira o quiz da listagem", async () => {
    const quiz = await createOk();
    expect(await service.archive(quiz.id)).toEqual({ success: true, data: null });
    expect(await service.list()).toEqual([]);
  });
});

describe("publish", () => {
  const NOW = new Date("2026-11-04T12:00:00Z");

  async function createPublishable() {
    const quiz = await createOk();
    const saved = await service.saveDraft(quiz.id, QuizDocument.parse(fullDocumentInput()), quiz.draftRevision);
    if (!saved.success) throw new Error(saved.error);
    return saved.data;
  }

  it("publica o rascunho como versão 1 e marca o quiz como publicado", async () => {
    const quiz = await createPublishable();
    const result = await service.publish(quiz.id, quiz.draftRevision, USER, NOW);
    expect(result).toMatchObject({ success: true, data: { versionNumber: 1 } });
    const after = await service.findById(quiz.id);
    expect(after).toMatchObject({ status: "published" });
    expect(after?.publishedVersionId).toBe(result.success ? result.data.versionId : "");
  });

  it("cada publicação cria a próxima versão", async () => {
    const quiz = await createPublishable();
    await service.publish(quiz.id, quiz.draftRevision, USER, NOW);
    const second = await service.publish(quiz.id, quiz.draftRevision, USER, NOW);
    expect(second).toMatchObject({ success: true, data: { versionNumber: 2 } });
  });

  it("bloqueia rascunho que não passa nas regras de publicação", async () => {
    const quiz = await createOk(); // documento inicial termina num step info
    const result = await service.publish(quiz.id, quiz.draftRevision, USER, NOW);
    expect(result.success).toBe(false);
    expect(!result.success && result.error).toMatch(/último step/i);
  });

  it("recusa publicar uma revisão que não é a atual", async () => {
    const quiz = await createPublishable();
    const result = await service.publish(quiz.id, quiz.draftRevision - 1, USER, NOW);
    expect(result).toEqual({ success: false, error: "O rascunho foi alterado por outra pessoa. Recarregue." });
  });

  it("quiz inexistente ou arquivado", async () => {
    expect(await service.publish("00000000-0000-4000-8000-000000000000", 1, USER, NOW)).toEqual({
      success: false,
      error: "Quiz não encontrado",
    });
    const quiz = await createPublishable();
    await service.archive(quiz.id);
    expect((await service.publish(quiz.id, quiz.draftRevision, USER, NOW)).success).toBe(false);
  });
});

describe("findVersion", () => {
  it("devolve o documento congelado da versão publicada", async () => {
    const quiz = await createOk();
    const saved = await service.saveDraft(quiz.id, QuizDocument.parse(fullDocumentInput()), quiz.draftRevision);
    if (!saved.success) throw new Error(saved.error);
    const published = await service.publish(quiz.id, saved.data.draftRevision, USER, new Date("2026-11-04T12:00:00Z"));
    if (!published.success) throw new Error(published.error);
    const version = await service.findVersion(published.data.versionId);
    expect(version).toMatchObject({ id: published.data.versionId, quizId: quiz.id, versionNumber: 1 });
    expect(version?.document.steps).toHaveLength(saved.data.draftDocument.steps.length);
    expect(await service.findVersion("00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});
