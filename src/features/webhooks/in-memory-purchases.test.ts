import { describe, expect, it } from "vitest";
import { fullDocumentInput } from "@/features/quiz/document/fixtures";
import { QuizDocument } from "@/features/quiz/document/schema";
import { createInMemoryQuizRepository } from "@/features/quiz/in-memory-repository";
import { createQuizService } from "@/features/quiz/service";
import { createInMemoryPurchaseStore } from "./in-memory-purchases";

const purchase = {
  orderId: "HP1", productId: "P1", status: "approved" as const, firstName: "Ana", city: "Lima", country: "PE",
  amount: 10, currency: "PEN", createdAt: "2026-11-04T11:00:00.000Z", quizId: null as string | null,
};

describe("createInMemoryPurchaseStore", () => {
  it("acha o quiz publicado pelo productId da oferta", async () => {
    const quizzes = createInMemoryQuizRepository();
    const service = createQuizService(quizzes);
    const created = await service.create({ name: "q", slug: "q", locale: "es-PE", currency: "PEN" }, "u@x.com");
    if (!created.success) throw new Error(created.error);
    const input = fullDocumentInput();
    input.offers[0] = { ...input.offers[0], productId: "P1" } as (typeof input.offers)[number];
    await service.saveDraft(created.data.id, QuizDocument.parse(input), 1);
    const store = createInMemoryPurchaseStore(quizzes);
    expect(await store.findQuizByProduct("P1")).toBeNull(); // ainda não publicado
    await service.publish(created.data.id, 2, "u@x.com", new Date("2026-11-04T00:00:00Z"));
    expect(await store.findQuizByProduct("P1")).toBe(created.data.id);
  });

  it("upsert por order_id mantém o primeiro registro e atualiza o status", async () => {
    const store = createInMemoryPurchaseStore(createInMemoryQuizRepository());
    await store.upsertPurchase({ ...purchase, quizId: "q1" });
    await store.upsertPurchase({ ...purchase, quizId: "q1", status: "refunded", firstName: "Outro" });
    expect(store.rows).toEqual([{ ...purchase, quizId: "q1", status: "refunded" }]);
  });
});
