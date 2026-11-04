import { z } from "zod";
import type { QuizDocument } from "./document/schema";

export const LOCALES = [
  "pt-BR", "pt-PT", "es-MX", "es-AR", "es-CO", "es-CL", "es-PE", "es-ES",
  "en-US", "en-GB", "de-DE", "fr-FR", "it-IT",
] as const;
export const CURRENCIES = ["BRL", "EUR", "USD", "MXN", "ARS", "COP", "CLP", "PEN", "GBP"] as const;

export const QuizStatus = z.enum(["draft", "published", "archived"]);
export type QuizStatus = z.infer<typeof QuizStatus>;

export const QuizMetaInput = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: letras minúsculas, números e hífen")
    .max(60),
  locale: z.enum(LOCALES),
  currency: z.enum(CURRENCIES),
});
export type QuizMetaInput = z.infer<typeof QuizMetaInput>;

export type QuizSummary = QuizMetaInput & {
  id: string;
  status: QuizStatus;
  updatedAt: string;
};

export type QuizRecord = QuizSummary & {
  draftDocument: QuizDocument;
  draftRevision: number;
  publishedVersionId: string | null;
  createdBy: string;
};

export type Result<T> = { success: true; data: T } | { success: false; error: string };
