import type { QuizDocument } from "@/features/quiz/document/schema";

export type TemplateSummary = { id: string; name: string; createdBy: string; createdAt: string; builtIn: boolean };
export type Template = TemplateSummary & { document: QuizDocument };

export interface TemplateRepository {
  list(): Promise<TemplateSummary[]>;
  findById(id: string): Promise<Template | null>;
  create(input: { name: string; document: QuizDocument; createdBy: string }): Promise<Template>;
  remove(id: string): Promise<boolean>;
}

export const toSummary = ({ id, name, createdBy, createdAt, builtIn }: Template): TemplateSummary => ({
  id,
  name,
  createdBy,
  createdAt,
  builtIn,
});
