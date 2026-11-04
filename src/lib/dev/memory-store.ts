import "server-only";
import { createInMemoryDomainRepository, type InMemoryDomainRepository } from "@/features/domains/in-memory-repository";
import { createInMemoryQuizRepository } from "@/features/quiz/in-memory-repository";
import type { QuizRepository } from "@/features/quiz/repository";
import { createInMemoryTrackingRepository } from "@/features/tracking/in-memory-repository";
import { createInMemoryPurchaseStore } from "@/features/webhooks/in-memory-purchases";

// Só em `next dev` sem Supabase configurado: permite usar o Studio localmente. Some ao reiniciar.
export function devMemoryEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.VERCEL_ENV === undefined &&
    !process.env.SUPABASE_URL
  );
}

type Store = {
  quizzes: QuizRepository;
  domains: InMemoryDomainRepository;
  tracking: ReturnType<typeof createInMemoryTrackingRepository>;
  purchases: ReturnType<typeof createInMemoryPurchaseStore>;
};
const globalStore = globalThis as typeof globalThis & { __anzolDevStore?: Store };

export function devMemoryStore(): Store {
  if (!globalStore.__anzolDevStore) {
    const quizzes = createInMemoryQuizRepository();
    globalStore.__anzolDevStore = {
      quizzes,
      domains: createInMemoryDomainRepository(),
      tracking: createInMemoryTrackingRepository(),
      purchases: createInMemoryPurchaseStore(quizzes),
    };
  }
  return globalStore.__anzolDevStore;
}
