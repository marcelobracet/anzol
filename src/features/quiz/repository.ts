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

export type PublishedVersion = { versionId: string; versionNumber: number };

export interface QuizRepository {
  list(): Promise<QuizSummary[]>;
  findById(id: string): Promise<QuizRecord | null>;
  /** @throws SlugTakenError */
  create(quiz: NewQuiz): Promise<QuizRecord>;
  /** @throws SlugTakenError */
  updateMeta(id: string, meta: QuizMetaInput): Promise<QuizRecord | null>;
  /** Salva só se a revisão atual for `expectedRevision`. @throws RevisionConflictError */
  saveDraft(id: string, document: QuizDocument, expectedRevision: number): Promise<QuizRecord>;
  /** Congela o rascunho da revisão `expectedRevision` como nova versão publicada. @throws RevisionConflictError */
  publish(id: string, expectedRevision: number, createdBy: string): Promise<PublishedVersion>;
  archive(id: string): Promise<boolean>;
}
