import { describe, expect, it } from "vitest";
import { createInMemoryTrackingRepository } from "./in-memory-repository";

describe("createInMemoryTrackingRepository", () => {
  it("guarda a hora de gravação, como o default now() do banco", async () => {
    const repo = createInMemoryTrackingRepository(() => new Date("2026-11-04T12:00:00Z"));
    await repo.insertEvent({ eventId: "e1", quizId: "q", versionId: "v", sessionId: "s", stepId: null, type: "quiz_start", utm: {}, answer: null });
    await repo.insertLead({ quizId: "q", sessionId: "s", name: "Ana", email: null, phoneE164: null, utm: {}, consentAt: null });
    expect(repo.events[0].createdAt).toBe("2026-11-04T12:00:00.000Z");
    expect(repo.leads[0].createdAt).toBe("2026-11-04T12:00:00.000Z");
  });
});
