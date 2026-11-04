import { describe, expect, it } from "vitest";
import { demoDocument } from "./demo-document";
import { createDemoSource, toPublishedQuiz } from "./published-source";

const row = {
  quiz_id: "6f1c2a3e-1111-4222-8333-944455556666",
  slug: "meu-quiz",
  locale: "es-MX",
  currency: "MXN",
  version_id: "7a1c2a3e-1111-4222-8333-944455556666",
  version_number: 3,
  document: demoDocument(),
};

describe("toPublishedQuiz", () => {
  it("mapeia a linha e valida o documento", () => {
    expect(toPublishedQuiz(row)).toEqual({
      quizId: row.quiz_id,
      slug: "meu-quiz",
      locale: "es-MX",
      currency: "MXN",
      versionId: row.version_id,
      versionNumber: 3,
      document: demoDocument(),
    });
  });

  it("falha com documento inválido em vez de servir quiz quebrado", () => {
    expect(() => toPublishedQuiz({ ...row, document: { schemaVersion: 1 } })).toThrow(/inválido/);
  });
});

describe("createDemoSource", () => {
  it("serve o demo só em demo.localhost", async () => {
    const source = createDemoSource();
    expect((await source.find("demo.localhost", null))?.slug).toBe("demo");
    expect(await source.find("outro.localhost", null)).toBeNull();
    expect(await source.find("demo.localhost", "x")).toBeNull();
    expect((await source.find("demo.localhost", "vsl"))?.document.steps.map((s) => s.type)).toEqual(["offerTimer", "vsl"]);
  });
});
