import type { QuizRepository } from "@/features/quiz/repository";
import type { PurchaseRecord } from "./hotmart";

// Mesmas regras de quiz_for_product() e record_purchase(), para dev sem banco e testes.
export function createInMemoryPurchaseStore(quizzes: QuizRepository) {
  const rows: PurchaseRecord[] = [];
  return {
    rows,
    async findQuizByProduct(productId: string): Promise<string | null> {
      for (const summary of await quizzes.list()) {
        const quiz = await quizzes.findById(summary.id);
        if (quiz?.status !== "published" || !quiz.publishedVersionId) continue;
        const version = await quizzes.findVersion(quiz.publishedVersionId);
        if (version?.document.offers.some((o) => o.productId === productId)) return quiz.id;
      }
      return null;
    },
    async upsertPurchase(purchase: PurchaseRecord): Promise<void> {
      const index = rows.findIndex((r) => r.orderId === purchase.orderId);
      if (index === -1) rows.push(purchase);
      else rows[index] = { ...rows[index], status: purchase.status, quizId: rows[index].quizId ?? purchase.quizId };
    },
  };
}
