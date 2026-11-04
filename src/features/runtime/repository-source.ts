import type { InMemoryDomainRepository } from "@/features/domains/in-memory-repository";
import type { QuizRepository } from "@/features/quiz/repository";
import type { PublishedQuiz, PublishedQuizSource } from "./published-source";

// Mesma regra do published_quiz() do Postgres, sobre os repositórios em memória (dev sem banco).
export function createRepositorySource(quizzes: QuizRepository, domains: InMemoryDomainRepository): PublishedQuizSource {
  return {
    async find(host, slug) {
      const { defaultQuizId, linkedQuizIds } = await domains.quizzesForHost(host);
      const candidates = slug === null ? [defaultQuizId] : linkedQuizIds;
      for (const id of candidates) {
        const quiz = id ? await quizzes.findById(id) : null;
        if (!quiz || quiz.status !== "published" || !quiz.publishedVersionId) continue;
        if (slug !== null && quiz.slug !== slug) continue;
        const version = await quizzes.findVersion(quiz.publishedVersionId);
        if (!version) continue;
        const published: PublishedQuiz = {
          quizId: quiz.id,
          slug: quiz.slug,
          locale: quiz.locale,
          currency: quiz.currency,
          versionId: version.id,
          versionNumber: version.versionNumber,
          document: version.document,
        };
        return published;
      }
      return null;
    },
  };
}
