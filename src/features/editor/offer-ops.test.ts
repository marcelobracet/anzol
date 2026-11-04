import { describe, expect, it } from "vitest";
import { QuizDocument } from "@/features/quiz/document/schema";
import { demoDocument } from "@/features/runtime/demo-document";
import { Step } from "@/features/steps/schema";
import { addStep, defaultStep } from "./document-ops";
import { addOffer, offerInUse, removeOffer, updateOffer } from "./offer-ops";

const base = demoDocument();
const withOffer = () => addOffer(base);

describe("addOffer", () => {
  it("cria oferta Hotmart vazia para preencher", () => {
    const { doc, id } = withOffer();
    expect(doc.offers).toEqual([{ id, provider: "hotmart", fullPriceUrl: "" }]);
  });
});

describe("updateOffer / removeOffer", () => {
  it("atualiza pelo id", () => {
    const { doc, id } = withOffer();
    const next = updateOffer(doc, { id, provider: "kiwify", fullPriceUrl: "https://pay.kiwify.com.br/x" });
    expect(next.offers[0].provider).toBe("kiwify");
  });

  it("não remove oferta usada por um step", () => {
    const { doc, id } = withOffer();
    const added = addStep(doc, "vsl");
    expect(added).not.toBeNull();
    expect(offerInUse(added!.doc, id)).toBe(true);
    expect(removeOffer(added!.doc, id).offers).toHaveLength(1);
    expect(removeOffer(doc, id).offers).toHaveLength(0);
  });
});

describe("steps que dependem de oferta", () => {
  it("VSL e timer só são criados se existir oferta", () => {
    expect(addStep(base, "vsl")).toBeNull();
    expect(addStep(base, "offerTimer")).toBeNull();
  });

  it("usam a primeira oferta e nascem com estrutura válida", () => {
    const { doc: withOne, id } = withOffer();
    const vsl = addStep(withOne, "vsl")!;
    const step = vsl.doc.steps.find((s) => s.id === vsl.id)!;
    expect(step.type === "vsl" && step.cta.offerId).toBe(id);
    expect(Step.safeParse(defaultStep("offerTimer", id)).success).toBe(true);
  });

  it("documento com oferta preenchida e VSL com vídeo é válido", () => {
    const { doc, id } = withOffer();
    const filled = updateOffer(doc, { id, provider: "hotmart", fullPriceUrl: "https://pay.hotmart.com/X" });
    const added = addStep(filled, "vsl")!;
    const steps = added.doc.steps.map((s) =>
      s.type === "vsl" ? { ...s, video: { kind: "video" as const, libraryId: "1", videoId: "v" } } : s,
    );
    expect(QuizDocument.safeParse({ ...added.doc, steps }).success).toBe(true);
  });
});
