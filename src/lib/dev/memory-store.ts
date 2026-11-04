import "server-only";
import { createInMemoryDomainRepository } from "@/features/domains/in-memory-repository";
import type { DomainRepository } from "@/features/domains/repository";
import { createInMemoryQuizRepository } from "@/features/quiz/in-memory-repository";
import type { QuizRepository } from "@/features/quiz/repository";

// Só em `next dev` sem Supabase configurado: permite usar o Studio localmente. Some ao reiniciar.
export function devMemoryEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.VERCEL_ENV === undefined &&
    !process.env.SUPABASE_URL
  );
}

type Store = { quizzes: QuizRepository; domains: DomainRepository };
const globalStore = globalThis as typeof globalThis & { __anzolDevStore?: Store };

export function devMemoryStore(): Store {
  globalStore.__anzolDevStore ??= {
    quizzes: createInMemoryQuizRepository(),
    domains: createInMemoryDomainRepository(),
  };
  return globalStore.__anzolDevStore;
}
