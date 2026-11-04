import { describe, expect, it } from "vitest";
import { fullDocumentInput } from "./fixtures";
import { validateForPublish } from "./publish-rules";
import { QuizDocument } from "./schema";

const NOW = new Date("2026-11-04T12:00:00Z");
const build = (mutate: (input: ReturnType<typeof fullDocumentInput>) => void = () => {}) => {
  const input = fullDocumentInput();
  mutate(input);
  return QuizDocument.parse(input);
};
const codes = (doc: QuizDocument) => validateForPublish(doc, NOW).map((i) => i.code);

describe("validateForPublish", () => {
  it("documento completo e correto não tem pendências", () => {
    expect(validateForPublish(build(), NOW)).toEqual([]);
  });

  it("bloqueia depoimento sem consentimento confirmado", () => {
    const doc = build((d) => {
      (d.steps[2] as { items: { consentConfirmed: boolean }[] }).items[0].consentConfirmed = false;
    });
    expect(validateForPublish(doc, NOW)).toContainEqual({
      code: "social-proof-consent",
      stepId: "proof_1",
      message: "Depoimento dep_1 sem consentimento confirmado",
    });
  });

  it("bloqueia offerTimer ligado a oferta sem promoção", () => {
    const doc = build((d) => {
      delete (d.offers[0] as { promo?: unknown }).promo;
    });
    expect(codes(doc)).toContain("offer-timer-without-expiry");
  });

  it("bloqueia offerTimer com promoção já expirada", () => {
    const doc = build((d) => {
      d.offers[0].promo!.expiresAt = "2026-11-01T00:00:00Z";
    });
    expect(codes(doc)).toContain("offer-timer-expired");
  });

  it("ignora steps ocultos nas regras", () => {
    const doc = build((d) => {
      (d.steps[2] as { hidden?: boolean; items: { consentConfirmed: boolean }[] }).hidden = true;
      (d.steps[2] as { items: { consentConfirmed: boolean }[] }).items[0].consentConfirmed = false;
    });
    expect(codes(doc)).not.toContain("social-proof-consent");
  });

  it("exige que o último step visível seja result ou vsl", () => {
    const doc = build((d) => {
      d.steps = d.steps.filter((s) => s.type !== "vsl" && s.type !== "result" && s.type !== "offerTimer");
    });
    expect(codes(doc)).toContain("invalid-final-step");
  });

  it("exige ao menos um step visível", () => {
    const doc = build((d) => {
      for (const s of d.steps as { hidden?: boolean }[]) s.hidden = true;
    });
    expect(codes(doc)).toEqual(["no-visible-steps"]);
  });
});
