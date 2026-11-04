import { randomUUID } from "node:crypto";
import type { NewQuiz, QuizRepository } from "./repository";
import { RevisionConflictError, SlugTakenError } from "./repository";
import type { QuizRecord } from "./types";

// Implementação para testes. Mesmo contrato da versão Supabase.
export function createInMemoryQuizRepository(): QuizRepository {
  let rows: QuizRecord[] = [];
  const now = () => new Date().toISOString();
  const slugTaken = (slug: string, exceptId?: string) =>
    rows.some((r) => r.slug === slug && r.id !== exceptId);

  return {
    async list() {
      return rows
        .filter((r) => r.status !== "archived")
        .map(({ id, name, slug, locale, currency, status, updatedAt }) => ({
          id, name, slug, locale, currency, status, updatedAt,
        }));
    },
    async findById(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async create(quiz: NewQuiz) {
      if (slugTaken(quiz.slug)) throw new SlugTakenError(quiz.slug);
      const record: QuizRecord = {
        ...quiz,
        id: randomUUID(),
        status: "draft",
        draftRevision: 1,
        publishedVersionId: null,
        updatedAt: now(),
      };
      rows = [...rows, record];
      return record;
    },
    async updateMeta(id, meta) {
      const current = rows.find((r) => r.id === id);
      if (!current) return null;
      if (slugTaken(meta.slug, id)) throw new SlugTakenError(meta.slug);
      const updated = { ...current, ...meta, updatedAt: now() };
      rows = rows.map((r) => (r.id === id ? updated : r));
      return updated;
    },
    async saveDraft(id, document, expectedRevision) {
      const current = rows.find((r) => r.id === id);
      if (!current || current.draftRevision !== expectedRevision) throw new RevisionConflictError();
      const updated = {
        ...current,
        draftDocument: document,
        draftRevision: current.draftRevision + 1,
        updatedAt: now(),
      };
      rows = rows.map((r) => (r.id === id ? updated : r));
      return updated;
    },
    async archive(id) {
      const exists = rows.some((r) => r.id === id);
      rows = rows.map((r) => (r.id === id ? { ...r, status: "archived" as const } : r));
      return exists;
    },
  };
}
