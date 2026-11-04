import { createEmptyDocument, parseDocument } from "./document/schema";
import { RevisionConflictError, SlugTakenError, type QuizRepository } from "./repository";
import { QuizMetaInput, type QuizRecord, type QuizSummary, type Result } from "./types";

const NOT_FOUND = { success: false, error: "Quiz não encontrado" } as const;
const SLUG_TAKEN = { success: false, error: "Esse slug já está em uso" } as const;

function parseMeta(input: unknown): Result<QuizMetaInput> {
  const result = QuizMetaInput.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues[0]?.message ?? "Dados inválidos" };
}

async function withSlugCheck<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { success: true, data: await run() };
  } catch (error) {
    if (error instanceof SlugTakenError) return SLUG_TAKEN;
    throw error;
  }
}

export function createQuizService(repo: QuizRepository) {
  return {
    list(): Promise<QuizSummary[]> {
      return repo.list();
    },

    findById(id: string): Promise<QuizRecord | null> {
      return repo.findById(id);
    },

    async create(input: unknown, user: string): Promise<Result<QuizRecord>> {
      const meta = parseMeta(input);
      if (!meta.success) return meta;
      return withSlugCheck(() =>
        repo.create({ ...meta.data, draftDocument: createEmptyDocument(), createdBy: user }),
      );
    },

    async updateMeta(id: string, input: unknown): Promise<Result<QuizRecord>> {
      const meta = parseMeta(input);
      if (!meta.success) return meta;
      const result = await withSlugCheck(() => repo.updateMeta(id, meta.data));
      if (result.success && !result.data) return NOT_FOUND;
      return result as Result<QuizRecord>;
    },

    // Cópia para outro locale/oferta: mesma estrutura, textos a traduzir no editor.
    async duplicate(id: string, input: unknown, user: string): Promise<Result<QuizRecord>> {
      const meta = parseMeta(input);
      if (!meta.success) return meta;
      const source = await repo.findById(id);
      if (!source) return NOT_FOUND;
      return withSlugCheck(() =>
        repo.create({ ...meta.data, draftDocument: structuredClone(source.draftDocument), createdBy: user }),
      );
    },

    async saveDraft(id: string, rawDocument: unknown, expectedRevision: number): Promise<Result<QuizRecord>> {
      const parsed = parseDocument(rawDocument);
      if (!parsed.success) return { success: false, error: parsed.error };
      try {
        return { success: true, data: await repo.saveDraft(id, parsed.data, expectedRevision) };
      } catch (error) {
        if (error instanceof RevisionConflictError) {
          return { success: false, error: "O rascunho foi alterado por outra pessoa. Recarregue." };
        }
        throw error;
      }
    },

    async archive(id: string): Promise<Result<null>> {
      return (await repo.archive(id)) ? { success: true, data: null } : NOT_FOUND;
    },
  };
}

export type QuizService = ReturnType<typeof createQuizService>;
