import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDocument } from "@/features/quiz/document/schema";
import type { Template, TemplateRepository, TemplateSummary } from "./repository";

type Row = Record<string, unknown>;

const toSummary = (row: Row): TemplateSummary => ({
  id: String(row.id),
  name: String(row.name),
  createdBy: String(row.created_by),
  createdAt: String(row.created_at),
  builtIn: false,
});

function toTemplate(row: Row): Template {
  const document = parseDocument(row.document); // migra templates antigos para o schema atual
  if (!document.success) throw new Error(`Template ${String(row.id)} inválido: ${document.error}`);
  return { ...toSummary(row), document: document.data };
}

export function createSupabaseTemplateRepository(db: SupabaseClient): TemplateRepository {
  const templates = () => db.from("templates");
  const check = (error: { message: string } | null) => {
    if (error) throw new Error(`Supabase templates: ${error.message}`);
  };

  return {
    async list() {
      const { data, error } = await templates().select("id, name, created_by, created_at").eq("kind", "quiz").order("created_at", { ascending: false });
      check(error);
      return (data ?? []).map(toSummary);
    },
    async findById(id) {
      const { data, error } = await templates().select("id, name, created_by, created_at, document").eq("id", id).maybeSingle();
      check(error);
      return data ? toTemplate(data) : null;
    },
    async create(input) {
      const { data, error } = await templates()
        .insert({ name: input.name, kind: "quiz", document: input.document, created_by: input.createdBy })
        .select("id, name, created_by, created_at, document")
        .single();
      check(error);
      return toTemplate(data!);
    },
    async remove(id) {
      const { data, error } = await templates().delete().eq("id", id).select("id");
      check(error);
      return (data ?? []).length > 0;
    },
  };
}
