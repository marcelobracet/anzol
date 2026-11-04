import type { QuizDocument } from "./document/schema";
import type { QuizMetaInput, QuizRecord, QuizSummary } from "./types";

export type NewQuiz = QuizMetaInput & { draftDocument: QuizDocument; createdBy: string };

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`Slug já em uso: ${slug}`);
  }
}

export class RevisionConflictError extends Error {
  constructor() {
    super("O rascunho foi alterado por outra pessoa");
  }
}

export interface QuizRepository {
  list(): Promise<QuizSummary[]>;
  findById(id: string): Promise<QuizRecord | null>;
  /** @throws SlugTakenError */
  create(quiz: NewQuiz): Promise<QuizRecord>;
  /** @throws SlugTakenError */
  updateMeta(id: string, meta: QuizMetaInput): Promise<QuizRecord | null>;
  /** Salva só se a revisão atual for `expectedRevision`. @throws RevisionConflictError */
  saveDraft(id: string, document: QuizDocument, expectedRevision: number): Promise<QuizRecord>;
  archive(id: string): Promise<boolean>;
}
