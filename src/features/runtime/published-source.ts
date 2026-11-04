import { z } from "zod";
import { parseDocument, type QuizDocument } from "@/features/quiz/document/schema";
import { demoDocument } from "./demo-document";

export type PublishedQuiz = {
  quizId: string;
  slug: string;
  locale: string;
  currency: string;
  versionId: string;
  versionNumber: number;
  document: QuizDocument;
};

export interface PublishedQuizSource {
  find(host: string, slug: string | null): Promise<PublishedQuiz | null>;
}

const Row = z.object({
  quiz_id: z.uuid(),
  slug: z.string(),
  locale: z.string(),
  currency: z.string(),
  version_id: z.uuid(),
  version_number: z.number().int(),
  document: z.unknown(),
});

export function toPublishedQuiz(raw: unknown): PublishedQuiz {
  const row = Row.parse(raw);
  const document = parseDocument(row.document);
  if (!document.success) {
    throw new Error(`Versão publicada ${row.version_id} inválida: ${document.error}`);
  }
  return {
    quizId: row.quiz_id,
    slug: row.slug,
    locale: row.locale,
    currency: row.currency,
    versionId: row.version_id,
    versionNumber: row.version_number,
    document: document.data,
  };
}

export const DEMO_HOST = "demo.localhost";

// Só para desenvolvimento: permite ver o runtime sem banco em http://demo.localhost:3000.
export function createDemoSource(): PublishedQuizSource {
  return {
    async find(host, slug) {
      if (host !== DEMO_HOST || slug !== null) return null;
      return {
        quizId: "00000000-0000-4000-8000-000000000000",
        slug: "demo",
        locale: "pt-BR",
        currency: "BRL",
        versionId: "00000000-0000-4000-8000-000000000001",
        versionNumber: 1,
        document: demoDocument(),
      };
    },
  };
}
