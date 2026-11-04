import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { parseDocument } from "./document/schema";
import { RevisionConflictError, SlugTakenError, type QuizRepository } from "./repository";
import { QuizMetaInput, QuizStatus, type QuizRecord, type QuizSummary } from "./types";

const SUMMARY_COLUMNS = "id, name, slug, locale, currency, status, updated_at";
const RECORD_COLUMNS = `${SUMMARY_COLUMNS}, draft_document, draft_revision, published_version_id, created_by`;
const UNIQUE_VIOLATION = "23505";

type Row = Record<string, unknown>;

function toSummary(row: Row): QuizSummary {
  const meta = QuizMetaInput.parse(row);
  return {
    ...meta,
    id: String(row.id),
    status: QuizStatus.parse(row.status),
    updatedAt: String(row.updated_at),
  };
}

function toRecord(row: Row): QuizRecord {
  const document = parseDocument(row.draft_document);
  if (!document.success) {
    throw new Error(`draft_document inválido no quiz ${String(row.id)}: ${document.error}`);
  }
  return {
    ...toSummary(row),
    draftDocument: document.data,
    draftRevision: Number(row.draft_revision),
    publishedVersionId: (row.published_version_id as string | null) ?? null,
    createdBy: String(row.created_by),
  };
}

function fail(error: PostgrestError, slug?: string): never {
  if (error.code === UNIQUE_VIOLATION && slug) throw new SlugTakenError(slug);
  throw new Error(`Supabase: ${error.message}`);
}

export function createSupabaseQuizRepository(db: SupabaseClient): QuizRepository {
  const quizzes = () => db.from("quizzes");

  return {
    async list() {
      const { data, error } = await quizzes()
        .select(SUMMARY_COLUMNS)
        .neq("status", "archived")
        .order("updated_at", { ascending: false });
      if (error) fail(error);
      return data.map(toSummary);
    },

    async findById(id) {
      const { data, error } = await quizzes().select(RECORD_COLUMNS).eq("id", id).maybeSingle();
      if (error) fail(error);
      return data ? toRecord(data) : null;
    },

    async create(quiz) {
      const { data, error } = await quizzes()
        .insert({
          name: quiz.name,
          slug: quiz.slug,
          locale: quiz.locale,
          currency: quiz.currency,
          draft_document: quiz.draftDocument,
          created_by: quiz.createdBy,
        })
        .select(RECORD_COLUMNS)
        .single();
      if (error) fail(error, quiz.slug);
      return toRecord(data);
    },

    async updateMeta(id, meta) {
      const { data, error } = await quizzes()
        .update({ ...meta, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select(RECORD_COLUMNS)
        .maybeSingle();
      if (error) fail(error, meta.slug);
      return data ? toRecord(data) : null;
    },

    async saveDraft(id, document, expectedRevision) {
      const { data, error } = await quizzes()
        .update({
          draft_document: document,
          draft_revision: expectedRevision + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("draft_revision", expectedRevision)
        .select(RECORD_COLUMNS)
        .maybeSingle();
      if (error) fail(error);
      if (!data) throw new RevisionConflictError();
      return toRecord(data);
    },

    async publish(id, expectedRevision, createdBy) {
      const { data, error } = await db
        .rpc("publish_quiz", { p_quiz_id: id, p_expected_revision: expectedRevision, p_created_by: createdBy })
        .single<{ version_id: string; version_number: number }>();
      if (error?.message.includes("revision_conflict")) throw new RevisionConflictError();
      if (error) fail(error);
      return { versionId: data.version_id, versionNumber: data.version_number };
    },

    async archive(id) {
      const { data, error } = await quizzes()
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id");
      if (error) fail(error);
      return data.length > 0;
    },
  };
}
