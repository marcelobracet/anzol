import { describe, expect, it } from "vitest";
import { fullDocumentInput } from "./fixtures";
import { createEmptyDocument, parseDocument, QuizDocument } from "./schema";

const messages = (input: unknown) => {
  const result = QuizDocument.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("QuizDocument", () => {
  it("aceita um documento com todos os tipos de step", () => {
    expect(QuizDocument.safeParse(fullDocumentInput()).success).toBe(true);
  });

  it("aplica defaults", () => {
    const doc = QuizDocument.parse(fullDocumentInput());
    const question = doc.steps[0];
    expect(question.hidden).toBe(false);
    if (question.type !== "question") throw new Error("esperado question");
    expect(question.layout).toBe("list");
    expect(question.options[1].tags).toEqual([]);
    const vsl = doc.steps.find((s) => s.type === "vsl");
    expect(vsl).toMatchObject({ progressBar: { enabled: true, k: 3 }, toast: { enabled: true, windowHours: 48 } });
  });

  it("rejeita ids de step duplicados", () => {
    const input = fullDocumentInput();
    input.steps[1].id = input.steps[0].id;
    expect(messages(input)).toContain("Id de step duplicado: q_age");
  });

  it("rejeita ids de opção duplicados dentro da pergunta", () => {
    const input = fullDocumentInput();
    const q = input.steps[0] as { options: { id: string }[] };
    q.options[1].id = q.options[0].id;
    expect(messages(input)).toContain("Id de opção duplicado: opt_18");
  });

  it("rejeita referência a oferta inexistente", () => {
    const input = fullDocumentInput();
    input.offers[0].id = "offer_outra";
    expect(messages(input)).toContain("Oferta inexistente: offer_main");
  });

  it("rejeita toast depois do CTA", () => {
    const input = fullDocumentInput();
    const vsl = input.steps.find((s) => s.type === "vsl") as { toast: { leadSeconds: number } };
    vsl.toast.leadSeconds = 601;
    expect(messages(input)).toContain("toast.leadSeconds não pode ser maior que cta.showAt");
  });

  it("rejeita leadForm sem nenhum campo habilitado", () => {
    const input = fullDocumentInput();
    const lead = input.steps.find((s) => s.type === "leadForm") as {
      fields: Record<string, { enabled: boolean }>;
    };
    for (const field of Object.values(lead.fields)) field.enabled = false;
    expect(messages(input)).toContain("Habilite ao menos um campo");
  });

  it("rejeita tipo de step desconhecido", () => {
    const input = fullDocumentInput();
    (input.steps[0] as { type: string }).type = "quizMagico";
    expect(QuizDocument.safeParse(input).success).toBe(false);
  });

  it("rejeita cor fora do formato hex", () => {
    const input = fullDocumentInput();
    input.theme.colors.primary = "red";
    expect(QuizDocument.safeParse(input).success).toBe(false);
  });

  it("rejeita URL de checkout que não é https", () => {
    const input = fullDocumentInput();
    input.offers[0].fullPriceUrl = "javascript:alert(1)";
    expect(QuizDocument.safeParse(input).success).toBe(false);
  });
});

describe("parseDocument", () => {
  it("devolve o documento quando válido", () => {
    const result = parseDocument(fullDocumentInput());
    expect(result.success).toBe(true);
  });

  it("recusa schemaVersion desconhecido com mensagem clara", () => {
    const result = parseDocument({ ...fullDocumentInput(), schemaVersion: 99 });
    expect(result).toEqual({ success: false, error: "schemaVersion 99 não suportado" });
  });

  it("recusa entrada que não é objeto", () => {
    expect(parseDocument("x")).toEqual({ success: false, error: "Documento inválido" });
  });
});

describe("createEmptyDocument", () => {
  it("gera documento válido com um step inicial", () => {
    const doc = createEmptyDocument();
    expect(QuizDocument.safeParse(doc).success).toBe(true);
    expect(doc.steps).toHaveLength(1);
  });
});
